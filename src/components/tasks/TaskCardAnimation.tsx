
import { RefObject } from 'react';

interface TaskCardAnimationProps {
  isExiting: boolean;
  finishExiting: () => void;
  EXIT_ANIMATION_DURATION: number;
}

export function TaskCardAnimation({ isExiting, finishExiting, EXIT_ANIMATION_DURATION }: TaskCardAnimationProps) {
  return (
    <style>
      {`
      @keyframes fade-slide-out {
        0% {
          opacity: 1;
          transform: translateY(0);
        }
        80% {
          opacity: 0.8;
          transform: translateY(0.25rem);
        }
        100% {
          opacity: 0;
          transform: translateY(0.5rem);
        }
      }
      .animate-fade-slide-out {
        animation: fade-slide-out ${EXIT_ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1);
      }
      `}
    </style>
  );
}
