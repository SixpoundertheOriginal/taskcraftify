
import { ReactNode } from 'react';
import { Header } from '@/components/Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Header />
      <main className="flex-1 w-full animate-fade-in">
        <div className="container py-6">
          {children}
        </div>
      </main>
      <footer className="py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            TaskCraft © {new Date().getFullYear()}
          </p>
          <p className="text-sm text-muted-foreground">
            Elegantly simple task management
          </p>
        </div>
      </footer>
    </div>
  );
}
