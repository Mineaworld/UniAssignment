import React, { useState, useEffect } from 'react';
import SpotlightHero from '../components/landing/SpotlightHero';
import ProductShowcase from '../components/landing/ProductShowcase';
import BenefitsGrid from '../components/landing/BenefitsGrid';
import FeatureTabs from '../components/landing/FeatureTabs';
import { TestimonialsSection as TestimonialsMarquee } from '../components/landing/TestimonialsMarquee';
import SiteFooter from '../components/landing/SiteFooter';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';
import { useScroll } from '../components/ui/use-scroll';
import { MenuToggleIcon } from '../components/ui/MenuToggleIcon';
import { cn } from '../utils/cn';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const scrolled = useScroll(10);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Close mobile menu on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [mobileMenuOpen]);
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (sectionId === 'hero') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30">

            {/* Sticky Navbar with scroll animation */}
            <header
                className={cn(
                    'sticky top-0 z-50 mx-auto w-full max-w-5xl border border-transparent md:rounded-xl md:transition-all md:duration-300 md:ease-out',
                    scrolled && !mobileMenuOpen
                        ? 'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg md:top-4 md:max-w-4xl md:shadow-lg'
                        : 'bg-transparent',
                    mobileMenuOpen && 'bg-background/90'
                )}
            >
                <nav
                    className={cn(
                        'flex w-full items-center justify-between md:transition-all md:duration-300 md:ease-out',
                        scrolled ? 'h-12 px-3' : 'h-16 px-4'
                    )}
                >
                    <a href="#" onClick={scrollToTop} className="font-bold text-xl tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/favicon.png" alt="Logo" width={32} height={32} className="h-6 w-6 object-contain" />
                        UniAssignment
                    </a>

                    <div className="hidden md:flex items-center gap-2">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Features</a>
                        <a href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Testimonials</a>
                        <AnimatedThemeToggler className="mr-1" />
                        <Button variant="outline" size="sm" asChild>
                            <a href="/login">Sign In</a>
                        </Button>
                        <Button size="sm" asChild>
                            <a href="/signup">Get Started</a>
                        </Button>
                    </div>

                    {/* Mobile menu toggle */}
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden"
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                    >
                        <MenuToggleIcon open={mobileMenuOpen} className="size-5" duration={300} />
                    </Button>
                </nav>

                {/* Mobile menu overlay */}
                <div
                    className={cn(
                        'bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex-col overflow-hidden border-y md:hidden',
                        mobileMenuOpen ? 'flex' : 'hidden'
                    )}
                >
                    <div
                        data-slot={mobileMenuOpen ? 'open' : 'closed'}
                        className={cn(
                            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95',
                            'data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95',
                            'ease-out flex h-full w-full flex-col justify-between gap-y-2 p-4'
                        )}
                    >
                        <div className="grid gap-y-2">
                            <a
                                href="#features"
                                onClick={(e) => { scrollToSection(e, 'features'); setMobileMenuOpen(false); }}
                                className="flex items-center justify-start px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#testimonials"
                                onClick={(e) => { scrollToSection(e, 'testimonials'); setMobileMenuOpen(false); }}
                                className="flex items-center justify-start px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                Testimonials
                            </a>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                                <AnimatedThemeToggler />
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/login">Sign In</a>
                            </Button>
                            <Button className="w-full" asChild>
                                <a href="/signup">Get Started</a>
                            </Button>
                        </div>
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
                            title="Students like you use it daily"
                            description="Here's what they say."
                            testimonials={[
                                {
                                    text: "I used to miss deadlines because my notes were everywhere. This app is the first one that doesn't feel like extra work. Dark mode is perfect for late-night coding.",
                                    author: {
                                        name: "Sok Piseth",
                                        handle: "CS Student, RUPP",
                                        avatar: "https://i.pravatar.cc/150?u=15"
                                    }
                                },
                                {
                                    text: "Med school is chaos. I had PDFs and schedules all over the place. Now everything is in one spot and I can actually see my free time.",
                                    author: {
                                        name: "Ly Sophea",
                                        handle: "General Medicine, UHS",
                                        avatar: "https://i.pravatar.cc/150?u=42"
                                    }
                                },
                                {
                                    text: "Most apps are too complicated. I just need to list readings and group work without spending hours setting it up. This one is clean and fast.",
                                    author: {
                                        name: "Chan Vuthy",
                                        handle: "Law Student, RULE",
                                        avatar: "https://i.pravatar.cc/150?u=12"
                                    }
                                },
                                {
                                    text: "I'm a visual learner, so spreadsheets never worked for me. The Kanban board here feels right. Moving a task to Done is so satisfying.",
                                    author: {
                                        name: "Keo Bopha",
                                        handle: "Design, Limkokwing",
                                        avatar: "https://i.pravatar.cc/150?u=25"
                                    }
                                },
                                {
                                    text: "It doesn't lag, which is huge for me. Phone or laptop, it opens fast. I use it to track all my lab reports and project due dates.",
                                    author: {
                                        name: "Chea Rithy",
                                        handle: "Engineering, ITC",
                                        avatar: "https://i.pravatar.cc/150?u=67"
                                    }
                                },
                                {
                                    text: "I tried Notion templates but they took too long to set up. UniAssignment just worked right away. It helps me balance study and my part-time job.",
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

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                                Ready to stop <br /> missing deadlines?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                                Join 100+ students who track their assignments with UniAssignment.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a href="/signup">
                                    <Button size="lg" className="rounded-full px-8 text-lg shadow-xl shadow-primary/25">Try It Free</Button>
                                </a>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-full px-8 text-lg bg-background/50 backdrop-blur-sm"
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Watch Demo
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
