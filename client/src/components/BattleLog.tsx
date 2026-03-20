import type { Battle } from '@/types';

interface BattleLogProps {
  battles: Battle[];
}

export default function BattleLog({ battles }: BattleLogProps) {
  if (battles.length === 0) {
    return (
      <div className="card-cyberpunk text-center py-8 text-muted-foreground">
        Waiting for battles...
      </div>
    );
  }

  return (
    <div className="card-cyberpunk max-h-96 overflow-y-auto">
      <div className="space-y-3">
        {battles.slice(0, 20).map((battle, index) => (
          <div
            key={battle.battleId}
            className={`battle-log-entry ${index === 0 ? 'battle-flash' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                battle.wasSuccessful 
                  ? 'bg-accent/20 text-accent' 
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {battle.wasSuccessful ? '✓ HIT' : '✗ MISS'}
              </span>
              <span className="text-xs text-muted-foreground">{battle.attackType}</span>
            </div>
            <div className="text-xs">
              <span className="glow-neon">{battle.attackerName}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="glow-neon">{battle.defenderName}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {battle.pointsStolen > 0 && (
                <span className="text-accent">+{battle.pointsStolen.toFixed(0)} pts</span>
              )}
              {battle.pointsStolen > 0 && battle.reputationChange > 0 && <span> • </span>}
              {battle.reputationChange > 0 && (
                <span className="text-accent">+{battle.reputationChange.toFixed(1)} rep</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
