import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './Config/db';
import logger from './Utils/logger';
import analysisRoutes from './Routes/analysis.routes';
import authRoutes from './Routes/auth.routes';
import adminRoutes from './Routes/admin.routes';

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);

app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Fake News Detection API is running...');
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});