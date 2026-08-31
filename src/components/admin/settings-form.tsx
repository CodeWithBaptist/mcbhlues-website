"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  section: "general" | "contact" | "social";
}

interface SiteSettings {
  name: string;
  description: string;
  tagline: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: { title: string; href: string; icon: string }[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  name: "MCBHLUES ENTERPRISES",
  description:
    "Luxury Real Estate Consulting, Property Development & Facility Management",
  tagline: "Redefining Luxury Real Estate",
  contact: {
    email: "info@mcbhlues.com",
    phone: "+1 (555) 000-0000",
    address: "123 Business Avenue, Suite 100, Financial District",
  },
  social: [
    { title: "Facebook", href: "https://facebook.com", icon: "Facebook" },
    { title: "Instagram", href: "https://instagram.com", icon: "Instagram" },
    { title: "Twitter", href: "https://twitter.com", icon: "Twitter" },
    { title: "LinkedIn", href: "https://linkedin.com", icon: "Linkedin" },
  ],
};

const STORAGE_KEY = "mcbhlues_site_settings";

function loadSettings(): SiteSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function SettingsForm({ section }: SettingsFormProps) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const updateContact = (key: keyof SiteSettings["contact"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      contact: { ...prev.contact, [key]: value },
    }));
    setDirty(true);
    setSaved(false);
  };

  const updateSocial = (
    index: number,
    field: "title" | "href" | "icon",
    value: string
  ) => {
    setSettings((prev) => {
      const social = [...prev.social];
      social[index] = { ...social[index], [field]: value };
      return { ...prev, social };
    });
    setDirty(true);
    setSaved(false);
  };

  const addSocial = () => {
    setSettings((prev) => ({
      ...prev,
      social: [...prev.social, { title: "", href: "", icon: "Globe" }],
    }));
    setDirty(true);
    setSaved(false);
  };

  const removeSocial = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      social: prev.social.filter((_, i) => i !== index),
    }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setDirty(true);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark font-heading capitalize">
            {section === "general"
              ? "General Settings"
              : section === "contact"
              ? "Contact Information"
              : "Social Links"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {section === "general"
              ? "Configure your site name, description, and tagline"
              : section === "contact"
              ? "Update your business contact details displayed across the site"
              : "Manage social media profile links shown in the footer"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <Button
            onClick={handleSave}
            disabled={!dirty}
            className={cn(
              "transition-all",
              saved && "!bg-green-600 hover:!bg-green-700"
            )}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* General Settings */}
        {section === "general" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Site Name
              </label>
              <Input
                value={settings.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Your company name"
              />
              <p className="text-xs text-gray-400">
                Displayed in the navbar, page titles, and meta tags
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark">
                Tagline
              </label>
              <Input
                value={settings.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="A short catchy tagline"
              />
              <p className="text-xs text-gray-400">
                Used as a short descriptor in the hero section
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark">
                Description
              </label>
              <Textarea
                value={settings.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="A brief description of your business"
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-400">
                Used for SEO meta descriptions and about sections
              </p>
            </div>

            {/* Preview */}
            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Preview
              </p>
              <div className="space-y-1">
                <p className="text-lg font-bold text-dark font-heading">
                  {settings.name || "Site Name"}
                </p>
                <p className="text-sm text-gray-500">
                  {settings.description || "Site description"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Settings */}
        {section === "contact" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </label>
              <Input
                type="email"
                value={settings.contact.email}
                onChange={(e) => updateContact("email", e.target.value)}
                placeholder="info@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={settings.contact.phone}
                onChange={(e) => updateContact("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-dark flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Office Address
              </label>
              <Textarea
                value={settings.contact.address}
                onChange={(e) => updateContact("address", e.target.value)}
                placeholder="123 Business St, City, State"
                className="min-h-[80px]"
              />
            </div>

            {/* Preview */}
            <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Preview
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-primary" />
                  {settings.contact.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-primary" />
                  {settings.contact.phone}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-primary" />
                  {settings.contact.address}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Links */}
        {section === "social" && (
          <div className="p-6 sm:p-8 space-y-6">
            {settings.social.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Link #{index + 1}
                  </span>
                  <button
                    onClick={() => removeSocial(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      Platform
                    </label>
                    <Input
                      value={link.title}
                      onChange={(e) =>
                        updateSocial(index, "title", e.target.value)
                      }
                      placeholder="e.g. Facebook"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      URL
                    </label>
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateSocial(index, "href", e.target.value)
                      }
                      placeholder="https://..."
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      Icon Name
                    </label>
                    <Input
                      value={link.icon}
                      onChange={(e) =>
                        updateSocial(index, "icon", e.target.value)
                      }
                      placeholder="e.g. Facebook"
                      className="h-10"
                    />
                  </div>
                </div>
                {link.href && link.href !== "#" && (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit link
                  </a>
                )}
              </motion.div>
            ))}

            <button
              onClick={addSocial}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Social Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
