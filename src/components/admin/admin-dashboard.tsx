"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  LogOut,
  Globe,
  Phone,
  Share2,
  ChevronRight,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsForm } from "./settings-form";

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminSection = "general" | "contact" | "social";

const SIDEBAR_ITEMS: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    icon: Globe,
    description: "Site name & description",
  },
  {
    id: "contact",
    label: "Contact Info",
    icon: Phone,
    description: "Email, phone & address",
  },
  {
    id: "social",
    label: "Social Links",
    icon: Share2,
    description: "Social media profiles",
  },
];

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-[70vh]">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-dark font-heading leading-tight">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Manage your site settings
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="space-y-1 sticky top-52">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold", isActive && "text-white")}>
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          "text-xs truncate",
                          isActive ? "text-white/70" : "text-gray-400"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform",
                        isActive
                          ? "text-white/70"
                          : "text-gray-300 group-hover:text-gray-400"
                      )}
                    />
                  </button>
                );
              })}

              {/* Info Card */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-dark">
                    MCBHLUES Admin
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Changes are saved locally. Connect a database to persist
                  settings across sessions.
                </p>
              </div>
            </nav>
          </aside>

          {/* Sidebar - Mobile */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-6 pt-24"
                  onClick={(e) => e.stopPropagation()}
                >
                  <nav className="space-y-1">
                    {SIDEBAR_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                            isActive
                              ? "bg-primary text-white"
                              : "hover:bg-gray-50 text-gray-700"
                          )}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsForm section={activeSection} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
