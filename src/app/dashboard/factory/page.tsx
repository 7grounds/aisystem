/**
 * @MODULE_ID app.dashboard.factory
 * @STAGE global
 * @DATA_INPUTS ["agent_templates"]
 * @REQUIRED_TOOLS ["createSpecialistAgent", "fetchAgentTemplates"]
 */
"use client";

import { useEffect, useState } from "react";
import {
  createSpecialistAgent,
  fetchAgentTemplates,
  instantiateTemplates,
  type AgentTemplate,
} from "@/core/agent-factory";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const FactoryPage = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskInput, setTaskInput] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      setIsLoading(true);
      const { data, error } = await fetchAgentTemplates();
      if (!isMounted) return;
      if (error) {
        setTemplates([]);
        setIsLoading(false);
        return;
      }
      setTemplates(instantiateTemplates(data));
      setIsLoading(false);
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      setMessages([]);
      return;
    }

    setMessages([
      {
        role: "system",
        content: selectedTemplate.systemPrompt,
      },
    ]);
  }, [selectedTemplate]);

  const handleCreateTemplate = async () => {
    if (!taskInput.trim()) {
      setCreateError("Bitte eine Task-Beschreibung eingeben.");
      return;
    }
    setCreateError(null);
    setIsCreating(true);

    const { data, error } = await createSpecialistAgent({ task: taskInput });
    if (error || !data) {
      setCreateError(error?.message ?? "Template konnte nicht erstellt werden.");
      setIsCreating(false);
      return;
    }

    const newTemplate = instantiateTemplates([data])[0];
    if (newTemplate) {
      setTemplates((prev) => [newTemplate, ...prev]);
      setSelectedTemplate(newTemplate);
    }
    setTaskInput("");
    setIsCreating(false);
  };

  const handleStartChat = (template: AgentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedTemplate) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: chatInput.trim() },
    ]);
    setChatInput("");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-950 px-8 py-8 text-slate-100 shadow-[0_20px_55px_rgba(15,23,42,0.4)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Agent Factory</span>
          <span>Templates</span>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">
              Create Specialist Agent
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                className="flex-1 rounded-2xl border border-slate-700/80 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Erstelle einen neuen Agenten für..."
                type="text"
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
              />
              <button
                className="rounded-full bg-emerald-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 hover:bg-emerald-400"
                type="button"
                onClick={handleCreateTemplate}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
            {createError ? (
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-rose-400">
                {createError}
              </p>
            ) : null}
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-400">
              Keine Agenten-Templates vorhanden.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {template.name}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {template.description}
                    </p>
                  </div>
                  <button
                    className="mt-4 rounded-full border border-emerald-400/40 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-200 hover:border-emerald-300"
                    type="button"
                    onClick={() => handleStartChat(template)}
                  >
                    Chat starten
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800/70 bg-slate-950 px-8 py-8 text-slate-100 shadow-[0_20px_55px_rgba(15,23,42,0.4)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>Agent Chat</span>
          <span>{selectedTemplate?.name ?? "Idle"}</span>
        </div>
        {selectedTemplate ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-xs text-slate-300">
              <p className="uppercase tracking-[0.2em] text-emerald-300">
                System Prompt
              </p>
              <p className="mt-3 whitespace-pre-line leading-relaxed">
                {selectedTemplate.systemPrompt}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4">
              <div className="space-y-3 text-xs text-slate-300">
                {messages.map((message, index) => (
                  <p key={`${message.role}-${index}`}>
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
                  placeholder="Nachricht an den Spezial-Agenten..."
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                />
                <button
                  className="rounded-full bg-emerald-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-900 hover:bg-emerald-400"
                  type="button"
                  onClick={handleSendMessage}
                >
                  Senden
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-400">
            Wähle ein Template, um einen Chat zu starten.
          </p>
        )}
      </section>
    </div>
  );
};

export default FactoryPage;
