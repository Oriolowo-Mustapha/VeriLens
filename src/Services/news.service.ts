
import logger from '../Utils/logger';
import axios from 'axios';
import { extractKeywordsFromClaim } from '../Utils/keywordExtractor';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const SERPAPI_ENDPOINT = 'https://serpapi.com/search';

const HIGH_CREDIBILITY = [
  'Reuters', 'BBC', 'CNN', 'The Guardian', 'Financial Times', 'NPR', 'CBC News', 'NBC News', 'Associated Press', 'Time Magazine'
];

const MEDIUM_CREDIBILITY = [
  'ESPN', 'CBS Sports', 'Sky Sports', 'Sports Illustrated', 'Yahoo Sports', 'Politico', 'Al Jazeera', 'The Hill', 'TRT World'
];

const LOW_CREDIBILITY = [
  'Firstpost', 'GiveMeSport', 'The Mirror', 'OneFootball', 'Front Office Sports', 'SportsPro', 'PressTV', 'Times of India', 'Daily Hive',
  'Facebook', 'Twitter', 'X.com', 'Reddit', 'Blog'
];

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
      source: a.source?.name || a.source || '',
      snippet: a.snippet,
      date: a.date,
      link: a.link,
    }));
    const scored = articles.map((a: any) => {
      const sourceName = (a.source || '').toLowerCase();
      let credibility = 'low';

      if (HIGH_CREDIBILITY.some(s => sourceName.includes(s.toLowerCase()))) {
        credibility = 'high';
      } else if (MEDIUM_CREDIBILITY.some(s => sourceName.includes(s.toLowerCase()))) {
        credibility = 'medium';
      } else if (LOW_CREDIBILITY.some(s => sourceName.includes(s.toLowerCase()))) {
        credibility = 'low';
      }

      return { ...a, credibility };
    });
    logger.info(`SerpAPI: Found ${scored.length} news articles.`);
    return scored;
  } catch (err: any) {
    logger.error(`SerpAPI News Search Error: ${err.message}`);
    return [];
  }
};
