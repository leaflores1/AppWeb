import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({

  username: { type: String, required: true },

  description: { type: String, required: true },

  fileName: { type: String, required: true },

  s3Url: { type: String, required: true }, 
});

export const Profile = mongoose.model("Profile", profileSchema);