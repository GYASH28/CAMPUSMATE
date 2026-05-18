export default function Loader({ label = 'Loading CampusMate...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
      <p className="text-sm font-medium text-slate-300">{label}</p>
    </div>
  );
}
