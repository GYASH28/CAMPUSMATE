import { WifiOff } from 'lucide-react';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import MotionPage from '../../components/animations/MotionPage';

export default function Offline() {
  return (
    <div className="app-canvas">
      <div className="aurora-layer animate-aurora" />
      <MotionPage>
        <PageHeader
          eyebrow="Offline"
          title="You are offline"
          description="Some CampusMate features need internet connection."
        />
        <Card className="grid place-items-center text-center">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            <WifiOff className="h-10 w-10" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-white">Connection needed</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Cached pages may still open, but Firebase data, AI tools, attendance,
            uploads, and notifications need an active internet connection.
          </p>
        </Card>
      </MotionPage>
    </div>
  );
}
