import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai@^1.35.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          overview: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          best_for: { type: Type.STRING },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          cost_level: { type: Type.STRING },
          complexity: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              suitability: { type: Type.INTEGER },
              risk: { type: Type.INTEGER },
              cost: { type: Type.INTEGER },
              scalability: { type: Type.INTEGER },
            },
            required: ["suitability", "risk", "cost", "scalability"],
          },
        },
        required: ["name", "overview", "pros", "cons", "best_for", "risks", "cost_level", "complexity", "scores"],
      },
    },
    summary: { type: Type.STRING },
    recommendation: { type: Type.STRING },
  },
  required: ["options", "summary", "recommendation"],
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

async function callGemini(prompt: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: comparisonSchema,
      maxOutputTokens: 4000,
      systemInstruction: "You are The Referee, a neutral decision analyst. Return strictly valid JSON.",
    },
  });

  return extractJSON(response.text ?? '');
}

async function callGroq(prompt: string) {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const jsonSchema = `
    {
      "options": [
        {
          "name": "string",
          "overview": "string",
          "pros": ["string array"],
          "cons": ["string array"],
          "best_for": "string",
          "risks": ["string array"],
          "cost_level": "Low|Medium|High",
          "complexity": "Low|Medium|High",
          "scores": {
            "suitability": 0-100,
            "risk": 0-100,
            "cost": 0-100,
            "scalability": 0-100
          }
        }
      ],
      "summary": "string",
      "recommendation": "string"
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
        { role: 'system', content: `You are The Referee, a neutral decision analyst. Return strictly valid JSON following this schema: ${jsonSchema}` },
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
    const { category, problemStatement, dynamicParams, priorities } = await req.json();

    const paramSummary = dynamicParams
      .map((p: any) => `- ${p.label}: ${p.value} ${p.unit || ''}`)
      .join("\n");

    const prompt = `
      Dilemma: "${problemStatement}"
      Category: "${category}"
      Constraints:
      ${paramSummary}
      Priorities: ${priorities.join(", ")}

      Identify and score 2-3 distinct, viable options. Provide a clear recommendation.
    `;
    
    let data;
    try {
      console.log('Trying Gemini API...');
      data = await callGemini(prompt);
    } catch (geminiError: any) {
      const errorStr = geminiError?.message || String(geminiError);
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        console.log('Gemini rate limited, falling back to Groq...');
        data = await callGroq(prompt);
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
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
