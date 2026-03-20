import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface BattleEvent {
  battleId: string;
  attackerName: string;
  defenderName: string;
  attackType: string;
  wasSuccessful: boolean;
  pointsStolen: number;
  battleLog: string;
  timestamp: Date;
}

interface AgentUpdate {
  agents: any[];
  leaderboard: any[];
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setConnected(true);
      newSocket.emit('request-initial-state');
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setConnected(false);
    });

    newSocket.on('battle-event', (event: BattleEvent) => {
      console.log('[WebSocket] Battle event:', event);
      setBattleEvents(prev => [event, ...prev.slice(0, 99)]);
    });

    newSocket.on('agents-update', (update: AgentUpdate) => {
      console.log('[WebSocket] Agents update');
      setAgentUpdates(update);
    });

    newSocket.on('initial-state', (state: any) => {
      console.log('[WebSocket] Initial state received');
      setBattleEvents(state.recentBattles || []);
      setAgentUpdates({
        agents: state.agents || [],
        leaderboard: state.leaderboard || [],
      });
    });

    newSocket.on('error', (error: any) => {
      console.error('[WebSocket] Error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return {
    socket,
    connected,
    battleEvents,
    agentUpdates,
  };
}
