import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardNavbar from '../components/layout/DashboardNavbar';
import ClassifierLayout from '../components/classifier/ClassifierLayout';

/**
 * @description Página principal del módulo clasificador arancelario.
 * Muestra el wizard de clasificación o el historial según el parámetro ?view=history.
 * Hereda el sistema de diseño dark (bg-slate-900) de la Landing Page.
 */
export default function ClassifierPage() {
  const location = useLocation();
  const { company } = useSelector((s) => s.auth);
  const plan = company?.plan || 'free';

  const [showHistory, setShowHistory] = useState(false);

  // Sincronizar con query param ?view=history
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShowHistory(params.get('view') === 'history');
  }, [location.search]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <DashboardNavbar />
      <main className="flex-1">
        <ClassifierLayout
          plan={plan}
          showHistory={showHistory}
          onToggleHistory={setShowHistory}
        />
      </main>
    </div>
  );
}
