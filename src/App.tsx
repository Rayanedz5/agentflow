/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Send, Sparkles, Terminal, ShieldAlert, FileText, 
  CheckCircle2, RefreshCw, ChevronDown, ChevronUp, Clock, 
  Trash2, BookOpen, Layers, AlertCircle, Cpu, ArrowRight, Code
} from "lucide-react";
import Markdown from "react-markdown";
import { ChatMessage, AgentStep, ExamplePrompt } from "./types";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // States to keep track of expanded traces (mapped by chatMessage index)
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<Record<string, boolean>>({});
  // Selected tab within details block of message
  const [selectedAgentTab, setSelectedAgentTab] = useState<Record<string, number>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing, activeStepIndex]);

  // Loading stepper simulation for agent-to-agent communication
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setActiveStepIndex(0);
      interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 3500); // Progresses through agents roughly every 3.5s
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Handle standard example templates
  const examplePrompts: ExamplePrompt[] = [
    {
      label: "Python Web Scraper",
      prompt: "Create a Python script that scrapes headlines from a news webpage with robust exception handling and testing.",
      icon: "🐍"
    },
    {
      label: "HTML Garden Dashboard",
      prompt: "Build an interactive, single-page garden greenhouse monitor in HTML, CSS, and JS with mock status indicators.",
      icon: "🌱"
    },
    {
      label: "Secure JWT Token Engine",
      prompt: "Write a high-security JSON Web Token (JWT) generator and validator in Python, avoiding dependencies, with comprehensive unit tests.",
      icon: "🔑"
    }
  ];
  const clearChat = () => {
    setMessages([]);
  };
  // Pipeline executor trigger
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;
  
    // 1. Clear any previous errors/states and append the user's message to the UI
    setIsAnalyzing(true);
    
    try {
      // 2. Route the request to your deployed Netlify serverless function endpoint
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
  
      // 3. Add the agent team's combined answer back to the UI
      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "user",
        text: data.response || data.message || "No response received.",
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, agentMsg]);
  
    } catch (error) {
      console.error("Connection failed:", error);
  
      // Fallback error message in the UI so it doesn't get stuck forever Loading
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "user", // Ensured this is "agent" so it renders as a bot response block
        text: "Error: Could not establish connection to the collaborative agent cluster. Please check your setup.",
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, errorMsg]);
  
    } finally {
      // This block runs cleanly after either success or catch completes
      setIsAnalyzing(false);
    }
  };
  const loadingSteps = [
    { name: "Product Manager Agent", role: "Analyzing requirements & preparing spec...", css: "border-indigo-500 text-indigo-600 bg-indigo-50" },
    { name: "Developer Agent (Coder)", role: "Writing draft implementation core...", css: "border-blue-500 text-blue-600 bg-blue-50" },
    { name: "Code Reviewer Agent", role: "Auditing security, bugs & edge cases...", css: "border-amber-500 text-amber-600 bg-amber-50" },
    { name: "Developer Agent (Revision)", role: "Applying review revisions...", css: "border-cyan-500 text-cyan-600 bg-cyan-50" },
    { name: "Documentation & QA Agent", role: "Writing user guide & units tests...", css: "border-emerald-500 text-emerald-600 bg-emerald-50" }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col font-sans transition-all duration-300">
      
      {/* Sleek Theme Nav Header */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#2563EB] font-display">AgentFlow</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Collaborative Software Team</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="hidden sm:inline">System Operational</span>
          </span>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <span className="text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-full transition-colors font-semibold">
            4 Active Agents
          </span>
          
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-full transition-all border border-transparent hover:border-red-100 cursor-pointer"
              title="Reset conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-display">Reset</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Conversation Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-between overflow-y-auto">
        
        {messages.length === 0 ? (
          /* Empty / Welcome Screen */
          <div className="flex-1 flex flex-col justify-center items-center py-6 sm:py-10 fade-in">
            <div className="text-center max-w-xl px-4">
              <div className="inline-flex py-1 px-3 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4 animate-bounce">
                🚀 Multi-Agent Intelligence System
              </div>
              <h2 className="text-3xl font-extrabold font-display tracking-tight text-[#111827] mb-3">
                Meet Your New Software Squad
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                Submit an idea or a requirement, and watch as specialized artificial intelligence agents collaborate, review, rewrite, and document your software in real time!
              </p>
            </div>

            {/* Role Layout Cards from Sleek Interface Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mb-12 px-2">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-400/85 hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-extrabold text-blue-600 shrink-0">PM</div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Product Manager Agent</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Converts simple prompts into complete technical specifications with requirements and workflows.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-[#14B8A6]/85 hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-extrabold text-teal-600 shrink-0">DEV</div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Developer Agent (Coder)</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Writes programmatic drafts, implementing feature specs across various runtime languages cleanly.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-red-400/85 hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-extrabold text-rose-600 shrink-0">CR</div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Code Critic Agent</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Inspects the draft code for security liabilities, logical bugs, and rejects or approves for rewrite.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-amber-400/85 hover:shadow-md transition-all duration-300 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-extrabold text-amber-600 shrink-0">QA</div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Documentation & QA Agent</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Asynchronously bundles functional unit test suites and comprehensive installation markup guides.</p>
                </div>
              </div>

            </div>

            {/* Click-to-Run Prompt Examples */}
            <div className="w-full max-w-3xl px-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
                Launch an Agent Session Instantly
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {examplePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="flex flex-col text-left p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#2563EB] rounded-2xl hover:shadow h-full cursor-pointer transition-all duration-200 focus:outline-none group"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-[#2563EB] transition-colors">{item.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {item.prompt}
                    </p>
                    <div className="mt-auto pt-3 flex items-center text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Launch Squad</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Dialogue Container */
          <div className="flex-1 space-y-8 mb-6">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              const isSystem = msg.sender === "system" || msg.text.startsWith("Error:");

              if (isSystem) {
                return (
                  <div key={msg.id} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 fade-in">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-red-800">Connection Failed</p>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col space-y-2.5 ${isUser ? "items-end" : "items-start"} fade-in`}>
                  
                  {/* Sender Metadata Block */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
                    <span className="font-bold text-slate-600">
                      {isUser ? "You" : "🤖 AgentFlow Software Team"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </span>
                  </div>

                  {/* Chat Bubbles */}
                  {isUser ? (
                    <div className="max-w-[75%] bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tr-none shadow-sm text-sm text-slate-700 leading-relaxed font-normal">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                      
                      {/* Stacked avatars header section from "Sleek Interface" design guidance */}
                      <div className="py-3 px-4 sm:px-6 bg-slate-50/50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-1.5 shrink-0">
                            <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-blue-600 shadow-sm">PM</div>
                            <div className="w-6 h-6 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-teal-600 shadow-sm">DEV</div>
                            <div className="w-6 h-6 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-rose-600 shadow-sm">CR</div>
                            <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[9px] font-extrabold text-amber-600 shadow-sm">QA</div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                            Multi-Agent Workflow Complete
                          </span>
                        </div>

                        {/* Interactive agents checks bar in green */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider bg-[#E6FBF7] border border-[#B9F3E8] px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Product Manager
                          </div>
                          <div className="flex items-center gap-1 text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider bg-[#E6FBF7] border border-[#B9F3E8] px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Coder
                          </div>
                          <div className="flex items-center gap-1 text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider bg-[#E6FBF7] border border-[#B9F3E8] px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            The Critic
                          </div>
                          <div className="flex items-center gap-1 text-[#14B8A6] text-[10px] font-bold uppercase tracking-wider bg-[#E6FBF7] border border-[#B9F3E8] px-2 py-0.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            QA & Docs
                          </div>
                        </div>
                      </div>

                      {/* Primary Output Text (The finalized answer) */}
                      <div className="p-6 sm:p-8 prose max-w-none text-sm text-slate-700 leading-relaxed">
                        <div className="markdown-body">
                          <Markdown>{msg.text}</Markdown>
                        </div>

                        {/* Beautiful generated summary notification banner at the bottom of output */}
                        <div className="flex gap-4 p-4 mt-6 bg-[#EFF6FF] rounded-2xl border border-blue-100/80 items-start">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 shrink-0 flex items-center justify-center text-white shadow-md shadow-blue-300/40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                          <div className="text-xs text-blue-950 leading-relaxed">
                            <span className="font-extrabold text-blue-900 block mb-0.5">Documentation & Unit Tests Bundled</span>
                            Core specifications are generated. Code reviewer certified compliance, and QA Agent created thorough suite.
                          </div>
                        </div>
                      </div>

                      {/* Expandable Collaboration Intelligence Trace Panel */}
                      {msg.trace && msg.trace.length > 0 && (
                        <div className="bg-slate-50 border-t border-slate-200/70">
                          
                          <button
                            onClick={() => {
                              setExpandedTraceIndex(prev => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }));
                            }}
                            className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-[#2563EB] hover:bg-slate-100/50 transition-colors focus:outline-none"
                          >
                            <div className="flex items-center space-x-2">
                              <Layers className="w-4 h-4 text-slate-400" />
                              <span>INSPECT SYSTEM TRACES & RESOLUTIONS</span>
                              <span className="bg-slate-200/80 text-slate-700 text-[9px] px-2 py-0.5 rounded font-mono font-semibold">
                                Details Available
                              </span>
                            </div>
                            {expandedTraceIndex[msg.id] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {expandedTraceIndex[msg.id] && (
                            <div className="px-5 pb-6 border-t border-slate-200/60 fade-in">
                              
                              {/* Horizontal Tab Selections */}
                              <div className="flex overflow-x-auto gap-1.5 border-b border-slate-200/75 py-3 scrollbar-none">
                                {msg.trace.map((t, tIdx) => (
                                  <button
                                    key={tIdx}
                                    onClick={() => {
                                      setSelectedAgentTab(prev => ({
                                        ...prev,
                                        [msg.id]: tIdx
                                      }));
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                                      (selectedAgentTab[msg.id] ?? 0) === tIdx
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "bg-white text-slate-600 border border-slate-200/90 hover:border-slate-300"
                                    }`}
                                  >
                                    {t.agent}
                                  </button>
                                ))}
                              </div>

                              {/* Tab Content Rendering */}
                              <div className="mt-4 bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-4 sm:p-5 max-h-96 overflow-y-auto shadow-inner">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3.5">
                                  <div>
                                    <h4 className="text-xs font-extrabold text-slate-900">
                                      {msg.trace[selectedAgentTab[msg.id] ?? 0].agent}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      Role Assigned: {msg.trace[selectedAgentTab[msg.id] ?? 0].role}
                                    </p>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800 border border-green-200">
                                    {msg.trace[selectedAgentTab[msg.id] ?? 0].status}
                                  </span>
                                </div>
                                <div className="markdown-body text-xs prose leading-relaxed">
                                  <Markdown>{msg.trace[selectedAgentTab[msg.id] ?? 0].output ?? ""}</Markdown>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}

            {/* Stepper Display during analyzing processing (Multi-Agent sequential visualization) */}
            {isAnalyzing && (
              <div className="w-full bg-white border border-[#2563EB]/40 rounded-2xl p-6 sm:p-8 shadow-md shadow-blue-500/5 space-y-6 fade-in">
                
                <div className="flex items-center space-x-2.5">
                  <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                  <span className="text-sm font-bold text-[#2563EB] font-display">
                    Multi-Agent Pipeline Active
                  </span>
                  <span className="text-xs text-slate-500">• Sequential Conflict Resolution Loop</span>
                </div>

                {/* Vertical Step Stepper */}
                <div className="space-y-4 pt-1 pl-1">
                  {loadingSteps.map((step, idx) => {
                    const isCompleted = activeStepIndex > idx;
                    const isRunning = activeStepIndex === idx;
                    const isPending = activeStepIndex < idx;

                    return (
                      <div key={idx} className="flex items-start space-x-3.5 transition-all duration-300">
                        {/* Bullet Icon */}
                        <div className="relative shrink-0 flex items-center justify-center">
                          {isCompleted ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-green-500/10">
                              ✔
                            </div>
                          ) : isRunning ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold animate-pulse shadow-md shadow-blue-600/20">
                              {idx + 1}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-[9px] font-bold">
                              {idx + 1}
                            </div>
                          )}
                          {idx < loadingSteps.length - 1 && (
                            <div className={`absolute top-6 bottom-[-18px] left-[11px] w-0.5 ${
                              isCompleted ? "bg-green-500" : isRunning ? "bg-blue-300 border-dashed" : "bg-slate-200"
                            }`}></div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                          <h4 className={`text-xs font-bold ${
                            isCompleted ? "text-slate-400 line-through" : isRunning ? "text-blue-700 font-extrabold" : "text-slate-300"
                          }`}>
                            {step.name}
                          </h4>
                          {isRunning && (
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-[#F1F5F9] border border-blue-100/60 p-3 rounded-xl font-mono tracking-tight animate-pulse">
                              ⏳ {step.role}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-400 text-right italic font-medium pt-2">
                  Building perfect compilation deliverables... Average time: 15-20s Since Agents conduct internal loops
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Controller bottom deck */}
        <div className="sticky bottom-0 z-45 pt-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-[#F8FAFC]/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="w-full max-w-4xl mx-auto space-y-2.5 pb-2"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isAnalyzing}
                placeholder={isAnalyzing ? "Agents are compiling & reviewing code..." : "Type a new project requirement..."}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 shadow-sm"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isAnalyzing}
                className={`absolute right-2.5 p-3 rounded-xl shadow-md transition-all font-semibold shrink-0 cursor-pointer flex items-center justify-center ${
                  inputValue.trim() && !isAnalyzing
                    ? "bg-[#2563EB] text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/15"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }`}
                title="Send instruction to agents"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 px-4 text-center leading-relaxed font-semibold uppercase tracking-wider">
              AgentFlow runs sequentially to guarantee code quality. Product Manager ➔ Coder ➔ Code Reviewer ➔ Revision ➔ QA Tester.
            </p>
          </form>
        </div>

      </main>

      {/* Structured Course Project Footer from Sleek Theme */}
      <footer className="px-6 sm:px-8 py-6 bg-white border-t border-slate-200 flex flex-col gap-4 text-center">
        <div className="flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Built for Multi-Agent Systems Course Project
        </div>
      </footer>

    </div>
  );
}
