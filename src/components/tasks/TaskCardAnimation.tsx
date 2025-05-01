
import { useEffect } from 'react';

interface TaskCardAnimationProps {
  isExiting: boolean;
  finishExiting: () => void;
  EXIT_ANIMATION_DURATION: number;
}

export function TaskCardAnimation({ 
  isExiting, 
  finishExiting,
  EXIT_ANIMATION_DURATION 
}: TaskCardAnimationProps) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isExiting) {
      // Use a local variable for the timeout to avoid React ref issues
      timeoutId = setTimeout(() => {
        finishExiting();
      }, EXIT_ANIMATION_DURATION);
    }
    
    // Clean up the timeout to prevent memory leaks
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isExiting, finishExiting, EXIT_ANIMATION_DURATION]);
  
  // Return null as this is a behavior component, not a UI component
  return null;
}
