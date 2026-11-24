/** ISO 8601 calendar date without time or time zone: `YYYY-MM-DD`. */
export type IsoDate = string;

/** Why a text value failed the common rules in `checkText`. Codes, not text: the UI translates them. */
export type TextErrorCode = 'required' | 'tooLong' | 'invalidFormat';
