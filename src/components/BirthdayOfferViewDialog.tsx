import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Gift, Cake, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface BirthdayOfferData {
  business_id: string;
  business_name: string;
  pet_name: string;
  discount: number;
  discount_type: string;
}

interface BirthdayOfferViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  data: BirthdayOfferData | null;
  createdAt: string;
}

export function BirthdayOfferViewDialog({
  open,
  onOpenChange,
  title,
  message,
  data,
  createdAt,
}: BirthdayOfferViewDialogProps) {
  const { t } = useTranslation();
  if (!data) return null;

  const discountText = data.discount_type === 'percentage'
    ? `${data.discount}% off`
    : `€${data.discount} off`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            {t("birthdayOfferView.title")}
          </DialogTitle>
          <DialogDescription>
            {t("birthdayOfferView.subtitle", { petName: data.pet_name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
            <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{data.business_name}</p>
              <Badge className="bg-pink-500 text-white text-xs mt-1">
                <Gift className="w-3 h-3 mr-1" />
                {discountText}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">{t("birthdayOfferView.messageFromBusiness")}</h4>
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
              {message}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{t("birthdayOfferView.receivedOn", { date: formatDate(new Date(createdAt)) })}</span>
            </div>
            <span className="text-xs">{t("birthdayOfferView.validFor30")}</span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("birthdayOfferView.instructions")}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          {t("birthdayOfferView.close")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
