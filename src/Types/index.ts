import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
  verificationToken?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
}

export interface IAnalysis extends Document {
  userId?: Types.ObjectId;
  content: {
    text: string;
    headline?: string;
    imageUrl?: string;
  };
  results: {
    textModel: {
      score: number;
      label: string;
      rawResponse?: any;
    };
    imageModel?: {
      alignmentScore?: number;
      manipulationScore?: number;
      rawResponse?: any;
    };
    finalScore: number;
    prediction: 'Fake' | 'Real' | 'Suspicious';
    humanFactChecks?: any[];
    newsHeadlines?: any[];
    breakdown?: {
      textAnalysis: string;
      imageAnalysis?: string;
    };
  };
  explanation?: string;
  createdAt: Date;
}