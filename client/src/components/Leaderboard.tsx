import type { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  agents: LeaderboardEntry[];
}

export default function Leaderboard({ agents }: LeaderboardProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No leaderboard data
      </div>
    );
  }

  return (
    <div className="card-cyberpunk">
      <div className="space-y-2">
        {agents.map((agent, index) => (
          <div key={agent.id} className="leaderboard-row">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="rank-badge">{agent.rank}</div>
                <div className="text-2xl">{agent.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate glow-neon">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">{agent.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-accent">{agent.balance.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">{agent.winRate}% WR</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
