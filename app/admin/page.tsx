"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MODULE_IDS, type Submission } from "@/lib/types";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchSubmissions(t: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { "x-admin-token": t },
      });
      if (res.status === 401) { setError("Invalid token."); setLoading(false); return; }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSubmissions(data);
      setAuthed(true);
      localStorage.setItem("adminToken", t);
    } catch {
      setError("Failed to load submissions.");
    }
    setLoading(false);
  }

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) { setToken(saved); fetchSubmissions(saved); }
  }, []);

  if (!authed) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold text-stone-900">Admin access</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            onKeyDown={(e) => e.key === "Enter" && fetchSubmissions(token)}
            className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={() => fetchSubmissions(token)}
            disabled={!token || loading}
            className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {loading ? "Loading…" : "Enter"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Submissions</h1>
          <p className="text-sm text-stone-500">{submissions.length} total</p>
        </div>
        <button
          onClick={() => fetchSubmissions(token)}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Refresh
        </button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-stone-400 text-sm">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const answered = MODULE_IDS.filter((m) => s.responses[m]).length;
            return (
              <Link
                key={s.id}
                href={`/admin/${s.id}?token=${token}`}
                className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{s.participant.name}</p>
                  <p className="text-xs text-stone-500">{s.participant.email}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.status === "submitted"
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-100 text-stone-500"
                  }`}>
                    {s.status === "submitted" ? "Submitted" : "In progress"}
                  </span>
                  <p className="text-xs text-stone-400 mt-1">{answered}/{MODULE_IDS.length} modules</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
