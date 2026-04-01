import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount)
}

export function formatDate(date: string) {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatRelative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
