import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      className="grid h-screen w-screen grid-cols-[65px_minmax(0,1fr)] overflow-hidden bg-canvas bg-[radial-gradient(ellipse_at_top_right,_var(--accent-alpha)_0%,_transparent_60%)]"
    >
      <Sidebar />
      <div className="grid min-w-0 grid-cols-[132px_minmax(0,1fr)_148px] grid-rows-[56px_minmax(0,1fr)_28px] gap-y-3 overflow-hidden py-3 pr-3">
        <Header />
        <main
          className="col-span-3 row-start-2 min-w-0 overflow-auto px-4"
        >
          <div className="screen-content h-full rounded-tl-xl">
            {children}
          </div>
        </main>
        <div className="col-span-3 row-start-3 min-w-0">
          <StatusBar />
        </div>
      </div>
    </div>
  );
}
