import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Reader from '../pages/Book';
import ePub from "epubjs";

// 1. Мокаємо scrollIntoView, бо JSDOM його не має
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('epubjs', () => ({
    default: vi.fn()
}));

describe('Reader Component', () => {
    const mockId = '123';
    
    const mockEpubInstance = {
        ready: Promise.resolve(),
        spine: {
            items: [
                { href: 'chapter1.xhtml' },
                { href: 'illustration.xhtml' }
            ]
        },
        navigation: {
            toc: [{ label: 'Розділ 1', href: 'chapter1.xhtml' }]
        },
        load: vi.fn().mockImplementation(async (href) => {
            if (href === 'chapter1.xhtml') {
                return '<html><body><h1>Заголовок</h1><p>Текст книги</p><strong>Видалити мене</strong></body></html>';
            }
            if (href === 'illustration.xhtml') {
                // 11 картинок для спрацювання фільтра
                return `<html><body>${' <img src="1.jpg" />'.repeat(11)}</body></html>`;
            }
            return '';
        })
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Налаштовуємо мок epubjs
        vi.mocked(ePub).mockReturnValue(mockEpubInstance);

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            blob: async () => new Blob(['fake-epub'], { type: 'application/epub+zip' }),
            json: async () => ({ accessToken: 'new-token' })
        });

        localStorage.clear();
    });

    test('Успішно завантажує книгу та очищує HTML', async () => {
        render(
            <MemoryRouter initialEntries={[`/reader/${mockId}`]}>
                <Routes>
                    {/* ВИПРАВЛЕНО: Шлях тепер збігається з initialEntries */}
                    <Route path="/reader/:id" element={<Reader />} />
                </Routes>
            </MemoryRouter>
        );

        // Чекаємо на завантаження контенту
        await waitFor(() => {
            expect(screen.getByText('Текст книги')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Перевірка очищення тегів
        expect(screen.queryByText('Видалити мене')).not.toBeInTheDocument();
        
        // Перевірка атрибутів
        const paragraph = screen.getByText('Текст книги');
        expect(paragraph).toHaveAttribute('id', 'para-0');
        expect(paragraph).toHaveClass('selectable-para');
    });
});