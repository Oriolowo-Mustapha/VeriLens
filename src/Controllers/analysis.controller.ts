import { Request, Response } from 'express';
import { runFullAnalysis } from '../Services/analysis.service';
import Analysis from '../Models/Analysis';
import logger from '../Utils/logger';
import { AuthRequest } from '../Middleware/auth';

export const analyzeNews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const imageFile = req.file;
    const userId = req.user?.id;

    if (!text) {
      res.status(400).json({ error: 'Text content is required for analysis.' });
      return;
    }

    const result = await runFullAnalysis(text, imageFile?.buffer, userId);
    res.json(result);
  } catch (error: any) {
    logger.error(`Analysis Controller Error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error during analysis.' });
  }
};

export const getUserHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized access to history.' });
      return;
    }

    const history = await Analysis.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error: any) {
    logger.error(`History Fetch Error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error fetching history.' });
  }
};
