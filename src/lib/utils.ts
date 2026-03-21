import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTargetYear(): number {
  const env = process.env['NEXT_PUBLIC_TARGET_YEAR']
  if (env !== undefined && env !== '') {
    const parsed = parseInt(env, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return new Date().getFullYear()
}
