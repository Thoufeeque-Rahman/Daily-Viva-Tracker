"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

// Natural language date parsing
function parseNaturalDate(input: string): Date | null {
  const lowercaseInput = input.toLowerCase().trim()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Common natural language patterns
  if (lowercaseInput === "today") {
    return today
  }
  
  if (lowercaseInput === "tomorrow") {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }
  
  if (lowercaseInput === "yesterday") {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }

  // "next week", "next month", "next year"
  if (lowercaseInput === "next week") {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek
  }

  if (lowercaseInput === "next month") {
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth
  }

  // "in X days"
  const inDaysMatch = lowercaseInput.match(/^in (\d+) days?$/)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)
    return futureDate
  }

  // "X days ago"
  const daysAgoMatch = lowercaseInput.match(/^(\d+) days? ago$/)
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1])
    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - days)
    return pastDate
  }

  // "in X weeks"
  const inWeeksMatch = lowercaseInput.match(/^in (\d+) weeks?$/)
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1])
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + weeks * 7)
    return futureDate
  }

  // Day names (next monday, next tuesday, etc.)
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const nextDayMatch = lowercaseInput.match(/^next (\w+)$/)
  if (nextDayMatch) {
    const dayName = nextDayMatch[1]
    const dayIndex = dayNames.indexOf(dayName)
    if (dayIndex !== -1) {
      const currentDay = today.getDay()
      let daysUntil = dayIndex - currentDay
      if (daysUntil <= 0) daysUntil += 7
      const nextDay = new Date(today)
      nextDay.setDate(nextDay.getDate() + daysUntil)
      return nextDay
    }
  }

  // Try standard date formats
  const formats = [
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "dd/MM/yyyy",
    "MMM d, yyyy",
    "MMMM d, yyyy",
    "d MMM yyyy",
    "d MMMM yyyy",
  ]

  for (const fmt of formats) {
    try {
      const parsed = parse(input, fmt, new Date())
      if (isValid(parsed)) {
        return parsed
      }
    } catch {
      // Continue to next format
    }
  }

  return null
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date or type naturally...",
  className,
  disabled = false,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Sync input value with date prop
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "PPP"))
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value.trim() === "") {
      onDateChange?.(undefined)
      return
    }

    const parsedDate = parseNaturalDate(value)
    if (parsedDate) {
      onDateChange?.(parsedDate)
    }
  }

  const handleInputBlur = () => {
    // On blur, if we have a valid date, format it nicely
    if (date && isValid(date)) {
      setInputValue(format(date, "PPP"))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsedDate = parseNaturalDate(inputValue)
      if (parsedDate) {
        onDateChange?.(parsedDate)
        setInputValue(format(parsedDate, "PPP"))
        setOpen(false)
      }
    }
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Fix timezone issue: ensure we use local date without timezone offset
      const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0)
      onDateChange?.(localDate)
      setInputValue(format(localDate, "PPP"))
    } else {
      onDateChange?.(undefined)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            disabled={disabled}
            onClick={() => setOpen(!open)}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* <div className="p-3 border-b w-">
          <p className="text-xs text-muted-foreground text-wrap">
            Try: "today", "tomorrow", "next week", "in 3 days", "next monday"
          </p>
        </div> */}
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleCalendarSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
