import { HttpError } from '../errors';

const bangkokOffsetMs = 7 * 60 * 60 * 1000;

export function calendarDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    const date = new Date(`${value}T00:00:00+07:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || formatCalendarDate(date) !== value) {
        throw new HttpError(400, 'INVALID_DATE', 'Use a valid calendar date in YYYY-MM-DD format.');
    }
    return date;
}

export function formatCalendarDate(value: Date): string {
    return new Date(value.getTime() + bangkokOffsetMs).toISOString().slice(0, 10);
}

export function expiryBoundary(value: Date): Date {
    // Labels remain valid throughout their Bangkok calendar day.
    const midnight = calendarDate(formatCalendarDate(value))!;
    return new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
}
