import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context";

const ProductShowcase = () => {
  const { theme } = useApp();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Your semester. <span className="text-primary">One clear view.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Assignments, due dates, and progress all in one place. No more
            digging through emails or syllabi
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Decorative Glow */}
          <div className="absolute -inset-8 bg-primary/15 blur-3xl -z-10 rounded-[4rem]" />

          {/* Browser window frame */}
          <div className="rounded-2xl md:rounded-3xl border border-border/50 shadow-2xl bg-card overflow-hidden">
            {/* Browser chrome */}
            <div className="h-10 md:h-12 border-b border-border bg-muted/30 flex items-center px-4 gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/70 hover:bg-red-400 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70 hover:bg-yellow-400 transition-colors" />
                <div className="w-3 h-3 rounded-full bg-green-400/70 hover:bg-green-400 transition-colors" />
              </div>
              <div className="flex-1 mx-4 hidden sm:block">
                <div className="h-6 bg-muted/50 rounded-lg max-w-md mx-auto flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    uniassignment.app
                  </span>
                </div>
              </div>
            </div>

            {/* Screenshot content with animation */}
            <div className="bg-background relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={theme}
                  src={`/screenshots/${theme === "dark" ? "dark" : "light"}/dashboard-main.webp?v=${theme}`}
                  alt="UniAssignment Dashboard - View and manage all your assignments in one place"
                  className="w-full h-auto"
                  loading="lazy"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
              </AnimatePresence>

              {/* Subtle overlay gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductShowcase;
