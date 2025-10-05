// components/date-range-picker.tsx
"use client";

import * as React from "react";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: 1 | 2;
}

export function DateRangePicker({ value, onChange, placeholder = "Seleccionar fechas", className, disabled, numberOfMonths }: Props) {
  const label = React.useMemo(() => {
    if (value?.from && value?.to) {
      const from = format(value.from, "PPP", { locale: es });
      const to = format(value.to, "PPP", { locale: es });
      return `${from} — ${to}`;
    }
    if (value?.from) {
      const from = format(value.from, "PPP", { locale: es });
      return `${from} — …`;
    }
    return placeholder;
  }, [value, placeholder]);

  const months = numberOfMonths ?? (typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 2);

  const btnClass = [
    "w-full justify-start text-left font-normal h-10 sm:h-11 text-sm sm:text-base",
    !value?.from ? "text-muted-foreground" : "",
    className ?? "",
  ].join(" ");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={btnClass}>
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start" side="bottom" sideOffset={4}>
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={months}
          initialFocus
          locale={es}
          disabled={disabled}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
}