import { useState, useCallback, useEffect } from 'react';

export function useScroll(threshold: number) {
    const [scrolled, setScrolled] = useState(false);

    const updateScrolled = useCallback(() => {
        setScrolled(window.scrollY > threshold);
    }, [threshold]);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    updateScrolled();
                    ticking = false;
                });
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [updateScrolled]);

    // Check on first load
    useEffect(() => {
        updateScrolled();
    }, [updateScrolled]);

    return scrolled;
}
