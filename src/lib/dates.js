/**
 * Date utilities with "Friday Transition" logic.
 *
 * - Lun–Gio: default to current week
 * - Ven–Dom: default to next week (Modalità Meal Prep)
 *
 * A "week" always runs Lunedì → Domenica.
 */

/** Get Monday of the week containing `date`. */
export function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Dom, 1=Lun, ...
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Get the 7 dates (Lun–Dom) for the week starting at `monday`. */
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
    const dayOfWeek = today.getDay();
    const isFridayOrLater = dayOfWeek === 0 || dayOfWeek >= 5;
    const monday = getMonday(today);
    if (isFridayOrLater) {
        monday.setDate(monday.getDate() + 7);
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

/** Short day label, e.g. "Lun 24". */
export function shortDayLabel(date) {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return `${days[date.getDay()]} ${date.getDate()}`;
}

/** Full day label, e.g. "Lunedì". */
export function fullDayLabel(date) {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[date.getDay()];
}

/** Month-year label, e.g. "Febbraio 2026". */
export function monthYearLabel(monday) {
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ];
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
