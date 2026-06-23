import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";

const MemberSettings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { accountType, loading: typeLoading } = useAccountType();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pendingDeletion, setPendingDeletion] = useState<{
    requested_at: string;
    scheduled_for: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("deletion_requested_at, deletion_scheduled_for")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.deletion_scheduled_for && data?.deletion_requested_at) {
        setPendingDeletion({
          requested_at: data.deletion_requested_at,
          scheduled_for: data.deletion_scheduled_for,
        });
      } else {
        setPendingDeletion(null);
      }
      setLoadingProfile(false);
    })();
  }, [user]);

  if (authLoading || typeLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const isMember = accountType === "member";

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Please type DELETE to confirm.',
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deletion");
      if (error) throw error;
      const scheduled = (data as { scheduled_for?: string })?.scheduled_for;
      toast({
        title: "Account scheduled for deletion",
        description: scheduled
          ? `Your account will be permanently deleted on ${formatDate(scheduled)}. Sign back in within 30 days to restore it.`
          : "Your account will be deleted in 30 days. Sign back in to restore it.",
      });
      setConfirmOpen(false);
      await signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process deletion request.";
      toast({ title: "Something went wrong", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-account-deletion");
      if (error) throw error;
      setPendingDeletion(null);
      toast({
        title: "Account restored",
        description: "Your account is active again. Welcome back!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not restore account.";
      toast({ title: "Restore failed", description: message, variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Account Settings | Wooffy</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your Wooffy account.</p>

        {pendingDeletion && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account scheduled for deletion</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Your account will be permanently deleted on{" "}
                <strong>{formatDate(pendingDeletion.scheduled_for)}</strong>. You can restore it any time before then.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestore}
                disabled={restoring}
                className="bg-background"
              >
                {restoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Restore my account
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your basic account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        {isMember && !pendingDeletion && !loadingProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delete account</CardTitle>
              <CardDescription>
                Permanently delete your Wooffy account and all associated data, including your pets, membership,
                redemption history, community posts and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Your account is soft-deleted for <strong>30 days</strong>. Sign back in any time within that window to restore it.</li>
                <li>Any active paid membership will be canceled immediately. No refunds are issued for the remaining period.</li>
                <li>After 30 days, all your data is permanently removed and cannot be recovered.</li>
              </ul>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                Delete my account
              </Button>
            </CardContent>
          </Card>
        )}

        {!isMember && (
          <Card>
            <CardHeader>
              <CardTitle>Close your account</CardTitle>
              <CardDescription>
                Partner accounts (businesses and shelters) can't self-delete because doing so would affect customer
                redemptions, active offers and adoption inquiries already linked to your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Please contact us and we'll close your account safely after handling any outstanding obligations.
              </p>
              <Button asChild variant="outline">
                <a href="mailto:hello@wooffy.app?subject=Account%20closure%20request">Contact support</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel any active paid membership and schedule your account and all associated data for
              permanent deletion in 30 days. You can sign back in within that period to restore it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <strong>DELETE</strong> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={submitting || confirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberSettings;
