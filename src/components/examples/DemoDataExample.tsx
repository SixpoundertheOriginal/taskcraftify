
import { DemoDataGenerator } from '@/components/projects/DemoDataGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DemoDataExample() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Demo Data Generator</h1>
        <DemoDataGenerator />
      </div>
    </div>
  );
}
