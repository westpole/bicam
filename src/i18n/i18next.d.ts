import 'i18next';

import type { defaultNS, resources } from './config';

/** Enables type-safe translation keys for `t()` based on the English resources. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
