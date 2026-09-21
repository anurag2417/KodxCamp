import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/shared/store/theme.store';
import { Button } from '@/shared/components/ui/Button';

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
};
