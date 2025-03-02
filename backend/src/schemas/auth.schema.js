import { z } from "zod";

// Esquema actualizado para Login
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

// Esquema para Registro (no necesitas cambios aquí)
export const registerSchema = z
  .object({
    username: z
      .string({
        required_error: "El nombre de usuario es obligatorio",
      })
      .min(3, {
        message: "El nombre de usuario debe tener al menos 3 caracteres",
      }),
    email: z.string().email({
      message: "El correo electrónico no es válido",
    }),
    password: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
    confirmPassword: z.string().min(6, {
      message: "La confirmación de la contraseña debe tener al menos 6 caracteres",
    }),
    nombre: z.string({
      required_error: "El nombre completo es obligatorio",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
