import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
}

export function formatArea(areaHa: number | null): string {
  if (areaHa === null || areaHa === undefined) return '-';
  return `${areaHa.toLocaleString()} ha`;
}

export function isExpiringSoon(expiryDate: Date | string | null, days: number = 60): boolean {
  if (!expiryDate) return false;
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}

export function isOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  return due < now;
}
