import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import { BirthdayOfferViewDialog } from "@/components/BirthdayOfferViewDialog";

interface NotificationData {
  business_id?: string;
  business_name?: string;
  pet_name?: string;
  discount?: number;
  discount_type?: string;
  share_code?: string;
  alert_id?: string;
  question_id?: string;
  action_url?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: NotificationData | null;
  read: boolean;
  created_at: string;
  user_id: string;
}

type RawNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  read: boolean;
  created_at: string;
  user_id: string;
};

const Notifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBirthdayOffer, setSelectedBirthdayOffer] = useState<Notification | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        // Cast data to proper type
        const typedNotifications: Notification[] = (data as RawNotification[]).map(n => ({
          ...n,
          data: n.data as NotificationData | null
        }));
        setNotifications(typedNotifications);
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    const data = notification.data;
    if (notification.type === "family_invite" && data?.share_code) {
      navigate(`/member/join-family?code=${data.share_code}`);
    } else if (notification.type === "redemption") {
      navigate("/member/history");
    } else if (notification.type === "lost_pet_alert" && data?.alert_id) {
      navigate(`/member/lost-found?alert=${data.alert_id}`);
    } else if ((notification.type === "community_answer" || notification.type === "community_follow_activity" || notification.type === "answer_accepted") && data?.question_id) {
      navigate(`/community/question/${data.question_id}`);
    } else if (notification.type === "business_birthday_reminder") {
      navigate("/business/birthdays");
    } else if (notification.type === "birthday_offer" && data?.business_id) {
      // Open birthday offer dialog to show full message
      setSelectedBirthdayOffer(notification);
    } else if (notification.type === "review_request" && data?.business_id) {
      navigate(`/business/${data.business_id}`);
    } else if (notification.type === "pet_birthday") {
      navigate("/member");
    } else if (notification.type === "anniversary") {
      navigate("/member");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return "📢";
      case "promotion":
        return "🎉";
      case "reminder":
        return "⏰";
      case "update":
        return "🆕";
      case "family_invite":
        return "👨‍👩‍👧‍👦";
      case "redemption":
        return "✅";
      case "lost_pet_alert":
        return "🐾";
      case "community_answer":
        return "💬";
      case "community_follow_activity":
        return "👀";
      case "answer_accepted":
        return "🏆";
      case "business_birthday_reminder":
        return "🎂";
      case "birthday_offer":
        return "🎁";
      case "review_request":
        return "⭐";
      case "pet_birthday":
        return "🎂";
      case "anniversary":
        return "🎊";
      default:
        return "🔔";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl font-bold">Notifications</h1>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? "border-primary/50 bg-accent/30" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">
                          {notification.type === "lost_pet_alert" 
                            ? notification.title.replace("Area", "Area 🚨")
                            : notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.type === "birthday_offer" 
                          ? notification.message.slice(0, 100) + (notification.message.length > 100 ? "..." : "")
                          : notification.message}
                        {notification.type === "birthday_offer" && (
                          <span className="ml-1 text-primary font-medium">Tap to read full message →</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Showing last 10 notifications
        </p>

        {/* Birthday Offer Dialog */}
        <BirthdayOfferViewDialog
          open={!!selectedBirthdayOffer}
          onOpenChange={(open) => !open && setSelectedBirthdayOffer(null)}
          title={selectedBirthdayOffer?.title || ""}
          message={selectedBirthdayOffer?.message || ""}
          data={selectedBirthdayOffer?.data ? {
            business_id: selectedBirthdayOffer.data.business_id || "",
            business_name: selectedBirthdayOffer.data.business_name || "",
            pet_name: selectedBirthdayOffer.data.pet_name || "",
            discount: selectedBirthdayOffer.data.discount || 0,
            discount_type: selectedBirthdayOffer.data.discount_type || "percentage",
          } : null}
          createdAt={selectedBirthdayOffer?.created_at || ""}
        />
      </main>
    </div>
  );
};

export default Notifications;
