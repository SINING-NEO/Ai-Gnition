"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Highlight } from "@/components/ui/Squiggle";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Every Friday send my team a status summary from the Orders sheet.",
  "Copy new order emails into the Orders sheet.",
  "Book a follow-up after every client call.",
];

export default function ChatPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Tell me a repetitive task in plain English. I'll design a workflow and Guardian will review anything risky.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  async function send(text?: string) {
    const message = (text ?? input).trim();
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
      <div className="text-center">
        <h1 className="font-display text-4xl font-normal leading-tight md:text-5xl">
          Just <Highlight>ask</Highlight> to automate
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
          Skip the pattern hunt. Describe the loop and the{" "}
          <span className="text-violet">Architect</span> drafts a workflow.
        </p>
      </div>

      <div className="card space-y-3 p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-10 rounded-2xl rounded-br-md bg-lime px-4 py-3 text-sm font-medium text-bg"
                : "mr-10 rounded-2xl rounded-bl-md bg-raised px-4 py-3 text-sm"
            }
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="mr-10 rounded-2xl rounded-bl-md bg-raised px-4 py-3 text-sm text-muted">
            Architecting…
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              className="chip transition hover:bg-line"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="tile flex items-center gap-2 p-2 pl-5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="Describe a repetitive task…"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button
          type="button"
          aria-label="Send"
          disabled={busy || !input.trim()}
          onClick={() => void send()}
          className="btn btn-primary h-11 w-11 px-0"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>

      {workflowId && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(`/approve/${workflowId}`)}
            className="btn btn-primary flex-1"
          >
            Review & approve
          </button>
          <button
            type="button"
            onClick={() => router.push(`/studio/${workflowId}`)}
            className="btn btn-ghost flex-1"
          >
            Open studio
          </button>
        </div>
      )}
    </div>
  );
}
