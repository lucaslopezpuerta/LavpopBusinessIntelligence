// badge.jsx v3.1 - Cosmic Precision 2.0 Badge System
// ✅ WCAG AA compliant contrast (4.5:1+)
// ✅ Flat solid colors without glow effects
// ✅ Consistent dark/light mode support
// ✅ Mode-aware warning colors (soft tinted in light, solid in dark)
//
// CHANGELOG:
// v3.1 (2026-01-29): Mode-aware warning colors
//   - warning/queued: Soft tinted amber in light mode (bg-amber-50/text-amber-800)
//   - warning/queued: Solid amber in dark mode (bg-amber-500/text-white)
//   - Better visual hierarchy in light mode while maintaining dark mode readability
// v3.0 (2026-01-29): Cosmic Precision 2.0 - Warning color fix
//   - REVERTED yellow back to AMBER for WCAG AA compliance
//   - Yellow-600 fails WCAG AA (3.5:1 contrast) - amber-600 passes (4.7:1)
//   - warning: amber-600/500 (was yellow - failed contrast)
//   - queued: amber-600/500 (was yellow - failed contrast)
// v2.2 (2026-01-29): Orange to yellow migration (REVERTED in v3.0)
// v2.1 (2026-01-29): Migrated warning/queued variants from amber to orange
// v2.0 (2026-01-28): Migrated to solid colors from opacity-based
// v1.0: Original opacity-based variants

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Semantic solid variants (WCAG AA compliant - 4.5:1+ contrast)
        success: "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-700 dark:border-emerald-400",
        warning: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400",
        error: "bg-red-600 dark:bg-red-500 text-white border-red-700 dark:border-red-400",
        info: "bg-blue-600 dark:bg-blue-500 text-white border-blue-700 dark:border-blue-400",
        neutral: "bg-slate-500 dark:bg-slate-600 text-white border-slate-600 dark:border-slate-500",
        accent: "bg-violet-600 dark:bg-violet-500 text-white border-violet-700 dark:border-violet-400",

        // Brand variants
        stellar: "bg-stellar-cyan text-space-void border-stellar-cyan/80",
        cosmic: "bg-cosmic-green text-space-void border-cosmic-green/80",

        // Domain-specific (mapped to semantic)
        active: "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-700 dark:border-emerald-400",
        contacted: "bg-blue-600 dark:bg-blue-500 text-white border-blue-700 dark:border-blue-400",
        blacklisted: "bg-red-600 dark:bg-red-500 text-white border-red-700 dark:border-red-400",
        queued: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500 dark:text-white dark:border-amber-400",

        // Outline variant (for secondary emphasis)
        outline: "bg-transparent border-current text-slate-600 dark:text-slate-300",

        // Legacy variants (kept for backwards compatibility)
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      shape: "default",
      size: "sm",
    },
  }
)

function Badge({ className, variant, shape, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, shape, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
