
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    // Always set to dark mode
    setTheme('dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="transition-colors duration-300 h-8 w-8 text-sidebar-foreground hover:bg-sidebar-hover"
      aria-label="Dark mode"
      onClick={toggleTheme}
    >
      <Moon className="h-[1.2rem] w-[1.2rem] text-indigo-400" />
      <span className="sr-only">Dark mode</span>
    </Button>
  );
}
