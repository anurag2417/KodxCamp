import { useEffect } from 'react';
import { ToastProvider } from '@/shared/components/ui/Toast';
import { useAuthStore } from '@/shared/store/auth.store';
import { useThemeStore } from '@/shared/store/theme.store';
import { AppRouter } from '@/app/router';

export default function App() {
  const initTheme = useThemeStore((state) => state.init);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    initTheme();
    void fetchMe();
  }, [initTheme, fetchMe]);

  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
