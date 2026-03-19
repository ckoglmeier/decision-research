"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MODULES, MODULE_IDS, type ModuleId } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const router = useRouter();

  const module = MODULES.find((m) => m.id === moduleId);
  const moduleIndex = MODULE_IDS.indexOf(moduleId as ModuleId);

  const [submissionId, setSubmissionId] = useState("");
  const [completedModules, setCompletedModules] = useState<ModuleId[]>([]);
  const [textResponse, setTextResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("submissionId");
    if (!id) { router.replace("/"); return; }
    setSubmissionId(id);

    const completed = JSON.parse(localStorage.getItem("completedModules") ?? "[]") as ModuleId[];
    setCompletedModules(completed);

    const texts = JSON.parse(localStorage.getItem("moduleTexts") ?? "{}") as Record<string, string>;
    if (texts[moduleId]) setTextResponse(texts[moduleId]);
  }, [moduleId, router]);

  if (!module) {
    return <main className="flex-1 flex items-center justify-center"><p className="text-stone-500">Module not found.</p></main>;
  }

  const isLastModule = moduleIndex === MODULE_IDS.length - 1;
  const nextModuleId = isLastModule ? null : MODULE_IDS[moduleIndex + 1];
  const isCompleted = completedModules.includes(moduleId as ModuleId);

  function markCompleted() {
    const updated = [...completedModules.filter((m) => m !== moduleId), moduleId as ModuleId];
    localStorage.setItem("completedModules", JSON.stringify(updated));
    setCompletedModules(updated);
  }

  async function handleNext() {
    const hasNewText = textResponse.trim().length > 0;

    if (!hasNewText && !isCompleted) {
      setSaveError("Please write a response before continuing.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      if (hasNewText) {
        const res = await fetch("/api/submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: submissionId, moduleId, text: textResponse.trim() }),
        });
        if (!res.ok) throw new Error("Save failed");
        const texts = JSON.parse(localStorage.getItem("moduleTexts") ?? "{}");
        texts[moduleId] = textResponse.trim();
        localStorage.setItem("moduleTexts", JSON.stringify(texts));
        markCompleted();
      }
    } catch {
      setSaveError("Something went wrong. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    if (isLastModule) router.push("/study/review");
    else router.push(`/study/${nextModuleId}`);
  }

  function handleSkip() {
    if (isLastModule) router.push("/study/review");
    else router.push(`/study/${nextModuleId}`);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        <ProgressBar currentModuleId={moduleId as ModuleId} completedModules={completedModules} />

        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2">
            Module {moduleIndex + 1} — {module.title}
          </p>
          <p className="text-sm text-stone-500 italic mb-4">{module.intro}</p>
          <p className="text-base text-stone-900 leading-relaxed font-medium">{module.question}</p>
        </div>

        <div className="bg-stone-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Prompts to consider</p>
          <ul className="space-y-1.5">
            {module.prompts.map((p) => (
              <li key={p} className="text-sm text-stone-600 flex gap-2">
                <span className="text-stone-400 shrink-0">·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <textarea
            value={textResponse}
            onChange={(e) => { setTextResponse(e.target.value); setSaveError(""); }}
            placeholder="Write your response here…"
            rows={10}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
          />
          <p className="text-xs text-stone-400 text-right">{textResponse.length} characters</p>
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="space-y-2 pb-8">
          <button
            onClick={handleNext}
            disabled={saving}
            className="w-full bg-stone-900 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {saving
              ? "Saving…"
              : isLastModule ? "Continue to review →" : `Continue to module ${moduleIndex + 2} →`}
          </button>
          {!isCompleted && (
            <button onClick={handleSkip} className="w-full text-sm text-stone-400 hover:text-stone-600 py-1">
              Skip this module
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
