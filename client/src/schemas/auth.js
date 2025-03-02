import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, {
      message: "Debes ingresar un correo o nombre de usuario válido",
    }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
});


export const registerSchema = z
  .object({
    username: z
      .string({
        required_error: "El nombre de usuario es requerido",
      })
      .min(3, {
        message: "El nombre de usuario debe tener al menos 3 caracteres",
      }),
    email: z.string().email({
      message: "Ingrese un correo electrónico válido",
    }),
    instagram: z
      .string()
      .regex(/^[a-zA-Z0-9_.]*$/, {
        message:
          "El usuario de Instagram solo puede contener letras, números, puntos y guiones bajos",
      })
      .optional(),
    password: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
    confirmPassword: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
    nombre: z
      .string({
        required_error: "El nombre es requerido",
      })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
