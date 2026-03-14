import logger from '../Utils/logger';
import axios from 'axios';
import { extractKeywordsFromClaim } from '../Utils/keywordExtractor';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search';

export const searchNewsHeadlines = async (claim: string) => {
  const keywords = extractKeywordsFromClaim(claim);
  const query = `${claim} ${keywords}`;
  try {
    const params = {
      engine: 'google_news',
      q: query,
      hl: 'en',
      num: 10,
      api_key: SERPAPI_KEY,
    };
    const { data: response } = await axios.get(SERPAPI_ENDPOINT, { params });
    const articles = (response.news_results || []).map((a: any) => ({
      title: a.title,
      source: a.source?.name || a.source || 'Unknown Source',
      snippet: a.snippet,
      date: a.date,
      link: a.link,
    }));
    
    logger.info(`SerpAPI: Found ${articles.length} news articles.`);
    return articles;
  } catch (err: any) {
    logger.error(`SerpAPI News Search Error: ${err.message}`);
    return [];
  }
};
