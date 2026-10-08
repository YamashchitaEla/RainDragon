import Footer from "./Footer";
import Header from "./Header";

// Layout component (якщо hideFooter не передано, то Footer буде показано)
export default function Layout({ children, hideFooter, hideHeader }) {
    return (
    <>
        {!hideHeader && <Header />}
        <main>{children}</main>
        {!hideFooter && <Footer />}
    </>
    );
}