import { useSelector } from 'react-redux';

export default function UsageMeter() {
  const { used, limit, plan } = useSelector(s => s.chatIA.usage);

  if (plan === 'enterprise') return null;

  const pct = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const fillClass = pct > 95 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className="flex items-center gap-2">
      <div className="bg-slate-700 rounded-full h-1 w-24 overflow-hidden">
        <div className={`${fillClass} rounded-full h-1 transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">
        {used}/{limit === Infinity ? '∞' : limit}
      </span>
    </div>
  );
}
