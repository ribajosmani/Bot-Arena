import { trpc } from '@/lib/trpc';
import type { EngineStatus } from '@/types';
import { useState } from 'react';

interface EngineControlsProps {
  status?: EngineStatus;
}

export default function EngineControls({ status }: EngineControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const startMutation = trpc.engine.start.useMutation();
  const stopMutation = trpc.engine.stop.useMutation();

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-cyberpunk flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Battle Engine</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status?.isRunning ? 'bg-accent animate-pulse' : 'bg-muted'}`} />
            <span className="font-bold">{status?.isRunning ? 'RUNNING' : 'STOPPED'}</span>
          </div>
        </div>
        {status && (
          <div className="text-sm text-muted-foreground">
            {status.listeners} viewers
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={status?.isRunning || isLoading}
          className="btn-cyberpunk disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!status?.isRunning || isLoading}
          className="btn-cyberpunk disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
