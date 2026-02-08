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
  registerNewAgent,
  type AgentTemplate,
} from "@/core/agent-factory";
import { useTenant } from "@/core/tenant-context";
import { supabase } from "@/core/supabase";

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
  const { organization } = useTenant();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("Alle");

  const isAdmin = userEmail === "test@zasterix.ch";

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUserEmail(data.user?.email ?? null);
    };

    const loadTemplates = async () => {
      setIsLoading(true);
      const { data, error } = await fetchAgentTemplates(organization?.id);
      if (!isMounted) return;
      if (error) {
        setTemplates([]);
        setIsLoading(false);
        return;
      }
      setTemplates(instantiateTemplates(data));
      setIsLoading(false);

      const { data: seeded, created } = await registerNewAgent({
        name: "Erbrecht-Expert CH",
        description:
          "Spezialist für Schweizer Erbengemeinschaften und Liegenschaften.",
        systemPrompt:
          "Du bist ein Experte für Schweizer Erbrecht (ZGB). Dein Fokus liegt auf Erbengemeinschaften (§ 602 ZGB). Dein Ziel ist es, neutral zu klären, wie mit gemeinsamem Eigentum umzugehen ist, wenn ein Erbe die Liegenschaft bewohnt. Erkläre Konzepte wie das Einstimmigkeitsprinzip und die Nutzungsentschädigung (fiktive Miete). Frage nach Details: Wird Miete gezahlt? Gibt es eine Nutzungsvereinbarung?",
        category: "Legal",
        icon: "Gavel",
      });

      const { data: medSeeded, created: medCreated } = await registerNewAgent({
        name: "Med-Interpret",
        description:
          "Spezialist für die Analyse von medizinischen Laborwerten.",
        systemPrompt:
          "Du bist ein Spezialist für die Analyse von medizinischen Laborwerten. Deine Aufgabe ist es, Fachbegriffe in einfache Sprache zu übersetzen. Suche nach Referenzwerten und erkläre, was Abweichungen bedeuten könnten. Beende jede Nachricht mit einem medizinischen Disclaimer.",
        category: "Medizin",
        icon: "Stethoscope",
      });

      if (!isMounted) return;
      if (created && seeded) {
        const newTemplate = instantiateTemplates([seeded])[0];
        if (newTemplate) {
          setTemplates((prev) => [newTemplate, ...prev]);
        }
      }

      if (medCreated && medSeeded) {
        const newTemplate = instantiateTemplates([medSeeded])[0];
        if (newTemplate) {
          setTemplates((prev) => [newTemplate, ...prev]);
        }
      }
    };

    loadUser();
    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [organization?.id]);

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

    const { data, error } = await createSpecialistAgent({
      task: taskInput,
      organizationId: organization?.id ?? null,
    });
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

  const categoryOptions = ["Alle", "Legal", "Medizin", "Finanzen"];
  const filteredTemplates =
    categoryFilter === "Alle"
      ? templates
      : templates.filter((template) => {
          if (categoryFilter === "Finanzen") {
            return (
              template.category === "Finanzen" || template.category === "General"
            );
          }
          return template.category === categoryFilter;
        });

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
            <div className="space-y-4">
              {isAdmin ? (
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Filter:</span>
                  {categoryOptions.map((option) => (
                    <button
                      key={option}
                      className={`rounded-full px-3 py-2 ${
                        categoryFilter === option
                          ? "bg-emerald-500 text-slate-900"
                          : "border border-slate-700 text-slate-300"
                      }`}
                      type="button"
                      onClick={() => setCategoryFilter(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {template.icon ? `${template.icon} ` : ""}
                      {template.name}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {template.description}
                    </p>
                    {template.category ? (
                      <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300">
                        {template.category}
                      </p>
                    ) : null}
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
