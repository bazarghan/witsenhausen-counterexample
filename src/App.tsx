import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calculator, Info, Zap, AlertTriangle, TrendingDown, ArrowDownToLine } from 'lucide-react';
import { CHART_CONFIG } from './constants';
import costsData from './data/costs.json';

// --- COMPONENTS ---

interface CardProps {
  title: string;
  value: number;
  subtext: string;
  color: string;
  icon: React.ElementType;
}

const Card: React.FC<CardProps> = ({ title, value, subtext, color, icon: Icon }) => (
  <div className={`p-4 rounded-xl border shadow-sm ${color} transition-all duration-300 hover:shadow-md`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-medium opacity-80">{title}</span>
      <Icon size={18} className="opacity-70" />
    </div>
    <div className="text-2xl font-bold font-mono">{value.toFixed(4)}</div>
    <div className="text-xs mt-1 opacity-70">{subtext}</div>
  </div>
);

// --- HELPERS ---

// Helper to find the closest index in the pre-calculated data
const getKIndex = (k: number) => {
  const { min, step } = costsData.metadata.k;
  return Math.round((k - min) / step);
};

const getSigmaIndex = (s: number) => {
  const { min, step } = costsData.metadata.sigma;
  return Math.round((s - min) / step);
};

const App = () => {
  // --- STATE ---
  // Default parameters that show the counterexample clearly
  const [k, setK] = useState(0.2);
  const [sigma, setSigma] = useState(5);

  // --- LOOKUP ---
  const results = useMemo(() => {
    // Look up costs from pre-calculated data
    const kIdx = getKIndex(k);
    const sIdx = getSigmaIndex(sigma);

    // Safety check
    if (kIdx >= 0 && kIdx < costsData.data.length &&
      sIdx >= 0 && sIdx < costsData.data[0].length) {
      const costs = costsData.data[kIdx][sIdx];
      return {
        ...costs,
        isCounterExample: costs.nonlinCost < costs.affineCost
      };
    }

    // Fallback (should not happen if sliders match ranges)
    return {
      lambda: 0,
      affineCost: 0,
      nonlinCost: 0,
      lowerBound: 0,
      isCounterExample: false
    };
  }, [k, sigma]);

  // Generate data for plotting the strategies (f(x))
  // This is still fast enough to calculate on the fly as it's just linear/step functions
  const plotData = useMemo(() => {
    const data = [];
    const range = sigma * CHART_CONFIG.STRATEGIES.X_RANGE_MULTIPLIER;
    const step = range / 50;
    for (let x = -range; x <= range; x += step) {
      data.push({
        x: x.toFixed(2),
        affine: (results.lambda * x),
        nonlinear: x > 0 ? sigma : -sigma, // Simple step function
        ideal: x // Ideally we want f(x) close to x for first term cost
      });
    }
    return data;
  }, [sigma, results.lambda]);

  // Generate data for Cost vs Sigma (Fixed k)
  const costVsSigmaData = useMemo(() => {
    const data = [];
    const { X_MIN, X_MAX, X_STEP } = CHART_CONFIG.COST_VS_SIGMA;
    const kIdx = getKIndex(k);

    if (kIdx >= 0 && kIdx < costsData.data.length) {
      // Iterate over the chart's x-axis range
      for (let s = X_MIN; s <= X_MAX; s += X_STEP) {
        const sIdx = getSigmaIndex(s);
        if (sIdx >= 0 && sIdx < costsData.data[kIdx].length) {
          const c = costsData.data[kIdx][sIdx];
          data.push({
            sigma: s,
            affineCost: c.affineCost,
            nonlinCost: c.nonlinCost,
            lowerBound: c.lowerBound
          });
        }
      }
    }
    return data;
  }, [k]);

  // Generate data for Cost vs k (Fixed Sigma)
  const costVsKData = useMemo(() => {
    const data = [];
    const { X_MIN, X_MAX, X_STEP } = CHART_CONFIG.COST_VS_K;
    const sIdx = getSigmaIndex(sigma);

    if (sIdx >= 0 && sIdx < costsData.data[0].length) {
      // Iterate over the chart's x-axis range
      for (let kv = X_MIN; kv <= X_MAX; kv += X_STEP) {
        const kIdx = getKIndex(kv);
        if (kIdx >= 0 && kIdx < costsData.data.length) {
          const c = costsData.data[kIdx][sIdx];
          data.push({
            k: kv.toFixed(2), // Keep as string for display if needed, or number for axis
            kVal: kv, // Number for axis
            affineCost: c.affineCost,
            nonlinCost: c.nonlinCost,
            lowerBound: c.lowerBound
          });
        }
      }
    }
    return data;
  }, [sigma]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Witsenhausen Counterexample</h1>
            <p className="text-slate-500 mt-2">
              Interactive demonstration of Signaling vs. Linear Control in Distributed Systems.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Made by Alireza Bazargan - December 1
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
            <Info size={16} />
            <span>Problem: Minimize E[k²u₁² + x₂²]</span>
          </div>
        </header>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: CONTROLS & INFO (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Control Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator size={20} className="mr-2 text-indigo-500" />
                Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Cost Weight (k)</label>
                    <span className="text-sm font-mono bg-gray-100 px-2 rounded">{k}</span>
                  </div>
                  <input
                    type="range" min="0.01" max="1.0" step="0.01"
                    value={k} onChange={(e) => setK(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Lower k = energy is cheap (favors signaling)</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Initial Variance (σ)</label>
                    <span className="text-sm font-mono bg-gray-100 px-2 rounded">{sigma}</span>
                  </div>
                  <input
                    type="range" min="0.5" max="10" step="0.1"
                    value={sigma} onChange={(e) => setSigma(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Higher σ = more initial uncertainty</p>
                </div>
              </div>
            </div>

            {/* Explanation Box */}
            <div className="bg-slate-800 text-slate-100 p-6 rounded-2xl shadow-lg">
              <h3 className="text-md font-bold mb-2 flex items-center text-yellow-400">
                <Zap size={18} className="mr-2" />
                The Intuition
              </h3>
              <p className="text-sm leading-relaxed opacity-90 mb-4">
                <strong>Linear Strategy:</strong> Multiplies state by a constant (λ). Noise is added directly. Good when energy is expensive.
              </p>
              <p className="text-sm leading-relaxed opacity-90">
                <strong>Nonlinear (Witsenhausen):</strong> Forces the state to <span className="font-mono text-yellow-300">±{sigma}</span>. This is <strong>Quantization</strong>. It uses energy to create a clear "signal" that the second controller can distinguish from noise.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: RESULTS & CHARTS (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                title="Optimal Affine Cost"
                value={results.affineCost}
                subtext={`λ ≈ ${results.lambda.toFixed(3)}`}
                color="bg-white border-gray-200 text-gray-600"
                icon={TrendingDown}
              />
              <Card
                title="Nonlinear Strategy Cost"
                value={results.nonlinCost}
                subtext="Signaling Strategy (Step Function)"
                color={results.isCounterExample ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-600"}
                icon={Zap}
              />
              <Card
                title="Theoretical Lower Bound"
                value={results.lowerBound}
                subtext="Theorem 3 (Witsenhausen)"
                color="bg-slate-50 border-slate-200 text-slate-600"
                icon={ArrowDownToLine}
              />
            </div>

            {/* Counterexample Alert */}
            <div className={`p-4 rounded-xl border flex items-center space-x-4 transition-all duration-500 ${results.isCounterExample
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
              <div className={`p-2 rounded-full ${results.isCounterExample ? "bg-amber-100" : "bg-gray-200"}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold">
                  {results.isCounterExample ? "Counterexample Valid!" : "Affine is currently better"}
                </h4>
                <p className="text-sm opacity-80">
                  {results.isCounterExample
                    ? `Nonlinear strategy beats the best Linear strategy by ${((1 - results.nonlinCost / results.affineCost) * 100).toFixed(2)}%.`
                    : "Increase σ or decrease k to see the counterexample emerge."}
                </p>
              </div>
            </div>

            {/* Chart 1: Control Strategies */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
              <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Control Strategies Comparison f(x)</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={plotData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    label={{ value: 'x (Initial State)', position: 'insideBottomRight', offset: -10 }}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis
                    label={{ value: 'u (Control Input)', angle: -90, position: 'insideLeft' }}
                    stroke="#94a3b8"
                    fontSize={12}
                    domain={CHART_CONFIG.STRATEGIES.Y_DOMAIN}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine x={0} stroke="#cbd5e1" />
                  <ReferenceLine y={0} stroke="#cbd5e1" />

                  <Line
                    type="monotone"
                    dataKey="affine"
                    name="Best Affine f(x) = λx"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="step"
                    dataKey="nonlinear"
                    name="Witsenhausen f(x) = σ·sgn(x)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="No Control (f(x)=x)"
                    stroke="#e2e8f0"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* NEW CHARTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Chart 2: Cost vs Sigma */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">
                  Cost vs. Initial Variance (σ)
                  <span className="ml-2 text-xs font-normal normal-case opacity-60">(Fixed k={k})</span>
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={costVsSigmaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="sigma"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ value: 'σ', position: 'insideBottomRight', offset: -5 }}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      domain={CHART_CONFIG.COST_VS_SIGMA.Y_DOMAIN}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />

                    <Line
                      type="monotone"
                      dataKey="affineCost"
                      name="Affine Cost"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="nonlinCost"
                      name="Nonlinear Cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="lowerBound"
                      name="Lower Bound"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    {/* Current Sigma Marker */}
                    <ReferenceLine x={sigma} stroke="#f59e0b" strokeDasharray="3 3" label="Current" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 3: Cost vs k */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">
                  Cost vs. Weight (k)
                  <span className="ml-2 text-xs font-normal normal-case opacity-60">(Fixed σ={sigma})</span>
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={costVsKData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="kVal"
                      type="number"
                      domain={[CHART_CONFIG.COST_VS_K.X_MIN, CHART_CONFIG.COST_VS_K.X_MAX]}
                      label={{ value: 'k', position: 'insideBottomRight', offset: -5 }}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      domain={CHART_CONFIG.COST_VS_K.Y_DOMAIN}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />

                    <Line
                      type="monotone"
                      dataKey="affineCost"
                      name="Affine Cost"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="nonlinCost"
                      name="Nonlinear Cost"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="lowerBound"
                      name="Lower Bound"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    {/* Current k Marker */}
                    <ReferenceLine x={k} stroke="#f59e0b" strokeDasharray="3 3" label="Current" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
