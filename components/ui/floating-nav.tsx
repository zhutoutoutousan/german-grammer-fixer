'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Pencil } from 'lucide-react';

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <Card className="fixed bottom-8 left-1/2 -translate-x-1/2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg rounded-full z-50">
      <div className="flex items-center gap-2">
        <Button
          variant={isActive('/verbs') ? 'default' : 'ghost'}
          size="lg"
          className="rounded-full"
          onClick={() => router.push('/verbs')}
        >
          <BookOpen className="h-5 w-5 mr-2" />
          Verbs
        </Button>
        <Button
          variant={isActive('/adjectives') ? 'default' : 'ghost'}
          size="lg"
          className="rounded-full"
          onClick={() => router.push('/adjectives')}
        >
          <Pencil className="h-5 w-5 mr-2" />
          Adjectives
        </Button>
      </div>
    </Card>
  );
} 