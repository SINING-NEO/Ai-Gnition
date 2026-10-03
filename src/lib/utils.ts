import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function formatHours(minutes: number) {
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)}m`;
  return `${hours.toFixed(1)}h`;
}

export function nowIso() {
  return new Date().toISOString();
}
