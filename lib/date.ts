// lib/date.ts
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { dateFnsLocalizer } from "react-big-calendar";

const locales = { es } as const;

export const localizer = dateFnsLocalizer({
  format: (date, fmt) => format(date, fmt, { locale: es }),
  parse: (value, fmt) => parse(value, fmt, new Date(), { locale: es }),
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // lunes
  getDay,
  locales,
});