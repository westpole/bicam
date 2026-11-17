import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

/** Root application view. Currently renders only the project name. */
export function App() {
  const { t } = useTranslation();
  const title = t('app.title');

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Typography variant="h3" component="h1">
        {title}
      </Typography>
    </Box>
  );
}
