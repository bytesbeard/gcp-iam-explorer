
import React, { useState, useEffect, useMemo } from 'react';
import { SCENARIOS } from './constants';
import { IAMNode, SimulationState } from './types';
import Canvas from './components/Canvas';
import PolicyPane from './components/PolicyPane';
import { getIAMExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    activeScenarioId: SCENARIOS[0].id,
    isActionApplied: false,
    selectedNodeId: null,
  });

  const [explanation, setExplanation] = useState<string>("Loading IAM context...");
  const [isExplaining, setIsExplaining] = useState(false);

  const scenario = useMemo(() => 
    SCENARIOS.find(s => s.id === state.activeScenarioId) || SCENARIOS[0]
  , [state.activeScenarioId]);

  const modifiedPolicy = useMemo(() => {
    const base = JSON.parse(JSON.stringify(scenario.initialPolicy));
    if (!state.isActionApplied) return base;

    if (scenario.id === 'deep-inheritance') {
      base['org'].bindings.push({ role: 'roles/viewer', members: ['user:lead-dev@example.com'] });
    } else if (scenario.id === 'service-accounts') {
      // Identity acting as another identity
      base['p-data'].bindings.push({ role: 'roles/iam.serviceAccountUser', members: ['user:developer@example.com'] });
    } else if (scenario.id === 'iam-deny') {
      // In actual GCP this is a separate DenyPolicy resource, but we'll show it in policy for sim
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
      const msg = await getIAMExplanation(scenario.title, state.isActionApplied, scenario.actionDescription);
      setExplanation(msg);
      setIsExplaining(false);
    };
    fetchExplanation();
  }, [state.activeScenarioId, state.isActionApplied]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-shield-alt text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GCP IAM Explorer</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Advanced Scenarios</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setState({ activeScenarioId: s.id, isActionApplied: false, selectedNodeId: null })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                state.activeScenarioId === s.id
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-6 gap-6">
        <div className="flex-1 flex flex-col gap-6 h-full min-w-0">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-slate-800 mb-1">{scenario.title}</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{scenario.description}</p>
            </div>
            <button
              onClick={() => setState(s => ({ ...s, isActionApplied: !s.isActionApplied }))}
              className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                state.isActionApplied ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              <i className={`fas ${state.isActionApplied ? 'fa-undo' : 'fa-play'}`}></i>
              {state.isActionApplied ? 'Reset' : scenario.actionLabel}
            </button>
          </div>

          <div className="flex-1 relative min-h-0">
            <Canvas
              nodes={scenario.initialNodes}
              isActionApplied={state.isActionApplied}
              selectedNodeId={state.selectedNodeId}
              onNodeClick={(id) => setState(s => ({ ...s, selectedNodeId: id }))}
              scenarioId={scenario.id}
            />
            
            <div className="absolute top-4 right-4 w-72">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase">
                        <i className="fas fa-robot text-blue-500"></i>
                        Architect Analysis
                    </div>
                    {isExplaining ? (
                        <div className="space-y-2">
                            <div className="h-2 bg-slate-100 animate-pulse rounded"></div>
                            <div className="h-2 bg-slate-100 animate-pulse rounded w-5/6"></div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-600 leading-normal space-y-2">
                            {explanation}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        <div className="w-[450px] flex flex-col gap-6 h-full shrink-0">
          <div className="flex-1 min-h-0">
            <PolicyPane
              resourceId={activePolicyResourceId}
              before={scenario.initialPolicy[activePolicyResourceId]}
              after={modifiedPolicy[activePolicyResourceId]}
              showAfter={state.isActionApplied}
            />
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
              <i className="fas fa-fingerprint text-blue-500"></i>
              Identity Details
            </h3>
            {state.selectedNodeId ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Resource ID</p>
                    <p className="text-xs font-mono text-slate-700">{state.selectedNodeId}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Effective Access</p>
                    <p className="text-[11px] text-blue-800 italic">
                        {state.isActionApplied ? "Inheriting roles from parent + direct bindings." : "Only inheriting default organizational roles."}
                    </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Select a component to view metadata.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
