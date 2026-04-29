import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const expenseFields = [
  ["rent", "Rent"],
  ["groceries", "Groceries"],
  ["transport", "Transport"],
  ["phone", "Phone"],
  ["tuition", "Tuition / Uni Fees"],
  ["subscriptions", "Subscriptions"],
  ["hygiene", "Hygiene / Personal Care"],
  ["periodCare", "Period Care / Health"],
  ["familySupport", "Pets / Kids / Family Support / Other"],
  ["debt", "Debt / Loans"],
];

const defaultProfile = {
  city: "",
  country: "",
  status: "student",
  jobs: 1,
  incomeCadence: "monthly",
  income: 0,
  currentSavings: 0,
  rent: 0,
  groceries: 0,
  transport: 0,
  phone: 0,
  tuition: 0,
  subscriptions: 0,
  hygiene: 0,
  periodCare: 0,
  familySupport: 0,
  debt: 0,
  shortGoalName: "",
  shortGoalAmount: 0,
  shortGoalDate: "",
  longGoalName: "",
  longGoalAmount: 0,
  longGoalDate: "",
  risk: "low",
  confidence: "beginner",
};

const currency = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function App() {
  const [profile, setProfile] = useState(
    () =>
      JSON.parse(localStorage.getItem("mm-profile") || "null") ||
      defaultProfile,
  );
  const [affordItem, setAffordItem] = useState({ name: "", cost: 0 });
  const [checkins, setCheckins] = useState(() =>
    JSON.parse(localStorage.getItem("mm-checkins") || "[]"),
  );

  useEffect(
    () => localStorage.setItem("mm-profile", JSON.stringify(profile)),
    [profile],
  );
  useEffect(
    () => localStorage.setItem("mm-checkins", JSON.stringify(checkins)),
    [checkins],
  );

  const totals = useMemo(() => {
    const totalIncome = Number(profile.income || 0);
    const totalExpenses = expenseFields.reduce(
      (sum, [k]) => sum + Number(profile[k] || 0),
      0,
    );
    const leftover = totalIncome - totalExpenses;
    const shortGap = Math.max(
      0,
      Number(profile.shortGoalAmount || 0) -
        Number(profile.currentSavings || 0),
    );
    const longGap = Math.max(
      0,
      Number(profile.longGoalAmount || 0) - Number(profile.currentSavings || 0),
    );
    return { totalIncome, totalExpenses, leftover, shortGap, longGap };
  }, [profile]);

  const aiPlan = useMemo(() => {
    const emergencyTarget = totals.totalExpenses * 3;
    const noBuffer = profile.currentSavings < emergencyTarget;
    const unstableIncome = totals.leftover < 0 || profile.jobs > 2;
    const savePct = totals.leftover > 0 ? (noBuffer ? 0.7 : 0.5) : 0;
    const saveAmount = Math.max(0, totals.leftover * savePct);
    const freeSpend = Math.max(0, totals.leftover - saveAmount);
    const highCosts = expenseFields
      .map(([k, l]) => ({ label: l, value: Number(profile[k] || 0) }))
      .filter(
        (x) => totals.totalIncome > 0 && x.value / totals.totalIncome > 0.2,
      )
      .map((x) => x.label);

    let investing = "Start with education only.";
    if (!noBuffer && !unstableIncome && totals.leftover > 0) {
      investing =
        "You may start beginner-safe investing education: broad-market ETFs, diversification, and long time horizons. No guaranteed returns.";
    } else {
      investing =
        "Build an emergency fund and income stability first; pause investing decisions for now.";
    }

    return {
      emergencyTarget,
      noBuffer,
      unstableIncome,
      saveAmount,
      freeSpend,
      highCosts,
      investing,
    };
  }, [profile, totals]);

  const affordResult = useMemo(() => {
    const cost = Number(affordItem.cost || 0);
    if (!cost) return null;
    const after = totals.leftover - cost;
    if (after >= aiPlan.saveAmount * 0.5) {
      return {
        verdict: "Yes",
        why: "It fits your current budget while still leaving room for savings.",
      };
    }
    if (after >= 0) {
      return {
        verdict: "Maybe",
        why: "You can buy it, but it may delay savings goals. Consider waiting or reducing another expense.",
      };
    }
    return {
      verdict: "No",
      why: "This pushes you over budget and may hurt bill coverage or emergency savings.",
    };
  }, [affordItem, totals.leftover, aiPlan.saveAmount]);

  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const saveCheckin = () =>
    setCheckins((c) =>
      [{ date: new Date().toISOString(), totals }, ...c].slice(0, 8),
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h1 className="text-3xl font-bold">Money Mentor</h1>
          <p className="text-slate-300 mt-2">
            A practical money guide for international students in high-cost
            cities.
          </p>
          <p className="text-amber-300 text-sm mt-3">
            Educational guidance only — not licensed financial advice.
          </p>
        </header>

        <section className="grid lg:grid-cols-3 gap-4">
          {[
            ["Income", totals.totalIncome],
            ["Expenses", totals.totalExpenses],
            ["Leftover", totals.leftover],
            ["Short Goal Gap", totals.shortGap],
            ["Long Goal Gap", totals.longGap],
          ].map(([t, v]) => (
            <div
              key={t}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <p className="text-slate-400">{t}</p>
              <p className="text-2xl font-semibold">{currency(v)}</p>
            </div>
          ))}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold mb-4">Financial profile</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["city", "City"],
              ["country", "Country"],
              ["status", "Visa/Student/Work Status"],
              ["jobs", "Number of jobs"],
              ["income", "Income"],
              ["currentSavings", "Current savings/bank balance"],
            ].map(([k, l]) => (
              <input
                key={k}
                className="bg-slate-800 rounded p-2"
                placeholder={l}
                value={profile[k]}
                onChange={(e) =>
                  set(
                    k,
                    ["jobs", "income", "currentSavings"].includes(k)
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            ))}
            {expenseFields.map(([k, l]) => (
              <input
                key={k}
                className="bg-slate-800 rounded p-2"
                placeholder={l}
                value={profile[k]}
                onChange={(e) => set(k, Number(e.target.value))}
              />
            ))}
            {[
              "shortGoalName",
              "shortGoalAmount",
              "shortGoalDate",
              "longGoalName",
              "longGoalAmount",
              "longGoalDate",
            ].map((k) => (
              <input
                key={k}
                className="bg-slate-800 rounded p-2"
                placeholder={k}
                type={
                  k.includes("Date")
                    ? "date"
                    : k.includes("Amount")
                      ? "number"
                      : "text"
                }
                value={profile[k]}
                onChange={(e) =>
                  set(
                    k,
                    k.includes("Amount")
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            ))}
            <select
              className="bg-slate-800 rounded p-2"
              value={profile.risk}
              onChange={(e) => set("risk", e.target.value)}
            >
              <option>low</option>
              <option>medium</option>
              <option>high</option>
            </select>
            <select
              className="bg-slate-800 rounded p-2"
              value={profile.confidence}
              onChange={(e) => set("confidence", e.target.value)}
            >
              <option>anxious</option>
              <option>beginner</option>
              <option>improving</option>
              <option>confident</option>
            </select>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-72">
            <h3 className="mb-3">Income vs Expenses</h3>
            <ResponsiveContainer>
              <BarChart
                data={[
                  {
                    name: "Budget",
                    income: totals.totalIncome,
                    expenses: totals.totalExpenses,
                    leftover: totals.leftover,
                  },
                ]}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#22c55e" />
                <Bar dataKey="expenses" fill="#ef4444" />
                <Bar dataKey="leftover" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-72">
            <h3 className="mb-3">Expense split</h3>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={expenseFields
                    .map(([k, l]) => ({
                      name: l,
                      value: Number(profile[k] || 0),
                    }))
                    .filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                >
                  {[
                    "#f59e0b",
                    "#f43f5e",
                    "#10b981",
                    "#60a5fa",
                    "#a78bfa",
                    "#fb7185",
                    "#34d399",
                    "#f97316",
                    "#facc15",
                    "#94a3b8",
                  ].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h2 className="text-xl font-semibold">Personalized money plan</h2>
          <p>
            Save about <b>{currency(aiPlan.saveAmount)}</b> from leftover money
            and keep <b>{currency(aiPlan.freeSpend)}</b> for flexible spending.
          </p>
          <p>
            Emergency fund target (~3 months expenses):{" "}
            <b>{currency(aiPlan.emergencyTarget)}</b>.
          </p>
          {aiPlan.highCosts.length > 0 && (
            <p>Potentially high expenses: {aiPlan.highCosts.join(", ")}.</p>
          )}
          <p>{aiPlan.investing}</p>
          <p>
            Australia checklist: Understand TFN setup, tax on income, and
            superannuation rules for your work status.
          </p>
          <p className="text-sm text-slate-400">
            No guaranteed returns. Avoid scams and unrealistic return promises.
          </p>
          <button
            className="mt-2 bg-cyan-600 px-4 py-2 rounded"
            onClick={saveCheckin}
          >
            Save Check-in
          </button>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xl font-semibold">Can I afford this?</h2>
            <input
              className="bg-slate-800 rounded p-2 w-full"
              placeholder="Item name"
              value={affordItem.name}
              onChange={(e) =>
                setAffordItem((a) => ({ ...a, name: e.target.value }))
              }
            />
            <input
              className="bg-slate-800 rounded p-2 w-full"
              type="number"
              placeholder="Cost"
              value={affordItem.cost}
              onChange={(e) =>
                setAffordItem((a) => ({ ...a, cost: Number(e.target.value) }))
              }
            />
            {affordResult && (
              <div>
                <p className="text-lg font-semibold">{affordResult.verdict}</p>
                <p>{affordResult.why}</p>
              </div>
            )}
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-xl font-semibold mb-2">Learn Money</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
              {[
                "Emergency fund basics",
                "Budgeting methods",
                "Managing debt responsibly",
                "Savings accounts & interest",
                "Compound growth",
                "ETF basics",
                "Australian superannuation",
                "Investing risks",
                "Scams & unrealistic returns",
              ].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
