import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getAllAgents, getLeaderboard, getRecentBattles, getAgentById, getAgentStats, getBattlesByAgentId } from "./db";
import { getBattleEngine } from "./battle-engine";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ AGENT QUERIES ============
  agents: router({
    /**
     * Get all agents with their current state
     */
    getAll: publicProcedure.query(async () => {
      try {
        const agents = await getAllAgents();
        return agents.map(agent => ({
          id: agent.id,
          agentId: agent.agentId,
          name: agent.name,
          role: agent.role,
          avatar: agent.avatar,
          balance: parseFloat(agent.balance.toString()),
          reputation: parseFloat(agent.reputation.toString()),
          status: agent.status,
          winCount: agent.winCount,
          lossCount: agent.lossCount,
          totalBattles: agent.totalBattles,
          lastBattleAt: agent.lastBattleAt,
          createdAt: agent.createdAt,
        }));
      } catch (error) {
        console.error("Error fetching agents:", error);
        throw error;
      }
    }),

    /**
     * Get leaderboard (top agents by balance)
     */
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(10) }).optional())
      .query(async ({ input }) => {
        try {
          const limit = input?.limit || 10;
          const agents = await getLeaderboard(limit);
          return agents.map((agent, index) => ({
            rank: index + 1,
            id: agent.id,
            agentId: agent.agentId,
            name: agent.name,
            role: agent.role,
            avatar: agent.avatar,
            balance: parseFloat(agent.balance.toString()),
            reputation: parseFloat(agent.reputation.toString()),
            winCount: agent.winCount,
            lossCount: agent.lossCount,
            totalBattles: agent.totalBattles,
            winRate: agent.totalBattles > 0 ? ((agent.winCount / agent.totalBattles) * 100).toFixed(2) : "0",
          }));
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          throw error;
        }
      }),

    /**
     * Get detailed stats for a specific agent
     */
    getStats: publicProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        try {
          const stats = await getAgentStats(input.agentId);
          if (!stats) {
            throw new Error("Agent not found");
          }

          return {
            agent: {
              id: stats.agent.id,
              agentId: stats.agent.agentId,
              name: stats.agent.name,
              role: stats.agent.role,
              avatar: stats.agent.avatar,
              balance: parseFloat(stats.agent.balance.toString()),
              reputation: parseFloat(stats.agent.reputation.toString()),
              status: stats.agent.status,
              personality: JSON.parse(stats.agent.personality as any),
              skills: JSON.parse(stats.agent.skills as any),
            },
            stats: {
              totalBattles: stats.totalBattles,
              wins: stats.wins,
              losses: stats.losses,
              winRate: stats.winRate,
            },
            recentBattles: stats.recentBattles.map(battle => ({
              battleId: battle.battleId,
              attackerName: battle.attackerName,
              defenderName: battle.defenderName,
              attackType: battle.attackType,
              wasSuccessful: battle.wasSuccessful === 1,
              pointsStolen: parseFloat(battle.pointsStolen.toString()),
              battleLog: battle.battleLog,
              createdAt: battle.createdAt,
            })),
          };
        } catch (error) {
          console.error("Error fetching agent stats:", error);
          throw error;
        }
      }),

    /**
     * Get agent profile
     */
    getProfile: publicProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        try {
          const agent = await getAgentById(input.agentId);
          if (!agent) {
            throw new Error("Agent not found");
          }

          const battles = await getBattlesByAgentId(input.agentId, 50);

          return {
            id: agent.id,
            agentId: agent.agentId,
            name: agent.name,
            role: agent.role,
            avatar: agent.avatar,
            balance: parseFloat(agent.balance.toString()),
            reputation: parseFloat(agent.reputation.toString()),
            status: agent.status,
            personality: JSON.parse(agent.personality as any),
            skills: JSON.parse(agent.skills as any),
            memory: JSON.parse(agent.memory as any),
            winCount: agent.winCount,
            lossCount: agent.lossCount,
            totalBattles: agent.totalBattles,
            lastBattleAt: agent.lastBattleAt,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
            recentBattles: battles.slice(0, 10).map(battle => ({
              battleId: battle.battleId,
              attackerName: battle.attackerName,
              defenderName: battle.defenderName,
              attackType: battle.attackType,
              wasSuccessful: battle.wasSuccessful === 1,
              pointsStolen: parseFloat(battle.pointsStolen.toString()),
              battleLog: battle.battleLog,
              createdAt: battle.createdAt,
            })),
          };
        } catch (error) {
          console.error("Error fetching agent profile:", error);
          throw error;
        }
      }),
  }),

  // ============ BATTLE QUERIES ============
  battles: router({
    /**
     * Get recent battles
     */
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(async ({ input }) => {
        try {
          const limit = input?.limit || 50;
          const battles = await getRecentBattles(limit);
          return battles.map(battle => ({
            battleId: battle.battleId,
            attackerName: battle.attackerName,
            defenderName: battle.defenderName,
            attackType: battle.attackType,
            wasSuccessful: battle.wasSuccessful === 1,
            pointsStolen: parseFloat(battle.pointsStolen.toString()),
            reputationChange: parseFloat(battle.reputationChange.toString()),
            battleLog: battle.battleLog,
            successProbability: parseFloat(battle.successProbability.toString()),
            createdAt: battle.createdAt,
          }));
        } catch (error) {
          console.error("Error fetching recent battles:", error);
          throw error;
        }
      }),

    /**
     * Get battles for a specific agent
     */
    getByAgent: publicProcedure
      .input(z.object({ agentId: z.number(), limit: z.number().min(1).max(100).default(20) }))
      .query(async ({ input }) => {
        try {
          const battles = await getBattlesByAgentId(input.agentId, input.limit);
          return battles.map(battle => ({
            battleId: battle.battleId,
            attackerId: battle.attackerId,
            defenderId: battle.defenderId,
            attackerName: battle.attackerName,
            defenderName: battle.defenderName,
            attackType: battle.attackType,
            wasSuccessful: battle.wasSuccessful === 1,
            pointsStolen: parseFloat(battle.pointsStolen.toString()),
            reputationChange: parseFloat(battle.reputationChange.toString()),
            battleLog: battle.battleLog,
            createdAt: battle.createdAt,
          }));
        } catch (error) {
          console.error("Error fetching agent battles:", error);
          throw error;
        }
      }),

    /**
     * Trigger a manual battle between two agents
     */
    trigger: publicProcedure
      .input(z.object({ attackerId: z.number(), defenderId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const battleEngine = getBattleEngine();
          const result = await battleEngine.triggerBattle(input.attackerId, input.defenderId);

          return {
            battleId: result.battleId,
            wasSuccessful: result.wasSuccessful,
            pointsStolen: result.pointsStolen,
            reputationChange: result.reputationChange,
            battleLog: result.battleLog,
            attackType: result.attackType,
            successProbability: result.successProbability,
          };
        } catch (error) {
          console.error("Error triggering battle:", error);
          throw error;
        }
      }),
  }),

  // ============ ENGINE QUERIES ============
  engine: router({
    /**
     * Get battle engine status
     */
    getStatus: publicProcedure.query(() => {
      try {
        const battleEngine = getBattleEngine();
        return battleEngine.getStatus();
      } catch (error) {
        console.error("Error fetching engine status:", error);
        throw error;
      }
    }),

    /**
     * Start the battle engine (admin only)
     */
    start: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can start the battle engine");
      }

      try {
        const battleEngine = getBattleEngine();
        await battleEngine.start();
        return { success: true, status: battleEngine.getStatus() };
      } catch (error) {
        console.error("Error starting battle engine:", error);
        throw error;
      }
    }),

    /**
     * Stop the battle engine (admin only)
     */
    stop: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can stop the battle engine");
      }

      try {
        const battleEngine = getBattleEngine();
        battleEngine.stop();
        return { success: true, status: battleEngine.getStatus() };
      } catch (error) {
        console.error("Error stopping battle engine:", error);
        throw error;
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
