"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !consent) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), consentGiven: consent }),
      });
      if (!res.ok) throw new Error("Failed to start");
      const { id } = await res.json();
      localStorage.setItem("submissionId", id);
      localStorage.setItem("participantName", name.trim());
      router.push("/study/m1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-3">
            Research Study
          </p>
          <h1 className="text-3xl font-semibold text-stone-900 mb-4 leading-tight">
            How do people make great decisions?
          </h1>
          <p className="text-stone-600 leading-relaxed">
            We&rsquo;re exploring the real process behind good decision-making — not the theory,
            the lived experience. You&rsquo;ll answer five short written prompts at your own pace.
            It takes about 15–20 minutes total.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
          <p className="text-sm font-medium text-stone-700 mb-3">What to expect</p>
          <ul className="space-y-2 text-sm text-stone-600">
            {[
              "Five written prompts across different aspects of decision-making",
              "Questions span any area of life — work, family, health, relationships",
              "Write as much or as little as feels right for each prompt",
              "No right answers — we want your real experience",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-stone-400 shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name is fine"
              required
              className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          <div className="bg-stone-100 rounded-lg p-4">
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 shrink-0 w-4 h-4 accent-stone-900"
              />
              <span className="text-sm text-stone-600">
                I understand my written responses will be stored securely and used only for this
                research study. I can request deletion of my responses at any time by emailing
                the researcher.
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || !consent || loading}
            className="w-full bg-stone-900 text-white rounded-lg py-3 px-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
          >
            {loading ? "Starting…" : "Begin the study →"}
          </button>
        </form>
      </div>
    </main>
  );
}
