/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AiChatMessage, AiFoodAnalysisResult, DetectedFoodItem, MealRecommendation } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const CLIENT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

/**
 * Call Gemini API directly from browser if running on static hosts like GitHub Pages
 */
async function callDirectGemini(payload: any): Promise<string> {
  if (!CLIENT_GEMINI_KEY) {
    throw new Error('No Gemini API key available on client.');
  }

  let lastError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CLIENT_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Direct model ${model} returned error:`, errJson);
        lastError = new Error(errJson?.error?.message || `Model error ${res.status}`);
      }
    } catch (err: any) {
      console.warn(`Direct model ${model} network error:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

export const AiClientService = {
  /**
   * 1. Food Photo Analysis
   */
  async analyzeFoodPhoto(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    userHint?: string
  ): Promise<AiFoodAnalysisResult & { isDemoFallback?: boolean }> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // Step A: Attempt server-side proxy endpoint first (if backend is deployed)
    try {
      const response = await fetch(`${API_BASE}/api/ai/analyze-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType,
          userHint: userHint?.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { ...data, rawImagePreview: imageBase64, isDemoFallback: false };
      }
    } catch {
      // Backend unreachable (typical for static GitHub Pages)
    }

    // Step B: Direct client-side Gemini call if VITE_GEMINI_API_KEY is available
    if (CLIENT_GEMINI_KEY) {
      try {
        const systemPrompt = `You are a professional nutrition scientist and visual food analysis engine.
Analyze the food photograph provided and identify individual food components or dishes.
Pay special attention to Asian, Filipino, Western, and global dishes.
User notes/hint: ${userHint || 'None'}

Return ONLY a JSON object strictly matching this schema:
{
  "foods": [
    {
      "name": "dish name",
      "estimatedServingGrams": 150,
      "unit": "g",
      "calories": 250,
      "proteinGrams": 20,
      "carbohydratesGrams": 15,
      "fatGrams": 8,
      "fiberGrams": 2,
      "confidence": 0.85
    }
  ],
  "total": {
    "calories": 250,
    "proteinGrams": 20,
    "carbohydratesGrams": 15,
    "fatGrams": 8
  },
  "notes": "detected items explanation"
}`;

        const rawText = await callDirectGemini({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                { text: systemPrompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(rawText);
        const foods: DetectedFoodItem[] = Array.isArray(parsed.foods)
          ? parsed.foods.map((food: any, idx: number) => ({
              id: `detected-${Date.now()}-${idx}`,
              name: String(food.name || 'Identified Dish'),
              estimatedServingGrams: Math.round(Number(food.estimatedServingGrams) || 120),
              unit: String(food.unit || 'g'),
              calories: Math.round(Number(food.calories) || 0),
              proteinGrams: Number((Number(food.proteinGrams) || 0).toFixed(1)),
              carbohydratesGrams: Number((Number(food.carbohydratesGrams) || 0).toFixed(1)),
              fatGrams: Number((Number(food.fatGrams) || 0).toFixed(1)),
              fiberGrams: Number((Number(food.fiberGrams) || 0).toFixed(1)),
              confidence: Math.min(1, Math.max(0.1, Number(food.confidence) || 0.85)),
              selected: true,
            }))
          : [];

        const total = {
          calories: Math.round(
            Number(parsed.total?.calories) ||
              foods.reduce((sum, f) => sum + f.calories, 0)
          ),
          proteinGrams: Number(
            (
              Number(parsed.total?.proteinGrams) ||
              foods.reduce((sum, f) => sum + f.proteinGrams, 0)
            ).toFixed(1)
          ),
          carbohydratesGrams: Number(
            (
              Number(parsed.total?.carbohydratesGrams) ||
              foods.reduce((sum, f) => sum + f.carbohydratesGrams, 0)
            ).toFixed(1)
          ),
          fatGrams: Number(
            (
              Number(parsed.total?.fatGrams) ||
              foods.reduce((sum, f) => sum + f.fatGrams, 0)
            ).toFixed(1)
          ),
        };

        return {
          foods,
          total,
          notes: parsed.notes || 'Visual food estimate generated via direct Gemini API.',
          disclaimer:
            'AI nutrition estimates are approximate. Please verify serving sizes and nutrition information when accuracy is important.',
          rawImagePreview: imageBase64,
          isDemoFallback: false,
        };
      } catch (err) {
        console.warn('Direct client-side Gemini analysis failed:', err);
      }
    }

    // Step C: Fallback when neither server nor Gemini API key is configured
    const dishName = userHint?.trim() || 'Chicken Adobo Plate with Rice';
    return {
      foods: [
        {
          id: `detected-${Date.now()}-0`,
          name: dishName,
          estimatedServingGrams: 280,
          unit: 'g',
          calories: 520,
          proteinGrams: 36,
          carbohydratesGrams: 48,
          fatGrams: 18,
          fiberGrams: 1.5,
          confidence: 0.82,
          selected: true,
        },
      ],
      total: {
        calories: 520,
        proteinGrams: 36,
        carbohydratesGrams: 48,
        fatGrams: 18,
      },
      notes:
        '⚠️ Static Preview Mode: Running without an active AI server. To enable real visual analysis on GitHub Pages, add VITE_GEMINI_API_KEY to your GitHub Secrets.',
      disclaimer:
        'AI nutrition estimates are approximate. Please verify serving sizes and nutrition information when accuracy is important.',
      rawImagePreview: imageBase64,
      isDemoFallback: true,
    };
  },

  /**
   * 2. Conversational AI Chat Assistant
   */
  async chatWithAi(
    messages: AiChatMessage[],
    context: any
  ): Promise<{ content: string; isDemoFallback?: boolean }> {
    // Step A: Attempt server-side proxy endpoint first
    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { content: data.content, isDemoFallback: false };
      }
    } catch {
      // Backend unreachable
    }

    // Step B: Direct client-side Gemini call if VITE_GEMINI_API_KEY is available
    if (CLIENT_GEMINI_KEY) {
      try {
        const systemInstruction = `You are NutriTrack AI, an encouraging, scientifically grounded nutrition and dietary advisor.
The user is tracking their nutrition with the following live profile:
- Daily Calorie Target: ${context?.dailyTarget || 'Not set'} kcal
- Calories Consumed Today: ${context?.consumed?.calories || 0} kcal
- Calories Remaining Today: ${context?.remaining?.calories || 0} kcal
- Remaining Macros: Protein: ${context?.remaining?.protein || 0}g, Carbs: ${context?.remaining?.carbohydrates || 0}g, Fat: ${context?.remaining?.fat || 0}g
- User Goal: ${context?.goal || 'Maintain healthy weight'}
- Dietary Preferences: ${context?.dietaryPreferences?.join(', ') || 'None specified'}
- Allergies: ${context?.allergies?.join(', ') || 'None'}
- Recent Meals Logged Today: ${context?.loggedMeals?.map((m: any) => `${m.foodName} (${m.calories} kcal)`).join(', ') || 'None'}

GUIDELINES:
1. Always base recommendations on the user's remaining calorie and macro budget.
2. Provide practical, appetizing meal ideas. Include Filipino and Asian dishes when appropriate.
3. Be supportive, concise, actionable, and formatted with bullet points.`;

        const contents = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'Understood. I will provide accurate nutrition advice.' }] },
          ...messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
        ];

        const text = await callDirectGemini({
          contents,
          generationConfig: { temperature: 0.6 },
        });

        return { content: text, isDemoFallback: false };
      } catch (err) {
        console.warn('Direct client-side Gemini chat failed:', err);
      }
    }

    // Step C: Fallback message
    const remCals = context?.remaining?.calories ?? 650;
    const remProtein = context?.remaining?.protein ?? 45;
    const remCarbs = context?.remaining?.carbohydrates ?? 60;
    const remFat = context?.remaining?.fat ?? 20;

    return {
      content: `*(Running in static preview mode)*\n\nBased on your remaining budget of **${remCals} kcal** (Protein: **${remProtein}g**, Carbs: **${remCarbs}g**, Fat: **${remFat}g**):\n\n- **Tinolang Manok & 1/2 Cup Rice**: ~340 kcal, 30g Protein\n- **Sinigang na Hipon (Shrimp Sour Soup)**: ~220 kcal, 25g Protein\n- **Tofu & Vegetables with Boiled Egg**: ~280 kcal, 22g Protein\n\n> 💡 *Note: To activate live conversational AI on GitHub Pages, add \`VITE_GEMINI_API_KEY\` to your GitHub Repository Secrets.*`,
      isDemoFallback: true,
    };
  },

  /**
   * 3. Meal Recommendations
   */
  async recommendMeals(params: {
    remaining: any;
    goal?: string;
    preferences?: string[];
    allergies?: string[];
    mealType?: string;
  }): Promise<{ recommendations: MealRecommendation[]; isDemoFallback?: boolean }> {
    // Step A: Attempt server-side proxy
    try {
      const response = await fetch(`${API_BASE}/api/ai/recommend-meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return { recommendations: data.recommendations, isDemoFallback: false };
        }
      }
    } catch {
      // Backend unreachable
    }

    // Step B: Direct client-side Gemini if VITE_GEMINI_API_KEY is available
    if (CLIENT_GEMINI_KEY) {
      try {
        const prompt = `Generate 3 personalized meal recommendations for a user with:
- Remaining Calories: ${params.remaining?.calories || 600} kcal
- Remaining Protein: ${params.remaining?.protein || 35}g
- Remaining Carbs: ${params.remaining?.carbohydrates || 50}g
- Remaining Fat: ${params.remaining?.fat || 15}g
- Meal Type: ${params.mealType || 'dinner'}
- Dietary Preferences: ${params.preferences?.join(', ') || 'Filipino / Asian'}

Return ONLY a JSON object strictly matching:
{
  "recommendations": [
    {
      "id": "rec-1",
      "title": "string",
      "mealType": "${params.mealType || 'dinner'}",
      "calories": number,
      "protein": number,
      "carbohydrates": number,
      "fat": number,
      "fiber": number,
      "servingSize": "string",
      "ingredients": ["string"],
      "instructions": "string",
      "tags": ["string"],
      "reason": "string"
    }
  ]
}`;

        const raw = await callDirectGemini({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
          return { recommendations: parsed.recommendations, isDemoFallback: false };
        }
      } catch (err) {
        console.warn('Direct client-side Gemini recommendation failed:', err);
      }
    }

    // Step C: Fallback calibrated defaults
    const cals = params.remaining?.calories || 600;
    const protein = params.remaining?.protein || 35;
    const carbs = params.remaining?.carbohydrates || 50;
    const fat = params.remaining?.fat || 15;

    return {
      recommendations: [
        {
          id: `rec-default-1`,
          title: 'Grilled Chicken Inasal with Garlic Brown Rice & Atchara',
          mealType: (params.mealType as any) || 'dinner',
          calories: Math.min(cals, 480),
          protein: Math.max(25, Math.min(protein, 42)),
          carbohydrates: Math.max(20, Math.min(carbs, 46)),
          fat: Math.max(8, Math.min(fat, 12)),
          fiber: 4,
          servingSize: '1 grilled chicken breast + 1 cup brown rice',
          ingredients: [
            'Boneless skinless chicken breast',
            'Calamansi & garlic marinade with atsuete',
            'Steamed brown garlic rice',
            'Pickled papaya (atchara)',
          ],
          instructions:
            'Pan-sear seasoned chicken breast until cooked through. Plate over warm garlic brown rice alongside tangy atchara.',
          tags: ['High Protein', 'Filipino', 'Lean'],
          reason: `Maximizes high-satiety protein while staying neatly under your ${cals} kcal ceiling.`,
        },
        {
          id: `rec-default-2`,
          title: 'Sinigang na Hipon (Shrimp Tamarind Soup with Water Spinach)',
          mealType: (params.mealType as any) || 'dinner',
          calories: Math.min(cals, 240),
          protein: Math.max(20, Math.min(protein, 28)),
          carbohydrates: Math.max(8, Math.min(carbs, 14)),
          fat: Math.max(4, Math.min(fat, 5)),
          fiber: 4,
          servingSize: '1 large bowl with broth & vegetables',
          ingredients: [
            'Fresh peeled shrimp',
            'Tamarind sour broth base',
            'Kangkong (water spinach)',
            'White radish (labanos)',
            'Tomatoes & green long pepper',
          ],
          instructions:
            'Simmer tamarind soup base with tomatoes and radish. Add shrimp and kangkong right before removing from heat.',
          tags: ['Low Calorie', 'Filipino Classic', 'Hydrating'],
          reason: 'Low in fat and carbohydrates while delivering 28g of clean protein.',
        },
      ],
      isDemoFallback: true,
    };
  },
};
