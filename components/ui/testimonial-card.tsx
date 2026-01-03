import React from "react"
import { cn } from "@/utils/cn"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

export interface TestimonialAuthor {
    name: string
    handle: string
    avatar: string
}

export interface TestimonialCardProps {
    author: TestimonialAuthor
    text: string
    href?: string
    className?: string
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
    author,
    text,
    href,
    className
}) => {
    const Card = href ? 'a' : 'div'

    return (
        <Card
            {...(href ? { href } : {})}
            className={cn(
                "flex flex-col rounded-3xl border border-white/5",
                "bg-white/50 dark:bg-black/20 backdrop-blur-md",
                "p-6 text-start",
                "hover:bg-white/60 dark:hover:bg-white/5 transition-colors duration-300",
                "w-[320px] shrink-0",
                className
            )}
        >
            <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={author.avatar} alt={author.name} />
                </Avatar>
                <div className="flex flex-col items-start">
                    <h3 className="text-sm font-bold leading-none text-foreground">
                        {author.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {author.handle}
                    </p>
                </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
                "{text}"
            </p>
        </Card>
    )
}
