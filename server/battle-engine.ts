import { getAllAgents, getIdleAgents, getRandomAgent } from "./db";
import { HackingEngine } from "./hacking-engine";
import type { Agent as AgentType } from "../drizzle/schema";
import { EventEmitter } from "events";

export class BattleEngine extends EventEmitter {
  private isRunning = false;
  private battleLoopInterval: NodeJS.Timeout | null = null;
  private battleDelay = 1500; // milliseconds between battles

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[BattleEngine] Already running");
      return;
    }

    console.log("[BattleEngine] Starting battle engine...");
    this.isRunning = true;

    // Start the battle loop
    this.battleLoopInterval = setInterval(() => {
      this.runBattleCycle().catch(err => {
        console.error("[BattleEngine] Error in battle cycle:", err);
      });
    }, this.battleDelay);

    console.log("[BattleEngine] Battle engine started");
  }

  stop(): void {
    if (!this.isRunning) {
      console.log("[BattleEngine] Not running");
      return;
    }

    console.log("[BattleEngine] Stopping battle engine...");
    this.isRunning = false;

    if (this.battleLoopInterval) {
      clearInterval(this.battleLoopInterval);
      this.battleLoopInterval = null;
    }

    console.log("[BattleEngine] Battle engine stopped");
  }

  /**
   * Run a single battle cycle - select agents and execute battles
   */
  private async runBattleCycle(): Promise<void> {
    try {
      const agents = await getAllAgents();
      if (agents.length < 2) {
        console.log("[BattleEngine] Not enough agents for battle");
        return;
      }

      // Randomly select number of battles (1-5 per cycle)
      const battleCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < battleCount; i++) {
        const attacker = agents[Math.floor(Math.random() * agents.length)];
        if (!attacker) continue;

        // Get potential targets (all agents except attacker)
        const potentialTargets = agents.filter(a => a.id !== attacker.id);
        if (potentialTargets.length === 0) continue;

        // Choose target based on attacker's personality
        const defender = HackingEngine.chooseTarget(attacker, potentialTargets);
        if (!defender) continue;

        // Check if attacker wants to attack
        const personality = JSON.parse(attacker.personality as any);
        if (!HackingEngine.shouldAttack(personality)) continue;

        // Execute the attack
        const result = await HackingEngine.executeAttack(attacker, defender);

        // Emit battle event for WebSocket broadcasting
        this.emit("battle", {
          battleId: result.battleId,
          attackerName: attacker.name,
          defenderName: defender.name,
          attackType: result.attackType,
          wasSuccessful: result.wasSuccessful,
          pointsStolen: result.pointsStolen,
          battleLog: result.battleLog,
          timestamp: new Date(),
        });

        // Small delay between battles to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("[BattleEngine] Error in battle cycle:", error);
    }
  }

  /**
   * Manually trigger a battle between two specific agents
   */
  async triggerBattle(attackerId: number, defenderId: number) {
    try {
      const agents = await getAllAgents();
      const attacker = agents.find(a => a.id === attackerId);
      const defender = agents.find(a => a.id === defenderId);

      if (!attacker || !defender) {
        throw new Error("Agent not found");
      }

      if (attacker.id === defender.id) {
        throw new Error("Cannot attack yourself");
      }

      const result = await HackingEngine.executeAttack(attacker, defender);

      this.emit("battle", {
        battleId: result.battleId,
        attackerName: attacker.name,
        defenderName: defender.name,
        attackType: result.attackType,
        wasSuccessful: result.wasSuccessful,
        pointsStolen: result.pointsStolen,
        battleLog: result.battleLog,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      console.error("[BattleEngine] Error triggering battle:", error);
      throw error;
    }
  }

  /**
   * Get current engine status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      battleDelay: this.battleDelay,
      listeners: this.listenerCount("battle"),
    };
  }
}

// Singleton instance
let engineInstance: BattleEngine | null = null;

export function getBattleEngine(): BattleEngine {
  if (!engineInstance) {
    engineInstance = new BattleEngine();
  }
  return engineInstance;
}
