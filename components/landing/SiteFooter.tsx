import React from 'react';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const SiteFooter = () => {
    return (
        <footer className="border-t border-white/10 bg-background/50 backdrop-blur-xl pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-4">
                        <a href="/" className="font-bold text-2xl tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />
                            UniAssignment
                        </a>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Assignment tracking for students. Simple. Fast. Free to start.
                        </p>
                        <div className="flex gap-4">
                            <button aria-label="Follow us on Twitter" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                                <Twitter className="w-4 h-4" />
                            </button>
                            <button aria-label="View our GitHub" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                            </button>
                            <button aria-label="Connect on LinkedIn" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Docs</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Stay Updated</h4>
                        <div className="flex gap-2">
                            <Input placeholder="Enter your email…" aria-label="Email address" className="rounded-full bg-secondary/50 border-transparent focus:bg-background" />
                            <Button size="icon" className="rounded-full shrink-0" aria-label="Subscribe">
                                <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} UniAssignment Inc. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" aria-hidden="true" /> by Students, for Students.
                    </p>
                </div>
            </div>
        </footer>
    );
};

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}

export default SiteFooter;
