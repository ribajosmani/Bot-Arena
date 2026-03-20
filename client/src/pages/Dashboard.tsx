import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useWebSocket } from '@/_core/hooks/useWebSocket';
import AgentGrid from '@/components/AgentGrid';
import Leaderboard from '@/components/Leaderboard';
import BattleLog from '@/components/BattleLog';
import EngineControls from '@/components/EngineControls';
import type { Agent } from '@/types';

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'leaderboard' | 'battles'>('agents');

  // Fetch initial data
  const agentsQuery = trpc.agents.getAll.useQuery();
  const leaderboardQuery = trpc.agents.getLeaderboard.useQuery({ limit: 10 });
  const battlesQuery = trpc.battles.getRecent.useQuery({ limit: 50 });
  const engineStatusQuery = trpc.engine.getStatus.useQuery();

  // WebSocket connection for real-time updates
  const { connected, battleEvents, agentUpdates } = useWebSocket();

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data);
    }
  }, [agentsQuery.data]);

  useEffect(() => {
    if (leaderboardQuery.data) {
      setLeaderboard(leaderboardQuery.data);
    }
  }, [leaderboardQuery.data]);

  useEffect(() => {
    if (battlesQuery.data) {
      setBattles(battlesQuery.data);
    }
  }, [battlesQuery.data]);

  // Handle real-time battle events
  useEffect(() => {
    if (battleEvents.length > 0) {
      const latestBattle = battleEvents[battleEvents.length - 1];
      setBattles(prev => [latestBattle, ...prev.slice(0, 49)]);
      
      // Trigger refetch of agents and leaderboard
      agentsQuery.refetch();
      leaderboardQuery.refetch();
    }
  }, [battleEvents]);

  // Handle real-time agent updates
  useEffect(() => {
    if (agentUpdates) {
      setAgents(agentUpdates.agents);
      setLeaderboard(agentUpdates.leaderboard);
    }
  }, [agentUpdates]);

  const isLoading = agentsQuery.isLoading || leaderboardQuery.isLoading || battlesQuery.isLoading;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold glow-accent mb-2">
          BOT ARENA
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {agents.length} agents in cyber warfare • {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
      </div>

      {/* Engine Controls */}
      <div className="mb-6">
        <EngineControls status={engineStatusQuery.data} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="stat-box">
          <div className="text-2xl md:text-3xl font-bold glow-neon">{agents.length}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Total Agents</div>
        </div>
        <div className="stat-box">
          <div className="text-2xl md:text-3xl font-bold glow-neon">{battles.length}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Battles Logged</div>
        </div>
        <div className="stat-box">
          <div className="text-2xl md:text-3xl font-bold glow-neon">
            {leaderboard[0]?.name || 'N/A'}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Top Agent</div>
        </div>
        <div className="stat-box">
          <div className="text-2xl md:text-3xl font-bold glow-neon">
            {leaderboard[0]?.balance.toFixed(0) || '0'}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Max Balance</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Agent Grid or Leaderboard */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-2 border-b border-accent/20 pb-4">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 font-bold uppercase text-sm transition-all ${
                activeTab === 'agents'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-bold uppercase text-sm transition-all ${
                activeTab === 'leaderboard'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Leaderboard
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-accent animate-pulse">Loading arena...</div>
            </div>
          ) : activeTab === 'agents' ? (
            <AgentGrid 
              agents={agents} 
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
            />
          ) : (
            <Leaderboard agents={leaderboard} />
          )}
        </div>

        {/* Right Column - Battle Log */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold glow-neon">BATTLE LOG</h2>
          </div>
          <BattleLog battles={battles} />
        </div>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="fixed bottom-4 right-4 bg-card border border-accent rounded-lg p-4 max-w-sm" style={{ boxShadow: '0 0 10px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.1)' }}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xl font-bold glow-neon">{selectedAgent.name}</div>
              <div className="text-sm text-muted-foreground">{selectedAgent.role}</div>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Balance</div>
              <div className="font-bold glow-neon">{selectedAgent.balance.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Reputation</div>
              <div className="font-bold glow-neon">{selectedAgent.reputation.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wins</div>
              <div className="font-bold">{selectedAgent.winCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Losses</div>
              <div className="font-bold">{selectedAgent.lossCount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
