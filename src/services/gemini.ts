import { supabase } from "@/integrations/supabase/client";
import { UserPreferences, ComparisonResponse, DynamicParameter, DecisionCategory } from "../types";

export async function getDynamicParameters(category: DecisionCategory, problemStatement: string): Promise<{ parameters: DynamicParameter[], suggestedPriorities: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('get-parameters', {
      body: { category, problemStatement }
    });

    if (error) {
      console.error("Setup Analysis Error:", error);
      throw error;
    }
    
    return {
      parameters: (data.parameters || []).map((p: any) => ({
        ...p,
        value: p.type === 'slider' ? (p.defaultValue ? Number(p.defaultValue) : ((p.min || 0) + (p.max || 100)) / 2) : p.type === 'toggle' ? false : p.defaultValue || ''
      })) as DynamicParameter[],
      suggestedPriorities: (data.suggestedPriorities || []) as string[]
    };
  } catch (error) {
    console.error("Setup Analysis Error:", error);
    return {
      parameters: [
        { id: 'cost', name: 'cost', label: 'Importance of Cost', type: 'slider', min: 0, max: 100, value: 50, reason: 'Budget is often a key factor.' },
        { id: 'risk', name: 'risk', label: 'Risk Tolerance', type: 'slider', min: 0, max: 100, value: 30, reason: 'Helps balance safety vs innovation.' }
      ] as DynamicParameter[],
      suggestedPriorities: ['Cost Efficiency', 'Reliability', 'Speed', 'Scalability']
    };
  }
}

function normalizeOption(opt: any, index: number): import('../types').ComparisonOption {
  return {
    name: opt?.name || `Option ${index + 1}`,
    overview: opt?.overview || "Path analyzed based on your requirements.",
    pros: Array.isArray(opt?.pros) && opt.pros.length > 0 ? opt.pros : ["Analysis in progress"],
    cons: Array.isArray(opt?.cons) && opt.cons.length > 0 ? opt.cons : ["Trade-offs being evaluated"],
    best_for: opt?.best_for || "Users seeking this approach",
    risks: Array.isArray(opt?.risks) ? opt.risks : [],
    cost_level: ['Low', 'Medium', 'High'].includes(opt?.cost_level) ? opt.cost_level : 'Medium',
    complexity: ['Low', 'Medium', 'High'].includes(opt?.complexity) ? opt.complexity : 'Medium',
    scores: {
      suitability: typeof opt?.scores?.suitability === 'number' ? opt.scores.suitability : 50,
      risk: typeof opt?.scores?.risk === 'number' ? opt.scores.risk : 50,
      cost: typeof opt?.scores?.cost === 'number' ? opt.scores.cost : 50,
      scalability: typeof opt?.scores?.scalability === 'number' ? opt.scores.scalability : 50,
    }
  };
}

export async function compareOptions(prefs: UserPreferences): Promise<ComparisonResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('compare-options', {
      body: { 
        category: prefs.category,
        problemStatement: prefs.problemStatement,
        dynamicParams: prefs.dynamicParams,
        priorities: prefs.priorities
      }
    });

    if (error) {
      console.error("Comparison Analysis Error:", error);
      throw error;
    }

    console.log("Raw comparison data received:", JSON.stringify(data, null, 2));
    
    // Normalize options array - ensure we always have renderable options
    const rawOptions = Array.isArray(data?.options) ? data.options : [];
    const normalizedOptions = rawOptions.length > 0 
      ? rawOptions.map((opt: any, idx: number) => normalizeOption(opt, idx))
      : [];

    // If no options came back, something went wrong - throw to trigger retry
    if (normalizedOptions.length === 0) {
      console.error("No options in response, data was:", data);
      throw new Error("No comparison options returned from analysis");
    }
    
    return {
      options: normalizedOptions,
      summary: data?.summary || "The Referee has analyzed your options based on the provided constraints and priorities.",
      recommendation: data?.recommendation || "Review the detailed comparison above to make your decision.",
    };
  } catch (error) {
    console.error("Comparison Analysis Error:", error);
    throw error;
  }
}
