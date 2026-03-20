import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { getBattleEngine } from "./battle-engine";
import { getAllAgents, getLeaderboard, getRecentBattles } from "./db";

export interface BattleEvent {
  battleId: string;
  attackerName: string;
  defenderName: string;
  attackType: string;
  wasSuccessful: boolean;
  pointsStolen: number;
  battleLog: string;
  timestamp: Date;
}

export interface AgentUpdateEvent {
  agentId: number;
  name: string;
  balance: string;
  reputation: string;
  status: string;
  winCount: number;
  lossCount: number;
  totalBattles: number;
}

export function setupWebSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  const battleEngine = getBattleEngine();

  // Handle client connections
  io.on("connection", (socket: any) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Send initial state to client
    socket.on("request-initial-state", async () => {
      try {
        const agents = await getAllAgents();
        const leaderboard = await getLeaderboard(10);
        const recentBattles = await getRecentBattles(20);

        socket.emit("initial-state", {
          agents,
          leaderboard,
          recentBattles,
          engineStatus: battleEngine.getStatus(),
        });
      } catch (error) {
        console.error("[WebSocket] Error sending initial state:", error);
        socket.emit("error", { message: "Failed to load initial state" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on("error", (error: any) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
  });

  // Broadcast battle events to all connected clients
  battleEngine.on("battle", (event: BattleEvent) => {
    io.emit("battle-event", event);
  });

  // Periodically broadcast agent updates
  setInterval(async () => {
    try {
      const agents = await getAllAgents();
      const leaderboard = await getLeaderboard(10);
      io.emit("agents-update", { agents, leaderboard });
    } catch (error) {
      console.error("[WebSocket] Error broadcasting agent updates:", error);
    }
  }, 3000); // Update every 3 seconds

  return io;
}
