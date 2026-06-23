import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNowStrict } from "date-fns";

interface PendingDeletion {
  user_id: string;
  email: string | null;
  full_name: string | null;
  deletion_requested_at: string;
  deletion_scheduled_for: string;
}

const PendingDeletionsPanel = () => {
  const [rows, setRows] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, deletion_requested_at, deletion_scheduled_for")
      .not("deletion_scheduled_for", "is", null)
      .order("deletion_scheduled_for", { ascending: true });

    if (error) {
      toast({ title: "Failed to load pending deletions", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as PendingDeletion[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (userId: string) => {
    setRestoringId(userId);
    const { data, error } = await supabase.functions.invoke("admin-restore-account", {
      body: { user_id: userId },
    });
    setRestoringId(null);
    if (error || (data && (data as { error?: string }).error)) {
      const msg = error?.message || (data as { error?: string })?.error || "Failed to restore account";
      toast({ title: "Restore failed", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Account restored", description: "Deletion has been canceled." });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Pending Account Deletions
        </CardTitle>
        <CardDescription>
          Members who requested account deletion. They have a 30-day grace period during which you can restore
          them. Once the grace period expires the account is permanently purged and cannot be recovered.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts pending deletion.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const scheduled = new Date(r.deletion_scheduled_for);
              const expired = scheduled < new Date();
              return (
                <div
                  key={r.user_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.full_name || "(no name)"}</div>
                    <div className="text-sm text-muted-foreground truncate">{r.email}</div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Requested {format(new Date(r.deletion_requested_at), "PP")}
                      </Badge>
                      <Badge variant={expired ? "destructive" : "secondary"}>
                        {expired
                          ? "Grace period expired"
                          : `Purges in ${formatDistanceToNowStrict(scheduled)}`}
                      </Badge>
                      <Badge variant="outline">Scheduled {format(scheduled, "PPp")}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restore(r.user_id)}
                    disabled={expired || restoringId === r.user_id}
                    className="gap-1 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {restoringId === r.user_id ? "Restoring…" : "Restore account"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingDeletionsPanel;
