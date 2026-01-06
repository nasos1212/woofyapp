import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

const PromoCodeManager = () => {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    usage_limit: "",
    expires_at: "",
    description: "",
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "WOOFFY";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const createPromoCode = async () => {
    if (!newCode.code) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      const { error } = await supabase.from("promo_codes").insert({
        code: newCode.code.toUpperCase(),
        discount_type: newCode.discount_type,
        discount_value: newCode.discount_value ? parseFloat(newCode.discount_value) : null,
        usage_limit: newCode.usage_limit ? parseInt(newCode.usage_limit) : null,
        expires_at: newCode.expires_at || null,
        description: newCode.description || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Promo code created!");
      setDialogOpen(false);
      setNewCode({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        usage_limit: "",
        expires_at: "",
        description: "",
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to create promo code");
    }
  };

  const togglePromoCode = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      toast.success(isActive ? "Promo code deactivated" : "Promo code activated");
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to update promo code");
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Promo code deleted");
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete promo code");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const getDiscountLabel = (type: string, value: number | null) => {
    if (type === "free_membership") return "Free Membership";
    if (type === "percentage") return `${value}% off`;
    return `$${value} off`;
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Promo Codes
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Code</Label>
                  <Input
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    placeholder="WOOFFY50"
                  />
                </div>
                <Button variant="outline" className="mt-6" onClick={generateCode}>
                  Generate
                </Button>
              </div>
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={newCode.discount_type}
                  onValueChange={(v) => setNewCode({ ...newCode, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                    <SelectItem value="free_membership">Free Membership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newCode.discount_type !== "free_membership" && (
                <div>
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={newCode.discount_value}
                    onChange={(e) => setNewCode({ ...newCode, discount_value: e.target.value })}
                    placeholder={newCode.discount_type === "percentage" ? "50" : "10"}
                  />
                </div>
              )}
              <div>
                <Label>Usage Limit (optional)</Label>
                <Input
                  type="number"
                  value={newCode.usage_limit}
                  onChange={(e) => setNewCode({ ...newCode, usage_limit: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newCode.expires_at}
                  onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  placeholder="Summer promotion"
                />
              </div>
              <Button onClick={createPromoCode} className="w-full">
                Create Promo Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {promoCodes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No promo codes yet</p>
        ) : (
          <div className="space-y-3">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="font-mono font-bold text-lg cursor-pointer hover:text-primary"
                    onClick={() => copyCode(promo.code)}
                  >
                    {promo.code}
                    <Copy className="w-3 h-3 inline ml-1 opacity-50" />
                  </div>
                  <Badge variant={promo.is_active ? "default" : "secondary"}>
                    {promo.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getDiscountLabel(promo.discount_type, promo.discount_value)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Used: {promo.used_count}/{promo.usage_limit || "∞"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePromoCode(promo.id, promo.is_active)}
                  >
                    {promo.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePromoCode(promo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromoCodeManager;
