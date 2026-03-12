import mongoose, { Schema } from 'mongoose';
import { IAnalysis } from '../Types';

const AnalysisSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: {
    text: { type: String, required: true },
    headline: { type: String },
    imageUrl: { type: String },
  },
  results: {
    textModel: {
      score: { type: Number, required: true },
      label: { type: String, required: true },
      rawResponse: { type: Object },
    },
    imageModel: {
      alignmentScore: { type: Number },
      manipulationScore: { type: Number },
      rawResponse: { type: Object },
    },
    finalScore: { type: Number, required: true },
    prediction: { type: String, enum: ['Fake', 'Real', 'Suspicious'], required: true },
    humanFactChecks: { type: [Object], default: [] },
    newsHeadlines: { type: [Object], default: [] },
    breakdown: {
      textAnalysis: { type: String },
      imageAnalysis: { type: String },
    },
  },
  explanation: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);