"use client";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface PersianDatePickerProps {
  value: DateObject | null;
  onChange: (value: DateObject | null) => void;
  placeholder?: string;
  id?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  id,
}: PersianDatePickerProps) {
  return (
    <DatePicker
      value={value}
      onChange={(d) => onChange((d as DateObject | null) ?? null)}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      render={(value, openCalendar) => (
        <input
          id={id}
          readOnly
          dir="rtl"
          value={value ?? ""}
          placeholder={placeholder}
          onFocus={openCalendar}
          onClick={openCalendar}
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      )}
    />
  );
}

/** Convert an ISO date string to a Persian DateObject (for picker initial value). */
export function isoToDateObject(iso: string | null | undefined): DateObject | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new DateObject({ date: d, calendar: persian, locale: persian_fa });
}

/** Convert a Persian DateObject back to an ISO string (local midnight). */
export function dateObjectToIso(d: DateObject | null): string | null {
  if (!d) return null;
  return d.toDate().toISOString();
}
