import * as React from "react"
import { cva } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { ALERT } from "../../constants/animations"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        // Cosmic Design System variants
        stellar:
          "border-stellar-cyan/20 bg-stellar-cyan/5 text-stellar-cyan [&>svg]:text-stellar-cyan",
        success:
          "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        info:
          "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <motion.div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    initial={ALERT.ENTER.initial}
    animate={ALERT.ENTER.animate}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
