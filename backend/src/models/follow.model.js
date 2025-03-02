import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    followerUsername: { type: String, ref: 'User' },
    followedUsername: { type: String, ref: 'User' },
  },
  { timestamps: true }
);

export const Follow = mongoose.model("Follow", followSchema);
