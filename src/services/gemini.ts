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
    
    return {
      options: (data.options || []).map((opt: any) => ({
        ...opt,
        name: opt.name || "Option",
        overview: opt.overview || "Path analyzed based on your requirements.",
        scores: opt.scores || { suitability: 50, risk: 50, cost: 50, scalability: 50 }
      })),
      summary: data.summary || "The Referee has analyzed your options.",
      recommendation: data.recommendation || "Consider the trade-offs above to make your choice.",
    };
  } catch (error) {
    console.error("Comparison Analysis Error:", error);
    throw error;
  }
}
