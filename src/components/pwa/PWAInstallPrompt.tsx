import { Download, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'gadgets-mela-install-dismissed';

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) {
      setIsInstalled(true);
      return undefined;
    }

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
      if (window.localStorage.getItem(DISMISSED_KEY) !== 'true') {
        window.setTimeout(() => setIsVisible(true), 1200);
      }
    }

    function onAppInstalled() {
      setIsInstalled(true);
      setIsVisible(false);
      setInstallEvent(null);
      window.localStorage.removeItem(DISMISSED_KEY);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;
    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      setIsVisible(false);
      setInstallEvent(null);
    }
  }

  function dismissPrompt() {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  }

  if (!isVisible || isInstalled || !installEvent) return null;

  return (
    <aside className="pwa-install-prompt" role="dialog" aria-live="polite" aria-label="Install Gadgets Mela App">
      <button className="pwa-dismiss" type="button" onClick={dismissPrompt} aria-label="Dismiss install prompt">
        <X size={16} />
      </button>
      <div className="pwa-icon-wrap">
        <img src="/brand/gm-icon.svg" alt="" width="54" height="54" aria-hidden="true" />
        <span><Smartphone size={16} /></span>
      </div>
      <div className="pwa-copy">
        <span>Native shopping mode</span>
        <strong>Install Gadgets Mela App</strong>
        <p>Faster deal alerts, full-screen browsing, and app-like access from your home screen.</p>
      </div>
      <button className="pwa-install-button" type="button" onClick={installApp}>
        <Download size={17} /> Install
      </button>
    </aside>
  );
}
