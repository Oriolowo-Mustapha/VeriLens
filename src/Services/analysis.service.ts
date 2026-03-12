
// import { searchFactChecks } from './factcheck.service';
import { searchNewsHeadlines } from './news.service';
import { analyzeTextWithAI, analyzeImageWithAI } from './ai.service';
import { uploadToCloudinary } from '../Config/cloudinary';
import { reverseImageSearch } from './reverseimage.service';
import Analysis from '../Models/Analysis';
import logger from '../Utils/logger';

type Prediction = 'Fake' | 'Real' | 'Suspicious';

function extractFactCheckContext(humanClaims: any[]): string {
  return humanClaims.map(c =>
    `Claim: ${c.claimReview?.[0]?.title}. Rating: ${c.claimReview?.[0]?.textualRating}. Publisher: ${c.claimReview?.[0]?.publisher?.name}`
  ).join('\n');
}

function getOfficialFactCheckStatus(humanClaims: any[]): { debunk: boolean; confirm: boolean } {
  let debunk = false, confirm = false;
  for (const c of humanClaims) {
    const rating = c.claimReview?.[0]?.textualRating?.toLowerCase() || '';
    if (rating.includes('false') || rating.includes('fake') || rating.includes('misleading')) debunk = true;
    if (rating.includes('true') || rating.includes('correct') || rating.includes('verified')) confirm = true;
  }
  return { debunk, confirm };
}

function aggregatePrediction(avgScore: number, imageAnalysis: any, official: { debunk: boolean; confirm: boolean }, aiVerdict?: string): { finalScore: number, prediction: Prediction } {
  let finalScore = avgScore;
  if (imageAnalysis) {
    finalScore = (avgScore * 0.6) + (imageAnalysis.alignmentScore * 0.4);
  }
  let prediction: Prediction = 'Suspicious';

  if (official.debunk) {
    prediction = 'Fake';
    finalScore = Math.min(finalScore, 10);
  } else if (official.confirm) {
    prediction = 'Real';
    finalScore = Math.max(finalScore, 95);
  } else {
    // Override based on AI verdict string if available
    if (aiVerdict === 'UNVERIFIED') {
      prediction = 'Suspicious';
      finalScore = Math.min(finalScore, 64); // Ensure it doesn't cross into 'Real'
    } else if (aiVerdict === 'FALSE') {
      prediction = 'Fake';
      finalScore = Math.min(finalScore, 29);
    } else if (aiVerdict === 'REAL' && finalScore >= 65) {
      prediction = 'Real';
    } else {
      // Default score-based logic
      if (finalScore < 30) prediction = 'Fake';
      else if (finalScore >= 65) prediction = 'Real';
      else prediction = 'Suspicious';
    }
  }
  return { finalScore, prediction };
}



export const runFullAnalysis = async (text: string, imageBuffer?: Buffer, userId?: string) => {
  try {
    let imageUrl: string | null = null;
    if (imageBuffer) {
      imageUrl = await uploadToCloudinary(imageBuffer);
    }

    const newsHeadlines = await searchNewsHeadlines(text);

    const [gpt] = await Promise.all([
      analyzeTextWithAI(text, newsHeadlines),
    ]);

    let imageAnalysis: any = null;
    let reverseImage: any = null;
    if (imageUrl) {
      [imageAnalysis, reverseImage] = await Promise.all([
        analyzeImageWithAI(text, imageUrl),
        reverseImageSearch(imageUrl)
      ]);
    }

    const activeResults = [gpt].filter(r => r && typeof r.confidence === 'number' && !isNaN(r.confidence));
    if (activeResults.length === 0) {
      throw new Error('AI models are currently down or returned invalid results. Check your proxy key and model output.');
    }
    const avgScore = activeResults.reduce((sum, r) => sum + r.confidence, 0) / activeResults.length;
    const bestReason = activeResults[0].explanation || activeResults[0].reason || 'No explanation.';
    const aiVerdict = activeResults[0].verdict;

    const { finalScore, prediction } = aggregatePrediction(avgScore, imageAnalysis, { debunk: false, confirm: false }, aiVerdict);

    const record = new Analysis({
      userId,
      content: { text, imageUrl: imageUrl || undefined },
      results: {
        textModel: {
          score: avgScore / 100,
          label: prediction,
          rawResponse: { gpt }
        },
        imageModel: imageAnalysis ? {
          alignmentScore: imageAnalysis.alignmentScore / 100,
          rawResponse: imageAnalysis
        } : undefined,
        reverseImage: reverseImage || undefined,
        finalScore: finalScore / 100,
        prediction,
        newsHeadlines: newsHeadlines,
        breakdown: {
          textAnalysis: bestReason,
          imageAnalysis: imageAnalysis?.reason || (imageUrl ? 'Visual context analyzed.' : 'No image.')
        }
      },
      explanation: `AI Consensus: ${prediction} (${Math.round(finalScore)}% credibility). ` +
        (reverseImage && reverseImage.found ? ` Reverse image search: ${reverseImage.context || 'Image found elsewhere.'}` : '')
    });

    await record.save();

    return {
      verdict: prediction.toUpperCase(),
      confidence: Math.round(finalScore),
      reason: bestReason,
      supporting_sources: newsHeadlines,
      image_analysis: imageAnalysis ? {
        alignmentScore: imageAnalysis.alignmentScore,
        explanation: imageAnalysis.reason
      } : undefined,
      reverse_image: reverseImage || undefined,
      sources_checked: newsHeadlines.length,
      explanation: record.explanation
    };
  } catch (error: any) {
    logger.error(`Master Analysis Error: ${error.message}`);
    throw error;
  }
};