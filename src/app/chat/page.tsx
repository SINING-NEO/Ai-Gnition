"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const router = useRouter();
  const [input, setInput] = useState(
    "Every Friday send my team a status summary from the Orders sheet.",
  );
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Tell me a repetitive task in plain English. I'll design a workflow and Guardian will review anything risky.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chat failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", text: String(json.reply).replace(/\*\*/g, "") },
      ]);
      setWorkflowId(json.workflow?.id ?? null);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Something went wrong.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Ask to automate</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-fog">
          OneLastThing
        </h1>
        <p className="mt-3 text-mist">
          Skip the pattern hunt — describe the loop and the Architect drafts a workflow.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-tr-sm bg-ember/20 px-4 py-3 text-fog"
                : "mr-8 rounded-2xl rounded-tl-sm bg-ink/50 px-4 py-3 text-mist"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="Describe a repetitive task…"
          className="flex-1 rounded-full border border-white/15 bg-ink/40 px-5 py-3 text-sm text-fog outline-none ring-ember/40 placeholder:text-mist/40 focus:ring-2"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void send()}
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white hover:bg-ember-hot disabled:opacity-50"
        >
          {busy ? "Architecting…" : "Send"}
        </button>
      </div>

      {workflowId && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/approve/${workflowId}`)}
            className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sand"
          >
            Review & approve
          </button>
          <button
            type="button"
            onClick={() => router.push(`/studio/${workflowId}`)}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-fog hover:bg-white/10"
          >
            Open studio
          </button>
        </div>
      )}
    </div>
  );
}
