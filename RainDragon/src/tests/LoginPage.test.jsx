import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect } from 'vitest';
import LoginPage from '../pages/Login';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    // Замінюємо браузер
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
        // Імітуємо захід на сторінку
        useLocation: () => ({ state: { mode: 'login' } }),
    };
});

describe('LoginPage', () => {
    test('Сторінка повинна відображати поля логіну та паролю', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
        expect(screen.getByPlaceholderText(/Login/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    });

    test('Успішний вхід: викликає API, зберігає токен та переходить на головну', async () => {
        // ФЕЙК fetch, щоб він повертав успішну відповідь з токеном
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ accessToken: 'fake-token-123' }),
        });

        // Шпигуємо чи викликалося 'setItem'
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        // Імітуємо введення логіну та паролю
        fireEvent.change(screen.getByPlaceholderText(/Login/i), {
            target: { value: 'rainchu05@gmail.com' }
        });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), {
            target: { value: 'DragonChU' }
        });

        // Натискаємо кнопку входу
        const loginBtn = screen.getByRole('button', { name: /Увійти/i });
        fireEvent.click(loginBtn);

        // ПЕРЕВІРКИ
        // Перевіряємо, чи був виклик API з правильними даними
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:5000/api/login",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ 
                        login: 'rainchu05@gmail.com', 
                        password: 'DragonChU', 
                        admin: false 
                    }),
                })
            );
        });

        // Перевіряємо, чи зберігся токен
        expect(setItemSpy).toHaveBeenCalledWith('token', 'fake-token-123');

        // Перевіряємо навігацію (через 1 сек, як у вашому коді setTimeout)
        await waitFor(() => {
            expect(mockedNavigate).toHaveBeenCalledWith("/main");
        }, { timeout: 1500 }); 
    });

    test('НЕ успішний вхід: відображає помилку, якщо дані невірні', async () => {
        // Мокаємо fetch на помилку 401
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: 'Невірний логін або пароль' }),
        });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Login/i), { target: { value: 'wrong@mail.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: '123' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Увійти/i }));

        // Перевіряємо, чи з'явилося повідомлення про помилку на екрані
        const errorMsg = await screen.findByText(/Невірний логін або пароль/i);
        expect(errorMsg).toBeInTheDocument();
        expect(errorMsg).toHaveClass('message-error');
    });
});