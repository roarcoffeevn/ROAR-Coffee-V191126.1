import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export interface ProductTranslationRequest {
  name_vi?: string;
  subtitle_vi?: string;
  description_vi?: string;
  roast_profile_vi?: string;
  tasting_notes_vi?: string;
  blend_summary_vi?: string;
  gallery_captions_vi?: string[];
  variant_labels_vi?: string[];
}

export interface ProductTranslationResponse {
  name_en?: string;
  subtitle_en?: string;
  description_en?: string;
  roast_profile_en?: string;
  tasting_notes_en?: string;
  blend_summary_en?: string;
  gallery_captions_en?: string[];
  variant_labels_en?: string[];
}

export class GeminiTranslationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'GEMINI_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiTranslationError(
      'Chưa cấu hình GEMINI_API_KEY trên máy chủ để tự động dịch AI.',
      503,
      'MISSING_API_KEY'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function translateProductViToEn(
  input: ProductTranslationRequest
): Promise<ProductTranslationResponse> {
  const payload: ProductTranslationRequest = {};
  if (input.name_vi?.trim()) payload.name_vi = input.name_vi.trim();
  if (input.subtitle_vi?.trim()) payload.subtitle_vi = input.subtitle_vi.trim();
  if (input.description_vi?.trim()) payload.description_vi = input.description_vi.trim();
  if (input.roast_profile_vi?.trim()) payload.roast_profile_vi = input.roast_profile_vi.trim();
  if (input.tasting_notes_vi?.trim()) payload.tasting_notes_vi = input.tasting_notes_vi.trim();
  if (input.blend_summary_vi?.trim()) payload.blend_summary_vi = input.blend_summary_vi.trim();
  if (Array.isArray(input.gallery_captions_vi) && input.gallery_captions_vi.length > 0) {
    payload.gallery_captions_vi = input.gallery_captions_vi.map((s) => String(s || '').trim());
  }
  if (Array.isArray(input.variant_labels_vi) && input.variant_labels_vi.length > 0) {
    payload.variant_labels_vi = input.variant_labels_vi.map((s) => String(s || '').trim());
  }

  if (Object.keys(payload).length === 0) {
    return {};
  }

  const ai = getGeminiClient();
  const maxAttempts = 3;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents:
          'Translate the following Vietnamese ROAR COFFEE specialty coffee product fields into natural, accurate, premium English. ' +
          'Preserve brand names (ROAR COFFEE, Signature Reserve), SKUs, technical coffee grading terms (S14, S16, S18, Natural, Honey, CBU Washed, Arabica, Robusta, Phin, Espresso, Crema, COA, MOQ, HORECA), and exact array lengths/order for gallery_captions_vi and variant_labels_vi.\n\n' +
          JSON.stringify(payload, null, 2),
        config: {
          systemInstruction:
            'You are the senior bilingual specialty coffee copywriter for ROAR COFFEE Vietnam. ' +
            'Return ONLY valid JSON matching the schema. Only translate fields present in the input JSON. Keep empty arrays empty.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name_en: { type: Type.STRING, description: 'English translation of name_vi' },
              subtitle_en: { type: Type.STRING, description: 'English translation of subtitle_vi' },
              description_en: { type: Type.STRING, description: 'English translation of description_vi' },
              roast_profile_en: { type: Type.STRING, description: 'English translation of roast_profile_vi' },
              tasting_notes_en: { type: Type.STRING, description: 'English translation of tasting_notes_vi' },
              blend_summary_en: { type: Type.STRING, description: 'English translation of blend_summary_vi' },
              gallery_captions_en: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'English translations matching gallery_captions_vi in the same order',
              },
              variant_labels_en: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'English translations matching variant_labels_vi in the same order',
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as ProductTranslationResponse;
      return parsed;
    } catch (err: any) {
      lastErr = err;
      const status = typeof err?.status === 'number' ? err.status : 502;
      const isTransient = status === 503 || status === 429 || status === 500 || status === 502;
      if (isTransient && attempt < maxAttempts) {
        const delayMs = attempt === 1 ? 600 : 1600;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }
  }

  if (lastErr instanceof GeminiTranslationError) throw lastErr;
  const status = typeof lastErr?.status === 'number' ? lastErr.status : 502;
  let friendlyMsg = 'Không thể kết nối dịch vụ dịch tự động Gemini lúc này. Bạn có thể nhập/sửa Tiếng Anh thủ công.';
  if (status === 400 || status === 403) {
    friendlyMsg = 'API Key Gemini chưa hợp lệ hoặc chưa được cấp quyền (kiểm tra Settings > Secrets).';
  } else if (status === 503 || status === 429) {
    friendlyMsg = 'Hệ thống dịch AI đang tạm thời quá tải, vui lòng thử lại sau vài giây hoặc nhập Tiếng Anh thủ công.';
  }
  throw new GeminiTranslationError(friendlyMsg, status, 'UPSTREAM_ERROR');
}

export interface BaristaChatResponse {
  reply: string;
  recommendedSlugs: string[];
  quickLinks: Array<{ label: string; to: string }>;
}

export async function chatWithRoarBarista(params: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  lang?: 'vi' | 'en';
  catalogSummary?: string;
}): Promise<BaristaChatResponse> {
  const ai = getGeminiClient();
  const isEn = params.lang === 'en';
  const historyText = (params.history || [])
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Customer' : 'ROAR Barista'}: ${m.text}`)
    .join('\n');

  const prompt = `${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Customer: ${params.message}`;

  const timeoutMs = 8000;
  const response = await Promise.race([
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          `You are ROAR COFFEE® Senior AI Barista & Sales Advisor in Vietnam. Reply warmly, accurately, and concisely in ${
            isEn ? 'English' : 'Vietnamese'
          }. ` +
          `You can answer ANY question about ROAR COFFEE: taste/gu uống recommendations, 7 Brand Personalities (Tiger/Hổ, Lion/Sư Tử, Fox/Cáo, Eagle/Đại Bàng, Black Panther/Báo Đen Signature Reserve, Wolf/Sói, Owl/Cú Mèo), ` +
          `exact retail & 5-tier kg wholesale quotes (1kg, 5–19kg, 20–49kg, 50–99kg, ≥100kg) for the 6 Roasted Coffee Bean SKUs, 27 B2B Green Coffee SKUs (S14/S16/S18 Natural/Honey/CBU Washed), brewing methods, promotions/vouchers, shipping fees, and order tracking. ` +
          `Always calculate exact quotes when the customer mentions a kg quantity (e.g. 25kg × tier price/kg). ` +
          `Return JSON with: "reply" (your helpful answer), "recommendedSlugs" (1 to 3 exact product slugs from the catalog context that best match the customer's taste/question), and "quickLinks" (0 to 2 helpful site links such as /coffee/roasted-beans, /coffee/green-beans, /personalities, /brewing, /promotions, /orders/track, /partners).` +
          (params.catalogSummary ? `\n\nLive ROAR COFFEE Catalog & Pricing Context:\n${params.catalogSummary}` : ''),
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Helpful barista response with exact pricing/taste advice' },
            recommendedSlugs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to 3 exact product slugs from the provided catalog context',
            },
            quickLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  to: { type: Type.STRING },
                },
                required: ['label', 'to'],
              },
            },
          },
          required: ['reply'],
        },
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_CHAT_TIMEOUT')), timeoutMs)
    ),
  ]);

  const rawText = (response.text || '{}').trim();
  try {
    const parsed = JSON.parse(rawText);
    return {
      reply: String(parsed.reply || '').trim() || rawText,
      recommendedSlugs: Array.isArray(parsed.recommendedSlugs)
        ? parsed.recommendedSlugs.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 3)
        : [],
      quickLinks: Array.isArray(parsed.quickLinks)
        ? parsed.quickLinks
            .filter((l: any) => l && typeof l.label === 'string' && typeof l.to === 'string' && l.to.startsWith('/'))
            .slice(0, 2)
        : [],
    };
  } catch {
    return { reply: rawText, recommendedSlugs: [], quickLinks: [] };
  }
}


