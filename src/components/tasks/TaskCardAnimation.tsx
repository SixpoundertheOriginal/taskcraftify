
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
      timeoutId = setTimeout(() => {
        finishExiting();
      }, EXIT_ANIMATION_DURATION);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isExiting, finishExiting, EXIT_ANIMATION_DURATION]);
  
  return null;
}
