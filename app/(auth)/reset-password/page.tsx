"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const emailSchema = z.object({ email: z.string().email("Please enter a valid email address.") });
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "update" | "done">("request");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Detect if we're in the update-password flow (Supabase puts token in hash)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onRequestReset = async (data: EmailForm) => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else setSent(true);
    } catch { toast.error("An unexpected error occurred."); }
    finally { setIsLoading(false); }
  };

  const onUpdatePassword = async (data: PasswordForm) => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) toast.error(error.message);
      else setMode("done");
    } catch { toast.error("An unexpected error occurred."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-card p-10 shadow-xl ring-1 ring-border/30 space-y-8">

        {mode === "request" && !sent && (
          <>
            <div className="text-center">
              <Link href="/"><span className="font-syne text-2xl font-bold text-primary">Vinzlu.</span></Link>
              <h2 className="mt-6 font-syne text-3xl font-bold">Reset password</h2>
              <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
            </div>
            <form className="space-y-5" onSubmit={emailForm.handleSubmit(onRequestReset)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com"
                  className="h-12 rounded-xl" {...emailForm.register("email")} />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isLoading}
                className="group h-12 w-full rounded-xl font-semibold transition-all hover:scale-[1.02]">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Send reset link <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </>
        )}

        {mode === "request" && sent && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">📬</div>
            <h2 className="font-syne text-2xl font-bold">Check your inbox</h2>
            <p className="mt-3 text-sm text-muted-foreground">We sent a reset link. Check spam if you don't see it.</p>
            <Link href="/login" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:scale-105 transition-transform">
              Back to sign in
            </Link>
          </div>
        )}

        {mode === "update" && (
          <>
            <div className="text-center">
              <Link href="/"><span className="font-syne text-2xl font-bold text-primary">Vinzlu.</span></Link>
              <h2 className="mt-6 font-syne text-3xl font-bold">Set new password</h2>
              <p className="mt-2 text-sm text-muted-foreground">Choose a strong password for your account.</p>
            </div>
            <form className="space-y-5" onSubmit={pwForm.handleSubmit(onUpdatePassword)}>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                    className="h-12 rounded-xl pr-10" {...pwForm.register("password")} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pwForm.formState.errors.password && <p className="text-xs text-destructive">{pwForm.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" placeholder="••••••••"
                  className="h-12 rounded-xl" {...pwForm.register("confirm")} />
                {pwForm.formState.errors.confirm && <p className="text-xs text-destructive">{pwForm.formState.errors.confirm.message}</p>}
              </div>
              <Button type="submit" disabled={isLoading}
                className="h-12 w-full rounded-xl font-semibold transition-all hover:scale-[1.02]">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          </>
        )}

        {mode === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
            <h2 className="font-syne text-2xl font-bold">Password updated!</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your password has been changed successfully.</p>
            <Link href="/login" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-8 font-semibold text-primary-foreground hover:scale-105 transition-transform">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
