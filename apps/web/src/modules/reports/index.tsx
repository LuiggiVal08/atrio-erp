import { useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, History, Clock } from 'lucide-react';
import { useSidebarStore } from '@/core/store/sidebar-store';
import { useReportsStore } from './store/reports-store';
import { DashboardView } from './views/DashboardView';
import { ReportHistoryView } from './views/ReportHistoryView';
import { ReportDefinitionsView } from './views/ReportDefinitionsView';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, view: 'dashboard' as const },
  { id: 'history', label: 'Historial', icon: History, view: 'history' as const },
  { id: 'definitions', label: 'Programados', icon: Clock, view: 'definitions' as const },
];

export function ReportsModule() {
  const { setModules } = useSidebarStore();
  const { selectedView, setSelectedView } = useReportsStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = tabs.find((t) => location.pathname.endsWith(t.id));

  useEffect(() => {
    setModules([
      {
        id: 'reports',
        label: 'sidebar.reports.label',
        icon: BarChart3,
        route: '/reports/dashboard',
        permissions: ['reports:dashboard:view'],
      },
    ]);
  }, [setModules]);

  function handleTabClick(tab: typeof tabs[number]) {
    setSelectedView(tab.view);
    navigate(`/reports/${tab.id}`);
  }

  const views: Record<string, ReactNode> = {
    dashboard: <DashboardView />,
    history: <ReportHistoryView />,
    definitions: <ReportDefinitionsView />,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              (currentTab?.id === tab.id || (!currentTab && tab.id === 'dashboard'))
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
        {views[selectedView] ?? <DashboardView />}
      </div>
    </div>
  );
}

export default ReportsModule;
