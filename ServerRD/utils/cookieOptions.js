export const COOKIE_NAME = "refreshToken";
export const cookieOptions = (rememberMe = false) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe // Чи сесійні cookie, чи на 7 днів
        ? { maxAge: 7 * 24 * 60 * 60 * 1000 }
        : {}),
});

export const clearRefreshCookie = (res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    });
};
