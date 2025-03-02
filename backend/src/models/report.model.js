// models/report.model.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "itemType",  // Enlace dinámico basado en itemType
  },
  itemType: {
    type: String,
    enum: ["photo", "album", "comment", "user"],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "removed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Report = mongoose.model("Report", reportSchema);
