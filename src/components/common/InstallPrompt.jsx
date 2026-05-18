import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export default function InstallPrompt({ compact = false }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const handleInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (installed) return null;

  return (
    <Card className={compact ? 'p-4' : ''}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-white">Install CampusMate</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Add CampusMate to your device for a mobile app-like experience.
            </p>
            {!promptEvent ? (
              <p className="mt-2 text-xs text-slate-500">
                Browser push notifications will be available after Firebase Cloud Messaging setup.
              </p>
            ) : null}
          </div>
        </div>
        <Button type="button" variant={promptEvent ? 'primary' : 'secondary'} onClick={install} disabled={!promptEvent}>
          <Download className="h-4 w-4" />
          {promptEvent ? 'Install App' : 'Install available after deployment'}
        </Button>
      </div>
    </Card>
  );
}
