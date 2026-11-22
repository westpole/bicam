import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@ui/components/AppHeader/AppHeader';
import { AppShell } from '@ui/components/AppShell/AppShell';

/** Root application view: the app shell with its header and an (empty, for now) main viewport. */
export function App() {
  const { t } = useTranslation();
  const title = t('app.title');

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <AppShell header={<AppHeader />} />;
}
