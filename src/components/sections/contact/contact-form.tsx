"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function ContactForm() {
  return (
    <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-xl">
      <h3 className="text-2xl font-bold text-dark font-heading mb-8">Send Us a Message</h3>
      
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
            <Input placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
            <Input placeholder="john@example.com" type="email" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
            <Input placeholder="+1 (555) 000-0000" type="tel" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Subject</label>
            <select className="flex h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
              <option>General Inquiry</option>
              <option>Talk to a Consultant</option>
              <option>List My Property</option>
              <option>Buying a Property</option>
              <option>Renting a Property</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your Message</label>
          <Textarea placeholder="How can we help you today?" className="min-h-[150px]" />
        </div>

        <Button className="w-full py-6 text-lg font-bold gap-2">
          Send Message
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
