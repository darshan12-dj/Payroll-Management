import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', fullHeight = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-gray-500 ${fullHeight ? 'min-h-[300px]' : 'py-12'}`}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
