
import React from 'react';

interface PolicyPaneProps {
  resourceId: string;
  before: any;
  after: any;
  showAfter: boolean;
}

const PolicyPane: React.FC<PolicyPaneProps> = ({ resourceId, before, after, showAfter }) => {
  const currentPolicy = showAfter ? after : before;
  
  const jsonString = JSON.stringify(currentPolicy, null, 2);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800">
      <div className="px-4 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <i className="fas fa-file-code text-sky-400"></i>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            IAM Policy: {resourceId}
          </span>
        </div>
        <div className="flex bg-slate-900 rounded-md p-0.5">
          <div className={`px-3 py-1 text-[10px] rounded cursor-default font-bold ${!showAfter ? 'bg-sky-500 text-white' : 'text-slate-500'}`}>
            BEFORE
          </div>
          <div className={`px-3 py-1 text-[10px] rounded cursor-default font-bold ${showAfter ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>
            AFTER
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="mono text-[13px] leading-relaxed">
          {jsonString.split('\n').map((line, i) => {
            const isAdded = showAfter && line.includes('"role":') && !JSON.stringify(before).includes(line.trim());
            return (
              <div key={i} className={`${isAdded ? 'bg-emerald-900/30 text-emerald-300' : 'text-slate-300'}`}>
                <span className="inline-block w-6 text-slate-600 select-none text-[10px]">{i + 1}</span>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
      <div className="px-4 py-2 bg-slate-800/50 text-[10px] text-slate-500 italic border-t border-slate-700">
        gcloud projects get-iam-policy {resourceId} --format=json
      </div>
    </div>
  );
};

export default PolicyPane;
