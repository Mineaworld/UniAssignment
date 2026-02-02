import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";
import { GlassCard } from "../ui/GlassCard";
import { useApp } from "../../context";

const tabs = [
  { id: "organize", label: "Organize" },
  { id: "track", label: "Track" },
  { id: "collaborate", label: "Share" },
];

const features = {
  organize: {
    title: "Group by subject",
    description:
      "See all assignments for each class. Filter by priority or status.",
    bgColor: "bg-blue-500/10",
    screenshot: "feature-organize.webp",
  },
  track: {
    title: "Track every deadline",
    description: "Due dates, reminders, and progress in one dashboard.",
    bgColor: "bg-purple-500/10",
    screenshot: "feature-track.webp",
  },
  collaborate: {
    title: "Share with classmates",
    description: "Coming soon: Share assignment lists with study groups.",
    bgColor: "bg-pink-500/10",
    screenshot: null, // No screenshot for coming soon feature
  },
};

const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState<
    "organize" | "track" | "collaborate"
  >("organize");
  const { theme } = useApp();
  const themePath = theme === "dark" ? "dark" : "light";

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Three ways to stay ahead
          </h2>
          <div
            role="tablist"
            className="inline-flex p-1.5 rounded-full bg-secondary/50 backdrop-blur-sm border border-border"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id as keyof typeof features)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative",
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={activeTab}
                className="p-4 sm:p-6 md:p-10 relative overflow-hidden bg-background/50"
              >
                <div
                  className={`absolute inset-0 opacity-20 ${features[activeTab].bgColor} blur-[100px] transition-colors duration-500`}
                />

                <div className="relative z-10">
                  {/* Text content - more compact on mobile */}
                  <div className="text-center max-w-2xl mx-auto mb-6 md:mb-10">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-4">
                      {features[activeTab].title}
                    </h3>
                    <p className="text-sm sm:text-base md:text-xl text-muted-foreground">
                      {features[activeTab].description}
                    </p>
                  </div>

                  {/* Screenshot or Placeholder - Full width on mobile */}
                  <div className="relative mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Glow effect */}
                    <div
                      className={`absolute -inset-2 md:-inset-4 ${features[activeTab].bgColor} blur-xl md:blur-2xl opacity-30 rounded-2xl md:rounded-3xl -z-10`}
                    />

                    {/* Browser window frame */}
                    <div className="rounded-lg sm:rounded-xl border border-border bg-card shadow-xl md:shadow-2xl overflow-hidden">
                      {/* Browser chrome - smaller on mobile */}
                      <div className="h-7 sm:h-8 md:h-9 border-b border-border bg-muted/40 flex items-center px-2.5 sm:px-4 gap-1.5 sm:gap-2">
                        <div className="flex gap-1 sm:gap-1.5">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-red-400/60" />
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400/60" />
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-green-400/60" />
                        </div>
                        <div className="flex-1 mx-2 sm:mx-4 hidden sm:block">
                          <div className="h-4 sm:h-5 bg-muted/50 rounded-md max-w-[120px] sm:max-w-xs mx-auto" />
                        </div>
                      </div>

                      {/* Screenshot content with animation */}
                      <div className="bg-background overflow-hidden">
                        <AnimatePresence mode="wait">
                          {features[activeTab].screenshot ? (
                            <motion.img
                              key={`${theme}-${activeTab}`}
                              src={`/screenshots/${themePath}/${features[activeTab].screenshot}?v=${theme}`}
                              alt={features[activeTab].title}
                              width={896}
                              height={504}
                              className="w-full h-auto"
                              loading="lazy"
                              initial={{ opacity: 0, x: 60 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -60 }}
                              transition={{
                                duration: 0.4,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                            />
                          ) : (
                            <motion.div
                              key="coming-soon"
                              className="aspect-[16/9] w-full bg-secondary/10 flex items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="text-center px-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                  <span className="text-xl sm:text-2xl">
                                    🚀
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-base sm:text-lg font-medium">
                                  Coming Soon
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FeatureTabs;
