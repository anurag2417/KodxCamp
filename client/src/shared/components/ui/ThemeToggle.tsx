import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface Props {
  /** When true, render light-colored icon for use over a dark background. */
  transparent?: boolean;
}

export const ThemeToggle: React.FC<Props> = ({ transparent }) => {
  const { theme, toggle } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
      className={cn(transparent && 'text-white hover:bg-white/10')}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
};