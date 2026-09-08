"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Turnstile, isTurnstileEnabled } from "@/components/ui/turnstile";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import {
  FIELD_LIMITS,
  hasErrors,
  validateEnquiry,
  type EnquiryErrors,
  type EnquiryField,
} from "@/lib/validation/enquiry";

const SUBJECTS = [
  "General Inquiry",
  "Talk to a Consultant",
  "List My Property",
  "Buying a Property",
  "Renting a Property",
];

const EMPTY = { name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" };

/**
 * Contact form. Submissions are stored as real enquiries in the Staff Portal
 * (Operations → Enquiries) via the public endpoint, and the enquiries team is
 * notified in-app immediately.
 *
 * Validation runs on blur and again on submit using the shared rules in
 * `lib/validation/enquiry`; the API re-runs the identical rules server-side.
 */
export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<EnquiryField, boolean>>>({});
  const [company, setCompany] = useState(""); // honeypot
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const captchaRequired = isTurnstileEnabled();

  function setField(field: keyof typeof EMPTY, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Clear an error as soon as the visitor fixes it; never introduce a new one
    // mid-typing (that is what blur is for).
    if (errors[field as EnquiryField]) {
      const fresh = validateEnquiry(next);
      setErrors((current) => ({ ...current, [field]: fresh[field as EnquiryField] }));
    }
  }

  function handleBlur(field: EnquiryField) {
    setTouched((current) => ({ ...current, [field]: true }));
    const fresh = validateEnquiry(values);
    setErrors((current) => ({ ...current, [field]: fresh[field] }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setResult(null);

    const validation = validateEnquiry(values);
    if (hasErrors(validation)) {
      setErrors(validation);
      setTouched({ name: true, email: true, phone: true, subject: true, message: true });
      // Move focus to the first problem so keyboard and screen-reader users
      // are not left guessing.
      const firstInvalid = (["name", "email", "phone", "message"] as const).find(
        (field) => validation[field]
      );
      if (firstInvalid) {
        formRef.current?.querySelector<HTMLElement>(`#contact-${firstInvalid}`)?.focus();
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
        body: JSON.stringify({ ...values, company, turnstileToken: captchaToken }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // The server sends field-level errors too — surface them inline.
        if (data.fields) setErrors(data.fields as EnquiryErrors);
        setResult({ ok: false, text: data.error ?? "Something went wrong. Please try again." });
        setCaptchaReset((count) => count + 1);
        return;
      }

      setResult({
        ok: true,
        text: `Thank you, ${values.name.split(" ")[0]}. Your enquiry (${
          data.reference ?? "received"
        }) has been logged and a consultant will reach out shortly.`,
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
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft sm:p-8 md:p-10">
      <h2 className="mb-8 font-heading text-2xl font-bold text-dark">Send us a message</h2>

      {result?.ok ? (
        <div className="flex animate-fade-up flex-col items-center gap-4 py-16 text-center" role="status">
          <CheckCircle2 className="h-12 w-12 text-green-700" aria-hidden="true" />
          <p className="max-w-sm text-gray-700">{result.text}</p>
          <Button variant="outline" onClick={() => setResult(null)}>
            Send another message
          </Button>
        </div>
      ) : (
        <form ref={formRef} className="space-y-6" onSubmit={submit} noValidate>
          <div className="grid gap-6 md:grid-cols-2">
            <FormField id="contact-name" label="Full Name" required error={shown("name")}>
              {({ error, ...field }) => (
                <Input
                  {...field}
                  error={error}
                  autoComplete="name"
                  maxLength={FIELD_LIMITS.name}
                  placeholder="John Doe"
                  value={values.name}
                  onChange={(event) => setField("name", event.target.value)}
                  onBlur={() => handleBlur("name")}
                />
              )}
            </FormField>

            <FormField id="contact-email" label="Email Address" required error={shown("email")}>
              {({ error, ...field }) => (
                <Input
                  {...field}
                  error={error}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={FIELD_LIMITS.email}
                  placeholder="john@example.com"
                  value={values.email}
                  onChange={(event) => setField("email", event.target.value)}
                  onBlur={() => handleBlur("email")}
                />
              )}
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField id="contact-phone" label="Phone Number" error={shown("phone")}>
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

            <FormField id="contact-subject" label="Subject" required>
              {(field) => (
                <select
                  id={field.id}
                  name={field.name}
                  required={field.required}
                  aria-describedby={field["aria-describedby"]}
                  className="h-12 w-full cursor-pointer rounded-md border border-gray-500 bg-white px-4 py-2 text-base text-dark shadow-2xs transition-all duration-200 ease-soft hover:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  value={values.subject}
                  onChange={(event) => setField("subject", event.target.value)}
                >
                  {SUBJECTS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              )}
            </FormField>
          </div>

          <FormField
            id="contact-message"
            label="Your Message"
            required
            error={shown("message")}
            hint={`Tell us what you're planning — the more detail, the better. ${values.message.length}/${FIELD_LIMITS.message} characters.`}
          >
            {({ error, ...field }) => (
              <Textarea
                {...field}
                error={error}
                maxLength={FIELD_LIMITS.message}
                placeholder="How can we help you today?"
                className="min-h-[150px]"
                value={values.message}
                onChange={(event) => setField("message", event.target.value)}
                onBlur={() => handleBlur("message")}
              />
            )}
          </FormField>

          {/* Honeypot — off-screen rather than `hidden`, so bots that skip
              display:none fields still fill it in. Never focusable. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="contact-company">Company (leave this field empty)</label>
            <input
              id="contact-company"
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
            action="contact-form"
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

          <Button size="lg" className="w-full gap-2 font-semibold" loading={sending}>
            {!sending && <Send className="h-5 w-5" aria-hidden="true" />}
            {sending ? "Sending…" : "Send message"}
          </Button>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              We use your details only to answer this enquiry. See our{" "}
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
  );
}
