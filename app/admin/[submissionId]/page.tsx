"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MODULES, MODULE_IDS, type Submission } from "@/lib/types";

export default function SubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? localStorage.getItem("adminToken") ?? "";

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/submissions", {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) { router.replace("/admin"); return; }
      const all: Submission[] = await res.json();
      const found = all.find((s) => s.id === submissionId);
      if (found) { setSubmission(found); setNotes(found.adminNotes ?? ""); }
      setLoading(false);
    }
    load();
  }, [submissionId, token, router]);

  async function saveNotes() {
    setSaving(true);
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id: submissionId, adminNotes: notes }),
    });
    setSaving(false);
  }

  if (loading) return <main className="flex-1 flex items-center justify-center"><p className="text-stone-400 text-sm">Loading…</p></main>;
  if (!submission) return <main className="flex-1 flex items-center justify-center"><p className="text-stone-400 text-sm">Submission not found.</p></main>;

  const answeredModules = MODULE_IDS.filter((m) => submission.responses[m]);

  return (
    <main className="flex-1 px-4 py-10 max-w-3xl mx-auto w-full space-y-8">
      {/* Back */}
      <Link href={`/admin?token=${token}`} className="text-sm text-stone-500 hover:text-stone-700">
        ← All submissions
      </Link>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">{submission.participant.name}</h1>
            <p className="text-sm text-stone-500">{submission.participant.email}</p>
            <p className="text-xs text-stone-400 mt-1">
              Submitted {new Date(submission.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
              })}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            submission.status === "submitted" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
          }`}>
            {submission.status === "submitted" ? "Submitted" : "In progress"}
          </span>
        </div>
        <p className="text-sm text-stone-500 mt-3">
          {answeredModules.length} of {MODULE_IDS.length} modules answered
        </p>
      </div>

      {/* Module responses */}
      <div className="space-y-6">
        {MODULES.map((m, i) => {
          const response = submission.responses[m.id];
          return (
            <div key={m.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  response ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400"
                }`}>
                  {response ? "✓" : i + 1}
                </div>
                <h2 className="text-sm font-semibold text-stone-800">{m.title}</h2>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 leading-relaxed border border-stone-100">
                {m.question}
              </div>

              {response?.text ? (
                <div className="rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {response.text}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-stone-200 py-8 text-center text-sm text-stone-400">
                  Not answered
                </div>
              )}

              {response && (
                <p className="text-xs text-stone-400">
                  Written{" "}
                  {new Date(response.uploadedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">Research notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add analysis notes, tags, or observations about this participant…"
          rows={5}
          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="text-sm bg-stone-900 text-white rounded-lg px-4 py-2 disabled:opacity-40 hover:bg-stone-800 transition-colors"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
      </div>
    </main>
  );
}
