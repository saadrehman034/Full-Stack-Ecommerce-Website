"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    const supabase = createClient();
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) { setAuthError(error.message); return; }

      let role = authData.user?.user_metadata?.role ?? "customer";
      if (authData.user?.id) {
        const { data: row } = await supabase.from("users").select("role").eq("id", authData.user.id).single();
        if (row?.role) role = row.role;
      }
      if (role === "admin") window.location.href = "/admin";
      else if (role === "staff") window.location.href = "/pos";
      else window.location.href = "/account/orders";
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-3xl bg-card p-10 shadow-xl ring-1 ring-border/30">
        <div className="text-center">
          <Link href="/"><span className="font-syne text-2xl font-bold text-primary">PantryLegend.</span></Link>
          <h2 className="mt-6 font-syne text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </div>

        {authError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {authError}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
              className="h-12 rounded-xl" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/reset-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                placeholder="••••••••" className="h-12 rounded-xl pr-10" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading}
            className="group h-12 w-full rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>Sign in <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
