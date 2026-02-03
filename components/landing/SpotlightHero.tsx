import React, { useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useApp } from "../../context";

const StaggeredText = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const words = text.split(" ");
  return (
    <span className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden mr-[0.2em] last:mr-0 align-bottom"
        >
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.1,
              ease: [0.33, 1, 0.68, 1],
            }}
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
  const { theme } = useApp();

  // Spotlight mouse position - using useMotionValue to avoid re-renders
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spotlight gradient - must be at top level (hooks rule)
  const spotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(var(--foreground-rgb),0.06), transparent 40%)`;

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
      className="relative min-h-[85vh] flex items-start justify-center overflow-hidden py-12 pt-24 bg-background"
    >
      {/* Spotlight Effect - Subtle on Light, stronger on Dark */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-20 mix-blend-soft-light"
        style={{
          background: spotlightBackground,
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

      <div className="max-w-7xl w-full mx-auto px-6 grid lg:grid-cols-[1fr,1.1fr] gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Content */}
        <motion.div className="space-y-8 flex flex-col justify-center">
          <h1 className="font-sans text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-foreground mb-6">
            <StaggeredText text="Never Miss a" className="block" />
            <span className="text-primary block">
              <StaggeredText text="Deadline" className="inline-block" />
            </span>
            <StaggeredText
              text="Again."
              className="block text-slate-400 dark:text-muted-foreground"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed font-normal"
          >
            The assignment tracker that keeps you on schedule. See everything
            due at a glance.
          </motion.p>

          <div className="flex flex-wrap gap-4 pt-4">
            <motion.button
              ref={btnRef}
              style={{ x: btnX, y: btnY }}
              onMouseMove={handleBtnMouseMove}
              onMouseLeave={handleBtnMouseLeave}
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="relative px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg overflow-hidden group shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                See How It Works{" "}
                <ArrowRight
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </span>
            </motion.button>

            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 rounded-full border border-border bg-background/50 hover:bg-muted/50 backdrop-blur-sm transition-colors text-foreground font-medium flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start Free
            </button>
          </div>

          <div className="pt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/100?img=${i + 50}`}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-border bg-muted object-cover"
                />
              ))}
            </div>
            <p>Trusted by 100+ students</p>
          </div>
        </motion.div>

        {/* Right Content - Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ y: yInternal }}
          className="relative hidden lg:flex items-start justify-center -mt-4"
        >
          {/* Glow effect */}
          <div className="absolute -inset-6 bg-primary/20 blur-3xl rounded-[3rem] -z-10" />

          {/* Browser window */}
          <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden w-full max-w-[680px]">
            {/* Browser chrome */}
            <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 mx-2">
                <div className="h-6 bg-muted/50 rounded-lg max-w-[200px] mx-auto" />
              </div>
            </div>

            {/* Screenshot Content with slide up animation */}
            <AnimatePresence mode="wait">
              <motion.img
                key={theme}
                src={`/screenshots/${theme === "dark" ? "dark" : "light"}/dashboard-main.webp?v=${theme}`}
                alt="UniAssignment app preview"
                width={680}
                height={470}
                className="w-full h-auto"
                loading="eager"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </AnimatePresence>

            {/* Floating badge - positioned inside */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-4 bg-card/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-lg flex items-center gap-3"
            >
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2
                  className="w-5 h-5 text-green-500"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-bold text-foreground">On Track</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SpotlightHero;
