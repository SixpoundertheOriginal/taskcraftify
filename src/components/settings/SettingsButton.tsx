
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsButtonProps {
  className?: string;
  onClick?: () => void;
}

export function SettingsButton({ 
  className,
  onClick
}: SettingsButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Button
      size="icon"
      variant="outline"
      className={cn(
        "h-10 w-10 rounded-full",
        "transition-all duration-300 hover:shadow-md",
        "border-primary/20 hover:border-primary/50",
        "bg-background hover:bg-background/90",
        isHovered ? "rotate-45" : "",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Settings className="h-5 w-5 text-primary" />
      <span className="sr-only">Settings</span>
    </Button>
  );
}
