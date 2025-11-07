"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.01 }}
          whileTap={{ scale: disabled ? 1 : 0.99 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal transition-all duration-300",
              !date && "text-muted-foreground",
              "hover:shadow-lg hover:shadow-emerald-500/20",
              className
            )}
            disabled={disabled}
          >
            <motion.div
              animate={{ 
                rotate: isOpen ? 180 : 0,
                scale: isOpen ? 1.1 : 1 
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.span
                key={date ? "selected" : "placeholder"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {date ? format(date, "PPP") : placeholder}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0 overflow-hidden",
          "bg-gray-800 border-gray-700"
        )}
        asChild
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0, 0.2, 1] // Custom easing for smooth feel
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onDateChange?.(newDate)
              // Close with a slight delay for visual feedback
              setTimeout(() => setIsOpen(false), 150)
            }}
            disabled={(date) => minDate ? date < minDate : false}
            initialFocus
            className="rounded-md border-0"
          />
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}
