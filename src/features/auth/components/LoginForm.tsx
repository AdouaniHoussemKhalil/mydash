"use client";

import { useState, useTransition } from "react";
import { Alert, AlertDescription, Button } from "@/components/ui/core";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
  useForm,
  zodResolver,
} from "@/components/ui/forms";
import { authenticateWithPassword, signInWithGitHub } from "../actions";
import { type AuthMode, type Credentials, credentialsSchema } from "../schemas";

const CALLBACK_ERRORS: Record<string, string> = {
  oauth: "Connexion GitHub impossible. Réessaie.",
  callback: "Le lien de connexion est invalide ou a expiré.",
};

export type LoginFormProps = {
  /** Chemin interne déjà assaini (safeNextPath). */
  next: string;
  /** Code d'erreur renvoyé par /auth/callback (?error=). */
  errorCode?: string | undefined;
};

export function LoginForm({ next, errorCode }: LoginFormProps) {
  const callbackError = errorCode ? CALLBACK_ERRORS[errorCode] : undefined;

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await authenticateWithPassword(mode, values, next);
      // En cas de succès avec session, l'action redirige et ne revient pas.
      if (result) {
        setFeedback(
          result.ok ? { kind: "success", text: result.message } : { kind: "error", text: result.error },
        );
      }
    });
  });

  const isSignIn = mode === "sign-in";
  const message = feedback ?? (callbackError ? { kind: "error" as const, text: callbackError } : null);

  return (
    <div className="flex flex-col gap-6">
      <form action={signInWithGitHub}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="outline" className="w-full">
          Continuer avec GitHub
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-neutral-11">
        <span className="h-px flex-1 bg-neutral-6" />
        ou par e-mail
        <span className="h-px flex-1 bg-neutral-6" />
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    showStrength={!isSignIn}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {message && (
            <Alert variant={message.kind === "error" ? "danger" : "success"} role="status">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Un instant…" : isSignIn ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
      </Form>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setMode(isSignIn ? "sign-up" : "sign-in");
          setFeedback(null);
        }}
      >
        {isSignIn ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </Button>
    </div>
  );
}
