import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const expenseFields = [
  ["rent", "Rent"],
  ["groceries", "Groceries"],
  ["transport", "Transport"],
  ["phone", "Phone"],
  ["tuition", "Uni / Tuition"],
  ["subscriptions", "Subscriptions"],
  ["hygiene", "Hygiene / Personal Care"],
  ["periodCare", "Period Care / Health"],
  ["pets", "Pets"],
  ["familySupport", "Kids / Family Support"],
  ["fun", "Eating Out / Fun"],
  ["custom", "Custom Expenses"],
];

const lessons = [
  [
    "Budgeting",
    "Track every dollar weekly, then cap flexible spending categories.",
  ],
  [
    "Emergency fund",
    "Aim for 8-12 weeks of essentials before taking investment risk.",
  ],
  [
    "Debt",
    "Pay high-interest debt aggressively while staying current on all bills.",
  ],
  [
    "Saving accounts",
    "Use separate buckets: bills, emergency, short-term goals.",
  ],
  [
    "Compound growth",
    "Small regular contributions can grow meaningfully over long periods.",
  ],
  [
    "ETFs",
    "Broad ETFs spread risk; no guaranteed returns and values can fall.",
  ],
  [
    "Superannuation basics",
    "Learn employer contributions, fund fees, and preservation rules.",
  ],
  [
    "Tax / TFN basics",
    "Understand TFN, tax withheld, and annual return responsibilities.",
  ],
  [
    "Scams and risky investing",
    "Avoid pressure tactics, unrealistic returns, and unverified platforms.",
  ],
];

const defaultState = {
  profile: {
    name: "",
    city: "",
    status: "international student",
    jobs: 1,
    weeklyIncome: 0,
    bankBalance: 0,
    currentSavings: 0,
    currentDebt: 0,
    confidence: "beginner",
    risk: "low",
  },
  expenses: Object.fromEntries(expenseFields.map(([k]) => [k, 0])),
  goals: {
    shortName: "",
    shortAmount: 0,
    shortDeadline: "",
    longName: "",
    longAmount: 0,
    longDeadline: "",
  },
  affordability: { item: "", cost: 0, urgency: "want", category: "lifestyle" },
  weeklyCheckin: { earned: 0, spent: 0, saved: "yes", mistake: "", proud: "" },
};

const aud = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [state, setState] = useState(
    () =>
      JSON.parse(localStorage.getItem("mm-state") || "null") || defaultState,
  );
  const [checkins, setCheckins] = useState(() =>
    JSON.parse(localStorage.getItem("mm-weekly-checkins") || "[]"),
  );
  const [planVisible, setPlanVisible] = useState(false);

  useEffect(
    () => localStorage.setItem("mm-state", JSON.stringify(state)),
    [state],
  );
  useEffect(
    () => localStorage.setItem("mm-weekly-checkins", JSON.stringify(checkins)),
    [checkins],
  );

  const totals = useMemo(() => {
    const weeklyExpenses = expenseFields.reduce(
      (sum, [k]) => sum + Number(state.expenses[k] || 0),
      0,
    );
    const income = Number(state.profile.weeklyIncome || 0);
    const leftover = income - weeklyExpenses;
    const savingsRate = income > 0 ? Math.max(0, (leftover / income) * 100) : 0;
    const emergencyTarget = weeklyExpenses * 8;
    const emergencyStatus =
      Number(state.profile.currentSavings || 0) >= emergencyTarget
        ? "On track"
        : "Needs attention";
    return {
      weeklyExpenses,
      income,
      leftover,
      savingsRate,
      emergencyTarget,
      emergencyStatus,
    };
  }, [state]);

  const goalMath = useMemo(() => {
    const calc = (amount, deadline) => {
      const days = daysUntil(deadline);
      if (!amount || !days)
        return { requiredWeekly: 0, realistic: null, gap: 0 };
      const weeks = Math.max(1, Math.ceil(days / 7));
      const requiredWeekly = Number(amount) / weeks;
      const gap = requiredWeekly - totals.leftover;
      return {
        requiredWeekly,
        realistic: totals.leftover >= requiredWeekly,
        gap,
      };
    };
    return {
      short: calc(state.goals.shortAmount, state.goals.shortDeadline),
      long: calc(state.goals.longAmount, state.goals.longDeadline),
    };
  }, [state.goals, totals.leftover]);

  const plan = useMemo(() => {
    const redFlags = [];
    if (totals.leftover < 0)
      redFlags.push(
        "Expenses are above weekly income. Focus on stabilizing cashflow before investing.",
      );
    if (state.profile.currentDebt > 0)
      redFlags.push("Debt exists: prioritize high-interest debt repayments.");
    if (state.profile.currentSavings < totals.emergencyTarget)
      redFlags.push("Emergency fund below target (8 weeks of essentials).");

    const investReady =
      totals.leftover > 0 &&
      state.profile.currentSavings >= totals.emergencyTarget &&
      state.profile.currentDebt <= 0;
    const goalWeekly =
      goalMath.short.requiredWeekly + goalMath.long.requiredWeekly;
    const suggestedBills = totals.weeklyExpenses;
    const suggestedEmergency =
      totals.leftover > 0
        ? Math.min(
            totals.leftover * 0.4,
            Math.max(0, totals.emergencyTarget - state.profile.currentSavings),
          )
        : 0;
    const suggestedGoals =
      totals.leftover > 0 ? Math.min(totals.leftover * 0.4, goalWeekly) : 0;
    const suggestedFree = Math.max(
      0,
      totals.leftover - suggestedEmergency - suggestedGoals,
    );

    return {
      investReady,
      suggestedBills,
      suggestedEmergency,
      suggestedGoals,
      suggestedFree,
      redFlags,
      investNote: investReady
        ? "Beginner education path: diversified ETFs, long-term mindset, understand volatility and fees. No guaranteed returns."
        : "Not ready to invest yet. Build emergency buffer, reduce instability, and learn basics first.",
    };
  }, [totals, state.profile, goalMath]);

  const affordability = useMemo(() => {
    const cost = Number(state.affordability.cost || 0);
    if (!cost) return null;
    const postPurchase = totals.leftover - cost;
    const weeklyGoalNeed =
      goalMath.short.requiredWeekly + goalMath.long.requiredWeekly;
    const missesGoals = postPurchase < weeklyGoalNeed;
    const lowBuffer = state.profile.currentSavings < totals.emergencyTarget;

    if (postPurchase < 0) {
      return {
        verdict: "No",
        reason: "This purchase would push your week negative after bills.",
        alt: "Try a lower-cost option, borrow, or delay by one pay cycle.",
      };
    }
    if (state.affordability.urgency === "need" && !missesGoals) {
      return {
        verdict: "Yes",
        reason: "Needs can fit while staying on plan.",
        alt: "Still compare prices and buy intentionally.",
      };
    }
    if (lowBuffer || missesGoals || state.affordability.urgency === "want") {
      return {
        verdict: "Wait",
        reason:
          "You can pay for it, but it may reduce emergency or goal progress this week.",
        alt: "Use a 7-day cooling-off period or set a lower spend cap.",
      };
    }
    return {
      verdict: "Yes",
      reason: "This fits your current weekly capacity.",
      alt: "Check for student discounts before buying.",
    };
  }, [state.affordability, totals, goalMath, state.profile.currentSavings]);

  const setProfile = (key, value) =>
    setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const setExpense = (key, value) =>
    setState((s) => ({
      ...s,
      expenses: { ...s.expenses, [key]: Number(value) || 0 },
    }));
  const setGoals = (key, value) =>
    setState((s) => ({ ...s, goals: { ...s.goals, [key]: value } }));
  const setAfford = (key, value) =>
    setState((s) => ({
      ...s,
      affordability: { ...s.affordability, [key]: value },
    }));
  const setWeekly = (key, value) =>
    setState((s) => ({
      ...s,
      weeklyCheckin: { ...s.weeklyCheckin, [key]: value },
    }));

  const saveWeeklyCheckin = () => {
    setCheckins((c) =>
      [{ ...state.weeklyCheckin, at: new Date().toISOString() }, ...c].slice(
        0,
        12,
      ),
    );
  };

  const chartData = [
    { name: "Income", amount: totals.income },
    { name: "Expenses", amount: totals.weeklyExpenses },
    { name: "Leftover", amount: totals.leftover },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h1 className="text-3xl font-bold">Money Mentor</h1>
          <p className="text-slate-300 mt-2">
            I got paid — what should I do with my money this week?
          </p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {["dashboard", "profile", "plan", "afford", "learn", "check-in"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-full border ${activeTab === tab ? "bg-cyan-600 border-cyan-500" : "bg-slate-900 border-slate-700"}`}
              >
                {tab}
              </button>
            ),
          )}
        </nav>

        {activeTab === "dashboard" && (
          <section className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Weekly Income", totals.income],
                ["Weekly Expenses", totals.weeklyExpenses],
                ["Leftover", totals.leftover],
                ["Savings Rate", `${totals.savingsRate.toFixed(1)}%`],
                ["Emergency Fund Status", totals.emergencyStatus],
                [
                  "Short Goal Progress",
                  `${aud(state.profile.currentSavings)} / ${aud(state.goals.shortAmount)}`,
                ],
                [
                  "Long Goal Progress",
                  `${aud(state.profile.currentSavings)} / ${aud(state.goals.longAmount)}`,
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                  <p className="text-slate-400 text-sm">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-72">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#22d3ee" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={expenseFields
                        .map(([k, l]) => ({
                          name: l,
                          value: Number(state.expenses[k] || 0),
                        }))
                        .filter((x) => x.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                      fill="#818cf8"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold">
              Financial Profile & Expenses
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["name", "Name"],
                ["city", "City in Australia"],
                ["jobs", "Number of jobs"],
                ["weeklyIncome", "Weekly income"],
                ["bankBalance", "Current bank balance"],
                ["currentSavings", "Current savings"],
                ["currentDebt", "Current debt"],
              ].map(([k, label]) => (
                <input
                  key={k}
                  className="bg-slate-800 rounded p-2"
                  placeholder={label}
                  value={state.profile[k]}
                  onChange={(e) =>
                    setProfile(
                      k,
                      [
                        "jobs",
                        "weeklyIncome",
                        "bankBalance",
                        "currentSavings",
                        "currentDebt",
                      ].includes(k)
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              ))}
              <select
                value={state.profile.status}
                onChange={(e) => setProfile("status", e.target.value)}
                className="bg-slate-800 rounded p-2"
              >
                <option>international student</option>
                <option>resident</option>
                <option>citizen</option>
                <option>working holiday</option>
                <option>other</option>
              </select>
              <select
                value={state.profile.confidence}
                onChange={(e) => setProfile("confidence", e.target.value)}
                className="bg-slate-800 rounded p-2"
              >
                <option>anxious</option>
                <option>beginner</option>
                <option>improving</option>
                <option>confident</option>
              </select>
              <select
                value={state.profile.risk}
                onChange={(e) => setProfile("risk", e.target.value)}
                className="bg-slate-800 rounded p-2"
              >
                <option>low</option>
                <option>medium</option>
                <option>high</option>
              </select>
            </div>
            <h3 className="font-semibold">Weekly expense breakdown</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {expenseFields.map(([k, l]) => (
                <input
                  key={k}
                  type="number"
                  className="bg-slate-800 rounded p-2"
                  placeholder={l}
                  value={state.expenses[k]}
                  onChange={(e) => setExpense(k, e.target.value)}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "plan" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold">Goals & Money Plan</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                placeholder="Short-term goal"
                className="bg-slate-800 rounded p-2"
                value={state.goals.shortName}
                onChange={(e) => setGoals("shortName", e.target.value)}
              />
              <input
                type="number"
                placeholder="Short amount"
                className="bg-slate-800 rounded p-2"
                value={state.goals.shortAmount}
                onChange={(e) =>
                  setGoals("shortAmount", Number(e.target.value))
                }
              />
              <input
                type="date"
                className="bg-slate-800 rounded p-2"
                value={state.goals.shortDeadline}
                onChange={(e) => setGoals("shortDeadline", e.target.value)}
              />
              <input
                placeholder="Long-term goal"
                className="bg-slate-800 rounded p-2"
                value={state.goals.longName}
                onChange={(e) => setGoals("longName", e.target.value)}
              />
              <input
                type="number"
                placeholder="Long amount"
                className="bg-slate-800 rounded p-2"
                value={state.goals.longAmount}
                onChange={(e) => setGoals("longAmount", Number(e.target.value))}
              />
              <input
                type="date"
                className="bg-slate-800 rounded p-2"
                value={state.goals.longDeadline}
                onChange={(e) => setGoals("longDeadline", e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800 rounded p-3">
                Short goal weekly target:{" "}
                <b>{aud(goalMath.short.requiredWeekly)}</b>
                <br />
                Realistic now:{" "}
                <b>
                  {goalMath.short.realistic == null
                    ? "n/a"
                    : goalMath.short.realistic
                      ? "Yes"
                      : "No"}
                </b>
                <br />
                Gap vs leftover: <b>{aud(goalMath.short.gap)}</b>
              </div>
              <div className="bg-slate-800 rounded p-3">
                Long goal weekly target:{" "}
                <b>{aud(goalMath.long.requiredWeekly)}</b>
                <br />
                Realistic now:{" "}
                <b>
                  {goalMath.long.realistic == null
                    ? "n/a"
                    : goalMath.long.realistic
                      ? "Yes"
                      : "No"}
                </b>
                <br />
                Gap vs leftover: <b>{aud(goalMath.long.gap)}</b>
              </div>
            </div>
            <button
              className="bg-cyan-600 px-4 py-2 rounded"
              onClick={() => setPlanVisible(true)}
            >
              What should I do with my money?
            </button>
            {planVisible && (
              <div className="space-y-2 text-sm">
                <p>
                  <b>Bills first:</b> Reserve {aud(plan.suggestedBills)} for
                  weekly essentials.
                </p>
                <p>
                  <b>Emergency fund:</b> Add {aud(plan.suggestedEmergency)} this
                  week until buffer reaches {aud(totals.emergencyTarget)}.
                </p>
                <p>
                  <b>Goal contribution:</b> Put {aud(plan.suggestedGoals)}{" "}
                  toward short/long goals.
                </p>
                <p>
                  <b>Spending allowance:</b> Keep {aud(plan.suggestedFree)} for
                  guilt-free spending.
                </p>
                <p>
                  <b>Investing education:</b> {plan.investNote}
                </p>
                <p>
                  <b>Warning / red flags:</b>{" "}
                  {plan.redFlags.length
                    ? plan.redFlags.join(" | ")
                    : "No major warning flags this week."}
                </p>
                <p>
                  <b>This week action plan:</b> 1) Auto-transfer emergency/goal
                  amount on payday. 2) Review one expense category to trim. 3)
                  Learn one investing concept (ETF/diversification/risk).
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "afford" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-semibold">Can I Afford This?</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className="bg-slate-800 rounded p-2"
                placeholder="Item name"
                value={state.affordability.item}
                onChange={(e) => setAfford("item", e.target.value)}
              />
              <input
                type="number"
                className="bg-slate-800 rounded p-2"
                placeholder="Item cost"
                value={state.affordability.cost}
                onChange={(e) => setAfford("cost", Number(e.target.value))}
              />
              <select
                className="bg-slate-800 rounded p-2"
                value={state.affordability.urgency}
                onChange={(e) => setAfford("urgency", e.target.value)}
              >
                <option>need</option>
                <option>important</option>
                <option>want</option>
              </select>
              <input
                className="bg-slate-800 rounded p-2"
                placeholder="Category"
                value={state.affordability.category}
                onChange={(e) => setAfford("category", e.target.value)}
              />
            </div>
            {affordability && (
              <div className="bg-slate-800 rounded p-3 text-sm">
                <p>
                  <b>{affordability.verdict}</b> — {affordability.reason}
                </p>
                <p>
                  Impact on weekly goal pace: leftover after buy would be{" "}
                  {aud(totals.leftover - Number(state.affordability.cost || 0))}
                  .
                </p>
                <p>Suggestion: {affordability.alt}</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "learn" && (
          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lessons.map(([title, body]) => (
              <div
                key={title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-slate-300">{body}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === "check-in" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-semibold">Weekly Check-in</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="number"
                className="bg-slate-800 rounded p-2"
                placeholder="How much did I earn this week?"
                value={state.weeklyCheckin.earned}
                onChange={(e) => setWeekly("earned", Number(e.target.value))}
              />
              <input
                type="number"
                className="bg-slate-800 rounded p-2"
                placeholder="How much did I spend?"
                value={state.weeklyCheckin.spent}
                onChange={(e) => setWeekly("spent", Number(e.target.value))}
              />
              <select
                className="bg-slate-800 rounded p-2"
                value={state.weeklyCheckin.saved}
                onChange={(e) => setWeekly("saved", e.target.value)}
              >
                <option>yes</option>
                <option>no</option>
              </select>
              <input
                className="bg-slate-800 rounded p-2"
                placeholder="What mistake did I make?"
                value={state.weeklyCheckin.mistake}
                onChange={(e) => setWeekly("mistake", e.target.value)}
              />
              <input
                className="bg-slate-800 rounded p-2 md:col-span-2"
                placeholder="What decision am I proud of?"
                value={state.weeklyCheckin.proud}
                onChange={(e) => setWeekly("proud", e.target.value)}
              />
            </div>
            <button
              className="bg-cyan-600 px-4 py-2 rounded"
              onClick={saveWeeklyCheckin}
            >
              Save weekly check-in
            </button>
            <div className="space-y-2 text-sm">
              {checkins.map((c, i) => (
                <div key={i} className="bg-slate-800 rounded p-3">
                  {new Date(c.at).toLocaleDateString()} — Earned {aud(c.earned)}
                  , Spent {aud(c.spent)}, Saved: {c.saved}. Proud:{" "}
                  {c.proud || "-"}.
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
          This app provides educational guidance only and is not professional
          financial advice. For personal financial decisions, consider speaking
          with a qualified financial adviser.
        </footer>
      </div>
    </div>
  );
}

export default App;
