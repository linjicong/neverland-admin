export const gameConfig = {
  baseUrl: process.env.GAME_API_URL || "http://localhost:5000",
  farmId: process.env.FARM_ID || "",
  agentId: process.env.AGENT_ID || "admin",
  agentName: process.env.AGENT_NAME || "管理面板",
};
