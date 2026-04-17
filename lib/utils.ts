import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type ImageItem = {
  id: string;
  file: File;
  preview: string;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return atob(normalized + "=".repeat(padLength));
}

export function formatDate(
  dateInput: Date | string = new Date(),
  format = "YYYY-MM-DD HH:mm:ss",
) {
  const d = new Date(dateInput);

  const pad = (n: number) => String(n).padStart(2, "0");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const map = {
    YYYY: d.getFullYear(),
    MMMM: months[d.getMonth()],
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    D: d.getDate(),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    Do: getOrdinal(d.getDate()), // 7th
  };

  let result = format;

  Object.keys(map).forEach((key) => {
    result = result.replace(key, map[key]);
  });

  return result;
}

export function toDateOnlyUTC(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}