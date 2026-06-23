import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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

  const proceedToFinalConfirm = () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast({
        title: t("memberSettings.confirmRequiredTitle"),
        description: t("memberSettings.confirmRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    setConfirmOpen(false);
    setAcknowledged(false);
    setFinalConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!acknowledged) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deletion");
      if (error) throw error;
      const scheduled = (data as { scheduled_for?: string })?.scheduled_for;
      toast({
        title: t("memberSettings.scheduledTitle"),
        description: scheduled
          ? t("memberSettings.scheduledDescWithDate", { date: formatDate(scheduled) })
          : t("memberSettings.scheduledDescNoDate"),
      });
      setFinalConfirmOpen(false);
      await signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("memberSettings.errorGeneric");
      toast({ title: t("memberSettings.errorTitle"), description: message, variant: "destructive" });
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
        title: t("memberSettings.restoreSuccessTitle"),
        description: t("memberSettings.restoreSuccessDesc"),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("memberSettings.restoreFailDesc");
      toast({ title: t("memberSettings.restoreFailTitle"), description: message, variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("memberSettings.pageTitle")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t("memberSettings.back")}
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">{t("memberSettings.heading")}</h1>
        <p className="text-muted-foreground mb-8">{t("memberSettings.subheading")}</p>

        {pendingDeletion && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("memberSettings.pendingTitle")}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                <Trans
                  i18nKey="memberSettings.pendingDescription"
                  values={{ date: formatDate(pendingDeletion.scheduled_for) }}
                  components={{ strong: <strong /> }}
                />
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestore}
                disabled={restoring}
                className="bg-background"
              >
                {restoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t("memberSettings.restore")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("memberSettings.profileTitle")}</CardTitle>
            <CardDescription>{t("memberSettings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t("memberSettings.emailLabel")} </span>
              <span className="font-medium">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        {isMember && !pendingDeletion && !loadingProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("memberSettings.deleteCardTitle")}</CardTitle>
              <CardDescription>{t("memberSettings.deleteCardDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>
                  <Trans i18nKey="memberSettings.deleteBullet1" components={{ strong: <strong /> }} />
                </li>
                <li>{t("memberSettings.deleteBullet2")}</li>
                <li>{t("memberSettings.deleteBullet3")}</li>
              </ul>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                {t("memberSettings.deleteButton")}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isMember && (
          <Card>
            <CardHeader>
              <CardTitle>{t("memberSettings.partnerCardTitle")}</CardTitle>
              <CardDescription>{t("memberSettings.partnerCardDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{t("memberSettings.partnerHelp")}</p>
              <Button asChild variant="outline">
                <a href="mailto:hello@wooffy.app?subject=Account%20closure%20request">
                  {t("memberSettings.contactSupport")}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("memberSettings.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("memberSettings.confirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              <Trans i18nKey="memberSettings.typeDeleteLabel" components={{ strong: <strong /> }} />
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("memberSettings.typeDeletePlaceholder")}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("memberSettings.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                proceedToFinalConfirm();
              }}
              disabled={confirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("memberSettings.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={finalConfirmOpen}
        onOpenChange={(open) => {
          if (submitting) return;
          setFinalConfirmOpen(open);
          if (!open) setAcknowledged(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> {t("memberSettings.finalTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("memberSettings.finalDesc")}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground space-y-2">
            <p className="font-medium">{t("memberSettings.ackIntro")}</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{t("memberSettings.ackBullet1")}</li>
              <li>{t("memberSettings.ackBullet2")}</li>
              <li>{t("memberSettings.ackBullet3")}</li>
            </ul>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="acknowledge-delete"
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label htmlFor="acknowledge-delete" className="text-sm leading-snug cursor-pointer">
              {t("memberSettings.ackCheckbox")}
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t("memberSettings.goBack")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={submitting || !acknowledged}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t("memberSettings.permanentDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MemberSettings;
