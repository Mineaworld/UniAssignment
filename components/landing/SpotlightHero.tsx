import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

const StaggeredText = ({ text, className }: { text: string, className?: string }) => {
    const words = text.split(" ");
    return (
        <span className={cn("inline-block", className)}>
            {words.map((word, i) => (
                <span key={`${word}-${i}`} className="inline-block overflow-hidden mr-[0.2em] last:mr-0 align-bottom">
                    <motion.span
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                        className="inline-block py-1"
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

const SpotlightHero = () => {
    const navigate = useNavigate();
    const heroRef = useRef<HTMLDivElement>(null);

    // Spotlight mouse position - using useMotionValue to avoid re-renders
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Magnetic Button Logic
    const btnRef = useRef<HTMLButtonElement>(null);
    const btnX = useMotionValue(0);
    const btnY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (heroRef.current) {
            const { left, top } = heroRef.current.getBoundingClientRect();
            mouseX.set(e.clientX - left);
            mouseY.set(e.clientY - top);
        }
    };

    const handleBtnMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const btnMouseX = e.clientX - rect.left;
        const btnMouseY = e.clientY - rect.top;
        const xPct = btnMouseX / width - 0.5;
        const yPct = btnMouseY / height - 0.5;

        btnX.set(xPct * 20);
        btnY.set(yPct * 20);
    };

    const handleBtnMouseLeave = () => {
        btnX.set(0);
        btnY.set(0);
    };

    // Parallax logic moved to specific elements or removed to prevent overlap
    const { scrollY } = useScroll();
    // Subtle internal movement only
    const yInternal = useTransform(scrollY, [0, 500], [0, 20]);

    return (
        <section
            ref={heroRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 bg-background"
        >
            {/* Spotlight Effect - Subtle on Light, stronger on Dark */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-20 mix-blend-soft-light"
                style={{
                    background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(var(--foreground-rgb),0.06), transparent 40%)`
                }}
            />

            {/* Aurora Background (Aventra Style) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Indigo Blob */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" />
                {/* Purple Blob */}
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob animation-delay-2000" />
                {/* Pink/Accent Blob */}
                <div className="absolute -bottom-20 left-[20%] w-[40vw] h-[40vw] bg-pink-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-40 animate-blob animation-delay-4000" />
            </div>

            {/* Noise Texture */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0 mix-blend-overlay" />

            <div className="max-w-7xl w-full mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Content */}
                <motion.div className="space-y-10">

                    <h1 className="font-sans text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-foreground mb-6">
                        <StaggeredText text="Master Your" className="block" />
                        <span className="text-primary block">
                            <StaggeredText text="Academic" className="inline-block" />
                        </span>
                        <StaggeredText text="Universe." className="block text-slate-400 dark:text-muted-foreground" />
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed font-normal"
                    >
                        The minimal, dark-mode first workspace for students who reject the noise.
                    </motion.p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <motion.button
                            ref={btnRef}
                            style={{ x: btnX, y: btnY }}
                            onMouseMove={handleBtnMouseMove}
                            onMouseLeave={handleBtnMouseLeave}
                            onClick={() => navigate('/signup')}
                            className="relative px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg overflow-hidden group shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </motion.button>

                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 rounded-full border border-border bg-background/50 hover:bg-muted/50 backdrop-blur-sm transition-all text-foreground font-medium flex items-center gap-2"
                        >
                            Explore Features
                        </button>
                    </div>

                    <div className="pt-8 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border border-border bg-muted" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 50})`, backgroundSize: 'cover' }} />
                            ))}
                        </div>
                        <p>Trusted by 100+ students</p>
                    </div>
                </motion.div>

                {/* Right Content - 3D Mockup Matte/Wireframe */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ y: yInternal }}
                    className="relative hidden lg:block perspective-1000"
                >
                    <div className="relative z-10 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transform-gpu rotate-y-[-12deg] rotate-x-[5deg]">
                        {/* Mockup Header */}
                        <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                            </div>
                        </div>

                        {/* Mockup Content - Clean Wireframe */}
                        <div className="p-6 grid gap-6 bg-background/50">
                            <div className="flex gap-6">
                                <div className="w-16 h-16 rounded-xl bg-muted animate-pulse" />
                                <div className="space-y-2 flex-1 pt-2">
                                    <div className="h-4 w-1/3 bg-muted/60 rounded" />
                                    <div className="h-3 w-1/4 bg-muted/40 rounded" />
                                    <div className="h-3 w-1/4 bg-muted/40 rounded" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-32 rounded-xl bg-muted/20 border border-border/50 p-4" />
                                <div className="h-32 rounded-xl bg-muted/20 border border-border/50 p-4" />
                                <div className="h-32 rounded-xl bg-muted/20 border border-border/50 p-4" />
                                <div className="h-32 rounded-xl bg-muted/20 border border-border/50 p-4" />
                            </div>
                        </div>

                        {/* Decoration */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -right-6 top-20 bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-lg flex items-center gap-3"
                        >
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-sm font-bold text-foreground">On Track</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Subtle Glow - Neutral */}
                    <div className="absolute inset-0 bg-primary/5 blur-[80px] -z-10" />
                </motion.div>
            </div>
        </section>
    );
};

export default SpotlightHero;
