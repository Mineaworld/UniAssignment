import React from 'react';
import { GlassCard } from '../ui/GlassCard';

const testimonials = [
    {
        quote: "Honestly, I used to miss deadlines just because my old system was so messy. This app is the first one that doesn't feel like a chore. The dark mode is perfect for my coding all-nighters.",
        author: "Sok Piseth",
        role: "CS Student, RUPP",
        image: "https://i.pravatar.cc/150?u=15"
    },
    {
        quote: "Med school is chaotic. I was juggling so many PDFs and schedules that I felt like I was drowning. Having everything synced in one place is literally a lifesaver. I can actually see my free time now.",
        author: "Ly Sophea",
        role: "General Medicine, UHS",
        image: "https://i.pravatar.cc/150?u=42"
    },
    {
        quote: "Most apps are too complicated. I just needed something to list my readings and group projects without spending hours setting it up. This is clean, fast, and exactly what I needed.",
        author: "Chan Vuthy",
        role: "Law Student, RULE",
        image: "https://i.pravatar.cc/150?u=12"
    },
    {
        quote: "I'm a visual learner, so boring spreadsheets just don't work for me. The Kanban board here is unmatched. Dragging my 'done' assignments over is the most satisfying feeling ever.",
        author: "Keo Bopha",
        role: "Design, Limkokwing",
        image: "https://i.pravatar.cc/150?u=25"
    },
    {
        quote: "It doesn't lag. That's huge for me. Whether I'm on my phone or laptop, it's instant. It's become essential for keeping track of all my lab reports and project due dates.",
        author: "Chea Rithy",
        role: "Engineering, ITC",
        image: "https://i.pravatar.cc/150?u=67"
    },
    {
        quote: "I tried using Notion templates but they took too long to customize. UniAssignment worked perfectly out of the box. Really helps me balance my studies and my part-time job.",
        author: "Meng Vanna",
        role: "Finance, CamEd",
        image: "https://i.pravatar.cc/150?u=33"
    }
];

const Testimonials = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-bold mb-4">Proven by high achievers</h2>
                    <p className="text-xl text-muted-foreground">
                        Join thousands of students who have elevated their academic performance.
                    </p>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {testimonials.map((t, i) => (
                        <GlassCard key={i} className="p-6 break-inside-avoid bg-white/50 dark:bg-black/20 hover:scale-[1.02] transition-transform duration-300">
                            <p className="text-lg leading-relaxed mb-6 font-medium text-foreground/90">"{t.quote}"</p>
                            <div className="flex items-center gap-4">
                                <img src={t.image} alt={t.author} className="w-10 h-10 rounded-full bg-secondary object-cover" />
                                <div>
                                    <div className="font-bold text-sm">{t.author}</div>
                                    <div className="text-xs text-muted-foreground">{t.role}</div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
