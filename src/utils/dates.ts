export const RESERVATION_DURATION_MINUTES = 90;
export const MINIMUM_ADVANCE_MINUTES = 60;

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isSameOrAfter(date: Date, compareDate: Date): boolean {
  return date.getTime() >= compareDate.getTime();
}

export function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function formatIsoLocal(date: Date): string {
  const pad = (numberValue: number): string => String(numberValue).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
