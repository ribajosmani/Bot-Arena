import { eq, desc, sql, and, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, battles, agentEvolution, Agent, Battle, AgentEvolution } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ AGENT QUERIES ============

export async function createAgent(agent: typeof agents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(agents).values(agent);
  return result;
}

export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(agents).orderBy(desc(agents.balance));
}

export async function getAgentById(id: number): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAgentByAgentId(agentId: string): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agents).where(eq(agents.agentId, agentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAgent(id: number, updates: Partial<typeof agents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(agents).set({ ...updates, updatedAt: new Date() }).where(eq(agents.id, id));
}

export async function getLeaderboard(limit: number = 10): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(agents).orderBy(desc(agents.balance)).limit(limit);
}

export async function getRandomAgent(excludeId?: number): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const query = excludeId 
    ? db.select().from(agents).where(ne(agents.id, excludeId))
    : db.select().from(agents);
  
  const allAgents = await query;
  if (allAgents.length === 0) return undefined;
  
  return allAgents[Math.floor(Math.random() * allAgents.length)];
}

export async function getIdleAgents(limit: number = 20): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(agents)
    .where(eq(agents.status, 'idle'))
    .orderBy(desc(agents.balance))
    .limit(limit);
}

// ============ BATTLE QUERIES ============

export async function createBattle(battle: typeof battles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(battles).values(battle);
}

export async function getRecentBattles(limit: number = 50): Promise<Battle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(battles).orderBy(desc(battles.createdAt)).limit(limit);
}

export async function getBattlesByAgentId(agentId: number, limit: number = 20): Promise<Battle[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(battles)
    .where(
      sql`${battles.attackerId} = ${agentId} OR ${battles.defenderId} = ${agentId}`
    )
    .orderBy(desc(battles.createdAt))
    .limit(limit);
}

export async function getAgentStats(agentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const agent = await getAgentById(agentId);
  if (!agent) return null;
  
  const battles = await getBattlesByAgentId(agentId, 100);
  const wins = battles.filter(b => 
    (b.attackerId === agentId && b.wasSuccessful) || 
    (b.defenderId === agentId && !b.wasSuccessful)
  ).length;
  
  return {
    agent,
    totalBattles: battles.length,
    wins,
    losses: battles.length - wins,
    winRate: battles.length > 0 ? (wins / battles.length * 100).toFixed(2) : '0',
    recentBattles: battles.slice(0, 10),
  };
}

// ============ EVOLUTION QUERIES ============

export async function createEvolution(evolution: typeof agentEvolution.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(agentEvolution).values(evolution);
}

export async function getAgentEvolution(agentId: number): Promise<AgentEvolution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(agentEvolution)
    .where(eq(agentEvolution.agentId, agentId))
    .orderBy(desc(agentEvolution.updatedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEvolution(id: number, updates: Partial<typeof agentEvolution.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(agentEvolution)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(agentEvolution.id, id));
}
