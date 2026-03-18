export type ModuleId = "m1" | "m2" | "m3" | "m4" | "m5";

export interface ModuleResponse {
  blobUrl?: string;
  fileName?: string;
  text?: string;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  createdAt: string;
  updatedAt: string;
  participant: {
    name: string;
    email: string;
    consentGiven: boolean;
  };
  responses: Partial<Record<ModuleId, ModuleResponse>>;
  status: "in_progress" | "submitted";
  adminNotes?: string;
}

export interface Module {
  id: ModuleId;
  title: string;
  intro: string;
  question: string;
  prompts: string[];
}

export const MODULES: Module[] = [
  {
    id: "m1",
    title: "Your Decision-Making World",
    intro: "We'll start with a warm-up to understand the kinds of decisions you navigate.",
    question:
      "Think about the decisions you make regularly — across all areas of your life: work, family, health, money, relationships, creative projects. What kinds of decisions do you find most significant, and roughly how often are you making ones that feel genuinely consequential? What makes a decision feel 'significant' to you personally?",
    prompts: [
      "Feel free to range across any domain — work, personal, creative, financial.",
      "There are no right answers. We're interested in how you actually experience decision-making.",
    ],
  },
  {
    id: "m2",
    title: "A Decision That Went Well",
    intro: "Tell us about a specific decision you feel genuinely good about.",
    question:
      "Bring to mind a specific decision — from any area of your life — that you feel genuinely good about. Not necessarily one with a great outcome, but one where you feel the process was right, or you made the right call given what you knew at the time. Tell us what the situation was, how you made the call, and what made it feel like a quality decision.",
    prompts: [
      "When did you know you were ready to decide? What was the signal?",
      "What information did you have — and what did you decide without?",
      "If you'd had half the time, would you have landed in the same place?",
    ],
  },
  {
    id: "m3",
    title: "A Decision That Broke Down",
    intro: "Now the harder side — a decision where the process failed or went wrong.",
    question:
      "Think of a specific decision — again, any area of life — where something went wrong in the process. Not necessarily a bad outcome, but a decision where the process failed you, got stuck, or you later wished you'd done differently. What happened, and what do you think went wrong?",
    prompts: [
      "Was there a moment where someone (or you) could have said 'we're not ready' — and didn't?",
      "Was there information that existed but didn't make it into the decision?",
      "What would you tell someone facing the same situation?",
    ],
  },
  {
    id: "m4",
    title: "The Cost of Deciding",
    intro: "Let's explore what makes decisions feel expensive.",
    question:
      "Think about what makes decisions feel expensive — in terms of time, energy, emotional weight, or coordinating with others. What part of the process costs you the most? And is there anything you do (or wish you could do) to make decisions faster or lighter without sacrificing quality?",
    prompts: [
      "Is there a type of decision that takes way longer than it should?",
      "Have you ever felt that slowing a decision down made it worse, not better?",
      "What would 'good help' in a decision actually look like for you?",
    ],
  },
  {
    id: "m5",
    title: "Gut, Process & What You'd Protect",
    intro: "We'll close with your personal theory of great decision-making.",
    question:
      "When you think about what makes a decision feel 'great' — not the outcome, but the decision itself — what does that mean to you? And is there anything in how you currently make decisions that you would protect from optimization — something that needs to stay slow, human, or imperfect?",
    prompts: [
      "Do you trust your gut more in some areas than others? What's different?",
      "What role do other people play in your best decisions?",
      "What's your actual theory of what makes decision-making work?",
    ],
  },
];

export const MODULE_IDS: ModuleId[] = ["m1", "m2", "m3", "m4", "m5"];
