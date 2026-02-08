/**
 * @MODULE_ID app.dashboard.showcase
 * @STAGE global
 * @DATA_INPUTS ["agent_templates"]
 * @REQUIRED_TOOLS ["fetchAgentTemplates", "MAIN_AGENT_SYSTEM_PROMPT"]
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAgentTemplates,
  instantiateTemplates,
  type AgentTemplate,
} from "@/core/agent-factory";
import { MAIN_AGENT_SYSTEM_PROMPT } from "@/core/agent-prompts";
import { useTenant } from "@/core/tenant-context";

type AgentShowcase = {
  id: string;
  icon: string;
  title: string;
  description: string;
  roi: string;
  category: string;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const AGENT_SHOWCASE: AgentShowcase[] = [
  {
    id: "tax-optimizer",
    icon: "🧾",
    title: "Der Steuer-Optimierer",
    description: "Optimiert Schweizer Steuerlast durch saubere Abzüge.",
    roi: "Reduziert steuerliche Reibung durch strukturierte Abzüge, Timing und Einkommensglättung.",
    category: "Finanzen",
  },
  {
    id: "inheritance-planner",
    icon: "🧬",
    title: "Der Erbschafts-Planer",
    description: "Strukturiert Vermögensübergabe und Pflichtanteile.",
    roi: "Minimiert Übergabekosten und rechtliche Risiken durch klare Strukturierung.",
    category: "Recht",
  },
  {
    id: "crypto-guardian",
    icon: "₿",
    title: "Der Krypto-Guardian",
    description: "Bewertet Risiko, Verwahrung und Steuerfolgen von Crypto.",
    roi: "Schützt vor Volatilitäts- und Compliance-Fallen durch klare Limits.",
    category: "Technik",
  },
  {
    id: "fee-hunter",
    icon: "📉",
    title: "Der Gebühren-Jäger",
    description: "Findet versteckte Gebühren und Rebalancing-Verluste.",
    roi: "Sichert Rendite, indem unnötige Gebührenströme eliminiert werden.",
    category: "Finanzen",
  },
];

const ShowcasePage = () => {
  const { organization } = useTenant();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentShowcase | null>(null);
  const [showArchitectChat, setShowArchitectChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      const { data, error } = await fetchAgentTemplates(organization?.id);
      if (!isMounted) return;
      if (error) {
        setTemplates([]);
        return;
      }
      setTemplates(instantiateTemplates(data));
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [organization?.id]);

  const activatedAgents = useMemo(() => {
    if (!organization?.id) return new Set<string>();
    return new Set(
      templates
        .filter((template) => template.organizationId === organization.id)
        .map((template) => template.name),
    );
  }, [organization?.id, templates]);

  const availableAgents = useMemo(() => {
    return new Set(
      templates
        .filter((template) => template.organizationId === null)
        .map((template) => template.name),
    );
  }, [templates]);

  const groupedAgents = useMemo(() => {
    return AGENT_SHOWCASE.reduce<Record<string, AgentShowcase[]>>((acc, agent) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push(agent);
      return acc;
    }, {});
  }, []);

  useEffect(() => {
    if (!showArchitectChat) {
      setMessages([]);
      setChatInput("");
      return;
    }
    setMessages([{ role: "system", content: MAIN_AGENT_SYSTEM_PROMPT }]);
  }, [showArchitectChat]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: chatInput.trim() }]);
    setChatInput("");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950 px-8 py-8 text-slate-100 shadow-[0_20px_55px_rgba(15,23,42,0.4)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Agent-Showcase</span>
          <span>Galerie</span>
        </div>
        <div className="mt-6 space-y-8">
          {Object.entries(groupedAgents).map(([category, agents]) => (
            <div key={category} className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {category}
              </p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {agents.map((agent) => {
                  const isActive = activatedAgents.has(agent.title);
                  const isAvailable = availableAgents.has(agent.title);
                  const statusLabel = isActive
                    ? "Aktiviert"
                    : isAvailable
                      ? "Verfügbar"
                      : "Nicht verfügbar";
                  return (
                    <button
                      key={agent.id}
                      className="flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-emerald-400/60"
                      type="button"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{agent.icon}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100">
                            {agent.title}
                          </h3>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-200">
                        Details ansehen
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            className="flex h-full flex-col justify-between rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-4 text-left text-sm text-emerald-200 transition hover:border-emerald-300"
            type="button"
            onClick={() => setShowArchitectChat(true)}
          >
            <div className="space-y-3">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="text-lg font-semibold">
                  Brauchst du einen anderen Experten?
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                  Frag den Architect!
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-200">
              Architect-Chat öffnen
            </div>
          </button>
        </div>
      </section>

      {selectedAgent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {selectedAgent.icon} {selectedAgent.title}
              </h3>
              <button
                className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
                type="button"
                onClick={() => setSelectedAgent(null)}
              >
                Close
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              {selectedAgent.roi}
            </p>
          </div>
        </div>
      ) : null}

      {showArchitectChat ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Zasterix Architect</h3>
              <button
                className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
                type="button"
                onClick={() => setShowArchitectChat(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-xs text-slate-300">
              {messages.map((message, index) => (
                <p key={`${message.role}-${index}`} className="mt-2">
                  <span className="text-emerald-300">
                    {message.role === "system" ? "SYSTEM" : "USER"}:
                  </span>{" "}
                  {message.content}
                </p>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="flex-1 rounded-2xl border border-slate-700/80 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Beschreibe deinen Spezial-Case..."
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
              />
              <button
                className="rounded-full bg-emerald-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 hover:bg-emerald-400"
                type="button"
                onClick={handleSend}
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShowcasePage;
