"use client";

import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SITE_CONFIG } from "@/constants";

const contactDetails = [
  {
    icon: Phone,
    title: "Call Us",
    value: SITE_CONFIG.contact.phone,
    description: "Mon-Fri from 8am to 6pm.",
  },
  {
    icon: Mail,
    title: "Email Us",
    value: SITE_CONFIG.contact.email,
    description: "We'll respond within 24 hours.",
  },
  {
    icon: MapPin,
    title: "Visit Our Office",
    value: SITE_CONFIG.contact.address,
    description: "Stop by for a coffee and a chat.",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "08:00 AM - 06:00 PM",
    description: "Monday to Saturday.",
  },
];

export function ContactInfo() {
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
