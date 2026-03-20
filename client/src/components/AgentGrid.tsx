import type { Agent } from '@/types';

interface AgentGridProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
}

export default function AgentGrid({ agents, selectedAgent, onSelectAgent }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No agents found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {agents.map(agent => (
        <div
          key={agent.id}
          onClick={() => onSelectAgent(agent)}
          className={`agent-card p-3 md:p-4 cursor-pointer transition-all ${
            selectedAgent?.id === agent.id ? 'ring-2 ring-accent' : ''
          }`}
        >
          <div className="text-2xl md:text-3xl mb-2">{agent.avatar}</div>
          <div className="font-bold text-sm md:text-base truncate glow-neon">{agent.name}</div>
          <div className="text-xs text-muted-foreground mb-2">{agent.role}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Balance</div>
              <div className="font-bold">{agent.balance.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Rep</div>
              <div className="font-bold">{agent.reputation.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">W</div>
              <div className="font-bold text-accent">{agent.winCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">L</div>
              <div className="font-bold text-destructive">{agent.lossCount}</div>
            </div>
          </div>
          <div className="mt-2 text-xs">
            <div className={`px-2 py-1 rounded text-center font-bold ${
              agent.status === 'idle' ? 'bg-accent/20 text-accent' :
              agent.status === 'attacking' ? 'bg-destructive/20 text-destructive' :
              agent.status === 'defending' ? 'bg-blue-500/20 text-blue-400' :
              'bg-muted/20 text-muted-foreground'
            }`}>
              {agent.status.toUpperCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
