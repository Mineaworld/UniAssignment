import React from 'react';
import SpotlightHero from '../components/landing/SpotlightHero';
import ProductShowcase from '../components/landing/ProductShowcase';
import BenefitsGrid from '../components/landing/BenefitsGrid';
import FeatureTabs from '../components/landing/FeatureTabs';
import { TestimonialsSection as TestimonialsMarquee } from '../components/landing/TestimonialsMarquee';
import Pricing from '../components/landing/Pricing';
import SiteFooter from '../components/landing/SiteFooter';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { AnimatedThemeToggler } from '../components/ui/animated-theme-toggler';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30">

            {/* Sticky Navbar */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="#" className="font-bold text-xl tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />
                        UniAssignment
                    </a>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">Features</a>
                        <a href="#testimonials" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">Testimonials</a>
                        <a href="#pricing" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">Pricing</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <AnimatedThemeToggler className="hover:bg-muted/20" />
                        <a href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Sign In</a>
                        <a href="/signup">
                            <Button size="sm" className="rounded-full">Get Started</Button>
                        </a>
                    </div>
                </div>
            </header>

            <main>
                <SpotlightHero />

                <ScrollReveal>
                    <ProductShowcase />
                </ScrollReveal>

                <div id="features">
                    <ScrollReveal>
                        <BenefitsGrid />
                    </ScrollReveal>
                </div>

                <ScrollReveal>
                    <FeatureTabs />
                </ScrollReveal>

                <div id="testimonials">
                    <ScrollReveal>
                        <TestimonialsMarquee
                            title="Proven by high achievers"
                            description="Join thousands of students who have elevated their academic performance."
                            testimonials={[
                                {
                                    text: "Honestly, I used to miss deadlines just because my old system was so messy. This app is the first one that doesn't feel like a chore. The dark mode is perfect for my coding all-nighters.",
                                    author: {
                                        name: "Sok Piseth",
                                        handle: "CS Student, RUPP",
                                        avatar: "https://i.pravatar.cc/150?u=15"
                                    }
                                },
                                {
                                    text: "Med school is chaotic. I was juggling so many PDFs and schedules that I felt like I was drowning. Having everything synced in one place is literally a lifesaver. I can actually see my free time now.",
                                    author: {
                                        name: "Ly Sophea",
                                        handle: "General Medicine, UHS",
                                        avatar: "https://i.pravatar.cc/150?u=42"
                                    }
                                },
                                {
                                    text: "Most apps are too complicated. I just needed something to list my readings and group projects without spending hours setting it up. This is clean, fast, and exactly what I needed.",
                                    author: {
                                        name: "Chan Vuthy",
                                        handle: "Law Student, RULE",
                                        avatar: "https://i.pravatar.cc/150?u=12"
                                    }
                                },
                                {
                                    text: "I'm a visual learner, so boring spreadsheets just don't work for me. The Kanban board here is unmatched. Dragging my 'done' assignments over is the most satisfying feeling ever.",
                                    author: {
                                        name: "Keo Bopha",
                                        handle: "Design, Limkokwing",
                                        avatar: "https://i.pravatar.cc/150?u=25"
                                    }
                                },
                                {
                                    text: "It doesn't lag. That's huge for me. Whether I'm on my phone or laptop, it's instant. It's become essential for keeping track of all my lab reports and project due dates.",
                                    author: {
                                        name: "Chea Rithy",
                                        handle: "Engineering, ITC",
                                        avatar: "https://i.pravatar.cc/150?u=67"
                                    }
                                },
                                {
                                    text: "I tried using Notion templates but they took too long to customize. UniAssignment worked perfectly out of the box. Really helps me balance my studies and my part-time job.",
                                    author: {
                                        name: "Meng Vanna",
                                        handle: "Finance, CamEd",
                                        avatar: "https://i.pravatar.cc/150?u=33"
                                    }
                                }
                            ]}
                        />
                    </ScrollReveal>
                </div>

                <div id="pricing">
                    <ScrollReveal>
                        <Pricing />
                    </ScrollReveal>
                </div>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                                Ready to master your <br /> academic universe?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                                Join thousands of students who have already switched to the most intuitive workspace built for higher education.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a href="/signup">
                                    <Button size="lg" className="rounded-full px-8 text-lg shadow-xl shadow-primary/25">Start for Free</Button>
                                </a>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full px-8 text-lg bg-background/50 backdrop-blur-sm"
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    View Demo
                                </Button>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
};

export default LandingPage;
