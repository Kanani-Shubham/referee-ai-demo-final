import React, { useState } from 'react';
import { UserPreferences, DecisionCategory, DynamicParameter } from '../../types';
import { getDynamicParameters } from '../../services/gemini';

interface DecisionFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isSubmitting: boolean;
}

const CATEGORIES: DecisionCategory[] = ['Tech Stack', 'Career Move', 'Major Purchase', 'Hiring', 'Custom'];

export const DecisionForm: React.FC<DecisionFormProps> = ({ onSubmit, isSubmitting }) => {
  const [phase, setPhase] = useState<'intent' | 'config'>('intent');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [category, setCategory] = useState<DecisionCategory>('Tech Stack');
  const [problemStatement, setProblemStatement] = useState('');
  const [dynamicParams, setDynamicParams] = useState<DynamicParameter[]>([]);
  const [suggestedPriorities, setSuggestedPriorities] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [aiAssisted, setAiAssisted] = useState(true);

  const handleNextPhase = async () => {
    if (!problemStatement.trim()) return;
    setLoadingConfig(true);
    try {
      const { parameters, suggestedPriorities: priorities } = await getDynamicParameters(category, problemStatement);
      setDynamicParams(parameters);
      setSuggestedPriorities(priorities);
      setPhase('config');
    } catch (error) {
      console.error(error);
      alert("Failed to analyze setup. Please try again.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      category,
      problemStatement,
      dynamicParams,
      priorities: selectedPriorities,
    });
  };

  const updateParamValue = (id: string, value: any) => {
    setDynamicParams(prev => prev.map(p => p.id === id ? { ...p, value } : p));
  };

  const togglePriority = (p: string) => {
    setSelectedPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  if (phase === 'intent') {
    return (
      <div className="min-h-screen py-12 px-4 flex justify-center items-center">
        <div className="max-w-2xl w-full space-y-8 glass-card p-8 md:p-12 rounded-3xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">What's the dilemma?</h2>
            <p className="mt-2 text-muted-foreground font-medium">The Referee will build a custom framework for you.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                  category === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <textarea
              required
              rows={5}
              className="appearance-none block w-full px-5 py-4 rounded-2xl border border-border bg-card text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm leading-relaxed"
              placeholder="Describe your situation in detail..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />

            <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-4">
                <div 
                  className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${aiAssisted ? 'bg-primary' : 'bg-muted'}`} 
                  onClick={() => setAiAssisted(!aiAssisted)}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${aiAssisted ? 'translate-x-5' : ''}`}></div>
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground block">AI-Assisted Framework</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Auto-suggest factors and priorities</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNextPhase}
              disabled={loadingConfig || !problemStatement.trim()}
              className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl shadow-primary/20 text-lg font-black text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loadingConfig ? 'Analyzing...' : 'Analyze Requirements'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex justify-center items-center bg-muted/50">
      <div className="max-w-4xl w-full space-y-10 glass-card p-8 md:p-14 rounded-[3rem] shadow-2xl">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setPhase('intent')} 
            className="group text-sm font-bold text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
          >
            <span>←</span> Back to intent
          </button>
          <div className="text-[10px] font-black text-primary uppercase tracking-widest">Phase 2: Fine Tuning</div>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {dynamicParams.map((param) => (
              <div key={param.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">{param.label}</label>
                  <span className="text-xs font-black text-primary">{param.value} {param.unit || ''}</span>
                </div>
                
                {param.type === 'slider' && (
                  <input
                    type="range"
                    min={param.min ?? 0}
                    max={param.max ?? 100}
                    value={param.value}
                    onChange={(e) => updateParamValue(param.id, Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                )}

                {param.type === 'toggle' && (
                  <button
                    type="button"
                    onClick={() => updateParamValue(param.id, !param.value)}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      param.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'
                    }`}
                  >
                    {param.value ? 'Active' : 'Inactive'}
                  </button>
                )}

                {param.type === 'select' && (
                  <select
                    value={param.value}
                    onChange={(e) => updateParamValue(param.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-card border-2 border-border text-xs font-bold outline-none focus:border-primary"
                  >
                    {param.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}

                <p className="text-[10px] text-muted-foreground italic leading-relaxed">{param.reason}</p>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-border">
            <label className="block text-[11px] font-black uppercase text-muted-foreground mb-4 tracking-widest">Core Priorities</label>
            <div className="flex flex-wrap gap-3">
              {suggestedPriorities.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border-2 transition-all ${
                    selectedPriorities.includes(p)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent border-border text-muted-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 rounded-3xl text-xl font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-4"
          >
            {isSubmitting ? 'Analyzing...' : 'Get Judgment ⚖️'}
          </button>
        </form>
      </div>
    </div>
  );
};
