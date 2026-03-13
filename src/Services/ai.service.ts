
import OpenAI from 'openai';
import logger from '../Utils/logger';

const client = new OpenAI({
  apiKey: process.env.AICC_API_KEY,
  baseURL: process.env.AICC_BASE_URL,
});

export interface AIAnalysisResult {
  verdict: 'REAL' | 'FALSE' | 'SUSPICIOUS' | 'UNVERIFIED';
  confidence: number;
  explanation: string;
  supporting_sources: string[];
}

export interface ImageAnalysisResult {
  alignmentScore: number;
  reason: string;
}

/**
 * Analyze text claim against news articles using GPT-4o
 */
export const analyzeTextWithAI = async (
  claim: string,
  articles: any[],
  model: string = 'gpt-4o'
): Promise<AIAnalysisResult | null> => {
  try {
    const prompt = `
You are a world-class investigative journalist and professional fact-checker specializing in digital misinformation.

USER CLAIM:
"${claim}"

NEWS SOURCES (JSON):
${JSON.stringify(articles.slice(0, 10), null, 2)}

TASK:
Verify the accuracy of the "USER CLAIM" by cross-referencing it with the provided "NEWS SOURCES".

FACT-CHECKING PROTOCOL:
1. SOURCE WEIGHTING:
   - HIGH: Reuters, BBC, AP, CNN, The Guardian, NPR, etc. (Gold Standard)
   - MEDIUM: Specialized media (ESPN, Politico) or regional reputable outlets.
   - LOW: Social media (X, Facebook), blogs, or known tabloid aggregators.

2. VERDICT CRITERIA:
   - REAL: Confirmed by at least TWO HIGH-credibility sources OR one HIGH and multiple MEDIUM sources.
   - FALSE: Explicitly debunked by HIGH/MEDIUM sources OR it's a "Breaking News" style claim (e.g., "Airport under attack", "President dead") that NO high-credibility source is reporting.
   - SUSPICIOUS: Contradictory reports exist, or it's only reported by LOW-credibility sources without corroboration.
   - UNVERIFIED: No relevant information found in the sources or broader context.

3. CONFIDENCE SCORING:
   - 90-100: Multiple independent high-credibility confirmations.
   - 70-89: Strong evidence from reliable sources.
   - 40-69: Mixed evidence or single-source reporting.
   - 0-39: Heavy contradiction or known hoax.

OUTPUT FORMAT (Strict JSON):
{
  "verdict": "REAL | FALSE | SUSPICIOUS | UNVERIFIED",
  "confidence": number (0-100),
  "explanation": "A concise, 3-4 sentence analytical breakdown. Mention specific sources by name.",
  "supporting_sources": ["Source Name 1", "Source Name 2"]
}
`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a professional investigative journalist and fact-checker.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content || '{}';
    const result: AIAnalysisResult = JSON.parse(content);

    // Basic Validation
    if (!result.verdict || typeof result.confidence !== 'number') {
      throw new Error('Invalid AI response structure');
    }

    return result;
  } catch (error: any) {
    logger.error(`Text Analysis AI Error (${model}): ${error.message}`);
    return null;
  }
};

/**
 * Analyze image alignment with claim using GPT-4o Vision
 */
export const analyzeImageWithAI = async (
  text: string, 
  imageUrl: string
): Promise<ImageAnalysisResult | null> => {
  try {
    const currentDate = new Date().toDateString();
    
    const forensicsContext = `
      You are an expert digital forensics analyst.
      DATE: ${currentDate}.
      CLAIM: "${text}"

      ANALYSIS STEPS:
      1. IMAGE-TEXT ALIGNMENT: Does the image actually show what the claim says? (e.g., if claim says "Protest in Paris", does the image have Paris landmarks/French signs?)
      2. CONTEXTUAL INTEGRITY: Is this a recycled image from a different event? Look for seasonal clues, fashion, or old technology.
      3. TECHNICAL ANOMALIES: Look for AI artifacts (distorted hands, nonsensical text, blurred backgrounds) or Photoshop edits (inconsistent lighting, sharp edges).

      SCORING:
      - 0–30: Image is a blatant mismatch, fake, or unrelated.
      - 31–70: Image is generic or provides no specific proof.
      - 71–100: Image provides strong, specific visual evidence for the claim.

      OUTPUT JSON: {"alignmentScore": number, "reason": "string"}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: forensicsContext
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image against the claim: "${text}"` },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{}';
    const result: ImageAnalysisResult = JSON.parse(content);

    if (typeof result.alignmentScore !== 'number') {
      throw new Error('Invalid Vision AI response');
    }

    return result;
  } catch (error: any) {
    logger.error(`Vision Analysis AI Error: ${error.message}`);
    return null;
  }
};