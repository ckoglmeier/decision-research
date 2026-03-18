"use client";

import { MODULES, MODULE_IDS, type ModuleId } from "@/lib/types";

interface Props {
  currentModuleId: ModuleId | "review" | "complete";
  completedModules: ModuleId[];
}

export default function ProgressBar({ currentModuleId, completedModules }: Props) {
  const totalSteps = MODULE_IDS.length + 1; // modules + review
  const currentIndex =
    currentModuleId === "review" || currentModuleId === "complete"
      ? MODULE_IDS.length
      : MODULE_IDS.indexOf(currentModuleId as ModuleId);
  const percent = Math.round(((currentIndex) / totalSteps) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-stone-500">
          {currentModuleId === "review" || currentModuleId === "complete"
            ? "Review"
            : `Module ${currentIndex + 1} of ${MODULE_IDS.length}`}
        </span>
        <span className="text-xs text-stone-400">{completedModules.length} of {MODULE_IDS.length} recorded</span>
      </div>
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-stone-900 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex mt-2 gap-1">
        {MODULES.map((m, i) => {
          const isCompleted = completedModules.includes(m.id);
          const isCurrent = m.id === currentModuleId;
          return (
            <div
              key={m.id}
              className={`flex-1 h-1 rounded-full transition-colors ${
                isCompleted ? "bg-stone-900" : isCurrent ? "bg-stone-400" : "bg-stone-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
