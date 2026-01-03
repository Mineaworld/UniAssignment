import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

const Pricing = () => {
    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
                    <p className="text-xl text-muted-foreground">Start for free, upgrade when you need more power.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <GlassCard className="p-8 relative flex flex-col h-full border-border/50 bg-white/40 dark:bg-black/40">
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">Student Basic</h3>
                            <div className="text-4xl font-extrabold mb-4">$0 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-muted-foreground">Essential tools for organized students.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {['Unlimited Assignments', 'Basic Kanban Board', '3 Subjects Max', 'Mobile Support'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <Button variant="outline" className="w-full rounded-full">Get Started Free</Button>
                    </GlassCard>

                    {/* Pro Plan */}
                    <div className="relative group">
                        <div className="absolute -inset-px bg-gradient-to-b from-primary to-purple-600 rounded-[2rem] opacity-100 blur-sm group-hover:blur-md transition-all duration-500" />
                        <GlassCard className="p-8 relative flex flex-col h-full bg-background border-transparent">
                            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                POPULAR
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">Academic Pro</h3>
                                <div className="text-4xl font-extrabold mb-4 text-primary">$5 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                <p className="text-muted-foreground">For power users who need complete control.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {['Everything in Basic', 'Unlimited Subjects', 'Calendar Sync', 'Advanced Analytics', 'Priority Support'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <Button className="w-full rounded-full shadow-lg shadow-primary/25 group-hover:scale-[1.02] transition-transform">
                                Upgrade to Pro <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
