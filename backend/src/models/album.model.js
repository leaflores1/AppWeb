import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // usuarios que dieron like
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // NUEVOS CAMPOS
  price: {
    type: Number,
    default: 0, // Si es 0, significa gratis (no se bloquea)
  },
  currency: { type: String, default: "ARS" },
  unlockedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ],
});

export const Album = mongoose.model("Album", albumSchema);
