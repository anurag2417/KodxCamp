import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useIsMarketingRoute } from '../../hooks/useIsMarketingRoute';

export const AppLayout: React.FC = () => {
  const isMarketing = useIsMarketingRoute();

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <Navbar />

      {/*
        The sidebar is position:sticky against this row so it doesn't
        scroll with the page. `self-start` is required because flex
        items default to stretch, and a stretched sticky child has no
        room to stick.
      */}
      <div className="flex w-full flex-1 items-start">
        {!isMarketing && <Sidebar />}
        <main className="min-w-0 w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};