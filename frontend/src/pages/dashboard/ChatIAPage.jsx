import { motion } from 'framer-motion';
import { pageEnter } from '../../styles/animations';
import DashboardNavbar from '../../components/layout/DashboardNavbar';
import ChatIALayout from '../../components/chat/ChatIALayout';

export default function ChatIAPage() {
  return (
    <motion.div className="min-h-screen bg-slate-900 flex flex-col" {...pageEnter}>
      <DashboardNavbar />
      <ChatIALayout />
    </motion.div>
  );
}
