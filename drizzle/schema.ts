import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, index, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * AI Agents - 100 autonomous agents in the arena
 */
export const agents = mysqlTable(
  "agents",
  {
    id: int("id").autoincrement().primaryKey(),
    agentId: varchar("agentId", { length: 64 }).notNull().unique(), // Unique identifier
    name: varchar("name", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["Hacker", "Defender", "Analyst"]).notNull(),
    avatar: varchar("avatar", { length: 255 }).notNull(), // Emoji or URL
    personality: json("personality").notNull(), // { aggressiveness, intelligence, caution }
    skills: json("skills").notNull(), // { hacking, defense, analysis, stealth }
    balance: decimal("balance", { precision: 18, scale: 2 }).default("1000").notNull(),
    reputation: decimal("reputation", { precision: 10, scale: 2 }).default("0").notNull(),
    status: mysqlEnum("status", ["idle", "attacking", "defending", "offline"]).default("idle").notNull(),
    memory: json("memory").notNull(), // Array of past actions and lessons learned
    winCount: int("winCount").default(0).notNull(),
    lossCount: int("lossCount").default(0).notNull(),
    totalBattles: int("totalBattles").default(0).notNull(),
    lastBattleAt: timestamp("lastBattleAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agentIdIdx: index("agentId_idx").on(table.agentId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Battle Records - Each attack/defense interaction
 */
export const battles = mysqlTable(
  "battles",
  {
    id: int("id").autoincrement().primaryKey(),
    battleId: varchar("battleId", { length: 64 }).notNull().unique(),
    attackerId: int("attackerId").notNull(),
    defenderId: int("defenderId").notNull(),
    attackerName: varchar("attackerName", { length: 255 }).notNull(),
    defenderName: varchar("defenderName", { length: 255 }).notNull(),
    attackType: varchar("attackType", { length: 64 }).notNull(), // "brute_force", "social_engineering", etc.
    successProbability: decimal("successProbability", { precision: 5, scale: 2 }).notNull(),
    wasSuccessful: int("wasSuccessful").notNull(), // 0 or 1
    pointsStolen: decimal("pointsStolen", { precision: 18, scale: 2 }).default("0").notNull(),
    reputationChange: decimal("reputationChange", { precision: 10, scale: 2 }).notNull(),
    battleLog: text("battleLog"), // Narrative description of the battle
    attackerSkillsUsed: json("attackerSkillsUsed"),
    defenderSkillsUsed: json("defenderSkillsUsed"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    attackerIdx: index("attacker_idx").on(table.attackerId),
    defenderIdx: index("defender_idx").on(table.defenderId),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

export type Battle = typeof battles.$inferSelect;
export type InsertBattle = typeof battles.$inferInsert;

/**
 * Agent Evolution - Track skill progression and learning
 */
export const agentEvolution = mysqlTable(
  "agent_evolution",
  {
    id: int("id").autoincrement().primaryKey(),
    agentId: int("agentId").notNull(),
    skillImprovement: json("skillImprovement").notNull(), // { hacking: +0.05, defense: +0.02 }
    strategiesLearned: json("strategiesLearned").notNull(), // Array of new strategies
    winStreak: int("winStreak").default(0).notNull(),
    lossStreak: int("lossStreak").default(0).notNull(),
    evolutionScore: decimal("evolutionScore", { precision: 10, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agentIdIdx: index("evolution_agentId_idx").on(table.agentId),
  })
);

export type AgentEvolution = typeof agentEvolution.$inferSelect;
export type InsertAgentEvolution = typeof agentEvolution.$inferInsert;