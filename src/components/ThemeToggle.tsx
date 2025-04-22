
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const toggleTheme = () => {
    // Always set to light mode, since that's all we support now
    setTheme('light');
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
