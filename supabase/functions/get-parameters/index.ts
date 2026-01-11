import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai@^1.35.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parameterGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    parameters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING },
          min: { type: Type.NUMBER },
          max: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          reason: { type: Type.STRING },
          defaultValue: { type: Type.STRING },
        },
        required: ['id', 'name', 'label', 'type', 'reason'],
      },
    },
    suggestedPriorities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    }
  },
  required: ['parameters', 'suggestedPriorities'],
};

function extractJSON(text: string): any {
  if (!text) return {};
  
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const startObj = cleaned.indexOf('{');
    const endObj = cleaned.lastIndexOf('}');
    const startArr = cleaned.indexOf('[');
    const endArr = cleaned.lastIndexOf(']');

    let jsonContent = '';
    if (startObj !== -1 && endObj !== -1 && (startArr === -1 || startObj < startArr)) {
      jsonContent = cleaned.substring(startObj, endObj + 1);
    } else if (startArr !== -1 && endArr !== -1) {
      jsonContent = cleaned.substring(startArr, endArr + 1);
    }

    if (!jsonContent) return {};

    try {
      return JSON.parse(jsonContent);
    } catch (innerError) {
      return {};
    }
  }
}

async function callGemini(category: string, problemStatement: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Analyze this decision intent:
    Category: ${category}
    Problem: "${problemStatement}"
    
    Identify 4-6 key parameters. Use standard numeric ranges (e.g., 0-100 or specific units like USD where relevant).
    Available types: 'slider', 'toggle', 'select'.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: parameterGenerationSchema,
      systemInstruction: "You are The Referee. Provide strictly valid JSON following the schema. Be precise and objective.",
    },
  });

  return extractJSON(response.text ?? '');
}

async function callGroq(category: string, problemStatement: string) {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
  
  const prompt = `
    Analyze this decision intent:
    Category: ${category}
    Problem: "${problemStatement}"
    
    Identify 4-6 key parameters. Use standard numeric ranges (e.g., 0-100 or specific units like USD where relevant).
    Available types: 'slider', 'toggle', 'select'.
    
    Return JSON with this exact structure:
    {
      "parameters": [
        {
          "id": "string",
          "name": "string",
          "label": "string",
          "type": "slider|toggle|select",
          "min": number (for sliders),
          "max": number (for sliders),
          "unit": "string (optional)",
          "options": ["string array for select type"],
          "reason": "string explaining why this parameter matters",
          "defaultValue": "string"
        }
      ],
      "suggestedPriorities": ["array of priority strings"]
    }
  `;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are The Referee. Provide strictly valid JSON. Be precise and objective.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const result = await response.json();
  return extractJSON(result.choices[0]?.message?.content ?? '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, problemStatement } = await req.json();
    
    let data;
    try {
      console.log('Trying Gemini API...');
      data = await callGemini(category, problemStatement);
    } catch (geminiError: any) {
      const errorStr = geminiError?.message || String(geminiError);
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        console.log('Gemini rate limited, falling back to Groq...');
        data = await callGroq(category, problemStatement);
      } else {
        throw geminiError;
      }
    }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      parameters: [
        { id: 'cost', name: 'cost', label: 'Importance of Cost', type: 'slider', min: 0, max: 100, reason: 'Budget is often a key factor.' },
        { id: 'risk', name: 'risk', label: 'Risk Tolerance', type: 'slider', min: 0, max: 100, reason: 'Helps balance safety vs innovation.' }
      ],
      suggestedPriorities: ['Cost Efficiency', 'Reliability', 'Speed', 'Scalability']
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
