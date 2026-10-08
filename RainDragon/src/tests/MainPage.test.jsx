import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import MainPage from '../pages/Main';

// Мокаємо useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe('MainPage - Відображення книг', () => {
    
    // Очищаємо моки перед кожним тестом
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.setItem('token', 'fake-token-123');
    });

    test('Повинен успішно отримати книги та відобразити їх на сторінці', async () => {
        const mockBooks = {
            topBooks: [
                {
                    id: 1,
                    ukrainian_name: 'Шлях Дракона',
                    preview: 'dragon.jpg',
                    author: [{ full_name: 'Тест' }]
                },
                {
                    id: 2,
                    ukrainian_name: 'Тіні минулого',
                    preview: 'shadows.jpg',
                    author: [{ full_name: 'Тест' }]
                }
            ]
        };

        // 2. Мокаємо успішну відповідь fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockBooks,
        });

        // 3. Рендеримо компонент
        render(
            <MemoryRouter>
                <MainPage />
            </MemoryRouter>
        );

        // 4. Перевіряємо заголовок (він статичний)
        expect(screen.getByText(/Останні новинки/i)).toBeInTheDocument();

        // 5. Чекаємо на появу назв книг (findBy... автоматично чекає виконання промісів)
        const bookTitle1 = await screen.findByText('Шлях Дракона');
        const bookTitle2 = await screen.findByText('Тіні минулого');
        const authors = await screen.findAllByText(/Тест/i);

        // 6. Фінальні перевірки
        expect(bookTitle1).toBeInTheDocument();
        expect(bookTitle2).toBeInTheDocument();
        expect(authors.length).toBeGreaterThan(0);
        
        // Перевіряємо, чи був виклик саме на потрібний URL
        expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost:5000/api/books_top",
            expect.any(Object)
        );
    });

    test('Відображає помилку в консолі, якщо сервер повернув статус 500', async () => {
        // Мокаємо помилку сервера
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Помилка сервера' }),
        });

        render(
            <MemoryRouter>
                <MainPage />
            </MemoryRouter>
        );

        // Чекаємо виклику console.error
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                "Сервер повернув помилку:",
                "Помилка сервера"
            );
        });
    });
});