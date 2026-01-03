import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        // Check initial preference or system preference
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

        // Default to dark if no preference, or adhere to save/system
        const initialTheme = savedTheme || systemTheme || "dark";
        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    return (
        <Toggle
            variant="outline"
            className="group size-9 p-0 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary data-[state=on]:bg-primary/20 data-[state=on]:text-primary transition-all"
            pressed={theme === "dark"}
            onPressedChange={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            <div className="relative flex items-center justify-center w-full h-full">
                <Sun
                    size={16}
                    strokeWidth={2}
                    className="absolute transition-all scale-100 rotate-0 opacity-100 dark:scale-0 dark:-rotate-90 dark:opacity-0"
                    aria-hidden="true"
                />
                <Moon
                    size={16}
                    strokeWidth={2}
                    className="absolute transition-all scale-0 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100"
                    aria-hidden="true"
                />
            </div>
        </Toggle>
    );
}
