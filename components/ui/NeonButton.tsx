
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface NeonButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    glow?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ children, className, variant = 'primary', size = 'md', isLoading = false, glow = false, ...props }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 overflow-hidden group";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 hover:shadow-primary/40",
            secondary: "bg-secondary text-secondary-foreground hover:opacity-80 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
            outline: "bg-transparent border-2 border-border hover:border-primary/50 hover:bg-primary/5 dark:border-white/20 dark:hover:border-white/40 dark:hover:bg-white/5",
            ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-foreground/70 hover:text-foreground",
            danger: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-lg shadow-destructive/25"
        };

        const sizes = {
            sm: "h-9 px-4 text-xs rounded-xl",
            md: "h-11 px-6 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-11 w-11"
        };

        return (
            <motion.button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {/* Glow Effect for primary variant */}
                {glow && variant === 'primary' && (
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:animate-shine" />
                )}

                {/* Subtle shine on hover for all variants */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out pointer-events-none" />

                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}

                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
            </motion.button>
        );
    }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
