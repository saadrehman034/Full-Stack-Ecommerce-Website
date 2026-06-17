"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("users").select("full_name, phone").eq("id", user.id).single();
      if (data) reset({ full_name: data.full_name || "", phone: data.phone || "" });
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ProfileValues) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("users")
        .update({ full_name: data.full_name, phone: data.phone })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-syne text-3xl font-bold">My Profile</h1>

      <div className="rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border/30">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input value={email} disabled className="h-11 rounded-xl bg-muted/40 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" placeholder="Jane Doe" className="h-11 rounded-xl" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+44 7700 900000" className="h-11 rounded-xl" {...register("phone")} />
          </div>

          <Button type="submit" disabled={isLoading} className="h-11 rounded-xl px-8">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
