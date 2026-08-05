"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Phone, Mail, User } from "lucide-react";

export function PropertySidebar() {
  return (
    <div className="flex flex-col gap-8 sticky top-32">
      {/* Contact Form */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
        <h4 className="text-xl font-bold text-dark font-heading mb-6">Inquire About This Property</h4>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
             <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
             <Input placeholder="Your Full Name" className="pl-10" />
          </div>
          <div className="relative">
             <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
             <Input placeholder="Email Address" type="email" className="pl-10" />
          </div>
          <div className="relative">
             <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
             <Input placeholder="Phone Number" type="tel" className="pl-10" />
          </div>
          <Textarea placeholder="I'm interested in this property and would like to schedule a viewing..." />
          <Button className="w-full py-6 text-lg font-bold">Send Inquiry</Button>
        </form>
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
