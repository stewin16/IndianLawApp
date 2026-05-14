import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Handles auto-scroll-to-top on route change only.
// The visual scroll buttons are handled per-page in Index.tsx.
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
