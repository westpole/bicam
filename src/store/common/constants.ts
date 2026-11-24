/** Matches any control character (C0, DEL, C1). Not allowed in single-line text. */
export const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u;
