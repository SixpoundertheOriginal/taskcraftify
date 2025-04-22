
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="transition-colors duration-300 h-8 w-8 text-sidebar-foreground hover:bg-sidebar-hover"
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-amber-500 ${
        resolvedTheme === 'dark' ? 'rotate-90 scale-0' : ''
      }`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all text-indigo-400 ${
        resolvedTheme === 'dark' ? 'rotate-0 scale-100' : ''
      }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
