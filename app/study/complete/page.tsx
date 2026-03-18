import Link from "next/link";

export default function CompletePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-3">Thank you</h1>
          <p className="text-stone-600 leading-relaxed">
            Your responses have been submitted. Your perspective will help shape our
            understanding of how people make great decisions.
          </p>
        </div>

        <div className="bg-stone-100 rounded-xl p-5 text-left space-y-3">
          <p className="text-sm font-medium text-stone-700">What happens next</p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex gap-2">
              <span className="text-stone-400 shrink-0">—</span>
              We&rsquo;ll review your responses as part of the broader study
            </li>
            <li className="flex gap-2">
              <span className="text-stone-400 shrink-0">—</span>
              A summary of findings will be shared with all participants when the study wraps up
            </li>
            <li className="flex gap-2">
              <span className="text-stone-400 shrink-0">—</span>
              To request deletion of your responses, email the researcher
            </li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          Return to home
        </Link>
      </div>
    </main>
  );
}
