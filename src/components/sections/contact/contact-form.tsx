"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const SUBJECTS = [
  "General Inquiry",
  "Talk to a Consultant",
  "List My Property",
  "Buying a Property",
  "Renting a Property",
];

/**
 * Contact form. Submissions are stored as real enquiries in the Staff Portal
 * (Operations → Enquiries) via the public endpoint, and the enquiries team is
 * notified in-app immediately.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ name, email, phone, subject, message, company }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResult({ ok: false, text: data.error ?? "Something went wrong — please try again." });
        return;
      }
      setResult({
        ok: true,
        text: `Thank you, ${name.split(" ")[0]} — your enquiry (${data.reference ?? "received"}) has been logged and a consultant will reach out shortly.`,
      });
      setName("");
      setEmail("");
      setPhone("");
      setSubject(SUBJECTS[0]);
      setMessage("");
    } catch {
      setResult({ ok: false, text: "Network error — please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-xl">
      <h3 className="text-2xl font-bold text-dark font-heading mb-8">Send Us a Message</h3>

      {result?.ok ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          <p className="max-w-sm text-gray-600">{result.text}</p>
          <Button variant="outline" onClick={() => setResult(null)}>
            Send another message
          </Button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
              <Input required placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
              <Input required placeholder="john@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
              <Input placeholder="+1 (555) 000-0000" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</label>
              <select
                className="flex h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your Message</label>
            <Textarea
              required
              placeholder="How can we help you today?"
              className="min-h-[150px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

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

          <Button className="w-full py-6 text-lg font-bold gap-2" disabled={sending}>
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </form>
      )}
    </div>
  );
}
