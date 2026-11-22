import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';

import { VerticalList } from '../VerticalList/VerticalList';
import { APP_MENU_ID, MENU_CONTAINER_SX, MENU_ITEMS, MENU_PANEL_SX, REDUCED_MOTION_QUERY } from './constants';
import type { AppMenuProps } from './types';

/**
 * App menu screen. Render it in the `AppShell` `overlay` slot: it fills `<main>`'s grid cell, slides down from the top
 * when `open` turns `true`, and slides back up when it turns `false`. Both directions use the theme's ease-out curve
 * (`theme.transitions.easing.easeOut`) with the theme's entering/leaving durations; with
 * `prefers-reduced-motion: reduce` it appears and disappears without moving.
 *
 * While closed it is unmounted, so its options are never in the tab order. After opening, focus moves to the first
 * option; after closing, focus returns to the element that had it before opening (normally the menu button) if focus
 * was lost with the panel. Escape anywhere calls `onClose` while the menu is open.
 *
 * @param props - See {@link AppMenuProps}.
 * @returns The (possibly empty) full-size menu container.
 * @example
 * <AppMenu open={isMenuOpen} activeScreen={activeScreen} onSelect={navigateTo} onClose={closeMenu} />
 */
export function AppMenu({ open, activeScreen, onSelect, onClose }: AppMenuProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  // noSsr reads the real value on the first render, so the first open never animates when motion is reduced.
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY, { noSsr: true });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    /**
     * Closes the menu on Escape.
     *
     * @param event - The keyboard event.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  /** Remembers which element had focus when the menu started opening. */
  function handleEnter() {
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
  }

  /**
   * Moves focus to the first option once the menu has slid in, unless the user already moved focus somewhere else
   * during the slide.
   */
  function handleEntered() {
    const active = document.activeElement;
    const focusUntouched = active === null || active === document.body || active === returnFocusRef.current;

    if (focusUntouched) {
      panelRef.current?.querySelector('button')?.focus();
    }
  }

  /**
   * Returns focus to the remembered element when focus is still inside the panel (it unmounts right after this
   * callback) or was already lost. Focus the user moved elsewhere, such as the header button, is left alone.
   */
  function handleExited() {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    const active = document.activeElement;
    const focusInPanel = active !== null && (panelRef.current?.contains(active) ?? false);
    const focusLost = active === null || active === document.body || !active.isConnected;

    if ((focusInPanel || focusLost) && target?.isConnected) {
      target.focus();
    }
  }

  const items = MENU_ITEMS.map((item) => ({ id: item.id, label: t(item.labelKey) }));
  const timeout = reduceMotion
    ? 0
    : { enter: theme.transitions.duration.enteringScreen, exit: theme.transitions.duration.leavingScreen };
  const easing = theme.transitions.easing.easeOut;

  return (
    <Box ref={setContainer} sx={MENU_CONTAINER_SX}>
      <Slide
        in={open}
        direction="down"
        container={container}
        timeout={timeout}
        easing={{ enter: easing, exit: easing }}
        appear={false}
        mountOnEnter
        unmountOnExit
        onEnter={handleEnter}
        onEntered={handleEntered}
        onExited={handleExited}
      >
        <Paper
          ref={panelRef}
          component="nav"
          id={APP_MENU_ID}
          aria-label={t('menu.label')}
          square
          elevation={0}
          sx={MENU_PANEL_SX}
        >
          <VerticalList items={items} selectedId={activeScreen} onItemClick={onSelect} divided />
        </Paper>
      </Slide>
    </Box>
  );
}
