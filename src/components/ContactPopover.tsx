import { useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import SupportDialog from "@/components/SupportDialog";

interface ContactPopoverProps {
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerClassName?: string;
  showIcon?: boolean;
  asLink?: boolean;
}

const ContactPopover = ({
  triggerText,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName = "",
  showIcon = true,
  asLink = false,
}: ContactPopoverProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const label = triggerText ?? t("contactPopover.defaultTrigger");

  const handleEmailClick = () => {
    navigator.clipboard.writeText("hello@wooffy.app");
    window.location.href = "mailto:hello@wooffy.app";
    toast({
      title: t("contactPopover.emailCopiedTitle"),
      description: t("contactPopover.emailCopiedDesc"),
    });
    setPopoverOpen(false);
  };

  const handleMessageClick = () => {
    setPopoverOpen(false);
    setShowSupportDialog(true);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {asLink ? (
            <button className={`text-primary hover:underline ${triggerClassName}`}>
              {label}
            </button>
          ) : (
            <Button variant={triggerVariant} size={triggerSize} className={`gap-2 ${triggerClassName}`}>
              {showIcon && <MessageSquare className="w-4 h-4" />}
              {label}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="center">
          <p className="text-sm font-medium mb-3 text-center">{t("contactPopover.howToReach")}</p>
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleMessageClick}
            >
              <MessageSquare className="w-4 h-4" />
              {t("contactPopover.messageUs")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleEmailClick}
            >
              <Mail className="w-4 h-4" />
              {t("contactPopover.sendEmail")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">hello@wooffy.app</p>
        </PopoverContent>
      </Popover>

      <SupportDialog open={showSupportDialog} onOpenChange={setShowSupportDialog} />
    </>
  );
};

export default ContactPopover;
