import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Megaphone } from "lucide-react";

const DISMISSED_KEY = "eddl_dismissed_announcements";

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    const today = new Date().toISOString().slice(0, 10);
    base44.entities.Announcement.filter({ is_active: true }, "-created_date", 10).then(list => {
      const valid = list.filter(a => {
        if (dismissed.includes(a.id)) return false;
        if (a.expires_at && a.expires_at < today) return false;
        return true;
      });
      if (valid.length) setAnnouncement(valid[0]);
    });
  }, []);

  function dismiss() {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    dismissed.push(announcement.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setAnnouncement(null);
  }

  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-secondary" />
          </div>
          <span className="text-xs font-heading uppercase tracking-widest text-muted-foreground">Announcement</span>
        </div>
        <h2 className="font-heading font-bold text-lg uppercase tracking-wide mb-2">{announcement.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{announcement.message}</p>
        <button
          onClick={dismiss}
          className="mt-5 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}