import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: "", // Ruta o URL de la foto de perfil
    },
    description: {
      type: String,
      default: "", // Descripción opcional del usuario
    },
    instagram: {
      type: String,
      default: "", 
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencia a otros usuarios (seguidores)
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencia a otros usuarios seguidos
      },
    ],
    notifications: {
      type: String,
      default: "",
    },
    unlockedPhotos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],
    sellerId: { type: String, default: null }, // Campo para vincular el sellerId
    mpUserId: { type: String, default: null },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  // <-- Campo añadido

  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export { User };
