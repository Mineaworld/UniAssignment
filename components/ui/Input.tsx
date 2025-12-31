import * as React from "react"

import { cn } from "../../utils/cn"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-xl border border-border/60 bg-background/80 backdrop-blur-md px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus:border-primary/50 focus:bg-background transition-all disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
