import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children?: React.ReactNode
  className?: string
}

export interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

export interface SelectItemProps {
  value: string
  children?: React.ReactNode
  className?: string
  onSelect?: (value: string) => void
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, placeholder, children, className }, ref) => {
    const [open, setOpen] = React.useState(false)

    return (
      <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
        <Popover open={open} onOpenChange={setOpen}>
          <div ref={ref} className={className}>
            {children}
          </div>
        </Popover>
      </SelectContext.Provider>
    )
  }
)
Select.displayName = "Select"

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            className
          )}
          {...props}
        >
          {children}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children }, ref) => {
    return (
      <PopoverContent 
        ref={ref}
        className={cn("w-full p-0", className)}
      >
        <div className="max-h-60 overflow-auto">
          {children}
        </div>
      </PopoverContent>
    )
  }
)
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, onSelect, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        onClick={() => {
          onValueChange?.(value)
          onSelect?.(value)
          setOpen(false)
        }}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {selectedValue === value && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export const SelectValue = React.forwardRef<HTMLSpanElement, { placeholder?: string; className?: string }>(
  ({ placeholder, className }, ref) => {
    const { value } = React.useContext(SelectContext)
    
    return (
      <span ref={ref} className={className}>
        {value || placeholder}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"
