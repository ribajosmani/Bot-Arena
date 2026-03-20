import { nanoid } from "nanoid";
import { createAgent, getAllAgents } from "./db";
import type { Agent as AgentType } from "../drizzle/schema";

export interface Personality {
  aggressiveness: number; // 0-1: how likely to attack
  intelligence: number;   // 0-1: how smart the strategy is
  caution: number;        // 0-1: how defensive they are
}

export interface Skills {
  hacking: number;        // 0-100: ability to breach systems
  defense: number;        // 0-100: ability to defend
  analysis: number;       // 0-100: ability to analyze threats
  stealth: number;        // 0-100: ability to hide attacks
}

export interface Memory {
  action: string;
  timestamp: number;
  result: string;
  pointsGained?: number;
  pointsLost?: number;
}

const AGENT_NAMES = [
  "Cipher", "Nexus", "Phantom", "Rogue", "Vortex", "Echo", "Specter", "Void",
  "Blaze", "Storm", "Inferno", "Frost", "Surge", "Pulse", "Spark", "Shade",
  "Reaper", "Wraith", "Sentinel", "Vanguard", "Titan", "Phoenix", "Demon", "Angel",
  "Shadow", "Midnight", "Dusk", "Dawn", "Twilight", "Eclipse", "Nova", "Supernova",
  "Quantum", "Photon", "Electron", "Proton", "Neutron", "Atom", "Molecule", "Crystal",
  "Apex", "Zenith", "Gedi", "Vertex", "Matrix", "Prism", "Spectrum", "Frequency",
  "Byte", "Bit", "Code", "Logic", "Binary", "Hex", "Octal", "ASCII",
  "Virus", "Malware", "Trojan", "Worm", "Ransomware", "Spyware", "Adware", "Rootkit",
  "Hacker", "Cracker", "Breaker", "Slasher", "Slicer", "Cutter", "Ripper", "Shredder",
  "Glitch", "Crash", "Freeze", "Lag", "Stutter", "Jitter", "Noise", "Static",
  "Pixel", "Vector", "Raster", "Bitmap", "Texture", "Shader", "Filter", "Render",
  "Cache", "Buffer", "Stack", "Heap", "Queue", "Tree", "Graph", "Node"
];

const AVATARS = [
  "🤖", "👾", "🎯", "⚡", "🔥", "❄️", "💀", "👻",
  "🕷️", "🦾", "🧠", "💻", "📡", "🛸", "🎲", "🎰"
];

const ROLES = ["Hacker", "Defender", "Analyst"] as const;

export class AgentFactory {
  static generatePersonality(): Personality {
    return {
      aggressiveness: Math.random(),
      intelligence: Math.random(),
      caution: Math.random(),
    };
  }

  static generateSkills(): Skills {
    return {
      hacking: Math.random() * 100,
      defense: Math.random() * 100,
      analysis: Math.random() * 100,
      stealth: Math.random() * 100,
    };
  }

  static generateMemory(): Memory[] {
    return [];
  }

  static async createAgent(): Promise<AgentType | null> {
    const agentId = nanoid();
    const name = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const personality = this.generatePersonality();
    const skills = this.generateSkills();
    const memory = this.generateMemory();

    try {
      await createAgent({
        agentId,
        name,
        avatar,
        role,
        personality: JSON.stringify(personality),
        skills: JSON.stringify(skills),
        balance: "1000",
        reputation: "0",
        status: "idle",
        memory: JSON.stringify(memory),
        winCount: 0,
        lossCount: 0,
        totalBattles: 0,
      });

      const agent = await getAllAgents();
      return agent.find(a => a.agentId === agentId) || null;
    } catch (error) {
      console.error("Failed to create agent:", error);
      return null;
    }
  }

  static async initializeArena(count: number = 100): Promise<AgentType[]> {
    console.log(`[Arena] Initializing ${count} agents...`);
    
    const existingAgents = await getAllAgents();
    if (existingAgents.length >= count) {
      console.log(`[Arena] Arena already has ${existingAgents.length} agents`);
      return existingAgents;
    }

    const agentsToCreate = count - existingAgents.length;
    const createdAgents: AgentType[] = [];

    for (let i = 0; i < agentsToCreate; i++) {
      const agent = await this.createAgent();
      if (agent) {
        createdAgents.push(agent);
        if ((i + 1) % 10 === 0) {
          console.log(`[Arena] Created ${i + 1}/${agentsToCreate} agents`);
        }
      }
    }

    console.log(`[Arena] Arena initialized with ${createdAgents.length} new agents`);
    return [...existingAgents, ...createdAgents];
  }
}

export function parsePersonality(personality: string | object | unknown): Personality {
  if (typeof personality === 'string') {
    return JSON.parse(personality);
  }
  return (personality as any) as Personality;
}

export function parseSkills(skills: string | object | unknown): Skills {
  if (typeof skills === 'string') {
    return JSON.parse(skills);
  }
  return (skills as any) as Skills;
}

export function parseMemory(memory: string | object): Memory[] {
  if (typeof memory === 'string') {
    return JSON.parse(memory);
  }
  return memory as Memory[];
}
