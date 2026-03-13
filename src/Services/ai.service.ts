
import OpenAI from 'openai';
import logger from '../Utils/logger';

const client = new OpenAI({
  apiKey: process.env.AICC_API_KEY,
  baseURL: process.env.AICC_BASE_URL,
});


export const analyzeTextWithAI = async (
  claim: string,
  articles: any[],
  model: string = 'gpt-4o'
) => {
  try {
    const prompt = `You are a professional fact-checking AI.

User Claim:
"${claim}"

News Sources (each contains a 'credibility' field of high, medium, or low):
${JSON.stringify(articles, null, 2)}

Task:
1. Determine if the claim is supported by credible news sources. Prioritize 'high' credibility sources, then 'medium'. Treat 'low' credibility sources with skepticism (aggregators, social media, or blogs).
2. If multiple high/medium credibility sources confirm it → REAL (Confidence: 70-100).
3. If high/medium sources contradict it → FALSE (Confidence: 0-30).
4. If there are only low credibility sources or evidence is insufficient → UNVERIFIED (Confidence: 40-60).

IMPORTANT:
- If NO high or medium credibility news sources are found in the provided list, you MUST NOT label the claim as REAL.
- A claim supported ONLY by low-credibility sources should be UNVERIFIED or SUSPICIOUS.
- A claim without evidence is UNVERIFIED by default, unless you have strong internal knowledge that it is a known hoax (FALSE) or a known fact (REAL).
- If you mark it as UNVERIFIED, the confidence score must be between 40 and 60.

Output JSON:
{
 "verdict": "REAL | FALSE | UNVERIFIED",
 "confidence": 0-100,
 "explanation": "Provide a detailed reason for your verdict, specifically mentioning the presence or absence of news sources.",
 "supporting_sources": []
}`;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a professional fact-checking AI.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    let content = completion.choices[0].message.content || '{}';
    content = content.trim().replace(/^```json|^```|```$/g, '').trim();
    return JSON.parse(content);
  } catch (error: any) {
    logger.error(`Fact-Check AI Error (${model}): ${error.message}`);
    return null;
  }
};

export const analyzeImageWithAI = async (text: string, imageUrl: string) => {
  try {
    const currentDate = new Date().toDateString();
    
    const forensicsContext = `
      You are an expert digital forensics analyst and investigative journalist.
      TODAY'S DATE: ${currentDate}.
      Your task is to determine whether the provided image supports the news claim.

      Evaluation steps:
      1. Analyze the image content carefully.
      2. Determine whether the image context matches the claim.
      3. Check if the image appears reused, misleading, staged, or unrelated.
      4. Identify signs of manipulation, editing, or AI generation.
      5. Evaluate whether the visual evidence strengthens or weakens the credibility of the claim.

      Scoring rules:
      - 0–40 → Image contradicts the claim
      - 41–70 → Image is unclear or weak evidence
      - 71–100 → Image strongly supports the claim
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `${forensicsContext}\n\nReturn ONLY a valid JSON object: {\"alignmentScore\": number, \"reason\": \"Detailed analysis\"}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image in relation to the claim: "${text}"` },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });
    let content = completion.choices[0].message.content || '{}';
    // Remove markdown code block markers if present
    content = content.trim().replace(/^```json|^```|```$/g, '').trim();
    return JSON.parse(content);
  } catch (error: any) {
    logger.error(`Expert Vision Analysis Error: ${error.message}`);
    return null;
  }
};