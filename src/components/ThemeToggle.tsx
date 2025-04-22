
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Direct toggle function for the button click
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="relative">
      {/* Main toggle button - completely separate from dropdown */}
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
      
      {/* Settings icon for dropdown with proper DropdownMenu wrapper */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-background border border-border hover:bg-muted"
          >
            <span className="text-xs">⚙️</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="border-border/60 backdrop-blur-sm mt-2">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4 text-amber-500" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4 text-indigo-400" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className="cursor-pointer"
          >
            <span className="mr-2">💻</span>
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
