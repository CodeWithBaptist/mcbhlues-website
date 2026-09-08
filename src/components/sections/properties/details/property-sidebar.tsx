"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Turnstile, isTurnstileEnabled } from "@/components/ui/turnstile";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  FIELD_LIMITS,
  hasErrors,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryField,
} from "@/lib/validation/enquiry";

const EMPTY = { name: "", email: "", phone: "", message: "" };

/**
 * "Inquire about this property" form. Submissions become enquiries linked to
 * the exact listing in the Staff Portal (Operations → Enquiries).
 *
 * The message is optional here — leaving it blank sends the default viewing
 * request — so validation runs with `requireMessage: false`, matching the
 * server's rule for `type: "viewing" | "property"`.
 */
export function PropertySidebar({
  propertyId,
  propertyTitle,
}: {
  propertyId?: string;
  propertyTitle?: string;
}) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<EnquiryField, boolean>>>({});
  const [wantsViewing, setWantsViewing] = useState(true);
  const [company, setCompany] = useState(""); // honeypot
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const captchaRequired = isTurnstileEnabled();
  const validationOptions = { requireMessage: false } as const;

  function setField(field: keyof typeof EMPTY, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field as EnquiryField]) {
      const fresh = validateEnquiry(next, validationOptions);
      setErrors((current) => ({ ...current, [field]: fresh[field as EnquiryField] }));
    }
  }

  function handleBlur(field: EnquiryField) {
    setTouched((current) => ({ ...current, [field]: true }));
    const fresh = validateEnquiry(values, validationOptions);
    setErrors((current) => ({ ...current, [field]: fresh[field] }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);

    const validation = validateEnquiry(values, validationOptions);
    if (hasErrors(validation)) {
      setErrors(validation);
      setTouched({ name: true, email: true, phone: true, message: true });
      const firstInvalid = (["name", "email", "phone", "message"] as const).find(
        (field) => validation[field]
      );
      if (firstInvalid) {
        formRef.current?.querySelector<HTMLElement>(`#inquiry-${firstInvalid}`)?.focus();
      }
      return;
    }

    if (captchaRequired && !captchaToken) {
      setResult({ ok: false, text: "Please complete the security check below." });
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          subject: propertyTitle ? `Inquiry: ${propertyTitle}` : "Property inquiry",
          message:
            values.message ||
            (wantsViewing
              ? "I'm interested in this property and would like to schedule a viewing."
              : "I'm interested in this property and would like more information."),
          type: wantsViewing ? "viewing" : "property",
          propertyId: propertyId ?? null,
          company,
          turnstileToken: captchaToken,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.fields) setErrors(data.fields as EnquiryErrors);
        setResult({ ok: false, text: data.error ?? "Something went wrong. Please try again." });
        setCaptchaReset((count) => count + 1);
        return;
      }

      setResult({
        ok: true,
        text: `Inquiry sent (${data.reference ?? "received"}). Our team will contact you shortly.`,
      });
      setValues(EMPTY);
      setErrors({});
      setTouched({});
      setCaptchaReset((count) => count + 1);
    } catch {
      setResult({ ok: false, text: "Network error. Please check your connection and try again." });
      setCaptchaReset((count) => count + 1);
    } finally {
      setSending(false);
    }
  }

  const shown = (field: EnquiryField) => (touched[field] ? errors[field] : undefined);

  return (
    <div className="flex flex-col gap-8 lg:sticky lg:top-28">
      <div
        id="inquiry"
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft sm:p-8"
      >
        <h2 className="font-heading text-xl font-bold text-dark">Arrange a viewing</h2>
        <p className="mb-6 mt-1 text-sm text-gray-600">
          Send your details and a consultant will reply to confirm a time.
        </p>

        {result?.ok ? (
          <div className="flex animate-fade-up flex-col items-center gap-3 py-10 text-center" role="status">
            <CheckCircle2 className="h-10 w-10 text-green-700" aria-hidden="true" />
            <p className="text-sm text-gray-700">{result.text}</p>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Send another enquiry
            </Button>
          </div>
        ) : (
          <form ref={formRef} className="space-y-5" onSubmit={submit} noValidate>
            <FormField id="inquiry-name" label="Full Name" required error={shown("name")}>
              {({ error, ...field }) => (
                <Input
                  {...field}
                  error={error}
                  autoComplete="name"
                  maxLength={FIELD_LIMITS.name}
                  placeholder="Your full name"
                  value={values.name}
                  onChange={(event) => setField("name", event.target.value)}
                  onBlur={() => handleBlur("name")}
                />
              )}
            </FormField>

            <FormField id="inquiry-email" label="Email Address" required error={shown("email")}>
              {({ error, ...field }) => (
                <Input
                  {...field}
                  error={error}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={FIELD_LIMITS.email}
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(event) => setField("email", event.target.value)}
                  onBlur={() => handleBlur("email")}
                />
              )}
            </FormField>

            <FormField id="inquiry-phone" label="Phone Number" error={shown("phone")}>
              {({ error, ...field }) => (
                <Input
                  {...field}
                  error={error}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={FIELD_LIMITS.phone}
                  placeholder="+234 800 000 0000"
                  value={values.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  onBlur={() => handleBlur("phone")}
                />
              )}
            </FormField>

            <FormField id="inquiry-message" label="Message" error={shown("message")}>
              {({ error, ...field }) => (
                <Textarea
                  {...field}
                  error={error}
                  maxLength={FIELD_LIMITS.message}
                  placeholder="I'm interested in this property and would like to schedule a viewing…"
                  value={values.message}
                  onChange={(event) => setField("message", event.target.value)}
                  onBlur={() => handleBlur("message")}
                />
              )}
            </FormField>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                checked={wantsViewing}
                onChange={(event) => setWantsViewing(event.target.checked)}
              />
              <span>I&rsquo;d like to schedule a viewing</span>
            </label>

            {/* Honeypot — off-screen rather than `hidden`, so bots that skip
                display:none fields still fill it in. Never focusable. */}
            <div
              aria-hidden="true"
              className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            >
              <label htmlFor="inquiry-company">Company (leave this field empty)</label>
              <input
                id="inquiry-company"
                name="company"
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <Turnstile
              onToken={setCaptchaToken}
              action="property-inquiry"
              resetSignal={captchaReset}
              className="space-y-2"
            />

            {result && !result.ok && (
              <p
                role="alert"
                className="animate-shake rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
              >
                {result.text}
              </p>
            )}

            <Button size="lg" className="w-full font-semibold" loading={sending}>
              {sending ? "Sending…" : "Send enquiry"}
            </Button>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Your details are used only to answer this enquiry. See our{" "}
                <a
                  href="/privacy"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
