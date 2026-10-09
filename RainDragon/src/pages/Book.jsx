import ePub from "epubjs";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { requestWithRefresh } from "../api/requestWithRefresh";
import '../styles/pages/_book-chapter.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function Reader() {
    // Дані находяться в URL
    const { id } = useParams();

    const [textExists, setTextExists] = useState(true);
    const [spine, setSpine] = useState([]);
    const [index, setIndex] = useState(0);
    const [html, setHtml] = useState("");
    const [showToc, setShowToc] = useState(false); // зміст
    const [toc, setToc] = useState([]);
    const epubRef = useRef(null);

    // Збереження значення між ререндерами
    const startIndexRef = useRef(0);

    // Функція для пошуку першого H1 у книзі
    const findFirstH1Index = async (epub) => {
        for (let i = 0; i < epub.spine.items.length; i++) {
            const item = epub.spine.items[i];

            const section = await epub.load(item.href);

            let doc;

            if (section instanceof Document) {
                doc = section;
            } else {
                let html;

                if (typeof section === "string") {
                    html = section;
                } else {
                    html = new TextDecoder().decode(section);
                }
                const parser = new DOMParser();
                doc = parser.parseFromString(html, "text/html");
            }

            if (doc.querySelector("h1")) {
                return i;
            }
        }
        return 0;
    };

    // Отримуємо текст книги та фільтруємо зміст
    useEffect(() => {
        const init = async () => {
            try {
                const response = await requestWithRefresh(
                    `http://localhost:5000/api/text/${id}`
                );
                if (!response.ok) {
                    setTextExists(false);
                    return;
                }

                const blob = await response.blob();
                const epub = ePub(blob);
                epubRef.current = epub;
                await epub.ready;

                // Паралельний парсинг глав
                const spineItemsWithClassification = await Promise.all(
                    epub.spine.items.map(async (item) => {
                        const section = await epub.load(item.href);
                        let html;

                        if (typeof section === "string") {
                            html = section;
                        } else if (section instanceof Document) {
                            html = new XMLSerializer().serializeToString(section);
                        } else {
                            html = new TextDecoder().decode(section);
                        }

                        const doc = new DOMParser().parseFromString(html, "text/html");
                        const type = classifyChapter(doc);
                        return { item, type };
                    })
                );

                // Фильтруємо результати
                const filteredSpine = spineItemsWithClassification
                    .filter(result => result.type !== "illustration")
                    .map(result => result.item);

                const allowedHrefs = new Set(filteredSpine.map(item => item.href));
                setSpine(filteredSpine);

                const filteredToc = (epub.navigation?.toc || []).filter(item =>
                    allowedHrefs.has(item.href)
                );
                setToc(filteredToc);

                const startIndex = await findFirstH1Index(epub);
                startIndexRef.current = startIndex;

                let indexToLoad = startIndex;
                const savedLocation = localStorage.getItem(`last_location_${id}`);
                if (savedLocation) {
                    const parsed = JSON.parse(savedLocation);
                    if (parsed.index >= 0 && parsed.index < filteredSpine.length) {
                        indexToLoad = parsed.index;
                    }
                }

                setIndex(indexToLoad);
                loadChapter(epub, filteredSpine[indexToLoad].href);
                
            } catch (error) {
                console.error("Ошибка при инициализации книги:", error);
                setTextExists(false);
            }
        };

        init();
    }, [id]);

    // Класифікація розділу
    function classifyChapter(doc) {
        if (!doc || !doc.body) return "mixed";

        const imgCount = doc.querySelectorAll?.("img")?.length ?? 0;
        const textLength = doc.textContent?.length ?? 0;

        if (imgCount > 10 && textLength < 500) return "illustration";
        if (doc.querySelector?.("h1")) return "text";

        return "mixed";
    }

    // Завантаження розділу та обробка HTML
    const loadChapter = async (epub, href) => {
        const section = await epub.load(href);

        let html;

        if (typeof section === "string") {
            html = section;
        } else if (section instanceof Document) {
            // DOM → string HTML
            html = new XMLSerializer().serializeToString(section);
        } else {
            // binary → string
            html = new TextDecoder().decode(section);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const type = classifyChapter(doc);
        if (type === "illustration") {
            // Пропускаємо цей розділ
            return;
        }

        doc.querySelectorAll("img").forEach(img => img.remove());
        doc.querySelectorAll("strong").forEach(strong => strong.remove());
        doc.querySelectorAll("p").forEach(p => {
            if (p.innerHTML.trim() === "&nbsp;" || p.textContent.trim() === "") {
                p.remove();
            }
        });
        doc.querySelectorAll("p span").forEach(span => {
            span.replaceWith(...span.childNodes);
        });
        doc.querySelectorAll("p").forEach(p => {
            if (p.querySelector("a")) {
                p.remove();
            }
        });
        doc.querySelectorAll("*").forEach(el => {
            el.removeAttribute("style");
        });

        // Індексація абзаців
        doc.querySelectorAll("p").forEach((p, i) => {
            p.id = `para-${i}`; // Кожен абзац тепер має унікальний ID
            p.classList.add("selectable-para");
        });
        setHtml(doc.body.innerHTML);
    };

    // Попередній та наступний розділ
    const next = () => {
        const newIndex = index + 1;
        if (newIndex >= spine.length) return;

        setIndex(newIndex);
        loadChapter(epubRef.current, spine[newIndex].href);
    };
    const prev = () => {
        const newIndex = index - 1;
        if (newIndex < startIndexRef.current) return;

        setIndex(newIndex);
        loadChapter(epubRef.current, spine[newIndex].href);
    };

    // ТЕМА
    const [theme, setTheme] = useState("dragon");
    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === "dragon") return "light";
            if (prev === "light") return "dark";
            return "dragon";
        });
    };

    // ШРИФТИ
    const [fontFamily, setFontFamily] = useState("Memory");
    const toggleFont = () => {
        setFontFamily(prev => {
            if (prev === "Memory") return "Times New Roman";
            if (prev === "Times New Roman") return "Arial";
            return "Memory";
        });
    };
    const [fontSize, setFontSize] = useState(18);
    // Мінімум 12 та максимум 30
    // Обираємо мінімальне або максимальне, щоб не опуститися за межі

    // Встановити розмір як css змінну
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--font-size",
            `${fontSize}px`
        );
    }, [fontSize]);


    // Автопрокрутка до початку розділу при зміні html
    const textRef = useRef(null);
    useEffect(() => {
        // textRef замість id
        // scrollIntoView перемістить сторінку так, щоб початок textRef був зверху
        if (textRef.current) {
            textRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        // Кожного разу при зміні html
    }, [html]);
    // Автозакладка останньої сторінки 
    useEffect(() => {
        if (spine[index]) {
            localStorage.setItem(`last_location_${id}`, JSON.stringify({
                index: index,
                href: spine[index].href
            }));
        }
    }, [index, id]);

    // ЗАКЛАДКИ
    const [bookmarks, setBookmarks] = useState(() => {
        return JSON.parse(localStorage.getItem(`bookmarks_${id}`) || "[]");
    });
    // Для відображення кнопки біля абзацу
    const [selectedPara, setSelectedPara] = useState(null);

    // Перемикач закладки
    const toggleBookmark = (paraId) => {

        // Знаходимо назву поточного розділу за допомогою нашої функції
        const currentHref = spine[index].href;
        const chapterTitle = getChapterLabel(currentHref);

        const bookmarkData = {
            chapterIndex: index, //поточна глава
            chapterTitle: chapterTitle, //назва розділу
            paraId: paraId,
            text: document.getElementById(paraId)?.textContent?.substring(0, 50) + "..."
        };

        // Якщо вже існує
        const isExist = bookmarks.find(b => b.paraId === paraId && b.chapterIndex === index);

        let newBookmarks;
        if (isExist) {
            // Видаляє її (через фільтр залишаємося всі крім неї)
            newBookmarks = bookmarks.filter(b => !(b.paraId === paraId && b.chapterIndex === index));
        } else {
            newBookmarks = [...bookmarks, bookmarkData];
        }

        setBookmarks(newBookmarks);
        localStorage.setItem(`bookmarks_${id}`, JSON.stringify(newBookmarks));
        setSelectedPara(null); // Сховати кнопку після натискання
    };

    // Коли клікаємо на текст
    const handleWrapperClick = (e) => {
        // Перевіряємо, чи є виділення тексту
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return; 
        }

        // На всіх абзацах є клас selectable-para, тому можна знайти найближчий батьківський елемент
        const para = e.target.closest('.selectable-para');
        if (para) {
            const rect = para.getBoundingClientRect();

            if (selectedPara?.id === para.id) {
                return;
            }

            setSelectedPara({
                id: para.id,
                top: para.offsetTop, 
                left: rect.width - 40 
            });
        } else {
            if (selectedPara !== null) {
                setSelectedPara(null);
            }
        }
    };

    // Відображення закладок на екрані
    useEffect(() => {
        // Видаляємо всі старі виділення з екрану
        document.querySelectorAll('.is-bookmarked').forEach(el => el.classList.remove('is-bookmarked'));

        // Додаємо нові для поточного розділу
        bookmarks.forEach(b => {
            if (b.chapterIndex === index) {
                const el = document.getElementById(b.paraId);
                if (el) el.classList.add('is-bookmarked');
            }
        });
    }, [html, bookmarks, index]);

    // Генеруємо CSS-правило на основі масиву закладок
    const bookmarkStyles = bookmarks
        .filter(b => b.chapterIndex === index) // Тільки для поточного розділу
        .map(b => `#${b.paraId} { border-left: 3px solid #e74c3c; background-color: rgba(231, 76, 60, 0.1); padding-left: 10px; }`)
        .join("\n");

    const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
    const goToBookmark = async (bookmark) => {
        // Перевіряємо, чи ми вже в цьому розділі
        if (index !== bookmark.chapterIndex) {
            setIndex(bookmark.chapterIndex);
            await loadChapter(epubRef.current, spine[bookmark.chapterIndex].href);
        }

        // Дати React час відрендерити HTML (через невелику затримку)
        setTimeout(() => {
            // Перехід до абзацу
            const element = document.getElementById(bookmark.paraId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Додамо тимчасовий ефект "мигтіння", щоб користувач побачив, куди перейшов
                element.style.transition = "background 0.5s";
                element.style.backgroundColor = "rgba(231, 76, 60, 0.3)";
                setTimeout(() => {
                    element.style.backgroundColor = "";
                }, 2000);
            }
        }, 100);

        setShowBookmarksPanel(false); // Закриваємо панель
    };

    const getChapterLabel = (href) => {
        // Шукаємо елемент у змісті, чий href міститься у посиланні на файл
        // (використовуємо split('#')[0], щоб ігнорувати внутрішні якорі)
        const tocItem = toc.find(item => item.href.split('#')[0] === href.split('#')[0]);
        return tocItem ? tocItem.label : "Невідомий розділ";
    };

    // Watermark при копіюванні тексту
    const handleCopy = (e) => {
        const selection = window.getSelection();
        const originalText = selection.toString();

        if (originalText.length < 10) { 
            return;
        } 
        e.preventDefault(); 

        const protectedText = 
            `${originalText}\n\n` +
            `© Джерело: Книжкова платформа "RainDrgaon"\n`;

        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', protectedText);
        } else if (window.clipboardData) {
            window.clipboardData.setData('Text', protectedText);
        }
    };

    if (!textExists) {
        return (
            <div className="book-chapter">
                <div className="no-results">
                    <p>На жаль, текст книги ще не додано.</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={textRef} className="book-chapter">
            <div className="book-chapter__chapter">
                {(showToc || showBookmarksPanel) && (
                    <div
                        className="book-chapter__overlay"
                        onClick={() => {
                            setShowToc(false);
                            setShowBookmarksPanel(false);
                        }}
                    />
                )}
                <style>{bookmarkStyles}</style>
                <div className="book-chapter__chapter-top">
                    <div className={`book-chapter__toc-panel ${showToc ? 'open' : ''}`}>
                        <div className="book-chapter__panel-header">
                            <h3>Зміст</h3>
                            <button className="close-sidebar-btn" onClick={() => setShowToc(false)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        {toc.map((item, i) => (
                            <div className="book-chapter__chapter-top_item"
                                key={i}
                                onClick={() => {
                                    // 1. Шукаємо індекс розділу в нашому відфільтрованому spine
                                    // Використовуємо split('#')[0], щоб ігнорувати якір (anchor), якщо він є в href
                                    const newIndex = spine.findIndex(s =>
                                        s.href.split('#')[0] === item.href.split('#')[0]
                                    );
                                    if (newIndex !== -1) {
                                        setIndex(newIndex); // Оновлюємо глобальний індекс
                                        loadChapter(epubRef.current, item.href); // Завантажуємо текст
                                    } else {
                                        // Якщо раптом у змісті є посилання, яке ми відфільтрували (наприклад, картинка)
                                        loadChapter(epubRef.current, item.href);
                                    }
                                    setShowToc(false);
                                }}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                    <div className="book-chapter__chapter-text_parameters">
                        <button className="book-chapter__text-button" onClick={prev}>⬅</button>
                        <button className="book-chapter__text-button" onClick={toggleTheme}>
                            {theme === "light" && <i className="fa-solid fa-sun"></i>}
                            {theme === "dark" && <i className="fa-solid fa-moon"></i>}
                            {theme === "dragon" && <i className="fa-solid fa-dragon"></i>}
                        </button>
                        <button className="book-chapter__text-button" onClick={toggleFont}>
                            <i className="fa-solid fa-font"></i>
                            {fontFamily}
                        </button>
                        <button className="book-chapter__text-button" onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}>
                            A-
                        </button>

                        <button className="book-chapter__text-button" onClick={() => setFontSize(prev => Math.min(prev + 2, 30))}>
                            A+
                        </button>
                        <button className="book-chapter__text-button" onClick={next}>➡</button>
                    </div>
                </div>
                <div className={`book-chapter__text
                        ${theme} ${fontFamily} ${fontSize}`}
                    style={{ position: 'relative' }}
                    onClick={handleWrapperClick}
                    onCopy={handleCopy}>
                    {selectedPara && (
                        <button
                            className="bookmark-btn"
                            style={{
                                position: 'absolute',
                                top: `${selectedPara.top}px`,
                                right: '10px',
                                zIndex: 10
                            }}
                            onClick={(e) => {
                                e.stopPropagation(); // Щоб не спрацював handleWrapperClick знову
                                toggleBookmark(selectedPara.id);
                            }}
                        >
                            <i className={
                                bookmarks.find(b => b.paraId === selectedPara.id && b.chapterIndex === index)
                                    ? "fa-solid fa-bookmark"
                                    : "fa-regular fa-bookmark"
                            }></i>
                        </button>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
                <div className="book-chapter__chapter-text_table__bookmarks">
                    <button className="book-chapter__text-button" onClick={prev}>⬅</button>
                    <button className="book-chapter__text-button" onClick={() => setShowToc(show => !show)}>
                        <i className="fa-solid fa-list"></i>
                    </button>
                    {/* Кнопка для відкриття панелі закладок у меню */}

                    <button className="book-chapter__text-button" onClick={() => {
                        setShowBookmarksPanel(!showBookmarksPanel);
                        setShowToc(false); // Закриваємо зміст, якщо він відкритий
                    }}>
                        <i className="fa-solid fa-bookmark"></i>
                    </button>
                    <div className={`book-chapter__bookmarks-panel ${showBookmarksPanel ? 'open' : ''}`}>
                        <div className="book-chapter__bookmarks-panel__header">
                            <h3>Ваші закладки</h3>
                            <button className="close-panel-btn" onClick={() => setShowBookmarksPanel(false)}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="book-chapter__bookmarks-panel__list">
                            {bookmarks.length === 0 ? (
                                <p className="book-chapter__bookmarks-panel__header">У вас ще немає закладок</p>
                            ) : (
                                bookmarks.map((b, i) => (
                                    <div
                                        key={i}
                                        className="book-chapter__bookmarks-panel__item"
                                        onClick={() => goToBookmark(b)}
                                    >
                                        <span className="book-chapter__bookmarks-panel__item-text">"{b.text}"</span>
                                        <div className="book-chapter__bookmarks-panel__item-info">
                                            <span className="book-chapter__bookmarks-panel__item-chapter-name">
                                                {b.chapterTitle || `Розділ ${b.chapterIndex + 1}`}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const updated = bookmarks.filter((_, idx) => idx !== i);
                                                    setBookmarks(updated);
                                                    localStorage.setItem(`bookmarks_${id}`, JSON.stringify(updated));
                                                }}
                                                className="book-chapter__bookmarks-panel__item-delete"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <button className="book-chapter__text-button" onClick={next}>➡</button>
                </div>
            </div>
        </div>
    );
}

export default Reader;