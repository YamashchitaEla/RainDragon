import Layout from "./components/Layout";
import StartPage from "./pages/Start.jsx"
import LoginPage from "./pages/Login.jsx";
import MainPage from "./pages/Main.jsx";

import ContactsPage from "./pages/Contacts.jsx";

import Books from "./pages/Books.jsx";
import Book from "./pages/Book.jsx"
import BookPage from "./pages/BookPage.jsx"
import CreateBookPage from "./pages/CreateBookPage.jsx";

import Posts from "./pages/Posts.jsx";
import PostsDrafts from "./pages/PostsDrafts.jsx";
import PostPage from "./pages/PostPage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";

import Profile from "./pages/Profile.jsx";

import Writers from "./pages/Writers.jsx";
import WriterPage from "./pages/WriterPage.jsx";
import CreateWriter from "./pages/CreateWriter.jsx";

import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// children - це те, що буде всередині Layout, hideFooter - це пропс для того, щоб приховати Footer на певних сторінках (наприклад, на стартовій та логіні)
function App() {

    const { pathname } = useLocation();

  useEffect(() => {
    // Прокручуємо і window, і html, і body про всяк випадок
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [pathname]);
  
    return (
        <Routes>
            <Route path="/" element={ <Layout hideHeader={true} hideFooter={true}> <StartPage /></Layout>}></Route>
            <Route path="/login" element={<Layout hideHeader={true} hideFooter={true}> <LoginPage/> </Layout>}></Route>
            <Route path="/main" element={<Layout> <MainPage /> </Layout>}></Route>
            <Route path="/books" element={<Layout> <Books /> </Layout>}></Route>
            <Route path="/posts" element={<Layout> <Posts /> </Layout>}></Route>
            <Route path="/posts/drafts" element={<Layout> <PostsDrafts /> </Layout>}></Route>
            <Route path="/writers" element={<Layout> <Writers /> </Layout>}></Route>
            <Route path="/contacts" element={<Layout> <ContactsPage /> </Layout>}></Route>
            
            <Route path="/book/:id" element={<Layout> <BookPage /> </Layout>} />
            <Route path="/book/reading/:id" element={<Layout> <Book /> </Layout>} />
            <Route path="/upload/book" element={<Layout> <CreateBookPage /> </Layout>} />
            <Route path="/upload/book/:id" element={<Layout> <CreateBookPage /> </Layout>} />

            <Route path="/post/:id" element={<Layout> <PostPage /> </Layout>} />
            <Route path="/upload/post" element={<Layout> <CreatePostPage /> </Layout>} />
            <Route path="/upload/post/:id" element={<Layout> <CreatePostPage /> </Layout>} />
            
            <Route path="/profile/:id" element={<Layout> <Profile /> </Layout>} />
            
            <Route path="/writer/:id" element={<Layout> <WriterPage /> </Layout>} />
            <Route path="/upload/writer" element={<Layout> <CreateWriter /> </Layout>} />
            <Route path="/upload/writer/:id" element={<Layout> <CreateWriter /> </Layout>} />
        </Routes>
    )
}

export default App
