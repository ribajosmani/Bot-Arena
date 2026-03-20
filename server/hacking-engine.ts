import { nanoid } from "nanoid";
import type { Agent as AgentType } from "../drizzle/schema";
import { parsePersonality, parseSkills, parseMemory, type Personality, type Skills, type Memory } from "./agents";
import { updateAgent, createBattle, createEvolution, getAgentEvolution, updateEvolution } from "./db";

export interface AttackResult {
  battleId: string;
  wasSuccessful: boolean;
  pointsStolen: number;
  reputationChange: number;
  battleLog: string;
  attackType: string;
  successProbability: number;
}

const ATTACK_TYPES = [
  "brute_force",
  "social_engineering",
  "sql_injection",
  "phishing",
  "zero_day",
  "ddos",
  "malware",
  "ransomware"
];

const ATTACK_DESCRIPTIONS: Record<string, string> = {
  brute_force: "attempted a brute force attack",
  social_engineering: "used social engineering tactics",
  sql_injection: "executed SQL injection",
  phishing: "sent phishing emails",
  zero_day: "exploited a zero-day vulnerability",
  ddos: "launched a DDoS attack",
  malware: "deployed malware",
  ransomware: "deployed ransomware"
};

export class HackingEngine {
  /**
   * Calculate success probability based on attacker and defender skills
   */
  static calculateSuccessProbability(
    attackerSkills: Skills,
    defenderSkills: Skills,
    attackerPersonality: Personality
  ): number {
    // Base probability from attacker's hacking skill
    const attackPower = attackerSkills.hacking / 100;
    
    // Defender's defense reduces success
    const defensePower = defenderSkills.defense / 100;
    
    // Attacker's intelligence increases success
    const intelligenceBonus = attackerPersonality.intelligence * 0.2;
    
    // Defender's analysis can detect attacks
    const detectionPower = defenderSkills.analysis / 100 * 0.3;
    
    // Calculate final probability (0 to 1)
    let probability = attackPower - defensePower + intelligenceBonus - detectionPower;
    
    // Clamp between 0.1 and 0.9 to ensure some randomness
    probability = Math.max(0.1, Math.min(0.9, probability));
    
    return probability;
  }

  /**
   * Calculate points stolen based on success and defender's balance
   */
  static calculatePointsStolen(
    success: boolean,
    defenderBalance: number,
    attackerSkills: Skills,
    defenderSkills: Skills
  ): number {
    if (!success) return 0;

    // Base steal amount (5-15% of defender's balance)
    const stealPercentage = 0.05 + (Math.random() * 0.1);
    let stolen = defenderBalance * stealPercentage;

    // Attacker's stealth increases steal amount
    const stealthBonus = attackerSkills.stealth / 100;
    stolen *= (1 + stealthBonus * 0.5);

    // Defender's analysis reduces steal amount
    const analysisReduction = defenderSkills.analysis / 100;
    stolen *= (1 - analysisReduction * 0.3);

    // Ensure minimum steal
    stolen = Math.max(10, stolen);
    
    // Cap at defender's balance
    stolen = Math.min(stolen, defenderBalance * 0.5);

    return Math.floor(stolen);
  }

  /**
   * Calculate reputation change
   */
  static calculateReputationChange(
    success: boolean,
    pointsStolen: number,
    attackerReputation: number,
    defenderReputation: number
  ): number {
    let change = 0;

    if (success) {
      // Gain reputation for successful attacks
      change = 5 + (pointsStolen / 100);
      
      // Bonus for attacking higher-reputation targets
      if (defenderReputation > attackerReputation) {
        change *= 1.5;
      }
    } else {
      // Lose reputation for failed attacks
      change = -2;
    }

    return change;
  }

  /**
   * Choose attack type based on attacker's skills
   */
  static chooseAttackType(attackerSkills: Skills): string {
    const random = Math.random();
    
    if (attackerSkills.stealth > 75) {
      return random < 0.3 ? "zero_day" : "malware";
    } else if (attackerSkills.hacking > 75) {
      return random < 0.4 ? "sql_injection" : "brute_force";
    } else if (attackerSkills.analysis > 75) {
      return random < 0.5 ? "phishing" : "social_engineering";
    }
    
    return ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
  }

  /**
   * Generate battle log narrative
   */
  static generateBattleLog(
    attackerName: string,
    defenderName: string,
    attackType: string,
    success: boolean,
    pointsStolen: number
  ): string {
    const action = ATTACK_DESCRIPTIONS[attackType] || "attacked";
    
    if (success) {
      return `${attackerName} ${action} ${defenderName} and successfully stole ${pointsStolen} points!`;
    } else {
      return `${attackerName} ${action} ${defenderName}, but the attack was defended!`;
    }
  }

  /**
   * Execute an attack between two agents
   */
  static async executeAttack(
    attacker: AgentType,
    defender: AgentType
  ): Promise<AttackResult> {
    const battleId = nanoid();
    const attackerSkills = parseSkills(attacker.skills);
    const defenderSkills = parseSkills(defender.skills);
    const attackerPersonality = parsePersonality(attacker.personality);
    const defenderPersonality = parsePersonality(defender.personality);

    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(
      attackerSkills,
      defenderSkills,
      attackerPersonality
    );

    // Determine if attack succeeds
    const wasSuccessful = Math.random() < successProbability;

    // Calculate points stolen
    const pointsStolen = this.calculatePointsStolen(
      wasSuccessful,
      parseFloat(defender.balance.toString()),
      attackerSkills as Skills,
      defenderSkills as Skills
    );

    // Calculate reputation change
    const reputationChange = this.calculateReputationChange(
      wasSuccessful,
      pointsStolen,
      parseFloat(attacker.reputation.toString()),
      parseFloat(defender.reputation.toString())
    );

    // Choose attack type
    const attackType = this.chooseAttackType(attackerSkills);

    // Generate battle log
    const battleLog = this.generateBattleLog(
      attacker.name,
      defender.name,
      attackType,
      wasSuccessful,
      pointsStolen
    );

    // Update attacker
    const newAttackerBalance = parseFloat(attacker.balance.toString()) + pointsStolen;
    const newAttackerReputation = parseFloat(attacker.reputation.toString()) + reputationChange;
    const newAttackerWins = attacker.winCount + (wasSuccessful ? 1 : 0);
    const newAttackerLosses = attacker.lossCount + (wasSuccessful ? 0 : 1);

    await updateAgent(attacker.id, {
      balance: newAttackerBalance.toString(),
      reputation: newAttackerReputation.toString(),
      winCount: newAttackerWins,
      lossCount: newAttackerLosses,
      totalBattles: attacker.totalBattles + 1,
      lastBattleAt: new Date(),
      status: "idle",
    });

    // Update defender
    const newDefenderBalance = Math.max(0, parseFloat(defender.balance.toString()) - pointsStolen);
    const newDefenderReputation = parseFloat(defender.reputation.toString()) - (reputationChange * 0.5);
    const newDefenderWins = defender.winCount + (wasSuccessful ? 0 : 1);
    const newDefenderLosses = defender.lossCount + (wasSuccessful ? 1 : 0);

    await updateAgent(defender.id, {
      balance: newDefenderBalance.toString(),
      reputation: newDefenderReputation.toString(),
      winCount: newDefenderWins,
      lossCount: newDefenderLosses,
      totalBattles: defender.totalBattles + 1,
      lastBattleAt: new Date(),
      status: "idle",
    });

    // Record battle
    await createBattle({
      battleId,
      attackerId: attacker.id,
      defenderId: defender.id,
      attackerName: attacker.name,
      defenderName: defender.name,
      attackType,
      successProbability: parseFloat((successProbability * 100).toFixed(2)).toString(),
      wasSuccessful: wasSuccessful ? 1 : 0,
      pointsStolen: pointsStolen.toString(),
      reputationChange: reputationChange.toString(),
      battleLog,
      attackerSkillsUsed: JSON.stringify(attackerSkills) as any,
      defenderSkillsUsed: JSON.stringify(defenderSkills) as any,
    });

    // Update evolution tracking
    await this.updateEvolutionRecord(attacker.id, wasSuccessful, pointsStolen);
    await this.updateEvolutionRecord(defender.id, !wasSuccessful, -pointsStolen);

    return {
      battleId,
      wasSuccessful,
      pointsStolen,
      reputationChange,
      battleLog,
      attackType,
      successProbability: parseFloat((successProbability * 100).toFixed(2)),
    };
  }

  /**
   * Update agent evolution based on battle result
   */
  private static async updateEvolutionRecord(
    agentId: number,
    won: boolean,
    pointsChange: number
  ): Promise<void> {
    try {
      let evolution = await getAgentEvolution(agentId);

      if (!evolution) {
        // Create new evolution record
        await createEvolution({
          agentId,
          skillImprovement: JSON.stringify({
            hacking: won ? 0.05 : -0.02,
            defense: won ? 0.03 : 0.05,
            analysis: 0.01,
            stealth: won ? 0.02 : 0,
          }) as any,
          strategiesLearned: JSON.stringify([]) as any,
          winStreak: won ? 1 : 0,
          lossStreak: won ? 0 : 1,
          evolutionScore: (won ? 10 : -5).toString() as any,
        });
      } else {
        // Update existing evolution record
        const skillImprovement = typeof evolution.skillImprovement === 'string' 
          ? JSON.parse(evolution.skillImprovement) 
          : (evolution.skillImprovement as any) || {};
        const newWinStreak = won ? ((evolution.winStreak || 0) + 1) : 0;
        const newLossStreak = won ? 0 : ((evolution.lossStreak || 0) + 1);
        const evolutionScoreNum = typeof evolution.evolutionScore === 'string' 
          ? parseFloat(evolution.evolutionScore) 
          : (typeof evolution.evolutionScore === 'number' ? evolution.evolutionScore : 0);
        const evolutionScore = evolutionScoreNum + (won ? 10 : -5);

        await updateEvolution(evolution.id, {
          skillImprovement: JSON.stringify({
            hacking: (skillImprovement.hacking || 0) + (won ? 0.05 : -0.02),
            defense: (skillImprovement.defense || 0) + (won ? 0.03 : 0.05),
            analysis: (skillImprovement.analysis || 0) + 0.01,
            stealth: (skillImprovement.stealth || 0) + (won ? 0.02 : 0),
          }) as any,
          winStreak: newWinStreak,
          lossStreak: newLossStreak,
          evolutionScore: evolutionScore.toString() as any,
        });
      }
    } catch (error) {
      console.error("Failed to update evolution:", error);
    }
  }

  /**
   * Choose a target based on attacker's personality
   */
  static shouldAttack(personality: Personality): boolean {
    return Math.random() < personality.aggressiveness;
  }

  /**
   * Choose target based on intelligence and caution
   */
  static chooseTarget(
    attacker: AgentType,
    potentialTargets: AgentType[]
  ): AgentType | null {
    if (potentialTargets.length === 0) return null;

    const personality = parsePersonality(attacker.personality);
    const skills = parseSkills(attacker.skills);

    // Smart agents choose weaker targets
    if (personality.intelligence > 0.7) {
      return potentialTargets.reduce((weakest, current) => {
        const currentBalance = parseFloat(current.balance.toString());
        const weakestBalance = parseFloat(weakest.balance.toString());
        return currentBalance < weakestBalance ? current : weakest;
      });
    }

    // Cautious agents avoid strong targets
    if (personality.caution > 0.7) {
      const avgBalance = potentialTargets.reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) / potentialTargets.length;
      const safeTargets = potentialTargets.filter(
        a => parseFloat(a.balance.toString()) < avgBalance * 1.2
      );
      if (safeTargets.length > 0) {
        return safeTargets[Math.floor(Math.random() * safeTargets.length)];
      }
    }

    // Random target
    return potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
  }
}
