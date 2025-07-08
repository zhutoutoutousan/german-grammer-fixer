'use client';

import { GenerationState } from '@/app/actions/generate-exercises';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export function GenerationProgress({ state }: { state: GenerationState }) {
  const isLoading = state.status === 'generating' || state.status === 'parsing';
  const isError = state.status === 'error';
  const isComplete = state.status === 'complete';

  return (
    <div className="space-y-4">
      <Alert variant={isError ? "destructive" : "default"}>
        <AlertTitle>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              {state.message}
            </div>
          )}
          {isError && "Error"}
          {isComplete && "Complete"}
        </AlertTitle>
        <AlertDescription>
          {state.message}
        </AlertDescription>
      </Alert>

      {isLoading && (
        <Progress value={30} className="animate-pulse" />
      )}

      {state.progress && (
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          <pre className="text-sm">
            {state.progress}
          </pre>
        </ScrollArea>
      )}

      {isLoading && !state.progress && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      )}
    </div>
  );
} 