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

/**
 * Descriptions are entered in the portal as plain text. Turn the common
 * dash-separated listing format into readable bullets without changing the
 * stored content or requiring editors to learn a special format.
 */
function descriptionItems(description: string, fallback: string): string[] {
  const text = description.trim() || fallback;
  const plotBreakdown = text.split(/plot breakdown:\s*-\s*/i);

  if (plotBreakdown.length > 1) {
    return [
      plotBreakdown[0].trim(),
      ...plotBreakdown[1]
        .split(/\s+-\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ];
  }

  const items = text
    .split(/(?:\n+|•)/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 1 ? items : [text];
}

export function PropertyContent({ property, amenities = [], features = [] }: PropertyContentProps) {
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
        <ul className="max-w-prose space-y-3 text-base leading-relaxed text-gray-600 sm:text-lg">
          {descriptionItems(
            property.description,
            `${property.name} is located in ${property.location}. Contact us to arrange a viewing or ask for more details.`,
          ).map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-[0.7em] h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <CheckList heading="Key features" items={features} />
      <CheckList heading="Amenities" items={amenities} />
    </div>
  );
}
