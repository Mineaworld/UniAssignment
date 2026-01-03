import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    className?: string;
    delay?: number;
    duration?: number;
    threshold?: number;
}

export const ScrollReveal = ({
    children,
    width = "100%",
    className,
    delay = 0,
    duration = 0.5,
    threshold = 0.2
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: threshold });

    return (
        <div ref={ref} style={{ width }} className={cn("relative", className)}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                }}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
                {children}
            </motion.div>
        </div>
    );
};
