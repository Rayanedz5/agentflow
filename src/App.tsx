import React, { useState } from 'react';
import { AlertCircle, Trash2, Send } from 'lucide-react';
import { ChatMessage } from './types'; // Adjust this import path if needed to match your project setup

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Reset Conversation Handler
  const clearChat = () => {
    setMessages([]);
  };

  // 2. Message Transmission Handler
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Append the user's message to the state layout right away
    const newUserMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userMessage,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.response || data.message || "No response received.";

      // We use the valid "system" type to bypass the type definition constraints,
      // adding an internal prefix so our visual layer handles its alignment correctly.
      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "system",
        text: `AI_TEAM: ${rawText}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMsg]);

    } catch (error) {
      console.error("Connection failed:", error);

      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "system", 
        text: "Error: Could not establish connection to the collaborative agent cluster. Please check your setup.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);

    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      {/* App Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight text-slate-900">AgentFlow</h1>
            <p className="text-xs text-slate-500 font-medium font-mono uppercase tracking-wider">Collaborative Software Team</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            System Operational
          </span>
          
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            4 Active Agents
          </span>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition duration-200 border border-transparent hover:border-red-100"
              title="Reset conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-display">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Active Chat View Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
        <div className="flex flex-col space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const isErrorSystem = msg.sender === "system" && msg.text.startsWith("Error:");
            const isBotTeam = msg.sender === "system" && msg.text.startsWith("AI_TEAM:");

            // Conditional View Variant A: Red System Error Card Component
            if (isErrorSystem) {
              return (
                <div key={msg.id} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 fade-in max-w-2xl mx-auto w-full">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-red-800">Connection Failed</p>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            }

            // Clean the prefix formatting value off before presenting it to the client
            const displayText = isBotTeam ? msg.text.replace("AI_TEAM: ", "") : msg.text;

            // Conditional View Variant B: Text Dialog Blocks (User on Right, Bot Team on Left)
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full fade-in`}>
                <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1 gap-8 opacity-65">
                    <p className="text-[10px] uppercase tracking-wider font-bold">
                      {isUser ? 'You' : 'Collaborative Agent Team'}
                    </p>
                    <p className="text-[9px] font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayText}</p>
                </div>
              </div>
            );
          })}

          {/* Inline Loading / Analysis Status Indicator */}
          {isAnalyzing && (
            <div className="flex justify-start w-full fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 max-w-[75%] shadow-sm flex items-center space-x-3 text-slate-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                </div>
                <span className="text-xs font-medium tracking-wide">Cluster executing pipeline sequential loops...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Message Form Bar */}
      <footer className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your agent network to compile or review code..."
              disabled={isAnalyzing}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none text-sm transition duration-150 disabled:opacity-65"
            />
            <button
              type="submit"
              disabled={!input.trim() || isAnalyzing}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-slate-200 disabled:text-slate-400 outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 font-medium font-mono uppercase tracking-wider mt-3">
            AgentFlow Runs Sequentially To Guarantee Code Quality: Product Manager ➔ Coder ➔ Code Reviewer ➔ Revision ➔ QA Tester
          </p>
        </div>
      </footer>
    </div>
  );
}