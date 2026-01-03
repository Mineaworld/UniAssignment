import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { GlassCard } from '../ui/GlassCard';

const tabs = [
    { id: 'organize', label: 'Organize' },
    { id: 'track', label: 'Track Content' },
    { id: 'collaborate', label: 'Collaborate' },
];

const features = {
    organize: {
        title: "Structure your semester",
        description: "Group assignments by subject, tag them by priority, and visualize your entire workload at a glance.",
        image: "bg-blue-500/10"
    },
    track: {
        title: "Never miss a detail",
        description: "Keep track of every reading, lecture note, and submission requirement in one central database.",
        image: "bg-purple-500/10"
    },
    collaborate: {
        title: "Study together (Coming Soon)",
        description: "Share notes and assignment trackers with classmates to stay synchronized.",
        image: "bg-pink-500/10"
    }
};

const FeatureTabs = () => {
    const [activeTab, setActiveTab] = useState<'organize' | 'track' | 'collaborate'>('organize');

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Built on strong foundations</h2>
                    <div className="inline-flex p-1.5 rounded-full bg-secondary/50 backdrop-blur-sm border border-border">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as keyof typeof features)}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative",
                                    activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
                            transition={{ duration: 0.4 }}
                        >
                            <GlassCard className="p-8 md:p-12 aspect-[16/9] flex items-center justify-center relative overflow-hidden bg-background/50">
                                <div className={`absolute inset-0 opacity-20 ${features[activeTab].image} blur-[100px] transition-colors duration-500`} />

                                <div className="relative z-10 text-center max-w-2xl">
                                    <h3 className="text-3xl font-bold mb-4">{features[activeTab].title}</h3>
                                    <p className="text-xl text-muted-foreground">{features[activeTab].description}</p>

                                    {/* Mockup Element */}
                                    <div className="mt-12 bg-background border border-border rounded-xl shadow-2xl p-4 w-full h-64 mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <div className="h-full w-full bg-secondary/20 rounded-lg animate-pulse" />
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
