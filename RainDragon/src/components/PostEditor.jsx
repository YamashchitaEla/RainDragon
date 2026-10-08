import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import "../styles/components/_post-editor.css";

function PostEditor({ content, onChange }) {
    // Ініціалізація редактора TipTap з базовим набором функцій
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="post-editor">
            <div className="post-editor__toolbar">
                {/* editor (викликаємо) - chain (ми хочемо відкрити ланцюжок команд) - focus (залишити фокус курсор в тексті) - перемикач - запустити */}
                <button type="button" 
                    className={editor.isActive("bold") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleBold().run()}>
                        <i className="fa-solid fa-bold"></i>
                </button>

                <button type="button" 
                    className={editor.isActive("italic") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <i className="fa-solid fa-italic"></i>
                </button>

                <button type="button" 
                    className={editor.isActive("strike") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleStrike().run()}>
                        <i className="fa-solid fa-strikethrough"></i>
                </button>

                <button type="button" 
                    className={editor.isActive("underline") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}>
                        <i className="fa-solid fa-underline"></i>
                </button>

                {/*Перемкнути заголовок H1*/}
                <button type="button" 
                    className={editor.isActive("heading", { level: 1 }) ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleHeading({
                        level: 1
                    }).run()}>
                        H1
                </button>

                {/*Перемкнути заголовок H2*/}
                <button type="button" 
                    className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleHeading({
                        level: 2
                    }).run()}>
                        H2
                </button>

                <button type="button" 
                    className={editor.isActive("bulletList") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}>
                        <i className="fa-solid fa-list-ul"></i>
                </button>

                <button type="button" 
                    className={editor.isActive("orderedList") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <i className="fa-solid fa-list-ol"></i>
                </button>

                {/* Цитата */}
                <button type="button"
                    className={editor.isActive("blockquote") ? "active" : ""}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                        <i className="fa-solid fa-quote-left"></i>
                </button>

                {/* Вирівнювання ліворуч */}
                <button type="button" 
                    className={editor.isActive({ textAlign: "left" }) ? "active" : ""}
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                        <i className="fa-solid fa-align-left"></i>
                </button>

                {/* По центру */}
                <button type="button" 
                    className={editor.isActive({ textAlign: "center" }) ? "active" : ""}
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                        <i className="fa-solid fa-align-center"></i>
                </button>

                {/* Праворуч */}
                <button type="button" 
                    className={editor.isActive({ textAlign: "right" }) ? "active" : ""}
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                        <i className="fa-solid fa-align-right"></i>
                </button>

                {/* По ширині */}
                <button type="button" 
                    className={editor.isActive({ textAlign: "justify" }) ? "active" : ""}
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
                        <i className="fa-solid fa-align-justify"></i>
                </button>

                {/* Посилання */}
                <button type="button" 
                    onClick={() => { const url = window.prompt("Введіть URL:");
                    if (url) {
                        editor
                            .chain()
                            .focus()
                            .setLink({ href: url })
                            .run();
                        }
                    }}
                >
                    <i className="fa-solid fa-link"></i>
                </button>

                {/* Видалити посилання */}
                <button type="button" 
                    onClick={() => editor.chain().focus().unsetLink().run()}>
                    <i className="fa-solid fa-link-slash"></i>
                </button>

                {/* Картинка */}
                <button type="button" 
                    onClick={() => {const url = window.prompt("Введіть URL зображення:");
                    if (url) {
                        editor
                            .chain()
                            .focus()
                            .setImage({ src: url })
                            .run();
                        }
                    }}
                >
                    <i className="fa-regular fa-image"></i>
                </button>

            </div>

            {/* Відображення редактора TipTap */}
            <EditorContent editor={editor} />
        </div>
    );
}

export default PostEditor; 