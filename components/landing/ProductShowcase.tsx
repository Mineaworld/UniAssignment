import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

const ProductShowcase = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <div className="mb-16 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Everything you need to <span className="text-primary">excel</span>.
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        A unified workspace that brings your assignments, schedule, and notes into one beautiful interface.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="relative mx-auto rounded-3xl border border-white/10 shadow-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm p-2 md:p-4"
                >
                    <div className="rounded-2xl overflow-hidden bg-background border border-border aspect-[16/10] relative group">
                        {/* Mockup UI - Dashboard View */}
                        <div className="absolute inset-0 bg-secondary/30 flex">
                            {/* Sidebar Mockup */}
                            <div className="w-64 border-r border-border h-full bg-card/50 p-6 hidden md:flex flex-col gap-4">
                                <div className="h-8 w-8 rounded-lg bg-primary/20 mb-4" />
                                <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                                <div className="h-4 w-32 rounded bg-muted-foreground/20" />
                                <div className="h-4 w-20 rounded bg-muted-foreground/20" />

                                <div className="mt-auto h-12 rounded-xl bg-primary/10" />
                            </div>
                            {/* Main Content Mockup */}
                            <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                                <div className="col-span-2 h-48 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-border/50 p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 rounded bg-muted-foreground/20" />
                                            <div className="h-3 w-20 rounded bg-muted-foreground/10" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 w-full rounded bg-muted/50" />
                                        <div className="h-2 w-5/6 rounded bg-muted/50" />
                                        <div className="h-2 w-4/6 rounded bg-muted/50" />
                                    </div>
                                </div>
                                <div className="col-span-1 h-48 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-border/50 p-4" />
                                <div className="col-span-1 h-48 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-border/50 p-4" />
                                <div className="col-span-2 h-48 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-border/50 p-4" />
                            </div>
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                    </div>

                    {/* Decorative Glow */}
                    <div className="absolute -inset-4 bg-primary/10 blur-3xl -z-10 rounded-[3rem]" />
                </motion.div>
            </div>
        </section>
    );
};

export default ProductShowcase;
