
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
    const prompt = `
You are an expert investigative journalist and professional fact-checker.

User Claim:
"${claim}"

News Sources (each contains a credibility field: high, medium, low):
${JSON.stringify(articles, null, 2)}

Your task is to verify the claim using the provided sources.

FACT-CHECKING RULES:

1. HIGH credibility sources (BBC, Reuters, AP, CNN) are the most reliable.
2. MEDIUM credibility sources are somewhat reliable.
3. LOW credibility sources (blogs, aggregators, tabloids, social media) are weak evidence.

DECISION LOGIC:

REAL
- At least TWO high credibility sources confirm the claim.
- Or one high credibility source and multiple medium sources confirm it.
Confidence: 70–100.

FALSE
- High credibility sources contradict the claim.
- OR the claim describes a major dramatic event (terror attack, hostage situation, airport takeover, war declaration, etc.) and NO high credibility source confirms it.
Confidence: 70–100.

SUSPICIOUS
- Evidence is mixed.
- Only medium credibility sources mention the claim.
Confidence: 40–60.

UNVERIFIED
- No sources discuss the claim at all.
Confidence: 30–50.

IMPORTANT RULES:
- Never mark REAL if only low credibility sources mention the claim.
- If a dramatic claim lacks confirmation from major news organizations, classify it as FALSE.
- Prefer evidence-based reasoning rather than speculation.

Return ONLY valid JSON:

{
 "verdict": "REAL | FALSE | SUSPICIOUS | UNVERIFIED",
 "confidence": number,
 "reason": "Explain why the claim was classified this way.",
 "supporting_sources": []
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