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
  Cell,
} from "recharts";

const expenseFields = [
  ["rent", "Rent", "Usually fixed weekly housing cost."],
  ["groceries", "Groceries", "Food + essentials."],
  ["transport", "Transport", "Public transport/fuel/rideshare."],
  ["phone", "Phone", "Mobile + data plan."],
  ["tuition", "Tuition / uni fees", "Weekly set-aside for studies."],
  ["subscriptions", "Subscriptions", "Streaming/apps/gym."],
  ["hygiene", "Hygiene / personal care", "Toiletries and care."],
  ["periodCare", "Period care / health", "Health and period costs."],
  ["pets", "Pets", "Food and vet basics."],
  ["familySupport", "Kids / family support", "Dependents/support home."],
  ["fun", "Eating out / fun", "Optional social spending."],
  ["custom", "Custom expenses", "Other recurring spending."],
];
const colors = [
  "#7c3aed",
  "#22d3ee",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#eab308",
  "#64748b",
];
const learnCards = [
  ["Budgeting", "https://moneysmart.gov.au/budgeting"],
  [
    "Emergency fund",
    "https://moneysmart.gov.au/saving/save-for-an-emergency-fund",
  ],
  [
    "ETFs",
    "https://moneysmart.gov.au/managed-funds-and-etfs/exchange-traded-funds-etfs",
  ],
  [
    "TFN/tax",
    "https://www.ato.gov.au/individuals-and-families/tax-file-number",
  ],
  [
    "Super",
    "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families",
  ],
];
const toneMap = {
  gentle: "Warm, reassuring, kind.",
  strict: "Direct, firm, no excuses.",
  "big sister": "Caring but blunt and practical.",
  "wealth coach": "Focused on systems, discipline, and long-term wealth.",
};
const defaultState = {
  profile: {
    name: "",
    city: "",
    status: "international student",
    jobs: 1,
    weeklyIncome: "",
    bankBalance: "",
    currentSavings: "",
    currentDebt: "",
    confidence: "beginner",
    risk: "low",
  },
  expenses: Object.fromEntries(expenseFields.map(([k]) => [k, ""])),
  goals: {
    shortName: "",
    shortAmount: "",
    shortDeadline: "",
    longName: "",
    longAmount: "",
    longDeadline: "",
  },
  affordability: { item: "", cost: "", urgency: "want", category: "" },
  weeklyCheckin: {
    earned: "",
    spent: "",
    saved: "yes",
    mistake: "",
    proud: "",
  },
  mentorMode: "gentle",
};
const aud = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const num = (v) => Number(v || 0);
const Field = ({ label, helper, children }) => (
  <label className="block space-y-1">
    <div className="text-sm font-semibold">{label}</div>
    {children}
    <div className="text-xs text-slate-400">{helper}</div>
  </label>
);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [state, setState] = useState(
    () =>
      JSON.parse(localStorage.getItem("mm-state-v3") || "null") || defaultState,
  );
  const [checkins, setCheckins] = useState(() =>
    JSON.parse(localStorage.getItem("mm-checkins-v3") || "[]"),
  );
  const [showPlan, setShowPlan] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState(
    "What should I do with my money this week?",
  );
  const [mentorAdvice, setMentorAdvice] = useState("");
  const [mentorError, setMentorError] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);
  useEffect(
    () => localStorage.setItem("mm-state-v3", JSON.stringify(state)),
    [state],
  );
  useEffect(
    () => localStorage.setItem("mm-checkins-v3", JSON.stringify(checkins)),
    [checkins],
  );

  const totals = useMemo(() => {
    const income = num(state.profile.weeklyIncome);
    const expenses = expenseFields.reduce(
      (s, [k]) => s + num(state.expenses[k]),
      0,
    );
    const leftover = income - expenses;
    return {
      income,
      expenses,
      leftover,
      savingsRate: income > 0 ? (leftover / income) * 100 : 0,
    };
  }, [state]);
  const emergencyTarget = totals.expenses * 8;

  const goalWeekly = useMemo(() => {
    const calc = (amount, deadline) => {
      if (!deadline)
        return { value: 0, status: "Add a deadline to calculate." };
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime()))
        return { value: 0, status: "Add a deadline to calculate." };
      const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
      if (diff <= 0) return { value: 0, status: "Deadline has passed." };
      const remain = Math.max(
        0,
        num(amount) - num(state.profile.currentSavings),
      );
      const weeks = Math.max(1, Math.ceil(diff / 7));
      return { value: remain / weeks, status: "ok" };
    };
    const short = calc(state.goals.shortAmount, state.goals.shortDeadline);
    const long = calc(state.goals.longAmount, state.goals.longDeadline);
    return { short, long, total: short.value + long.value };
  }, [state.goals, state.profile.currentSavings]);

  const biggest = useMemo(
    () =>
      expenseFields
        .map(([k, l]) => ({ label: l, val: num(state.expenses[k]) }))
        .sort((a, b) => b.val - a.val)[0] || { label: "N/A", val: 0 },
    [state.expenses],
  );
  const action = useMemo(() => {
    const save = Math.max(0, Math.round(totals.leftover * 0.55));
    const investEdu = Math.max(0, Math.round(totals.leftover * 0.1));
    const goal = Math.max(
      0,
      Math.min(Math.round(totals.leftover * 0.2), Math.round(goalWeekly.total)),
    );
    const flex = Math.max(0, totals.leftover - save - goal - investEdu);
    const behavior =
      biggest.label === "Rent"
        ? "Rent is fixed, so look for savings in flexible categories like takeaway, fun, transport, subscriptions."
        : `Trim ${biggest.label.toLowerCase()} this week by 10-15%.`;
    return { save, investEdu, goal, flex, behavior };
  }, [totals.leftover, goalWeekly.total, biggest.label]);

  const weeklyFocus = useMemo(() => {
    const rule =
      biggest.label === "Eating out / fun"
        ? "Do not eat out more than 2 times this week."
        : biggest.label === "Rent"
          ? "Protect rent first; freeze non-essential spending for 48 hours."
          : `Cap ${biggest.label.toLowerCase()} spending this week.`;
    return {
      rule,
      saveTarget: action.save,
      spendLimit: Math.max(0, Math.round(totals.income - action.save)),
    };
  }, [biggest.label, action.save, totals.income]);

  const wealthPath = useMemo(() => {
    const savings = num(state.profile.currentSavings);
    if (savings <= 0)
      return {
        stage: "Stage 1: Survival",
        next: "Build your first $500 buffer by automating a small weekly transfer.",
      };
    if (savings < emergencyTarget)
      return {
        stage: "Stage 2: Stability",
        next: `Grow emergency fund to ${aud(emergencyTarget)}.`,
      };
    if (totals.leftover > 0 && savings < 2000)
      return {
        stage: "Stage 3: Control",
        next: "Keep consistent weekly saving until $2,000 cash buffer.",
      };
    return {
      stage: "Stage 4: Growth",
      next: "Open a low-fee brokerage account, start $50/week into broad ETF, hold 5+ years.",
    };
  }, [state.profile.currentSavings, totals.leftover, emergencyTarget]);
  const affordability = useMemo(() => {
    if (!state.profile.weeklyIncome || !totals.expenses)
      return { verdict: "I need your weekly income and expenses first." };
    const cost = num(state.affordability.cost);
    if (!cost) return null;
    const after = totals.leftover - cost;
    if (after < 0)
      return {
        verdict: "NO",
        reason: `This purchase puts you below $0 this week (${aud(after)}).`,
        after,
      };
    if (state.affordability.urgency === "need")
      return {
        verdict: "YES",
        reason: `It’s a need and you still have ${aud(after)} left after buying it.`,
        after,
      };
    const slowsGoals = goalWeekly.total > 0 && after < goalWeekly.total;
    if (state.affordability.urgency === "important")
      return slowsGoals
        ? {
            verdict: "WAIT",
            reason: `You can afford it, but it slows your weekly goal progress.`,
            after,
          }
        : {
            verdict: "YES",
            reason: `Important and still safe this week with ${aud(after)} left.`,
            after,
          };
    const clearlyAffordable =
      after > totals.leftover * 0.6 &&
      num(state.profile.currentSavings) >= emergencyTarget;
    return clearlyAffordable
      ? {
          verdict: "YES",
          reason: `You can buy it and still stay on track this week.`,
          after,
        }
      : {
          verdict: "WAIT",
          reason: `It’s a want. Wait until savings/leftover are stronger.`,
          after,
        };
  }, [state, totals, goalWeekly.total, emergencyTarget]);

  const leakage = useMemo(() => {
    const latest = checkins[0];
    if (!latest) return null;
    const expected = Math.max(0, totals.leftover);
    const actual = Math.max(0, num(latest.earned) - num(latest.spent));
    const leak = Math.max(0, expected - actual);
    const topTwo = expenseFields
      .map(([k, l]) => ({ label: l, val: num(state.expenses[k]) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 2)
      .map((x) => x.label);
    return { expected, actual, leak, topTwo };
  }, [checkins, totals.leftover, state.expenses]);

  const fetchMentorAdvice = async () => {
    setMentorLoading(true);
    setMentorError("");
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { ...state.profile, mentorMode: state.mentorMode },
          expenses: state.expenses,
          goals: state.goals,
          question: mentorQuestion,
        }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setMentorAdvice(d.advice || "No advice");
    } catch {
      setMentorError(
        "AI unavailable. Use the built-in weekly mentor plan below.",
      );
    } finally {
      setMentorLoading(false);
    }
  };

  const streak = useMemo(() => {
    let saveWeeks = 0,
      spendWeeks = 0;
    for (const c of checkins) {
      const saved = num(c.earned) - num(c.spent);
      if (saved > 0) saveWeeks++;
      if (num(c.spent) <= Math.max(0, weeklyFocus.spendLimit)) spendWeeks++;
    }
    return { saveWeeks, spendWeeks, onTrack: Math.min(saveWeeks, spendWeeks) };
  }, [checkins, weeklyFocus.spendLimit]);

  const nextBestMove = () => {
    if (totals.leftover <= 0)
      return "Do not spend anything non-essential for the next 2 days.";
    if (num(state.profile.currentSavings) < emergencyTarget)
      return `Move ${aud(Math.min(action.save, totals.leftover))} into savings right now.`;
    if (goalWeekly.total > totals.leftover)
      return "Push your goal deadline out and increase income by one extra shift this week.";
    return `Auto-transfer ${aud(Math.max(50, Math.round(totals.leftover * 0.25)))} to goals now.`;
  };

  const setSec = (sec, k, v) =>
    setState((s) => ({ ...s, [sec]: { ...s[sec], [k]: v } }));
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <h1 className="text-3xl font-bold">WTF do I do with my money?</h1>
          <p className="text-slate-300">
            PocketMentor is an AI money mentor for international students trying
            to build wealth in Australia.
          </p>
        </header>
        <nav className="flex flex-wrap gap-2">
          {["dashboard", "profile", "plan", "afford", "learn", "check-in"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 rounded-full ${tab === t ? "bg-violet-600" : "bg-slate-800"}`}
              >
                {t}
              </button>
            ),
          )}
        </nav>
        {tab === "dashboard" && (
          <section className="space-y-3">
            <div className="bg-violet-900/40 border border-violet-500 rounded-2xl p-5">
              <p className="text-sm text-violet-200">THIS WEEK'S FOCUS</p>
              <p className="text-lg font-bold">Rule: {weeklyFocus.rule}</p>
              <p className="text-lg font-bold">
                Save: {aud(weeklyFocus.saveTarget)}
              </p>
              <p className="text-lg font-bold">
                Max spend: {aud(weeklyFocus.spendLimit)}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Income", aud(totals.income)],
                ["Expenses", aud(totals.expenses)],
                ["Leftover", aud(totals.leftover)],
                ["Savings rate", `${totals.savingsRate.toFixed(1)}%`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
                >
                  <div className="text-xs text-slate-400">{k}</div>
                  <div className="font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="bg-slate-900 rounded-2xl p-4 h-72">
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      {
                        name: "Week",
                        income: totals.income,
                        expenses: totals.expenses,
                        leftover: totals.leftover,
                      },
                    ]}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="#22d3ee" />
                    <Bar dataKey="expenses" fill="#f43f5e" />
                    <Bar dataKey="leftover" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 rounded-2xl p-4 h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={expenseFields
                        .map(([k, l]) => ({
                          name: l,
                          value: num(state.expenses[k]),
                        }))
                        .filter((x) => x.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                    >
                      {colors.map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 text-sm space-y-1">
              <b>Why am I not getting ahead?</b>
              {!leakage ? (
                <p className="mt-1 text-slate-300">
                  Add at least one weekly check-in to compare expected vs actual
                  savings.
                </p>
              ) : (
                <>
                  <p>
                    Your budget says save {aud(leakage.expected)} but you saved{" "}
                    {aud(leakage.actual)}.
                  </p>
                  {leakage.leak > 0 && (
                    <p className="text-rose-300">
                      You are off track by {aud(leakage.leak)} this week. Main
                      cause: overspending in {leakage.topTwo[0]}.
                    </p>
                  )}
                  <p>
                    You lost {aud(leakage.leak)} this week. Most likely causes:{" "}
                    {leakage.topTwo.join(" and ")}.
                  </p>
                </>
              )}
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 text-sm">
              <p>
                <b>Wealth Path:</b> {wealthPath.stage}
              </p>
              <p>{wealthPath.next}</p>
              <p className="mt-1">
                Streak: You've stayed on track for {streak.onTrack} weeks (saved
                money {streak.saveWeeks} weeks, under limit {streak.spendWeeks}{" "}
                weeks).
              </p>
              <button
                className="mt-3 bg-violet-600 px-3 py-2 rounded"
                onClick={() => alert(nextBestMove())}
              >
                What is my next best move?
              </button>
            </div>
          </section>
        )}

        {tab === "profile" && (
          <section className="bg-slate-900 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-xl">Profile & inputs</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field
                label="Weekly income"
                helper="After-tax money you receive each week."
              >
                <input
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.profile.weeklyIncome}
                  onChange={(e) =>
                    setSec("profile", "weeklyIncome", e.target.value)
                  }
                  placeholder="1000"
                />
              </Field>
              <Field label="Current savings" helper="Money already saved.">
                <input
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.profile.currentSavings}
                  onChange={(e) =>
                    setSec("profile", "currentSavings", e.target.value)
                  }
                  placeholder="1500"
                />
              </Field>
              {expenseFields.map(([k, l, d]) => (
                <Field key={k} label={l} helper={d}>
                  <input
                    className="bg-slate-800 p-2 rounded w-full"
                    value={state.expenses[k]}
                    onChange={(e) => setSec("expenses", k, e.target.value)}
                    placeholder="0"
                  />
                </Field>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field
                label="Short goal amount"
                helper={
                  goalWeekly.short.status === "ok"
                    ? ""
                    : "Add amount + deadline."
                }
              >
                <input
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.goals.shortAmount}
                  onChange={(e) =>
                    setSec("goals", "shortAmount", e.target.value)
                  }
                  placeholder="10000"
                />
              </Field>
              <Field
                label="Short goal deadline"
                helper={
                  goalWeekly.short.status === "ok"
                    ? `Weekly target ${aud(goalWeekly.short.value)}`
                    : goalWeekly.short.status
                }
              >
                <input
                  type="date"
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.goals.shortDeadline}
                  onChange={(e) =>
                    setSec("goals", "shortDeadline", e.target.value)
                  }
                />
              </Field>
              <Field
                label="Long goal amount"
                helper={
                  goalWeekly.long.status === "ok"
                    ? ""
                    : "Add amount + deadline."
                }
              >
                <input
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.goals.longAmount}
                  onChange={(e) =>
                    setSec("goals", "longAmount", e.target.value)
                  }
                  placeholder="400000"
                />
              </Field>
              <Field
                label="Long goal deadline"
                helper={
                  goalWeekly.long.status === "ok"
                    ? `Weekly target ${aud(goalWeekly.long.value)}`
                    : goalWeekly.long.status
                }
              >
                <input
                  type="date"
                  className="bg-slate-800 p-2 rounded w-full"
                  value={state.goals.longDeadline}
                  onChange={(e) =>
                    setSec("goals", "longDeadline", e.target.value)
                  }
                />
              </Field>
            </div>
          </section>
        )}

        {tab === "plan" && (
          <section className="bg-slate-900 rounded-2xl p-5 space-y-3 text-sm">
            <h2 className="text-xl font-semibold">Weekly Plan (simple)</h2>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>Money diagnosis:</b> You have {aud(totals.leftover)} left after
              bills. Biggest pressure: {biggest.label} ({aud(biggest.val)}).
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>What to do this week:</b> Save {aud(action.save)}. Put{" "}
              {aud(action.goal)} toward goals. Keep {aud(action.flex)} for
              flexible spending.
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>What NOT to do:</b> Don't buy wants that cut into emergency
              savings.
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>Save / spend / invest split:</b> Save {aud(action.save)} •
              Spend {aud(action.flex)} • Invest {aud(action.investEdu)}
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>Wealth-building next step:</b>{" "}
              {num(state.profile.currentSavings) < emergencyTarget
                ? "Finish emergency fund first."
                : "Start tiny diversified ETF contributions after bills and savings are handled."}
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <b>Reality check:</b>{" "}
              {goalWeekly.short.status !== "ok" ||
              goalWeekly.long.status !== "ok"
                ? "Add valid goal deadlines to get realistic weekly targets."
                : goalWeekly.total > totals.leftover
                  ? "At your current income, this goal is not achievable unless you increase income or extend timeline."
                  : "Your goals are realistic if you stick to this week's plan."}
            </div>
            <Field label="Mentor Mode" helper="Changes tone of AI advice.">
              <select
                className="bg-slate-800 p-2 rounded w-full"
                value={state.mentorMode}
                onChange={(e) =>
                  setState((s) => ({ ...s, mentorMode: e.target.value }))
                }
              >
                <option>gentle</option>
                <option>strict</option>
                <option>big sister</option>
                <option>wealth coach</option>
              </select>
            </Field>
            <Field label="Ask AI mentor" helper="Gets practical 7-day advice.">
              <input
                className="bg-slate-800 p-2 rounded w-full"
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
              />
            </Field>
            <button
              className="bg-violet-600 px-4 py-2 rounded"
              onClick={fetchMentorAdvice}
            >
              {mentorLoading ? "Thinking..." : "Ask AI mentor"}
            </button>
            {mentorError && <p className="text-amber-300">{mentorError}</p>}
            {mentorAdvice && (
              <div className="bg-slate-800 rounded-xl p-3 whitespace-pre-wrap">
                {mentorAdvice}
              </div>
            )}
          </section>
        )}

        {tab === "afford" && (
          <section className="bg-slate-900 rounded-2xl p-5 space-y-2">
            <h2 className="text-xl font-semibold">Can I afford this?</h2>
            <div className="grid md:grid-cols-2 gap-2">
              <input
                className="bg-slate-800 p-2 rounded"
                placeholder="Item"
                value={state.affordability.item}
                onChange={(e) =>
                  setSec("affordability", "item", e.target.value)
                }
              />
              <input
                className="bg-slate-800 p-2 rounded"
                placeholder="Cost"
                value={state.affordability.cost}
                onChange={(e) =>
                  setSec("affordability", "cost", e.target.value)
                }
              />
              <select
                className="bg-slate-800 p-2 rounded"
                value={state.affordability.urgency}
                onChange={(e) =>
                  setSec("affordability", "urgency", e.target.value)
                }
              >
                <option>need</option>
                <option>important</option>
                <option>want</option>
              </select>
            </div>
            <div className="bg-slate-800 rounded p-3 text-sm">
              Weekly income {aud(totals.income)} • Weekly expenses{" "}
              {aud(totals.expenses)} • Leftover before purchase{" "}
              {aud(totals.leftover)} • Item cost {aud(state.affordability.cost)}{" "}
              • Leftover after purchase{" "}
              {aud(totals.leftover - num(state.affordability.cost))}
            </div>
            {affordability && (
              <div className="bg-slate-800 rounded p-3">
                <b>{affordability.verdict}</b>
                <p className="text-sm mt-1">{affordability.reason}</p>
              </div>
            )}
          </section>
        )}

        {tab === "learn" && (
          <section className="grid md:grid-cols-2 gap-2">
            {learnCards.map(([t, l]) => (
              <a
                key={t}
                href={l}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-violet-500"
              >
                <b>{t}</b>
                <p className="text-xs text-slate-400 mt-1">
                  Open trusted beginner resource
                </p>
              </a>
            ))}
          </section>
        )}

        {tab === "check-in" && (
          <section className="bg-slate-900 rounded-2xl p-5 space-y-2">
            <div className="grid md:grid-cols-2 gap-2">
              <input
                className="bg-slate-800 p-2 rounded"
                placeholder="Earned this week"
                value={state.weeklyCheckin.earned}
                onChange={(e) =>
                  setSec("weeklyCheckin", "earned", e.target.value)
                }
              />
              <input
                className="bg-slate-800 p-2 rounded"
                placeholder="Spent this week"
                value={state.weeklyCheckin.spent}
                onChange={(e) =>
                  setSec("weeklyCheckin", "spent", e.target.value)
                }
              />
              <select
                className="bg-slate-800 p-2 rounded"
                value={state.weeklyCheckin.saved}
                onChange={(e) =>
                  setSec("weeklyCheckin", "saved", e.target.value)
                }
              >
                <option>yes</option>
                <option>no</option>
              </select>
              <input
                className="bg-slate-800 p-2 rounded"
                placeholder="Money mistake"
                value={state.weeklyCheckin.mistake}
                onChange={(e) =>
                  setSec("weeklyCheckin", "mistake", e.target.value)
                }
              />
              <input
                className="bg-slate-800 p-2 rounded md:col-span-2"
                placeholder="Decision I'm proud of"
                value={state.weeklyCheckin.proud}
                onChange={(e) =>
                  setSec("weeklyCheckin", "proud", e.target.value)
                }
              />
            </div>
            <button
              className="bg-violet-600 px-4 py-2 rounded"
              onClick={() =>
                setCheckins((c) =>
                  [
                    { ...state.weeklyCheckin, date: new Date().toISOString() },
                    ...c,
                  ].slice(0, 12),
                )
              }
            >
              Save check-in
            </button>
            {checkins.map((c, i) => (
              <div key={i} className="bg-slate-800 rounded p-3 text-sm">
                {new Date(c.date).toLocaleDateString()} • Earned {aud(c.earned)}{" "}
                • Spent {aud(c.spent)} • Saved {c.saved}
              </div>
            ))}
          </section>
        )}
        <section className="bg-slate-900 rounded-xl p-4 text-sm">
          <b>Coming soon</b>
          <ul className="list-disc pl-5 text-slate-300">
            <li>Location-aware financial guidance</li>
            <li>Cross-country wealth planning</li>
            <li>Career and income growth suggestions</li>
          </ul>
        </section>
        <footer className="text-xs text-slate-400 bg-slate-900 rounded-xl p-4">
          This app provides educational guidance only and is not professional
          financial advice.
        </footer>
      </div>
    </div>
  );
}
