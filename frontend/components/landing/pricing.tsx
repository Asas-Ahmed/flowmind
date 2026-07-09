const plans = [
  {
    name: "Free",
    oldPrice: "$0",
    description: "For getting started with tasks, habits, and focus.",
  },
  {
    name: "Student",
    oldPrice: "$4",
    description: "For students managing assignments, routines, and deadlines.",
    highlighted: true,
  },
  {
    name: "Pro",
    oldPrice: "$8",
    description: "For professionals who want deeper insights and planning.",
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-cyan-300">
          Initial release offer
        </p>

        <h2 className="text-app mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Full access is free for the first 2 months.
        </h2>

        <p className="mt-5 text-sm leading-6 text-muted">
          All premium features are unlocked during the launch period.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {plans.map((plan, index) => (
          <article
            key={plan.name}
            className={
              plan.highlighted
                ? "reveal-scale aurora-gradient rounded-3xl p-7 text-white shadow-xl shadow-indigo-500/20 hover-lift"
                : "reveal-scale glass-card rounded-3xl p-7 text-app shadow-xl hover-lift"
            }
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <h3 className="text-2xl font-black">{plan.name}</h3>

            <div className="mt-4 flex items-end gap-3">
              <p
                className={
                  plan.highlighted
                    ? "text-4xl font-black text-white/60 line-through decoration-2"
                    : "text-4xl font-black text-muted line-through decoration-2"
                }
              >
                {plan.oldPrice}
              </p>

              <p className="text-2xl font-black">Free</p>
            </div>

            <p
              className={
                plan.highlighted
                  ? "mt-4 text-sm leading-6 text-indigo-50"
                  : "mt-4 text-sm leading-6 text-muted"
              }
            >
              {plan.description}
            </p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className={
                plan.highlighted
                  ? "mt-7 inline-flex w-full cursor-not-allowed justify-center rounded-full bg-white/80 px-5 py-3 text-sm font-bold text-slate-950 opacity-80"
                  : "mt-7 inline-flex w-full cursor-not-allowed justify-center rounded-full bg-slate-950/80 px-5 py-3 text-sm font-bold text-white opacity-80 dark:bg-white/80 dark:text-slate-950"
              }
            >
              Full Access for 2 Months
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}