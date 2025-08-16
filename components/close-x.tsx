import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"

export function CloseX({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Close"
      className={cn(
        "p-1 rounded-md hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring absolute right-2 top-2 z-20",
        className
      )}
      {...props}
    >
      <X className="h-5 w-5 text-gray-400 hover:text-gray-700" />
    </button>
  )
}
