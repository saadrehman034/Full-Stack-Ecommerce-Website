"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MapPin, Loader2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const addressSchema = z.object({
  label: z.string().optional(),
  full_name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  line1: z.string().min(3, "Address required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postal_code: z.string().min(3, "Postal code required"),
  country: z.string().min(2, "Country required"),
});

type AddressValues = z.infer<typeof addressSchema>;

interface Address extends AddressValues {
  id: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "United Kingdom" },
  });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((data as unknown as Address[]) ?? []);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const onSubmit = async (data: AddressValues) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("addresses").insert({ ...data, user_id: user.id, is_default: addresses.length === 0 });
      if (error) throw error;
      toast.success("Address saved!");
      reset();
      setShowForm(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error("Failed to delete."); return; }
    toast.success("Address removed.");
    await load();
  };

  const setDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    await load();
    toast.success("Default address updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-syne text-3xl font-bold">My Addresses</h1>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border/30">
            <h2 className="mb-6 font-syne text-xl font-bold">New Address</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Label (optional)</Label>
                <Input placeholder="Home / Work / etc." className="h-11 rounded-xl" {...register("label")} />
              </div>
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="Jane Doe" className="h-11 rounded-xl" {...register("full_name")} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address Line 1 *</Label>
                <Input placeholder="123 High Street" className="h-11 rounded-xl" {...register("line1")} />
                {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address Line 2</Label>
                <Input placeholder="Apartment, floor, etc." className="h-11 rounded-xl" {...register("line2")} />
              </div>
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input placeholder="London" className="h-11 rounded-xl" {...register("city")} />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>State/County *</Label>
                <Input placeholder="England" className="h-11 rounded-xl" {...register("state")} />
              </div>
              <div className="space-y-1.5">
                <Label>Postal Code *</Label>
                <Input placeholder="EC1A 1BB" className="h-11 rounded-xl" {...register("postal_code")} />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Input className="h-11 rounded-xl" {...register("country")} />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={isLoading} className="rounded-xl">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Address"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-16 text-center shadow-sm ring-1 ring-border/30">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <p className="font-syne text-xl font-semibold">No addresses saved</p>
          <p className="text-muted-foreground">Add an address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id}
              className={`relative rounded-2xl p-5 shadow-sm ring-1 transition-all ${addr.is_default ? "bg-primary/5 ring-primary/30" : "bg-card ring-border/30"}`}>
              {addr.is_default && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Star className="h-3 w-3" /> Default
                </span>
              )}
              {addr.label && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{addr.label}</p>}
              <p className="font-semibold">{addr.full_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                {addr.city}, {addr.postal_code}<br />
                {addr.country}
              </p>
              <div className="mt-4 flex gap-2">
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                    Set Default
                  </button>
                )}
                <button onClick={() => deleteAddress(addr.id)}
                  className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
