import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Clock, Zap, Target, Sparkles, Timer, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
    {
        title: 'Distraction-Free',
        description: 'Clean interface. No clutter. Just your assignments.',
        icon: Target,
        color: 'bg-blue-500/10 text-blue-500'
    },
    {
        title: 'Loads Instantly',
        description: 'No waiting. Opens fast on any device.',
        icon: Zap,
        color: 'bg-yellow-500/10 text-yellow-500'
    },
    {
        title: 'Smart Reminders',
        description: 'Get notified before deadlines, not after.',
        icon: Clock,
        color: 'bg-green-500/10 text-green-500'
    },
    {
        title: 'Auto-Organized',
        description: 'Assignments sort by due date automatically.',
        icon: Sparkles,
        color: 'bg-purple-500/10 text-purple-500'
    },
    {
        title: 'Pomodoro Timer',
        description: 'Stay focused with built-in study sessions and breaks.',
        icon: Timer,
        color: 'bg-red-500/10 text-red-500'
    },
    {
        title: 'Notes & Attachments',
        description: 'Add notes and files to each assignment.',
        icon: FileText,
        color: 'bg-orange-500/10 text-orange-500'
    }
];

const BenefitsGrid = () => {
    return (
        <section className="py-24 bg-secondary/30 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                            Stop <span className="underline decoration-wavy decoration-destructive/30">losing track</span> of what's due.
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Scattered notes and forgotten deadlines cost you grades. Get one place that shows exactly what needs your attention.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                "Cluttered navigation vs Clean Sidebar",
                                "Manual tracking vs Auto-Sort",
                                "Slow loading vs Instant updates"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-lg font-medium">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                            >
                                <GlassCard className="p-8 h-full hover:shadow-xl transition-shadow border-white/40 bg-white/40 dark:bg-black/40">
                                    <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-6`}>
                                        <benefit.icon className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BenefitsGrid;
