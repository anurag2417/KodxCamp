import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => (
  <div className="flex min-h-screen w-full flex-col bg-bg">
    <Navbar />
    <div className="flex w-full flex-1">
      <Sidebar />
      <main className="w-full flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);