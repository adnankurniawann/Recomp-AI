"use client";

import { Check, Info, Send, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { recordRecruitDecision, loadRecruitHint } from "@/app/(app)/tim/actions";
import { sendInvite } from "@/app/(app)/undangan/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";
import type { RecruitDraft } from "@/lib/ai/recruiter";
import { INVITE_MESSAGE_MAX, type SendInviteInput } from "@/lib/validation/invite";
import type { RecruitDecisionInput } from "@/lib/validation/recruit";

export interface RecruitRun {
  agentActionId: string;
  drafts: RecruitDraft[];
  aiUsed: boolean;
}

/** POST /api/ai/recruit (PRD §13.2). Throws with the API's Indonesian message. */
export async function requestRecruitDrafts(teamRoleId: string): Promise<RecruitRun> {
  const res = await fetch("/api/ai/recruit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamRoleId }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? "Draf belum bisa disiapkan. Coba lagi.");
  return body as RecruitRun;
}

export interface RecruitApi {
  request: (teamRoleId: string) => Promise<RecruitRun>;
  send: (input: SendInviteInput) => Promise<ActionResult<{ inviteId: string }>>;
  decide: (input: RecruitDecisionInput) => Promise<ActionResult<{ approval: string }>>;
  hint: (teamRoleId: string) => Promise<ActionResult<{ declinedName: string } | null>>;
}

const defaultApi: RecruitApi = {
  request: requestRecruitDrafts,
  send: sendInvite,
  decide: recordRecruitDecision,
  hint: loadRecruitHint,
};

type CardState = "open" | "sending" | "sent" | "skipped";

/**
 * "Bantu rekrut" for the leader (F-RCR-01..02, PRD §8.2): drafts a message for the top 3
 * candidates not yet invited. Each draft is editable and goes out only on "Kirim" (ADR 0004);
 * "Lewati" drops it. After an AI-drafted invite is declined, offers drafts for the next ones.
 */
export function RecruitPanel({
  teamRoleId,
  roleName,
  onInvited,
  api = defaultApi,
}: {
  teamRoleId: string;
  roleName: string;
  onInvited: (profileId: string) => void;
  api?: RecruitApi;
}) {
  const [run, setRun] = useState<RecruitRun | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api.hint(teamRoleId).then((r) => {
      if (live && r.ok && r.data) setHint(r.data.declinedName);
    });
    return () => {
      live = false;
    };
  }, [api, teamRoleId]);

  async function start() {
    setLoading(true);
    try {
      const next = await api.request(teamRoleId);
      setRun(next);
      setMessages(Object.fromEntries(next.drafts.map((d) => [d.candidateId, d.message])));
      setCards(Object.fromEntries(next.drafts.map((d) => [d.candidateId, "open" as const])));
      setHint(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Draf belum bisa disiapkan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function send(d: RecruitDraft) {
    if (!run) return;
    const message = (messages[d.candidateId] ?? "").trim();
    setCards((c) => ({ ...c, [d.candidateId]: "sending" }));
    const res = await api.send({
      teamRoleId,
      candidateId: d.candidateId,
      message,
      // An edited AI draft is still an AI draft: the leader started from it.
      aiDrafted: d.aiDrafted,
      agentActionId: run.agentActionId,
    });
    if (!res.ok) {
      toast.error(res.error.message);
      setCards((c) => ({ ...c, [d.candidateId]: "open" }));
      return;
    }
    setCards((c) => ({ ...c, [d.candidateId]: "sent" }));
    toast.success(`Undangan terkirim ke ${d.fullName}`);
    onInvited(d.candidateId);
    await api.decide({
      agentActionId: run.agentActionId,
      candidateId: d.candidateId,
      decision: "sent",
    });
  }

  async function skip(d: RecruitDraft) {
    if (!run) return;
    setCards((c) => ({ ...c, [d.candidateId]: "skipped" }));
    await api.decide({
      agentActionId: run.agentActionId,
      candidateId: d.candidateId,
      decision: "skipped",
    });
  }

  const visible = run?.drafts.filter((d) => cards[d.candidateId] !== "skipped") ?? [];
  const allDone = run !== null && visible.every((d) => cards[d.candidateId] === "sent");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-sm text-ink-2">
          {hint ? (
            <>
              <span className="font-medium text-ink-strong">{hint} menolak.</span> Mau aku siapkan
              draf untuk kandidat berikutnya?
            </>
          ) : (
            <>Butuh bantuan menulis undangan untuk 3 kandidat teratas {roleName}?</>
          )}
        </p>
        <Button
          variant="accent"
          size="sm"
          className="h-11 md:h-8"
          onClick={start}
          disabled={loading}
          aria-busy={loading}
          icon={<Sparkles aria-hidden size={16} strokeWidth={1.75} />}
        >
          {loading ? "Menyiapkan draf…" : hint ? "Siapkan draf" : "Bantu rekrut"}
        </Button>
      </div>

      {loading && <DraftSkeleton />}

      {!loading && run && (
        <div className="flex flex-col gap-3">
          {!run.aiUsed && (
            <p className="flex items-start gap-2 rounded-md bg-warning-50 px-3 py-2 text-[13px] text-warning-ink">
              <Info aria-hidden size={16} strokeWidth={1.75} className="mt-px shrink-0" />
              Fitur AI sedang tidak aktif, jadi draf memakai template. Kamu tetap bisa mengeditnya.
            </p>
          )}
          {visible.map((d) => (
            <DraftCard
              key={d.candidateId}
              draft={d}
              message={messages[d.candidateId] ?? ""}
              state={cards[d.candidateId] ?? "open"}
              onChange={(m) => setMessages((all) => ({ ...all, [d.candidateId]: m }))}
              onSend={() => send(d)}
              onSkip={() => skip(d)}
            />
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-ink-3">Semua draf dilewati. Tidak ada undangan terkirim.</p>
          )}
          {!allDone && visible.length > 0 && (
            <p className="text-xs text-ink-3">
              Undangan baru terkirim setelah kamu menekan &quot;Kirim&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft: d,
  message,
  state,
  onChange,
  onSend,
  onSkip,
}: {
  draft: RecruitDraft;
  message: string;
  state: CardState;
  onChange: (message: string) => void;
  onSend: () => void;
  onSkip: () => void;
}) {
  const id = useId();
  const sent = state === "sent";
  const busy = state === "sending";
  const empty = message.trim().length === 0;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium text-ink-strong">
          <label htmlFor={`${id}-msg`}>{d.fullName}</label>
          <span className="font-mono text-xs text-ink-2 tabular-nums">skor {d.score}</span>
        </p>
        {d.aiDrafted ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Sparkles aria-hidden size={14} strokeWidth={1.75} />
            Dibuat AI
          </span>
        ) : (
          <span className="text-xs font-medium text-ink-3">Template</span>
        )}
      </div>
      <Textarea
        id={`${id}-msg`}
        value={message}
        onChange={(e) => onChange(e.target.value)}
        maxLength={INVITE_MESSAGE_MAX}
        rows={4}
        disabled={sent || busy}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-3 tabular-nums">
          {message.length}/{INVITE_MESSAGE_MAX}
        </span>
        {sent ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-ink">
            <Check aria-hidden size={16} strokeWidth={2} />
            Terkirim
          </span>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 md:h-8"
              onClick={onSkip}
              disabled={busy}
            >
              Lewati
            </Button>
            <Button
              variant="accent"
              size="sm"
              className="h-11 md:h-8"
              onClick={onSend}
              disabled={busy || empty}
              aria-busy={busy}
              icon={<Send aria-hidden size={16} strokeWidth={1.75} />}
              aria-label={`Kirim undangan ke ${d.fullName}`}
            >
              {busy ? "Mengirim…" : "Kirim"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function DraftSkeleton() {
  return (
    <div aria-busy="true" aria-label="Menyiapkan draf" className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col gap-3 rounded-lg border border-line p-4"
        >
          <div className="h-4 w-40 rounded-sm bg-surface-2" />
          <div className="h-16 w-full rounded-sm bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
