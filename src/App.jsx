import { useEffect, useMemo, useState } from "react";

const expenseFields = [
  ["rent", "Rent", "Your weekly rent or accommodation cost."],
  [
    "groceries",
    "Groceries",
    "Food and household essentials from supermarkets.",
  ],
  ["transport", "Transport", "Public transport, fuel, parking, or rideshare."],
  ["phone", "Phone", "Mobile plan and phone-related costs."],
  [
    "tuition",
    "Tuition / uni fees",
    "Weekly amount set aside for course costs.",
  ],
  [
    "subscriptions",
    "Subscriptions",
    "Streaming, apps, software, gym memberships.",
  ],
  [
    "hygiene",
    "Hygiene / personal care",
    "Toiletries, skincare, haircare, and self-care.",
  ],
  [
    "periodCare",
    "Period care / health",
    "Period products, pharmacy, and health basics.",
  ],
  ["pets", "Pets", "Food, vet costs, and pet essentials."],
  [
    "familySupport",
    "Kids / family support",
    "Money sent home or spent on dependents.",
  ],
  ["fun", "Eating out / fun", "Cafes, restaurants, social activities."],
  ["custom", "Custom expenses", "Any weekly cost unique to your situation."],
];

const learnCards = [
  {
    key: "budgeting",
    title: "Budgeting",
    explain: "A budget tells every dollar where to go before the week starts.",
    why: "International students often juggle tuition, rent, and variable shifts, so planning ahead reduces stress.",
    action:
      "Set one weekly spending cap for eating out/fun and track it daily.",
    link: "https://moneysmart.gov.au/budgeting/how-to-do-a-budget",
  },
  {
    key: "emergency",
    title: "Emergency fund",
    explain:
      "Emergency savings protect you from surprise costs like medical bills or reduced shifts.",
    why: "Visa and work limitations can make income less stable, so a cash buffer matters more.",
    action: "Transfer a fixed amount to savings on payday.",
    link: "https://moneysmart.gov.au/saving/emergency-fund",
  },
  {
    key: "etf",
    title: "ETFs",
    explain:
      "ETFs are baskets of investments that can spread risk across many companies.",
    why: "They can be a beginner-friendly way to learn investing after emergency savings are in place.",
    action: "Learn ETF basics first; don’t invest money you might need soon.",
    link: "https://moneysmart.gov.au/how-to-invest/exchange-traded-funds-etfs",
  },
  {
    key: "tfn",
    title: "Tax / TFN basics",
    explain:
      "A TFN helps employers tax you correctly and is important for lodging tax returns.",
    why: "International students in Australia should understand tax withholding early to avoid surprises.",
    action: "Check your TFN details and keep payslips for tax time.",
    link: "https://www.ato.gov.au/individuals-and-families/tax-file-number",
  },
  {
    key: "super",
    title: "Superannuation basics",
    explain:
      "Super is money employers contribute for retirement when eligible.",
    why: "Students with part-time jobs may still receive super contributions from employers.",
    action: "Check your super fund, fees, and contribution history.",
    link: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families",
  },
];

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
};

const aud = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const toNum = (v) => Number(v || 0);

const Field = ({ label, helper, children }) => (
  <label className="block space-y-1">
    <span className="font-medium text-sm">{label}</span>
    {children}
    <span className="text-xs text-slate-400">{helper}</span>
  </label>
);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [state, setState] = useState(
    () =>
      JSON.parse(localStorage.getItem("mm-state-v2") || "null") || defaultState,
  );
  const [checkins, setCheckins] = useState(() =>
    JSON.parse(localStorage.getItem("mm-checkins-v2") || "[]"),
  );
  const [expandedLearn, setExpandedLearn] = useState("budgeting");
  const [showPlan, setShowPlan] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState(
    "What should I do with my money this week?",
  );
  const [mentorAdvice, setMentorAdvice] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState("");

  useEffect(
    () => localStorage.setItem("mm-state-v2", JSON.stringify(state)),
    [state],
  );
  useEffect(
    () => localStorage.setItem("mm-checkins-v2", JSON.stringify(checkins)),
    [checkins],
  );

  const totals = useMemo(() => {
    const weeklyIncome = toNum(state.profile.weeklyIncome);
    const weeklyExpenses = expenseFields.reduce(
      (sum, [k]) => sum + toNum(state.expenses[k]),
      0,
    );
    const leftover = weeklyIncome - weeklyExpenses;
    const savingsRate = weeklyIncome > 0 ? (leftover / weeklyIncome) * 100 : 0;
    return { weeklyIncome, weeklyExpenses, leftover, savingsRate };
  }, [state]);

  const goalWeekly = useMemo(() => {
    const perWeek = (amount, deadline) => {
      if (!amount || !deadline) return 0;
      const diffDays = Math.max(
        1,
        Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000),
      );
      return toNum(amount) / Math.max(1, Math.ceil(diffDays / 7));
    };
    const short = perWeek(state.goals.shortAmount, state.goals.shortDeadline);
    const long = perWeek(state.goals.longAmount, state.goals.longDeadline);
    return { short, long, total: short + long };
  }, [state.goals]);

  const emergencyTarget = totals.weeklyExpenses * 8;

  const mentorSummary =
    totals.weeklyIncome > 0
      ? `You earn ${aud(totals.weeklyIncome)}/week and spend ${aud(totals.weeklyExpenses)}/week, leaving ${aud(totals.leftover)}. Your first priority is building an emergency fund of about ${aud(emergencyTarget)} before investing.`
      : "Start with your profile so I can give advice based on your real life.";

  const planSections = useMemo(() => {
    const reality =
      totals.leftover < 0
        ? `Right now you are spending ${aud(Math.abs(totals.leftover))} more than you earn each week.`
        : `You currently have ${aud(totals.leftover)} left after weekly expenses.`;
    const bills = `Protect ${aud(totals.weeklyExpenses)} for bills and essentials first.`;
    const emergency =
      toNum(state.profile.currentSavings) >= emergencyTarget
        ? `Great progress: your emergency savings are near target (${aud(emergencyTarget)}).`
        : `Build emergency savings first. Target is about ${aud(emergencyTarget)} (8 weeks essentials).`;
    const goal = `Goal targets: short-term ${aud(goalWeekly.short)}/week, long-term ${aud(goalWeekly.long)}/week.`;
    const allowance =
      totals.leftover > 0
        ? `After goals/savings, keep a capped flexible allowance.`
        : "Pause flexible spending until cashflow is positive.";
    const investing =
      totals.leftover <= 0 ||
      toNum(state.profile.currentSavings) < emergencyTarget
        ? "Investing learning only for now: focus on ETF basics, diversification, and risk. No guaranteed returns."
        : "You can begin beginner-safe investing education while continuing savings discipline.";
    const exact =
      totals.leftover > 0
        ? `This week: auto-transfer ${aud(Math.max(0, Math.min(totals.leftover * 0.4, emergencyTarget - toNum(state.profile.currentSavings))))} to emergency savings, then ${aud(Math.min(totals.leftover * 0.4, goalWeekly.total))} to goals.`
        : "This week: cut one discretionary category and re-check cashflow next payday.";
    return { reality, bills, emergency, goal, allowance, investing, exact };
  }, [totals, goalWeekly, state.profile.currentSavings, emergencyTarget]);

  const affordability = useMemo(() => {
    const missingCore =
      !state.profile.weeklyIncome ||
      expenseFields.every(([k]) => !state.expenses[k]);
    const itemCost = toNum(state.affordability.cost);
    const after = totals.leftover - itemCost;
    const goalPressure = goalWeekly.total;
    const emergencyGap = Math.max(
      0,
      emergencyTarget - toNum(state.profile.currentSavings),
    );
    const emergencyStatus =
      emergencyGap > 0
        ? `Below target by ${aud(emergencyGap)} (target ${aud(emergencyTarget)}).`
        : `On track (target ${aud(emergencyTarget)} reached).`;

    if (missingCore) {
      return {
        verdict: "I need your weekly income and expenses first.",
        after,
        goalPressure,
        emergencyStatus,
        emergencyGap,
      };
    }
    if (!itemCost) return null;
    if (after < 0) {
      return {
        verdict: "No",
        reason: `Buying this leaves you at ${aud(after)} for the week, which means bills and basics are no longer covered safely.`,
        after,
        goalPressure,
        emergencyStatus,
        emergencyGap,
      };
    }

    const usesHalfAndWant =
      state.affordability.urgency === "want" &&
      itemCost > totals.leftover * 0.5;
    if (usesHalfAndWant) {
      return {
        verdict: "Wait",
        reason: `You could still have ${aud(after)} left, but this purchase uses more than half of your spare money (${aud(totals.leftover)}). Since it is a want, waiting keeps your plan steadier.`,
        after,
        goalPressure,
        emergencyStatus,
        emergencyGap,
      };
    }

    const goalStretch = goalPressure > after;
    const emergencyStillLow = emergencyGap > 0;
    if (goalStretch || emergencyStillLow) {
      return {
        verdict: "Wait",
        reason: `Technically you can buy this because you would still have ${aud(after)} left, but your weekly goal pressure is ${aud(goalPressure)} and your emergency fund is still below target, so waiting is smarter.`,
        after,
        goalPressure,
        emergencyStatus,
        emergencyGap,
      };
    }

    return {
      verdict: "Yes",
      reason: `This fits your weekly plan: after buying, you keep ${aud(after)} and still have room for goals and emergency progress.`,
      after,
      goalPressure,
      emergencyStatus,
      emergencyGap,
    };
  }, [state, totals, goalWeekly.total, emergencyTarget]);

  const fetchMentorAdvice = async () => {
    setMentorLoading(true);
    setMentorError("");
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: state.profile,
          expenses: state.expenses,
          goals: state.goals,
          question: mentorQuestion,
        }),
      });
      if (!res.ok) throw new Error("API request failed.");
      const data = await res.json();
      setMentorAdvice(data.advice || "No advice returned.");
    } catch (err) {
      setMentorError(
        "Could not reach AI mentor right now. Showing your built-in plan instead.",
      );
    } finally {
      setMentorLoading(false);
    }
  };
  const setSection = (section, key, value) =>
    setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));

  const saveCheckin = () =>
    setCheckins((c) =>
      [{ ...state.weeklyCheckin, date: new Date().toISOString() }, ...c].slice(
        0,
        12,
      ),
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h1 className="text-3xl font-bold">Money Mentor</h1>
          <p className="text-slate-300">
            Guided weekly money planning for international students in
            Australia.
          </p>
        </header>

        <div className="bg-cyan-950/40 border border-cyan-800 rounded-2xl p-4">
          <h2 className="font-semibold">Your Money Mentor says:</h2>
          <p className="text-cyan-100">{mentorSummary}</p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {["dashboard", "profile", "plan", "afford", "learn", "check-in"].map(
            (t) => (
              <button
                key={t}
                className={`px-3 py-2 rounded-full border ${tab === t ? "bg-cyan-600 border-cyan-500" : "bg-slate-900 border-slate-700"}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ),
          )}
        </nav>

        {tab === "dashboard" && (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["Weekly income", aud(totals.weeklyIncome)],
              ["Weekly expenses", aud(totals.weeklyExpenses)],
              ["Leftover money", aud(totals.leftover)],
              ["Savings rate", `${totals.savingsRate.toFixed(1)}%`],
              [
                "Emergency fund status",
                toNum(state.profile.currentSavings) >= emergencyTarget
                  ? "On track"
                  : "Needs work",
              ],
              [
                "Short goal progress",
                `${aud(state.profile.currentSavings)} / ${aud(state.goals.shortAmount)}`,
              ],
              [
                "Long goal progress",
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
          </section>
        )}

        {tab === "profile" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
            <h2 className="text-xl font-semibold">Guided setup</h2>
            <div className="space-y-3">
              <h3 className="font-semibold">About me</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Name"
                  helper="How should your mentor address you?"
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="Anjali"
                    value={state.profile.name}
                    onChange={(e) =>
                      setSection("profile", "name", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="City in Australia"
                  helper="Your current city helps contextualize costs."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="Sydney"
                    value={state.profile.city}
                    onChange={(e) =>
                      setSection("profile", "city", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Visa/status"
                  helper="Choose the option closest to your situation."
                >
                  <select
                    className="bg-slate-800 rounded p-2 w-full"
                    value={state.profile.status}
                    onChange={(e) =>
                      setSection("profile", "status", e.target.value)
                    }
                  >
                    <option>international student</option>
                    <option>resident</option>
                    <option>citizen</option>
                    <option>working holiday</option>
                    <option>other</option>
                  </select>
                </Field>
                <Field
                  label="Number of jobs"
                  helper="How many jobs currently contribute to your income?"
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="1"
                    value={state.profile.jobs}
                    onChange={(e) =>
                      setSection("profile", "jobs", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Income</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Weekly income"
                  helper="How much money do you usually receive each week after tax?"
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="1000"
                    value={state.profile.weeklyIncome}
                    onChange={(e) =>
                      setSection("profile", "weeklyIncome", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Current bank balance"
                  helper="Total cash currently in your everyday account(s)."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="1800"
                    value={state.profile.bankBalance}
                    onChange={(e) =>
                      setSection("profile", "bankBalance", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Current money situation</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Current savings"
                  helper="Money you already have saved, not including this week’s income."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="1200"
                    value={state.profile.currentSavings}
                    onChange={(e) =>
                      setSection("profile", "currentSavings", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Current debt"
                  helper="Total debt balance you still need to repay."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="500"
                    value={state.profile.currentDebt}
                    onChange={(e) =>
                      setSection("profile", "currentDebt", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Money confidence level"
                  helper="How confident do you feel with money decisions?"
                >
                  <select
                    className="bg-slate-800 rounded p-2 w-full"
                    value={state.profile.confidence}
                    onChange={(e) =>
                      setSection("profile", "confidence", e.target.value)
                    }
                  >
                    <option>anxious</option>
                    <option>beginner</option>
                    <option>improving</option>
                    <option>confident</option>
                  </select>
                </Field>
                <Field
                  label="Risk comfort"
                  helper="Your comfort with investment ups and downs."
                >
                  <select
                    className="bg-slate-800 rounded p-2 w-full"
                    value={state.profile.risk}
                    onChange={(e) =>
                      setSection("profile", "risk", e.target.value)
                    }
                  >
                    <option>low</option>
                    <option>medium</option>
                    <option>high</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Weekly expenses</h3>
              <div className="space-y-2">
                {expenseFields.map(([k, label, desc]) => (
                  <div
                    key={k}
                    className="grid md:grid-cols-3 gap-2 bg-slate-800/60 rounded p-3"
                  >
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <input
                      className="bg-slate-800 border border-slate-700 rounded p-2 md:col-span-2"
                      placeholder="0"
                      value={state.expenses[k]}
                      onChange={(e) =>
                        setSection("expenses", k, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Goals</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Short-term goal"
                  helper="Example: Save for laptop upgrade"
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="Save $5,000 for emergency cushion"
                    value={state.goals.shortName}
                    onChange={(e) =>
                      setSection("goals", "shortName", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Short-term amount"
                  helper="Target amount for this goal."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="5000"
                    value={state.goals.shortAmount}
                    onChange={(e) =>
                      setSection("goals", "shortAmount", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Short-term deadline"
                  helper="When do you want to hit this goal?"
                >
                  <input
                    type="date"
                    className="bg-slate-800 rounded p-2 w-full"
                    value={state.goals.shortDeadline}
                    onChange={(e) =>
                      setSection("goals", "shortDeadline", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Long-term goal"
                  helper="Example: long-term wealth target"
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="Have $400,000 in 3 years"
                    value={state.goals.longName}
                    onChange={(e) =>
                      setSection("goals", "longName", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Long-term amount"
                  helper="Target amount for long-term goal."
                >
                  <input
                    className="bg-slate-800 rounded p-2 w-full"
                    placeholder="400000"
                    value={state.goals.longAmount}
                    onChange={(e) =>
                      setSection("goals", "longAmount", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Long-term deadline"
                  helper="Choose target completion date."
                >
                  <input
                    type="date"
                    className="bg-slate-800 rounded p-2 w-full"
                    value={state.goals.longDeadline}
                    onChange={(e) =>
                      setSection("goals", "longDeadline", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          </section>
        )}

        {tab === "plan" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold">Weekly plan</h2>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                ["Weekly income", aud(totals.weeklyIncome)],
                ["Weekly expenses", aud(totals.weeklyExpenses)],
                ["Leftover after bills", aud(totals.leftover)],
                ["Short-term goal target per week", aud(goalWeekly.short)],
                ["Long-term goal target per week", aud(goalWeekly.long)],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-800 rounded p-3">
                  <p className="text-slate-400">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <button
              className="bg-cyan-600 px-4 py-2 rounded"
              onClick={() => setShowPlan(true)}
            >
              What should I do with my money this week?
            </button>
            {showPlan && (
              <div className="space-y-2 text-sm bg-slate-800 rounded p-4">
                <p>
                  <b>Reality check:</b> {planSections.reality}
                </p>
                <p>
                  <b>Bills first:</b> {planSections.bills}
                </p>
                <p>
                  <b>Emergency fund:</b> {planSections.emergency}
                </p>
                <p>
                  <b>Goal plan:</b> {planSections.goal}
                </p>
                <p>
                  <b>Spending allowance:</b> {planSections.allowance}
                </p>
                <p>
                  <b>Investing learning:</b> {planSections.investing}
                </p>
                <p>
                  <b>This week’s exact action:</b> {planSections.exact}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Field
                label="Ask the AI mentor a question"
                helper="Optional: Ask for a clearer weekly plan in your own words."
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  value={mentorQuestion}
                  onChange={(e) => setMentorQuestion(e.target.value)}
                />
              </Field>
              <button
                className="bg-indigo-600 px-4 py-2 rounded"
                onClick={fetchMentorAdvice}
                disabled={mentorLoading}
              >
                {mentorLoading ? "Asking mentor..." : "Ask AI mentor"}
              </button>
              {mentorError && (
                <p className="text-amber-300 text-sm">{mentorError}</p>
              )}
              {mentorAdvice && (
                <div className="bg-slate-800 rounded p-4 whitespace-pre-wrap text-sm">
                  <b>AI mentor advice</b>
                  {mentorAdvice}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "afford" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-semibold">Can I afford this?</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Item name" helper="What do you want to buy?">
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="New headphones"
                  value={state.affordability.item}
                  onChange={(e) =>
                    setSection("affordability", "item", e.target.value)
                  }
                />
              </Field>
              <Field label="Item cost" helper="Total cost for this purchase.">
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="180"
                  value={state.affordability.cost}
                  onChange={(e) =>
                    setSection("affordability", "cost", e.target.value)
                  }
                />
              </Field>
              <Field
                label="Urgency"
                helper="Need = essential, Want = optional."
              >
                <select
                  className="bg-slate-800 rounded p-2 w-full"
                  value={state.affordability.urgency}
                  onChange={(e) =>
                    setSection("affordability", "urgency", e.target.value)
                  }
                >
                  <option>need</option>
                  <option>important</option>
                  <option>want</option>
                </select>
              </Field>
              <Field
                label="Category"
                helper="Example: study, transport, lifestyle"
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="Lifestyle"
                  value={state.affordability.category}
                  onChange={(e) =>
                    setSection("affordability", "category", e.target.value)
                  }
                />
              </Field>
            </div>
            <div className="bg-slate-800 rounded p-4 text-sm space-y-1">
              <p>
                Weekly income: <b>{aud(totals.weeklyIncome)}</b>
              </p>
              <p>
                Weekly expenses: <b>{aud(totals.weeklyExpenses)}</b>
              </p>
              <p>
                Leftover before purchase: <b>{aud(totals.leftover)}</b>
              </p>
              <p>
                Item cost: <b>{aud(state.affordability.cost)}</b>
              </p>
              <p>
                Leftover after purchase:{" "}
                <b>{aud(totals.leftover - toNum(state.affordability.cost))}</b>
              </p>
            </div>
            {affordability && (
              <div className="bg-slate-800 rounded p-4 space-y-1">
                <p className="font-semibold">{affordability.verdict}</p>
                {affordability.reason && (
                  <p className="text-sm text-slate-300">
                    {affordability.reason}
                  </p>
                )}
                <p className="text-xs text-slate-400">
                  Goal pressure this week:{" "}
                  {aud(affordability.goalPressure || 0)} (this is what your
                  goals need per week).
                </p>
                <p className="text-xs text-slate-400">
                  Emergency fund status: {affordability.emergencyStatus}
                </p>
              </div>
            )}
          </section>
        )}

        {tab === "learn" && (
          <section className="grid md:grid-cols-2 gap-3">
            {learnCards.map((card) => (
              <button
                key={card.key}
                onClick={() =>
                  setExpandedLearn(expandedLearn === card.key ? "" : card.key)
                }
                className="text-left bg-slate-900 border border-slate-800 rounded-xl p-4"
              >
                <p className="font-semibold">{card.title}</p>
                {expandedLearn === card.key && (
                  <div className="mt-2 text-sm text-slate-300 space-y-1">
                    <p>
                      <b>Simple explanation:</b> {card.explain}
                    </p>
                    <p>
                      <b>Why this matters for international students:</b>{" "}
                      {card.why}
                    </p>
                    <p>
                      <b>Action this week:</b> {card.action}
                    </p>
                    <a
                      className="text-cyan-300 underline"
                      href={card.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Beginner-safe learning link
                    </a>
                  </div>
                )}
              </button>
            ))}
          </section>
        )}

        {tab === "check-in" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-semibold">Weekly check-in</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Field
                label="How much did I earn this week?"
                helper="Enter after-tax weekly income."
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="980"
                  value={state.weeklyCheckin.earned}
                  onChange={(e) =>
                    setSection("weeklyCheckin", "earned", e.target.value)
                  }
                />
              </Field>
              <Field
                label="How much did I spend this week?"
                helper="Total weekly spending across all categories."
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="760"
                  value={state.weeklyCheckin.spent}
                  onChange={(e) =>
                    setSection("weeklyCheckin", "spent", e.target.value)
                  }
                />
              </Field>
              <Field
                label="Did I save money this week?"
                helper="Honest yes/no reflection."
              >
                <select
                  className="bg-slate-800 rounded p-2 w-full"
                  value={state.weeklyCheckin.saved}
                  onChange={(e) =>
                    setSection("weeklyCheckin", "saved", e.target.value)
                  }
                >
                  <option>yes</option>
                  <option>no</option>
                </select>
              </Field>
              <Field
                label="What money mistake did I make?"
                helper="Name one thing you can improve."
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="Overspent on takeaway"
                  value={state.weeklyCheckin.mistake}
                  onChange={(e) =>
                    setSection("weeklyCheckin", "mistake", e.target.value)
                  }
                />
              </Field>
              <Field
                label="What money decision am I proud of?"
                helper="Celebrate one positive money action."
              >
                <input
                  className="bg-slate-800 rounded p-2 w-full"
                  placeholder="I saved before spending"
                  value={state.weeklyCheckin.proud}
                  onChange={(e) =>
                    setSection("weeklyCheckin", "proud", e.target.value)
                  }
                />
              </Field>
            </div>
            <button
              className="bg-cyan-600 px-4 py-2 rounded"
              onClick={saveCheckin}
            >
              Save check-in
            </button>
            <div className="grid md:grid-cols-2 gap-2">
              {checkins.map((c, idx) => (
                <div key={idx} className="bg-slate-800 rounded p-3 text-sm">
                  <p className="text-slate-400">
                    {new Date(c.date).toLocaleDateString()}
                  </p>
                  <p>
                    Earned {aud(c.earned)} • Spent {aud(c.spent)} • Saved:{" "}
                    {c.saved}
                  </p>
                  <p>Mistake: {c.mistake || "-"}</p>
                  <p>Proud: {c.proud || "-"}</p>
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
