// Коли перший запит отримує 401 помилку, він дивиться на цей прапорець.
// Якщо він false, значить ніхто ще не пішов за "кавою" (новим токеном). Ми ставимо його в true і починаємо процес оновлення.
// Якщо він true, ми розуміємо: "О, хтось уже оновлює токен, мені просто треба зачекати".
let isRefreshing = false;
let refreshSubscribers = [];

// Черга колбеків, які потрібно викликати після оновлення токена. Коли процес оновлення завершиться, ми викликаємо всі ці колбеки, передаючи їм новий токен.
const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

// Ця функція викликається після успішного оновлення токена. Вона проходить по всіх підписниках і викликає їх, передаючи новий токен.
// Запити які чекають
const onRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

export const requestWithRefresh = async (url, options = {}) => {
    // Функція для виконання запиту з автоматичним оновленням токена при 401 помилці
    const makeRequest = (token) =>
        fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${
                    token || localStorage.getItem("token")
                }`,
            },
        });

    // Виконуємо запит вперше з поточним токеном
    let res = await makeRequest();

    if (res.status !== 401) {
        return res;
    }

    // Створюємо проміс, який буде чекати, поки токен оновиться, і потім повторить оригінальний запит з новим токеном
    const retryOriginalRequest = new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
            if (newToken) {
                resolve(makeRequest(newToken));
            } else {
                //  Повідомлення про неуспіх
                reject(new Error("Token refresh failed"));
            }
        });
    });

    if (!isRefreshing) {
        isRefreshing = true;
        try {
            const refreshRes = await fetch(
                "http://localhost:5000/api/refresh",
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!refreshRes.ok) {
                throw new Error("Refresh failed");
            }

            const data = await refreshRes.json();
            localStorage.setItem("token", data.accessToken);
            isRefreshing = false;
            // У кожний елемент масиву пробрасую новий токен, щоб вони могли повторити свої запити з оновленим токеном по черзі
            onRefreshed(data.accessToken);

        } catch (err) {
            isRefreshing = false;
            onRefreshed(null);

            localStorage.removeItem("token");
            window.location.href = "/login";

            return res;
        }
    }

    return retryOriginalRequest;
};