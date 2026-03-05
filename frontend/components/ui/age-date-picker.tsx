"use client";

import * as React from "react";
import { format, getDaysInMonth, getDay, isSameDay, addMonths, subMonths, getYear, differenceInYears } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  currentMonth,
  onMonthChange,
}: CalendarProps) {
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
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const date = new Date(year, currentMonth.getMonth(), day);
    onSelect?.(date);
  };

  const renderDays = () => {
    const daysArray = [];
    
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(
        <div key={`empty-${i}`} className="h-10 w-10" />
      );
    }
    
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
            "h-10 w-10 rounded-xl text-sm font-medium transition-all duration-200",
            "hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400",
            disabled && "text-white/20 opacity-30 cursor-not-allowed hover:bg-transparent",
            selected && "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30",
            !selected && !disabled && "text-white hover:bg-white/10",
            today && !selected && "border-2 border-purple-400"
          )}
        >
          {day}
        </button>
      );
    }
    
    return daysArray;
  };

  return (
    <div className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 p-0 text-white hover:bg-white/20 transition"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="text-base font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {year}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 p-0 text-white hover:bg-white/20 transition"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-10 w-10 text-center text-xs font-medium text-white/50"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}

interface AgeDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  minAge?: number;
  placeholder?: string;
  className?: string;
}

export function AgeDatePicker({
  value,
  onChange,
  minAge = 18,
  placeholder = "Select your birth date",
  className,
}: AgeDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getAge = (date: Date) => {
    return differenceInYears(today, date);
  };

  const isValidAge = (date: Date) => {
    return getAge(date) >= minAge;
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentMonth(maxDate);
  };

  const handleYearChange = (newYear: number) => {
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  const handleMonthChange = (newMonth: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), newMonth, 1));
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full h-14 bg-white/10 border-2 border-white/20 rounded-2xl px-5 text-left flex items-center justify-between",
          "text-white placeholder:text-white/50",
          "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400",
          "transition-all duration-200 hover:bg-white/15",
          value && "border-purple-400/50"
        )}
      >
        <span className={cn("text-lg", value ? "text-white" : "text-white/50")}>
          {value 
            ? `${format(value, "MMMM d, yyyy")} (${getAge(value)} years old)`
            : placeholder
          }
        </span>
        <CalendarIcon className="w-5 h-5 text-purple-300" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-3 w-full">
            <div className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex gap-2 px-4 pt-4">
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {years.map((year) => (
                    <option key={year} value={year} className="bg-purple-900">
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index} className="bg-purple-900">
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              
              <Calendar
                selected={value}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onSelect={(date) => {
                  if (date && isValidAge(date)) {
                    onChange(date);
                  }
                  setIsOpen(false);
                }}
                disabled={(date) => {
                  if (date > maxDate) return true;
                  if (date < minDate) return true;
                  return false;
                }}
              />
              <div className="px-4 pb-4 text-center">
                <p className="text-white/60 text-sm">
                  You must be at least {minAge} years old
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
