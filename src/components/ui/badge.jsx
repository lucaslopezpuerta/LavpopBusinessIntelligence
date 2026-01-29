import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-px text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:rounded-md sm:px-2.5 sm:py-0.5 sm:text-xs",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Cosmic Design System variants
        stellar:
          "border-stellar-cyan/20 bg-stellar-cyan/10 text-stellar-cyan",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        // Domain-specific variants
        contacted:
          "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        blacklisted:
          "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
        active:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        queued:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
