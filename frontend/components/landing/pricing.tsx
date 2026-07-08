const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started with tasks, habits, and focus.",
  },
  {
    name: "Student",
    price: "$4",
    description: "For students managing assignments, routines, and deadlines.",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$8",
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
          Simple plans
        </p>

        <h2 className="text-app mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Built for students and professionals.
        </h2>
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
            <p className="mt-4 text-5xl font-black">{plan.price}</p>

            <p
              className={
                plan.highlighted
                  ? "mt-4 text-sm leading-6 text-indigo-50"
                  : "mt-4 text-sm leading-6 text-muted"
              }
            >
              {plan.description}
            </p>

            <a
              href="#"
              className={
                plan.highlighted
                  ? "mt-7 inline-flex w-full justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
                  : "mt-7 inline-flex w-full justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              }
            >
              Choose Plan
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}