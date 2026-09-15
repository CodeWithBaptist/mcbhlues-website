import { Bed, Bath, Maximize2, Check } from "lucide-react";
import { Property } from "@/types";

interface PropertyContentProps {
  property: Property;
  amenities?: string[];
  features?: string[];
}

/** One line of the specs strip. Unknown values read "—" rather than "0". */
function Spec({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Bed;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
      <div>
        <p className="text-lg font-bold tabular-nums leading-none text-dark">{value > 0 ? value : "—"}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function CheckList({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-5 font-heading text-xl font-bold text-dark sm:text-2xl">{heading}</h2>
      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-gray-700">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface DescriptionCopy {
  paragraphs: string[];
  bullets: string[];
}

/**
 * Keep ordinary property descriptions as prose. Only text that an editor has
 * deliberately marked as a list is shown with bullets; previously even a
 * single paragraph received a decorative dot, which made the page feel
 * unnecessarily list-heavy.
 *
 * The plot-breakdown branch supports the compact legacy format already stored
 * on some listings: `Plot breakdown: - item - item`.
 */
function descriptionCopy(description: string, fallback: string): DescriptionCopy {
  const text = description.trim() || fallback;
  const plotBreakdown = text.match(/^([\s\S]*?)plot breakdown:\s*-\s*([\s\S]+)$/i);

  if (plotBreakdown) {
    return {
      paragraphs: [plotBreakdown[1].trim(), "Plot breakdown"].filter(Boolean),
      bullets: plotBreakdown[2]
        .split(/\s+-\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  const paragraphs: string[] = [];
  const bullets: string[] = [];

  for (const line of text.split(/\n+/)) {
    const copy = line.trim();
    if (!copy) continue;

    // The portal's list shortcut stores `•`; accept Markdown-style list marks
    // too, while leaving dashes used naturally inside prose untouched.
    const bullet = copy.match(/^[•*-]\s+(.+)$/);
    if (bullet) {
      bullets.push(bullet[1].trim());
      continue;
    }

    // Also support older one-line content such as `Intro • first • second`.
    const inline = copy.split(/\s+•\s+/).map((item) => item.trim()).filter(Boolean);
    if (inline.length > 1) {
      paragraphs.push(inline[0]);
      bullets.push(...inline.slice(1));
    } else {
      paragraphs.push(copy);
    }
  }

  return { paragraphs, bullets };
}

export function PropertyContent({ property, amenities = [], features = [] }: PropertyContentProps) {
  const description = descriptionCopy(
    property.description,
    `${property.name} is located in ${property.location}. Contact us to arrange a viewing or ask for more details.`,
  );

  return (
    <div className="flex flex-col gap-12">
      {/* Specs strip */}
      <div className="grid grid-cols-3 gap-6 border-y border-gray-100 py-6">
        <Spec icon={Bed} value={property.beds} label="Bedrooms" />
        <Spec icon={Bath} value={property.baths} label="Bathrooms" />
        <Spec icon={Maximize2} value={property.sqm} label="Sq m" />
      </div>

      {/* Description */}
      <section>
        <h2 className="mb-5 font-heading text-xl font-bold text-dark sm:text-2xl">About this property</h2>
        <div className="max-w-prose space-y-4 text-base leading-relaxed text-gray-600 sm:text-lg">
          {description.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {description.bullets.length > 0 && (
            <ul className="space-y-2.5 pt-1">
              {description.bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CheckList heading="Key features" items={features} />
      <CheckList heading="Amenities" items={amenities} />
    </div>
  );
}
