import { useSelector } from 'react-redux';
import UsageMeter from './UsageMeter';

const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};

const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

export default function ChatHeader() {
  const { activeConversationId, conversations } = useSelector(s => s.chatIA);
  const plan = useSelector(s => s.auth.company?.plan || 'free');

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const title = activeConv?.title || 'Chat de IA';

  return (
    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-white font-semibold text-sm truncate">{title}</h1>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${PLAN_BADGE[plan]}`}>
          {PLAN_LABEL[plan]}
        </span>
      </div>
      <UsageMeter />
    </div>
  );
}
