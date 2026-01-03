import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Clock, Zap, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
    {
        title: 'Focus Mode',
        description: 'Eliminate distractions with a clean, immersive interface designed for deep work.',
        icon: Target,
        color: 'bg-blue-500/10 text-blue-500'
    },
    {
        title: 'Lightning Fast',
        description: 'Optimized performance ensures your workflow never hits a bottleneck.',
        icon: Zap,
        color: 'bg-yellow-500/10 text-yellow-500'
    },
    {
        title: 'Smart Scheduling',
        description: 'AI-driven prioritization helps you stay on top of deadlines without stress.',
        icon: Clock,
        color: 'bg-green-500/10 text-green-500'
    },
    {
        title: 'Automated Polish',
        description: 'Automatic formatting and organization keeps your workspace pristine.',
        icon: Sparkles,
        color: 'bg-purple-500/10 text-purple-500'
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
                            Your current workflow is <span className="underline decoration-wavy decoration-destructive/30">slowing you down</span>.
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Stop fighting with cluttered interfaces and confusing tools. Switch to a workspace that adapts to your thinking process.
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

                    <div className="grid sm:grid-cols-2 gap-6">
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
                                        <benefit.icon className="w-6 h-6" />
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
