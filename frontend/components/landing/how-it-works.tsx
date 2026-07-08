const steps = [
  "Capture your tasks, habits, and focus goals.",
  "FlowMind organizes your day into a calmer plan.",
  "Flow Assistant gives useful suggestions when you need direction.",
];

export function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
      <div className="grid gap-8 rounded-4xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 md:grid-cols-3 md:p-8">
        {steps.map((step, index) => (
          <div
            key={step}
            className="reveal-scale rounded-3xl bg-white/10 p-6 ring-1 ring-white/10 hover-lift"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300 font-black text-slate-950">
              {index + 1}
            </span>

            <p className="mt-5 text-lg font-bold leading-7">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}