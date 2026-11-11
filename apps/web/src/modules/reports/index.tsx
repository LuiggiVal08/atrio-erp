import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, History, Clock } from 'lucide-react';
import { DashboardView } from './views/DashboardView';
import { ReportHistoryView } from './views/ReportHistoryView';
import { ReportDefinitionsView } from './views/ReportDefinitionsView';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/reports/dashboard' },
  { id: 'history', label: 'Historial', icon: History, path: '/reports/history' },
  { id: 'definitions', label: 'Programados', icon: Clock, path: '/reports/definitions' },
];

export function ReportsModule() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = tabs.find((t) => location.pathname.endsWith(t.id));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              currentTab?.id === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="history" element={<ReportHistoryView />} />
          <Route path="definitions" element={<ReportDefinitionsView />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default ReportsModule;
