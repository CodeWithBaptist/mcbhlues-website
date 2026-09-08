import { Mail, Phone, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/constants";

interface ContactInfoProps {
  /** From Portal → Company Settings; falls back to the shipped constants. */
  contact?: {
    email: string;
    phone: string;
    address: string;
  };
}

/**
 * The company's contact details, as a plain definition list. Only values the
 * business actually maintains (in Portal → Company Settings) are shown —
 * no invented opening hours or response-time promises.
 */
export function ContactInfo({ contact }: ContactInfoProps) {
  const details = contact ?? SITE_CONFIG.contact;
  const telHref = `tel:${details.phone.replace(/[^\d+]/g, "")}`;

  const rows = [
    {
      icon: Phone,
      label: "Phone",
      value: (
        <a href={telHref} className="transition-colors duration-200 hover:text-primary">
          {details.phone}
        </a>
      ),
      note: "Speak to a consultant directly.",
    },
    {
      icon: Mail,
      label: "Email",
      value: (
        <a
          href={`mailto:${details.email}`}
          className="break-all transition-colors duration-200 hover:text-primary"
        >
          {details.email}
        </a>
      ),
      note: "For enquiries, documents and anything in writing.",
    },
    {
      icon: MapPin,
      label: "Office",
      value: <span>{details.address}</span>,
      note: "Visits are by appointment — call or email first so the right person is available.",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-dark">Get in touch</h2>
      <p className="mt-2 max-w-md text-gray-600">
        Use the form, or reach the office directly. Either way a consultant, not a
        call centre, picks it up.
      </p>

      <dl className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-5 py-6">
            <row.icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-gray-500">{row.label}</dt>
              <dd className="mt-1.5 text-lg font-semibold text-dark">{row.value}</dd>
              <dd className="mt-1 text-sm text-gray-600">{row.note}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
