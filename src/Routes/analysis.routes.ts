import { Router } from 'express';
import { analyzeNews, getUserHistory } from '../Controllers/analysis.controller';
import upload from '../Middleware/upload';
import { auth } from '../Middleware/auth';

const router = Router();

router.post('/analyze', auth, upload.single('image'), analyzeNews);

router.get('/history', auth, getUserHistory);

export default router;
