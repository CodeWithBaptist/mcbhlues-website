"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Phone, Mail, User } from "lucide-react";

/**
 * "Inquire about this property" form. Submissions become enquiries linked to
 * the exact listing in the Staff Portal (Operations → Enquiries).
 */
export function PropertySidebar({
  propertyId,
  propertyTitle,
}: {
  propertyId?: string;
  propertyTitle?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [wantsViewing, setWantsViewing] = useState(true);
  const [company, setCompany] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject: propertyTitle ? `Inquiry: ${propertyTitle}` : "Property inquiry",
          message:
            message || (wantsViewing ? "I'm interested in this property and would like to schedule a viewing." : ""),
          type: wantsViewing ? "viewing" : "property",
          propertyId: propertyId ?? null,
          company,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResult({ ok: false, text: data.error ?? "Something went wrong — please try again." });
        return;
      }
      setResult({
        ok: true,
        text: `Inquiry sent (${data.reference ?? "received"}). Our team will contact you shortly.`,
      });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setResult({ ok: false, text: "Network error — please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 sticky top-32">
      {/* Contact Form */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
        <h4 className="text-xl font-bold text-dark font-heading mb-6">Inquire About This Property</h4>
        {result?.ok ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-gray-600">{result.text}</p>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Send another inquiry
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="relative">
               <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
               <Input required placeholder="Your Full Name" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="relative">
               <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
               <Input required placeholder="Email Address" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
               <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
               <Input placeholder="Phone Number" type="tel" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Textarea
              placeholder="I'm interested in this property and would like to schedule a viewing..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={wantsViewing} onChange={(e) => setWantsViewing(e.target.checked)} />
              I&apos;d like to schedule a viewing
            </label>

            {/* Honeypot — invisible to visitors, catches bots. */}
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {result && !result.ok && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{result.text}</p>
            )}

            <Button className="w-full py-6 text-lg font-bold" disabled={sending}>
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Inquiry"}
            </Button>
          </form>
        )}
      </div>

      {/* Agent Info */}
      <div className="bg-dark text-white p-8 rounded-2xl">
         <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
               <User className="w-8 h-8 text-primary" />
            </div>
            <div>
               <h5 className="font-bold text-lg">Marcus Blue</h5>
               <p className="text-primary-light text-sm">Senior Listing Agent</p>
            </div>
         </div>
         <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white hover:text-dark">
            View Agent Profile
         </Button>
      </div>
    </div>
  );
}
