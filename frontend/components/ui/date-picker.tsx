"use client";

import * as React from "react";
import { format, getDaysInMonth, getDay, isSameDay, addMonths, subMonths, getYear } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  classNames?: {
    months?: string;
    month?: string;
    caption?: string;
    caption_label?: string;
    nav?: string;
    nav_button?: string;
    nav_button_previous?: string;
    nav_button_next?: string;
    table?: string;
    head_row?: string;
    head_cell?: string;
    row?: string;
    cell?: string;
    day?: string;
    day_selected?: string;
    day_today?: string;
    day_outside?: string;
    day_disabled?: string;
    day_hidden?: string;
  };
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  
  const year = getYear(currentMonth);
  const days = getDaysInMonth(currentMonth);
  const firstDay = getDay(new Date(year, currentMonth.getMonth(), 1));
  
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isDisabled = (day: number) => {
    if (!disabled) return false;
    const date = new Date(year, currentMonth.getMonth(), day);
    return disabled(date);
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return isSameDay(new Date(year, currentMonth.getMonth(), day), selected);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return isSameDay(new Date(year, currentMonth.getMonth(), day), today);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const date = new Date(year, currentMonth.getMonth(), day);
    onSelect?.(date);
  };

  const renderDays = () => {
    const daysArray = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(
        <div key={`empty-${i}`} className="h-9 w-9" />
      );
    }
    
    // Days of the month
    for (let day = 1; day <= days; day++) {
      const disabled = isDisabled(day);
      const selected = isSelected(day);
      const today = isToday(day);
      
      daysArray.push(
        <button
          key={day}
          type="button"
          disabled={disabled}
          onClick={() => handleDayClick(day)}
          className={cn(
            "h-9 w-9 rounded-lg text-sm font-normal transition-all duration-200",
            "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500",
            disabled && "text-white/20 opacity-30 cursor-not-allowed hover:bg-transparent",
            selected && "bg-purple-600 text-white hover:bg-purple-600",
            !selected && !disabled && "text-white hover:bg-white/10",
            today && !selected && "border-2 border-purple-400",
            (firstDay + day - 1) === 0 && "rounded-l-lg",
            (firstDay + day - 1) % 7 === 6 && "rounded-r-lg"
          )}
        >
          {day}
        </button>
      );
    }
    
    return daysArray;
  };

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-lg bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 transition"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium text-white">
          {monthNames[currentMonth.getMonth()]} {year}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-lg bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 transition"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-9 w-9 text-center text-xs font-normal text-white/50"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  maxDate?: Date;
  minDate?: Date;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  placeholder = "Select date",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-left flex items-center justify-between",
          "text-white placeholder:text-white/50",
          "focus:outline-none focus:ring-2 focus:ring-purple-500",
          "transition-all duration-200"
        )}
      >
        <span className={value ? "text-white" : "text-white/50"}>
          {value ? format(value, "PPP") : placeholder}
        </span>
        <svg
          className="w-4 h-4 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-2">
            <div className="bg-purple-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              <Calendar
                selected={value}
                onSelect={(date) => {
                  onChange(date);
                  setIsOpen(false);
                }}
                disabled={(date) => {
                  if (maxDate && date > maxDate) return true;
                  if (minDate && date < minDate) return true;
                  return false;
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
