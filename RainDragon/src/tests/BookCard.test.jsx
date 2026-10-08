import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect } from 'vitest';
import BookCard from '../pages/BookCard';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    // Замінюємо браузер
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

describe('BookCard', () => {
    test('Відображає дані книги та переходить на сторінку книги при кліку', () => {
        // 1. Готуємо фейкові дані (props)
        const mockProps = {
            id: 42,
            ukrainian_name: 'Тестова Книга',
            author: 'Тестовий Автор',
            preview: 'test-image.jpg'
        };

        // 2. Передаємо їх у компонент при рендері
        render(
            <MemoryRouter>
                <BookCard 
                    id={mockProps.id}
                    ukrainian_name={mockProps.ukrainian_name}
                    author={mockProps.author}
                    preview={mockProps.preview}
                />
            </MemoryRouter>
        );

        // 3. Перевіряємо, чи відобразився текст
        expect(screen.getByText('Тестова Книга')).toBeInTheDocument();
        expect(screen.getByText('Тестовий Автор')).toBeInTheDocument();

        // 4. Перевіряємо картинку
        const img = screen.getByAltText(/Тестова Книга/i); // зазвичай в alt назва
        expect(img).toHaveAttribute('src', expect.stringContaining('test-image.jpg'));
    });

    test('При натисканні викликається перехід на сторінку книги', () => {
        render(
            <MemoryRouter>
                <BookCard id={42} ukrainian_name="Книга" author="Автор" />
            </MemoryRouter>
        );

        const cardElement = screen.getByText('Книга');
        fireEvent.click(cardElement);
        expect(mockedNavigate).toHaveBeenCalledWith('/book/42');
    });
});