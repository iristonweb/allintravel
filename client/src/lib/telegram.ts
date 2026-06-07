type TelegramWebApp = {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; username?: string } };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function isTelegramMiniApp(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function initTelegramMiniApp(): TelegramWebApp | null {
  const app = window.Telegram?.WebApp;
  if (!app) return null;
  app.ready();
  app.expand();
  return app;
}
