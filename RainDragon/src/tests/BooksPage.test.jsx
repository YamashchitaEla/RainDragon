import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import BooksPage from '../pages/Books';

// 1. Створюємо змінну для перемикання стану адміна
let mockIsAdmin = false;

// 2. Мокаємо jwt-decode під вашу логіку (currentUser.admin === true)
vi.mock('jwt-decode', () => ({
    jwtDecode: () => ({ admin: mockIsAdmin })
}));

describe('BooksPage - доступ до адмін-функцій', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'fake-token');
        
        // Базовий мок для fetch, щоб компонент не падав при завантаженні жанрів/книг
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ genres: [], books: [] }),
        });
    });

    test('Відображає кнопку "+" для адміністратора', async () => {
        mockIsAdmin = true; // Робимо користувача адміном

        render(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>
        );

        // Шукаємо кнопку за її класом або за символом "+"
        // Оскільки у вас кнопка має текст "+", шукаємо його
        const addButton = await screen.findByText('+');
        
        expect(addButton).toBeInTheDocument();
        expect(addButton).toHaveClass('page-books__btn--add');
    });

    test('Приховує кнопку "+" для звичайного користувача', async () => {
        mockIsAdmin = false; // Звичайний користувач

        render(
            <MemoryRouter>
                <BooksPage />
            </MemoryRouter>
        );

        // Перевіряємо, що кнопки з текстом "+" немає
        const addButton = screen.queryByText('+');
        
        expect(addButton).not.toBeInTheDocument();
    });
});