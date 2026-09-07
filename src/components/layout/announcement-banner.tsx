import { Megaphone } from "lucide-react";
import { listActiveAnnouncements } from "@/lib/cms/cms-service";
import { cn } from "@/lib/utils";

/**
 * Site-wide announcement banner. Renders the active announcements managed in
 * the Staff Portal (Content → Announcements) above the navbar — nothing is
 * rendered when no announcement is live.
 */
export async function AnnouncementBanner() {
  let items: Awaited<ReturnType<typeof listActiveAnnouncements>> = [];
  try {
    items = await listActiveAnnouncements();
  } catch {
    items = [];
  }
  if (items.length === 0) return null;

  // Every combination below clears 4.5:1 — amber-500 with white text (2.1:1)
  // and green-600 with white text (3.3:1) both failed WCAG AA.
  const tones: Record<string, string> = {
    info: "bg-primary text-white",
    success: "bg-green-800 text-white",
    warning: "bg-amber-300 text-amber-950",
  };

  return (
    <div className="relative z-[60]" role="region" aria-label="Site announcements">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn("px-4 py-2 text-center text-sm", tones[item.tone] ?? tones.info)}
        >
          <Megaphone className="mr-2 inline-block h-4 w-4 align-[-2px]" aria-hidden="true" />
          <span className="font-semibold">{item.title}</span>
          {item.body && <span className="ml-2">{item.body}</span>}
        </div>
      ))}
    </div>
  );
}
