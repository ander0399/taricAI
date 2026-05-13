import DashboardNavbar from '../../components/layout/DashboardNavbar';
import TrackingSection from '../../components/tracking/TrackingSection';

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <DashboardNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Trazabilidad de Carga en Tiempo Real</h1>
          <p className="text-slate-400 text-sm mt-1">Rastrea tus envíos naviera-grade con señal AIS en tiempo real.</p>
        </div>
        <TrackingSection />
      </main>
    </div>
  );
}
