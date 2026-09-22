import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useIsMarketingRoute } from '../../hooks/useIsMarketingRoute';

export const AppLayout: React.FC = () => {
  const isMarketing = useIsMarketingRoute();

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <Navbar />
      <div className="flex w-full flex-1">
        {!isMarketing && <Sidebar />}
        <main className="w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};