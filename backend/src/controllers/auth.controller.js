import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../libs/jwt.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, nombre, instagram } = req.body;


    // Verificar si el nombre de usuario ya existe
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res
        .status(400)
        .json({ message: "El nombre de usuario ya está en uso." });
    }

    const userFound = await User.findOne({ email });
    if (userFound)
      return res.status(400).json({
        message: ["El email ya está en uso"],
      });

    // hashing the password
    const passwordHash = await bcrypt.hash(password, 10);

    // creating the user
    const newUser = new User({
      nombre,
      username,
      email,
      password: passwordHash,
      instagram: instagram || "", // Guarda el usuario de Instagram si lo ingresó
    });

    // saving the user in the database
    const userSaved = await newUser.save();

    // create access token
    const token = await createAccessToken({
      id: userSaved._id,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // en desarrollo suele ir false
      sameSite: "none",
    });

    res.json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,
      nombre: userSaved.nombre,
      instagram: userSaved.instagram,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Buscar por email O por username
    const userFound = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!userFound) {
      return res.status(400).json({
        message: ["El usuario/correo no existe"],
      });
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta"],
      });
    }

    const token = await createAccessToken({
      id: userFound._id,
      username: userFound.username,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      nombre: userFound.nombre,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.send(false);

  jwt.verify(token, TOKEN_SECRET, async (error, user) => {
    if (error) return res.sendStatus(401);

    const userFound = await User.findOne({ username: user.username });
    if (!userFound) return res.sendStatus(401);

    //console.log("verifytoken", token);

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      nombre: userFound.nombre,
    });
  });
};

export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(0),
  });
  return res.sendStatus(200);
};
