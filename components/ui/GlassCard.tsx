
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'hover' | 'interactive';
    glow?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, variant = 'default', glow = false, ...props }, ref) => {
        const variants = {
            default: {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
            },
            hover: {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                whileHover: { y: -5, transition: { duration: 0.2 } }
            }
        };

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "glass-surface p-6 relative overflow-hidden group rounded-2xl",
                    "transition-all duration-300 shadow-sm dark:shadow-2xl",
                    glow && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-secondary/10 before:opacity-0 before:transition-opacity hover:before:opacity-100",
                    className
                )}
                initial="initial"
                animate="animate"
                whileHover={variant === 'interactive' || variant === 'hover' ? "whileHover" : undefined}
                variants={variants[variant as keyof typeof variants] || variants.default}
                transition={{ duration: 0.4, ease: "easeOut" }}
                {...props}
            >
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay"></div>

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
