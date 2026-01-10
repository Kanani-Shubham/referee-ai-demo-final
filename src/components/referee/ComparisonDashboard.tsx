import React, { useState, useEffect } from 'react';
import { ComparisonResponse, ComparisonOption, UserPreferences } from '../../types';

interface ComparisonDashboardProps {
  initialData: ComparisonResponse;
  initialPreferences: UserPreferences;
  onRefresh: (newPrefs: UserPreferences) => void;
  isRefreshing: boolean;
  onReset: () => void;
}

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ 
  initialData, 
  initialPreferences, 
  onRefresh, 
  isRefreshing, 
  onReset 
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(prefs) !== JSON.stringify(initialPreferences));
  }, [prefs, initialPreferences]);

  const updateParam = (id: string, value: any) => {
    setPrefs(prev => ({
      ...prev,
      dynamicParams: prev.dynamicParams.map(p => p.id === id ? { ...p, value } : p)
    }));
  };

  return (
    <div className="min-h-screen pb-20 p-4 md:p-10 bg-muted/50">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Referee <span className="text-primary">Judgment</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium max-w-2xl leading-relaxed">
            Scenario: {initialPreferences.problemStatement}
          </p>
        </div>
        <button 
          onClick={onReset} 
          className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-primary border border-border hover:border-primary/50 rounded-full transition-all bg-card"
        >
          Start New Analysis
        </button>
      </header>

      {/* Simulator */}
      <div className="max-w-7xl mx-auto mb-12 glass-card p-6 md:p-8 rounded-3xl sticky top-4 z-20 shadow-xl border border-border/40">
        <div className="flex flex-col xl:flex-row items-end xl:items-center justify-between gap-8">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {prefs.dynamicParams.map(param => (
              <div key={param.id} className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">{param.label}</label>
                {param.type === 'slider' ? (
                  <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl">
                    <input 
                      type="range" min={param.min} max={param.max} value={param.value}
                      onChange={(e) => updateParam(param.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg accent-primary focus:outline-none cursor-pointer"
                    />
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-primary w-10 text-right">{param.value}</span>
                      <span className="text-[10px] font-bold text-primary/70 ml-0.5">{param.unit || ''}</span>
                    </div>
                  </div>
                ) : param.type === 'select' ? (
                  <select
                    value={param.value}
                    onChange={(e) => updateParam(param.id, e.target.value)}
                    className="text-xs font-bold text-foreground bg-muted/50 p-2 rounded-xl border-none outline-none"
                  >
                    {param.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                   <div className="bg-muted/50 p-2 rounded-xl text-xs font-bold text-foreground">
                    {param.value.toString()}
                   </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => onRefresh(prefs)}
            disabled={!hasChanges || isRefreshing}
            className={`whitespace-nowrap px-10 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${
              hasChanges && !isRefreshing 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-primary/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isRefreshing ? 'Recalculating...' : 'Update Simulation'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {initialData.options.map((option, idx) => (
              <OptionCard key={idx} option={option} />
            ))}
          </div>
          
          <div className="glass-card p-10 rounded-[2.5rem] border-l-8 border-primary shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="text-9xl">⚖️</span>
            </div>
            <h3 className="text-2xl font-black text-foreground mb-6">Expert Summary</h3>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium mb-8">
              {initialData.summary}
            </p>
            <div className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-lg shadow-primary/20">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">The Verdict</span>
              <p className="text-xl font-bold mt-2 leading-snug">{initialData.recommendation}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 rounded-[2rem] shadow-xl">
            <h3 className="font-black text-xl text-foreground mb-8 tracking-tight">Trade-off Matrix</h3>
            <div className="space-y-8">
              {['suitability', 'risk', 'cost', 'scalability'].map((metric) => (
                <div key={metric}>
                  <p className="text-[11px] font-black uppercase text-muted-foreground mb-4 tracking-widest">{metric}</p>
                  <div className="space-y-5">
                    {initialData.options.map((opt, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-muted-foreground truncate max-w-[150px]">{opt.name}</span>
                          <span className="text-foreground font-mono">{opt.scores[metric as keyof typeof opt.scores]}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              metric === 'risk' ? 'bg-orange-500' : 
                              metric === 'cost' ? 'bg-red-500' : 
                              'bg-primary'
                            }`}
                            style={{ width: `${opt.scores[metric as keyof typeof opt.scores]}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionCard: React.FC<{ option: ComparisonOption }> = ({ option }) => (
  <div className="glass-card p-8 rounded-[2rem] flex flex-col h-full border border-transparent hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1">
    <div className="mb-6">
      <h3 className="text-xl font-black text-foreground leading-tight mb-3">{option.name}</h3>
      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
        {option.overview}
      </p>
    </div>
    
    <div className="flex flex-wrap gap-2 mb-8">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-muted text-muted-foreground uppercase tracking-wider border border-border">
        Cost: {option.cost_level}
      </span>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-muted text-muted-foreground uppercase tracking-wider border border-border">
        Level: {option.complexity}
      </span>
    </div>

    <div className="space-y-6 flex-1">
      <div>
        <h4 className="text-[10px] font-black uppercase text-green-600 mb-3 tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Key Advantages
        </h4>
        <ul className="text-xs text-muted-foreground space-y-2 font-medium">
          {option.pros.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500">•</span>
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase text-red-500 mb-3 tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Main Trade-offs
        </h4>
        <ul className="text-xs text-muted-foreground space-y-2 font-medium">
          {option.cons.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-400">•</span>
              <span className="leading-relaxed">{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="mt-8 pt-6 border-t border-border">
      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Best Fit For</p>
      <p className="text-sm text-foreground font-bold leading-snug">{option.best_for}</p>
    </div>
  </div>
);
