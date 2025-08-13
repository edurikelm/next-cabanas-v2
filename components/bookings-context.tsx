// components/bookings-context.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Booking, BookingId } from "../lib/types/booking-types";

interface BookingsContextValue {
  bookings: Booking[];
  addBooking: (b: Omit<Booking, "id">) => void;
  updateBooking: (id: BookingId, b: Partial<Booking>) => void;
  deleteBooking: (id: BookingId) => void;
  getBooking: (id: BookingId) => Booking | undefined;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

const STORAGE_KEY = "arriendos.bookings";

function reviveDates(raw: any): Booking[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b) => ({ ...b, start: new Date(b.start), end: new Date(b.end) }));
}

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) setBookings(reviveDates(JSON.parse(json)));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {}
  }, [bookings]);

  const addBooking = useCallback((b: Omit<Booking, "id">) => {
    const id = crypto.randomUUID();
    setBookings((prev) => [...prev, { id, ...b }]);
  }, []);

  const updateBooking = useCallback((id: BookingId, b: Partial<Booking>) => {
    setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, ...b } : x)));
  }, []);

  const deleteBooking = useCallback((id: BookingId) => {
    setBookings((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const getBooking = useCallback((id: BookingId) => bookings.find((b) => b.id === id), [bookings]);

  const value = useMemo(() => ({ bookings, addBooking, updateBooking, deleteBooking, getBooking }), [bookings, addBooking, updateBooking, deleteBooking, getBooking]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}