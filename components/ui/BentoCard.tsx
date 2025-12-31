import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { ArrowRight } from "lucide-react";

type BentoCardProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  delay?: number;
};

export const BentoCard = ({ children, className, href, onClick, delay = 0 }: BentoCardProps) => {
  const Container = href ? motion.a : motion.div;

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        // Base Layout & Transition
        "relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 h-full group/bento",
        // Glassmorphism & Colors
        "bg-white/60 border-black/5 backdrop-blur-xl",
        "dark:bg-black/40 dark:border-white/10 dark:shadow-2xl",
        // Hover Overlay
        "hover:border-primary/20 hover:shadow-lg",
        href && "cursor-pointer",
        // User Overrides (Grid spans, padding, custom colors)
        className
      )}
      onClick={onClick}
      {...(href ? { href } : {})}
    >
      {/* Gradient overlay for light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay"></div>

      {/* Content Container - Ensures z-index above background */}
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </Container>
  );
};

export const BentoHeader = ({
  title,
  subtitle,
  icon: Icon,
  className
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1 p-6 relative z-10", className)}>
    <div className="flex items-center justify-between">
      {Icon && (
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background shadow-sm text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
          <Icon className="h-4 w-4" />
        </div>
      )}
      {/* Optional arrow indicator for links */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 transform group-hover:translate-x-1 duration-300">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
    <h3 className="font-semibold tracking-tight text-base">{title}</h3>
    {subtitle && <p className="text-muted-foreground text-xs font-medium">{subtitle}</p>}
  </div>
);

export const BentoContent = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex-1 p-6 pt-0 relative z-10", className)}>
    {children}
  </div>
);
