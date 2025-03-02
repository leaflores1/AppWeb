import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false } // Puedes omitir _id en subdocumentos
);


const photoSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    title: { type: String, required: false },
    description: { type: String, required: false },
    userId: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true, },
    fileName: { type: String, required: true },
    s3Url: { type: String, default: null },
    blurUrl: {type: String},
    thumbnailUrl: { type: String, default: null },
    responsive: [{width: Number,url: { type: String, default: null },},],
  isPaidContent: { type: Boolean, default: false },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId,ref: "User",default: [],}],
    price: {type: Number,default: 0,},
    currency: { type: String, default: "ARS" },
    unlockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mediaType: { type: String, default: "image" }, 
    comments: [commentSchema],
  },
  { timestamps: true }
);

export const Photo = mongoose.model("Photo", photoSchema);
