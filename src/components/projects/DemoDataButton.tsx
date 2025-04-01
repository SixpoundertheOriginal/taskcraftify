
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DemoDataGenerator } from './DemoDataGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database } from 'lucide-react';

export function DemoDataButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Generate Demo Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Demo Data Generator</DialogTitle>
        </DialogHeader>
        <DemoDataGenerator />
      </DialogContent>
    </Dialog>
  );
}
