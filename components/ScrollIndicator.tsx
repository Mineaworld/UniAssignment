import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface ScrollIndicatorProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollIndicator = ({ children, className }: ScrollIndicatorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftIndicator(scrollLeft > 10);
    setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    checkScroll();
    scrollElement.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      scrollElement.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    const targetScroll = direction === 'left'
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;

    scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative group">
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300",
          "bg-gradient-to-r from-background via-background/80 to-transparent",
          showLeftIndicator ? "opacity-100" : "opacity-0"
        )}
      />

      <button
        onClick={() => scroll('left')}
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 z-20 transition-all duration-300",
          "h-8 w-8 rounded-full flex items-center justify-center",
          "bg-background/90 border border-border shadow-lg backdrop-blur-sm",
          "hover:bg-muted hover:scale-110 active:scale-95",
          showLeftIndicator ? "opacity-100 md:opacity-0 md:group-hover:opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>

      <div ref={scrollRef} className={cn("overflow-x-auto custom-scrollbar", className)}>
        {children}
      </div>

      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300",
          "bg-gradient-to-l from-background via-background/80 to-transparent",
          showRightIndicator ? "opacity-100" : "opacity-0"
        )}
      />

      <button
        onClick={() => scroll('right')}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 z-20 transition-all duration-300",
          "h-8 w-8 rounded-full flex items-center justify-center",
          "bg-background/90 border border-border shadow-lg backdrop-blur-sm",
          "hover:bg-muted hover:scale-110 active:scale-95",
          showRightIndicator ? "opacity-100 md:opacity-0 md:group-hover:opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
};
