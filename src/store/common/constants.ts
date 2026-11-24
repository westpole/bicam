/** Matches any control character (C0, DEL, C1). Not allowed in single-line text. */
export const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;

/** Shape of an ISO calendar date, capturing year, month, and day. Calendar validity is checked separately. */
export const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
