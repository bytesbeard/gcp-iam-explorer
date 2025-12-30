
import React, { useState, useEffect, useMemo } from 'react';
import { SCENARIOS } from './constants';
import { IAMNode, SimulationState } from './types';
import Canvas from './components/Canvas';
import PolicyPane from './components/PolicyPane';
import { getIAMExplanation, ArchitectInsight } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    activeScenarioId: SCENARIOS[0].id,
    isActionApplied: false,
    selectedNodeId: null,
  });

  const [insight, setInsight] = useState<ArchitectInsight | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const scenario = useMemo(() => 
    SCENARIOS.find(s => s.id === state.activeScenarioId) || SCENARIOS[0]
  , [state.activeScenarioId]);

  const scenarioContextString = useMemo(() => {
    return scenario.initialNodes.map(n => `${n.name} (${n.type})`).join(' -> ');
  }, [scenario]);

  const modifiedPolicy = useMemo(() => {
    const base = JSON.parse(JSON.stringify(scenario.initialPolicy));
    if (!state.isActionApplied) return base;

    if (scenario.id === 'deep-inheritance') {
      base['org'].bindings.push({ role: 'roles/viewer', members: ['user:lead-dev@example.com'] });
    } else if (scenario.id === 'service-accounts') {
      base['p-data'].bindings.push({ role: 'roles/iam.serviceAccountUser', members: ['user:developer@example.com'] });
    } else if (scenario.id === 'iam-deny') {
      base['org'].bindings.push({ 
          role: 'roles/deny.deletion', 
          members: ['user:contractor@example.com'],
          note: 'DENY overrides all Allow policies'
      });
    } else if (scenario.id === 'iam-conditions') {
      base['p-test'].bindings.push({
        role: 'roles/viewer',
        members: ['user:intern@example.com'],
        condition: {
          title: 'Business Hours Only',
          expression: "request.time < timestamp('2025-12-31T17:00:00Z')",
          description: 'Restricts access to standard working hours.'
        }
      });
    }
    return base;
  }, [scenario, state.isActionApplied]);

  const activePolicyResourceId = Object.keys(scenario.initialPolicy)[0];

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsExplaining(true);
      const result = await getIAMExplanation(
        scenario.title, 
        state.isActionApplied, 
        scenario.actionDescription,
        scenarioContextString
      );
      if (typeof result !== 'string') {
        setInsight(result);
      }
      setIsExplaining(false);
    };
    fetchExplanation();
  }, [state.activeScenarioId, state.isActionApplied]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <i className="fas fa-shield-alt text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GCP IAM Explorer</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Advanced Policy Simulator</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setState({ activeScenarioId: s.id, isActionApplied: false, selectedNodeId: null })}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                state.activeScenarioId === s.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Left Column: Context + Canvas + AI Analysis */}
        <div className="flex-[3] flex flex-col gap-6 h-full min-w-0">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between shrink-0">
            <div className="max-w-2xl">
              <h2 className="text-xl font-bold text-slate-800 mb-1">{scenario.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{scenario.description}</p>
            </div>
            <button
              onClick={() => setState(s => ({ ...s, isActionApplied: !s.isActionApplied }))}
              className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 ${
                state.isActionApplied ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-emerald-500 text-white shadow-emerald-200'
              }`}
            >
              <i className={`fas ${state.isActionApplied ? 'fa-undo' : 'fa-play'}`}></i>
              {state.isActionApplied ? 'Reset Scenario' : scenario.actionLabel}
            </button>
          </div>

          <div className="flex-[2] min-h-0">
            <Canvas
              nodes={scenario.initialNodes}
              isActionApplied={state.isActionApplied}
              selectedNodeId={state.selectedNodeId}
              onNodeClick={(id) => setState(s => ({ ...s, selectedNodeId: id }))}
              scenarioId={scenario.id}
            />
          </div>
          
          {/* Architect Analysis: Dedicated bottom panel */}
          <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 ring-1 ring-slate-900/5 overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <i className="fas fa-robot text-blue-500 text-sm"></i>
                  </div>
                  <span className="text-slate-800 font-extrabold text-xs uppercase tracking-widest">Architect Analysis</span>
                </div>
                {isExplaining && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1">
                  {isExplaining ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl border border-slate-100"></div>
                          ))}
                      </div>
                  ) : insight && (
                      <div className="text-[13px] text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                              <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">🛡️</span> Security
                              </p>
                              <p className="text-slate-600 italic leading-snug">
                                {insight.security}
                              </p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                              <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">🧬</span> Inheritance
                              </p>
                              <p className="text-slate-600 italic leading-snug">
                                {insight.inheritance}
                              </p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                              <p className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-lg">💡</span> Best Practice
                              </p>
                              <p className="text-slate-600 italic leading-snug">
                                {insight.bestPractice}
                              </p>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* Right Column: Policy + Metadata */}
        <div className="w-[480px] flex flex-col gap-6 h-full shrink-0">
          <div className="flex-1 min-h-0">
            <PolicyPane
              resourceId={activePolicyResourceId}
              before={scenario.initialPolicy[activePolicyResourceId]}
              after={modifiedPolicy[activePolicyResourceId]}
              showAfter={state.isActionApplied}
            />
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
              <i className="fas fa-fingerprint text-blue-500"></i>
              Identity Metadata
            </h3>
            {state.selectedNodeId ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Resource / Principal ID</p>
                    <p className="text-xs font-mono text-slate-700 break-all">{state.selectedNodeId}</p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Effective Access Engine</p>
                    <p className="text-[12px] text-slate-700 leading-snug">
                        {state.isActionApplied 
                          ? "Combined evaluation of hierarchical folders and direct project permissions." 
                          : "Baseline evaluation of organization-level constraints."}
                    </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-[11px] text-slate-400 italic">Select a node to inspect attributes.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
