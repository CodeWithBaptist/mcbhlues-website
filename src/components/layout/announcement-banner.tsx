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

  const tones: Record<string, string> = {
    info: "bg-primary text-white",
    success: "bg-green-600 text-white",
    warning: "bg-amber-500 text-white",
  };

  return (
    <div className="relative z-[60]">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn("px-4 py-2 text-center text-sm", tones[item.tone] ?? tones.info)}
        >
          <Megaphone className="mr-2 inline-block h-4 w-4 align-[-2px]" />
          <span className="font-semibold">{item.title}</span>
          {item.body && <span className="ml-2 opacity-90">{item.body}</span>}
        </div>
      ))}
    </div>
  );
}
