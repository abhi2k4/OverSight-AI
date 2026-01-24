import * as React from "react"
import { cva } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-white text-slate-950 border-slate-200",
        destructive:
          "border-red-500/50 text-red-600 bg-red-50 [&>svg]:text-red-600",
        success:
          "border-emerald-500/50 text-emerald-700 bg-emerald-50 [&>svg]:text-emerald-600",
        warning:
          "border-amber-500/50 text-amber-700 bg-amber-50 [&>svg]:text-amber-600",
        info:
          "border-blue-500/50 text-blue-700 bg-blue-50 [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, children, onClose, ...props }, ref) => {
  const IconComponent = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  }[variant || "default"]

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <IconComponent className="h-4 w-4" />
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})
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
