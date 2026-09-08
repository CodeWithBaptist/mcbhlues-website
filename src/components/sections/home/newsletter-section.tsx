"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartImage } from "@/components/ui/smart-image";
import { validateSubscriptionEmail } from "@/lib/newsletter/subscription";

const IMAGE_SRC = "/newsletter-property.jpg";
const IMAGE_ALT =
  "A contemporary MCBHLUES residence at dusk, glazing lit from within and reflected in a still courtyard pool";

const EASE = [0.22, 1, 0.36, 1] as const;

type SubmitState = "idle" | "submitting" | "success";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateSubscriptionEmail(email);
    if (validation) {
      setError(validation);
      inputRef.current?.focus();
      return;
    }

    setSubmitState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; alreadySubscribed?: boolean; error?: string }
        | null;

      if (res.ok && data?.ok) {
        setAlreadySubscribed(Boolean(data.alreadySubscribed));
        setSubmitState("success");
      } else {
        setSubmitState("idle");
        setError(data?.error ?? "We couldn't add that address just now. Please try again.");
        inputRef.current?.focus();
      }
    } catch {
      setSubmitState("idle");
      setError("Something went wrong. Please try again in a moment.");
      inputRef.current?.focus();
    }
  }

  return (
    <section className="bg-white py-16 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="overflow-hidden rounded-[1.25rem] border border-gray-200 bg-white shadow-soft lg:grid lg:grid-cols-2"
        >
          {/* Image — left side, beside the subscribe form */}
          <div className="relative min-h-[340px] overflow-hidden bg-primary-dark sm:min-h-[440px] lg:min-h-[560px]">
            {!imageFailed && (
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.06 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                <SmartImage
                  src={IMAGE_SRC}
                  alt={IMAGE_ALT}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-[68%_center]"
                  onError={() => setImageFailed(true)}
                />
              </motion.div>
            )}
            {/* Brand wash to keep it in palette */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-primary-dark/70 via-primary-dark/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-primary-dark/10 lg:to-primary-dark/40"
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 p-6 sm:p-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <MapPin className="h-4 w-4 text-white" aria-hidden="true" />
              </span>
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-white/90">
                Victoria Island · Lagos — Private listing preview
              </span>
            </div>
          </div>

          {/* Subscribe — right side, directly beside the image */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 xl:p-14">
            {submitState === "success" ? (
              <div className="flex flex-col gap-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-primary">
                  <Check className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-dark sm:text-[2rem]">
                  You&apos;re on the list.
                </h2>
                <p className="text-[0.9375rem] leading-relaxed text-gray-600">
                  {alreadySubscribed
                    ? "That address is already with us — welcome back. The next edition is on its way."
                    : "Thank you. The next edition — new listings, pricing context and the occasional off-market opportunity — is on its way to your inbox."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitState("idle");
                    setEmail("");
                  }}
                  className="w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Add another address
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-primary">
                    Private listings · Market notes
                  </p>
                  <h2 className="font-heading text-[1.75rem] font-bold leading-[1.12] tracking-[-0.02em] text-dark sm:text-[2.125rem]">
                    See the right homes before the market does.
                  </h2>
                  <p className="text-[0.9375rem] leading-[1.65] text-gray-600">
                    A considered monthly email on Lagos property — new listings,
                    pricing context and the occasional off-market opportunity.
                    One email a month, unsubscribe in one click.
                  </p>
                </div>

                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
                  <label htmlFor="newsletter-section-email" className="sr-only">
                    Email address
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1">
                      <Input
                        ref={inputRef}
                        id="newsletter-section-email"
                        name="newsletter-section-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        value={email}
                        disabled={submitState === "submitting"}
                        error={Boolean(error)}
                        aria-describedby={error ? "newsletter-section-error" : undefined}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="h-[3.25rem] text-[0.9375rem]"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      loading={submitState === "submitting"}
                      className="group h-[3.25rem] shrink-0 gap-2 px-7 font-semibold sm:w-auto"
                    >
                      Join the list
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 ease-soft group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                  {error && (
                    <p id="newsletter-section-error" role="alert" className="text-sm text-red-700">
                      {error}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-gray-500">
                    We never share your address. Read our{" "}
                    <a href="/privacy" className="underline underline-offset-4 hover:text-dark">
                      privacy policy
                    </a>
                    .
                  </p>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
