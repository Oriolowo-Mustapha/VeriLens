import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../Types';
import logger from '../Utils/logger';

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, index: true },
  refreshToken: { type: String },
  resetPasswordToken: { type: String, index: true },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  try {
    logger.debug(`Hashing password for user: ${this.email}`);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    logger.debug(`Password successfully hashed for user: ${this.email}`);
  } catch (err: any) {
    logger.error(`Error hashing password for user ${this.email}: ${err.message}`);
    throw err;
  }
});

export default mongoose.model<IUser>('User', UserSchema);
