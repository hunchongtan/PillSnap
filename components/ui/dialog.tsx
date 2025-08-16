import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

export function Dialog({ open, onOpenChange, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content className={cn("fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 w-full max-w-xs flex flex-col items-center", className)}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
