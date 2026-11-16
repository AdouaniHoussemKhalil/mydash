import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

export const credentialsSchema = z.object({
  // Normaliser avant de valider : un espace copié-collé ne doit pas bloquer.
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide")),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Au moins ${PASSWORD_MIN_LENGTH} caractères`)
    .max(128, "128 caractères maximum"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const authModeSchema = z.enum(["sign-in", "sign-up"]);
export type AuthMode = z.infer<typeof authModeSchema>;
