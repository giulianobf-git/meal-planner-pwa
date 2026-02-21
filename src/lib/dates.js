/**
 * Date utilities with "Friday Transition" logic.
 *
 * - Mon–Thu: default to current week
 * - Fri–Sun: default to next week (Meal Prep Mode)
 *
 * A "week" always runs Monday → Sunday.
 */

/** Get Monday of the week containing `date`. */
export function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Get the 7 dates (Mon–Sun) for the week starting at `monday`. */
export function getWeekDates(monday) {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return d;
    });
}

/** Get the default week Monday based on the "Friday Transition" rule. */
export function getDefaultMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const isFridayOrLater = dayOfWeek === 0 || dayOfWeek >= 5; // Fri=5, Sat=6, Sun=0
    const monday = getMonday(today);
    if (isFridayOrLater) {
        monday.setDate(monday.getDate() + 7); // next week
    }
    return monday;
}

/** Navigate to previous week. */
export function prevWeek(monday) {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    return d;
}

/** Navigate to next week. */
export function nextWeek(monday) {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    return d;
}

/** Format a date as YYYY-MM-DD for database storage. */
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Short day label, e.g. "Mon 24". */
export function shortDayLabel(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
}

/** Full day label, e.g. "Monday". */
export function fullDayLabel(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

/** Month-year label, e.g. "February 2026". */
export function monthYearLabel(monday) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    // Show the month of the Monday
    return `${months[monday.getMonth()]} ${monday.getFullYear()}`;
}

/** Check if a date is today. */
export function isToday(date) {
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}
