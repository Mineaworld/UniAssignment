"use client"

import { useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../utils/cn"
import { useApp } from "../../context"

type AnimatedThemeTogglerProps = {
  className?: string
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> }
}

export const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { theme, toggleTheme } = useApp()
  const darkMode = theme === "dark"

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return

    const vtDocument = document as ViewTransitionDocument

    // Fallback for browsers without View Transitions support
    if (!vtDocument.startViewTransition) {
      toggleTheme()
      return
    }

    await vtDocument.startViewTransition(() => {
      flushSync(() => {
        toggleTheme()
      })
    }).ready

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [toggleTheme])

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none",
        className
      )}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
