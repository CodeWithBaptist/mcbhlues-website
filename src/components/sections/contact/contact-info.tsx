"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SITE_CONFIG } from "@/constants";

interface ContactInfoProps {
  /** From Portal → Company Settings; falls back to the shipped constants. */
  contact?: {
    email: string;
    phone: string;
    address: string;
  };
}

export function ContactInfo({ contact }: ContactInfoProps) {
  const details = contact ?? SITE_CONFIG.contact;

  const contactDetails = [
    {
      icon: Phone,
      title: "Call Us",
      value: details.phone,
      description: "Mon-Fri from 8am to 6pm.",
    },
    {
      icon: Mail,
      title: "Email Us",
      value: details.email,
      description: "We'll respond within 24 hours.",
    },
    {
      icon: MapPin,
      title: "Visit Our Office",
      value: details.address,
      description: "Stop by for a coffee and a chat.",
    },
    {
      icon: Clock,
      title: "Working Hours",
      value: "08:00 AM - 06:00 PM",
      description: "Monday to Saturday.",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-8">
      {contactDetails.map((item) => (
        <div key={item.title} className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            <item.icon className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-dark font-heading mb-2">{item.title}</h4>
          <p className="text-primary font-bold mb-2">{item.value}</p>
          <p className="text-gray-500 text-sm">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
