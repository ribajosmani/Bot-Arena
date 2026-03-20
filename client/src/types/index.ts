export interface Agent {
  id: number;
  agentId: string;
  name: string;
  role: 'Hacker' | 'Defender' | 'Analyst';
  avatar: string;
  balance: number;
  reputation: number;
  status: 'idle' | 'attacking' | 'defending' | 'offline';
  winCount: number;
  lossCount: number;
  totalBattles: number;
  lastBattleAt?: Date | null;
  createdAt: Date;
}

export interface Battle {
  battleId: string;
  attackerName: string;
  defenderName: string;
  attackType: string;
  wasSuccessful: boolean;
  pointsStolen: number;
  reputationChange: number;
  battleLog: string;
  successProbability: number;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  agentId: string;
  name: string;
  role: string;
  avatar: string;
  balance: number;
  reputation: number;
  winCount: number;
  lossCount: number;
  totalBattles: number;
  winRate: string;
}

export interface EngineStatus {
  isRunning: boolean;
  battleDelay: number;
  listeners: number;
}
