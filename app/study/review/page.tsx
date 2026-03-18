"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MODULES, MODULE_IDS, type ModuleId } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<ModuleId[]>([]);
  const [moduleUrls, setModuleUrls] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("submissionId");
    if (!id) { router.replace("/"); return; }
    const completed = JSON.parse(localStorage.getItem("completedModules") ?? "[]") as ModuleId[];
    const urls = JSON.parse(localStorage.getItem("moduleUrls") ?? "{}") as Record<string, string>;
    setCompletedModules(completed);
    setModuleUrls(urls);
  }, [router]);

  async function handleSubmit() {
    const id = localStorage.getItem("submissionId");
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Submit failed");
      // Clear local state
      localStorage.removeItem("completedModules");
      localStorage.removeItem("moduleUrls");
      localStorage.removeItem("submissionId");
      localStorage.removeItem("participantName");
      router.push("/study/complete");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const answeredCount = completedModules.length;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2">
            Review
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            You&rsquo;re almost done
          </h1>
          <p className="text-stone-500 text-sm">
            You recorded {answeredCount} of {MODULE_IDS.length} modules.
            {answeredCount < MODULE_IDS.length && " You can go back and record any you skipped, or submit now."}
          </p>
        </div>

        {/* Module list */}
        <div className="space-y-3">
          {MODULES.map((m, i) => {
            const done = completedModules.includes(m.id);
            const url = moduleUrls[m.id];
            return (
              <div
                key={m.id}
                className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
                    done ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{m.title}</p>
                    {!done && <p className="text-xs text-stone-400">Not recorded</p>}
                  </div>
                </div>
                <Link
                  href={`/study/${m.id}`}
                  className="text-xs text-stone-500 hover:text-stone-700 shrink-0 ml-4"
                >
                  {done ? "Edit" : "Record"}
                </Link>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="w-full bg-stone-900 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit responses"}
          </button>
          {answeredCount === 0 && (
            <p className="text-xs text-center text-stone-400">
              Record at least one module to submit.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
