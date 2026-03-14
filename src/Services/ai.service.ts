
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
1. AUTONOMOUS SOURCE JUDGMENT: You are responsible for identifying the credibility of each news source yourself based on its name and reputation. High-credibility sources should be prioritized, but you must also weigh smaller or niche sources fairly.

2. VERDICT CRITERIA:
   - REAL: The claim is supported by high-credibility news sources. OR, if high-credibility sources are not present, the claim is supported by a large number of lower-credibility sources (consensus is strong).
   - FALSE: The claim is explicitly debunked by news sources. OR, if NO news sources discuss the claim at all, or if the claim contradicts what all news sources are reporting, it is FALSE.
   - SUSPICIOUS: Contradictory reports exist across sources.
   - UNVERIFIED: Use only if the evidence is truly ambiguous or inconclusive.

3. CONFIDENCE SCORING:
   - 90-100: Multiple independent high-credibility confirmations.
   - 70-89: Strong evidence from multiple sources or a solid consensus.
   - 40-69: Mixed evidence or single-source reporting.
   - 0-39: Heavy contradiction or a "silence" where reporting would be expected.

OUTPUT FORMAT (Strict JSON):
{
  "verdict": "REAL | FALSE | SUSPICIOUS | UNVERIFIED",
  "confidence": number (0-100),
  "explanation": "A concise, 3-4 sentence analytical breakdown. Discuss the quality and quantity of the sources and explain why the verdict was chosen.",
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