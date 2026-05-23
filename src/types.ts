export interface AgentStep {
  agent: string;
  role: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "system" | "agents" | "bot";
  text: string;
  timestamp: Date;
  trace?: AgentStep[];
  isError?: boolean;
}

export interface ExamplePrompt {
  label: string;
  prompt: string;
  icon: string;
}
