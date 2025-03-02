import { z } from "zod";

export const createFotoSchema = z.object({
  foto: z
    .any()
    .refine((file) => file && typeof file === "object", {
      message: "Debe incluirse un archivo de tipo foto",
    }),
});
