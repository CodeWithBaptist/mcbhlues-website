/**
 * Demo operational content — customers, enquiries, bookings, CMS entries,
 * media assets and notifications. Seeded once per table (only when empty), so
 * anything edited or deleted from the Staff Portal afterwards stays as-is.
 */

export const CUSTOMER_SEED = [
  {
    firstName: "Elena", lastName: "Vasquez", email: "elena.vasquez@example.com",
    phone: "+1 (555) 210-3344", type: "buyer", status: "active", source: "Website",
    budgetMin: 850_000, budgetMax: 1_400_000, preferredLocation: "Miami Beach, FL",
    notes: "Looking for a waterfront condo, prefers modern finishes.",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    firstName: "Marcus", lastName: "Chen", email: "marcus.chen@example.com",
    phone: "+1 (555) 210-7788", type: "investor", status: "active", source: "Referral",
    budgetMin: 2_000_000, budgetMax: 5_000_000, preferredLocation: "Manhattan, NY",
    notes: "Repeat investor — portfolio acquisitions only, cash buyer.",
    assignedEmail: "admin@mcbhlues.com",
  },
  {
    firstName: "Fatima", lastName: "Al-Sayed", email: "fatima.alsayed@example.com",
    phone: "+1 (555) 210-9911", type: "renter", status: "lead", source: "Phone",
    budgetMin: 4_000, budgetMax: 7_500, preferredLocation: "Downtown Los Angeles",
    notes: "Relocating in October, needs furnishing included.",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    firstName: "George", lastName: "Osei", email: "george.osei@example.com",
    phone: "+1 (555) 210-5533", type: "seller", status: "active", source: "Walk-in",
    budgetMin: 0, budgetMax: 0, preferredLocation: "Boston, MA",
    notes: "Considering listing a brownstone in Q1 2027.",
    assignedEmail: "reception@mcbhlues.com",
  },
];

export const ENQUIRY_SEED = [
  {
    name: "Sofia Marchetti", email: "sofia.m@example.com", phone: "+1 (555) 300-1122",
    subject: "Buying a Property", type: "general", source: "website",
    message: "Hi, I'd like to talk to a consultant about relocating to Miami and buying a condo.",
    status: "new", priority: "normal", propertySlug: null,
    assignedEmail: null, customerEmail: null,
  },
  {
    name: "James Whitfield", email: "jwhitfield@example.com", phone: "+1 (555) 300-3345",
    subject: "Inquiry: Azure Sky Penthouse", type: "property", source: "website",
    message: "Is the Azure Sky Penthouse still available? What are the HOA fees?",
    status: "in_progress", priority: "high", propertySlug: "azure-sky-penthouse",
    assignedEmail: "salesagent@mcbhlues.com", customerEmail: "elena.vasquez@example.com",
  },
  {
    name: "Amara Diallo", email: "amara.d@example.com", phone: "+1 (555) 300-5577",
    subject: "Schedule a viewing", type: "viewing", source: "website",
    message: "I'm interested in this property and would like to schedule a viewing this weekend if possible.",
    status: "responded", priority: "high", propertySlug: "emerald-estate",
    assignedEmail: "salesagent@mcbhlues.com", customerEmail: "fatima.alsayed@example.com",
  },
  {
    name: "David Kim", email: "dkim@example.com", phone: "",
    subject: "Property management quote", type: "general", source: "phone",
    message: "Called the office asking about facility management for a 12-unit building.",
    status: "closed", priority: "low", propertySlug: null,
    assignedEmail: "admin@mcbhlues.com", customerEmail: null,
  },
];

export const BOOKING_SEED = [
  {
    name: "Amara Diallo", email: "amara.d@example.com", phone: "+1 (555) 300-5577",
    type: "viewing", status: "confirmed", inDays: 2, hour: 10,
    durationMinutes: 45, location: "On-site",
    notes: "Bring building access code; client is travelling from out of state.",
    propertySlug: "emerald-estate", customerEmail: "fatima.alsayed@example.com",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    name: "Sofia Marchetti", email: "sofia.m@example.com", phone: "+1 (555) 300-1122",
    type: "consultation", status: "pending", inDays: 4, hour: 14,
    durationMinutes: 60, location: "Office — Suite 100",
    notes: "First consultation: relocation brief.",
    propertySlug: null, customerEmail: null,
    assignedEmail: "admin@mcbhlues.com",
  },
  {
    name: "Marcus Chen", email: "marcus.chen@example.com", phone: "+1 (555) 210-7788",
    type: "inspection", status: "confirmed", inDays: 7, hour: 9,
    durationMinutes: 120, location: "On-site",
    notes: "Full building inspection with the investor's surveyor present.",
    propertySlug: "azure-sky-penthouse", customerEmail: "marcus.chen@example.com",
    assignedEmail: "propertymanager@mcbhlues.com",
  },
];

export const TESTIMONIAL_SEED = [
  {
    name: "Elena Vasquez", role: "Homeowner, Miami Beach",
    quote: "MCBHLUES found us our dream waterfront condo in under six weeks. Every viewing was perfectly curated — we never wasted an afternoon.",
    rating: 5, sortOrder: 10,
  },
  {
    name: "Marcus Chen", role: "Property Investor",
    quote: "Their market analysis is surgical. Two acquisitions in, both outperforming projections. I will not buy without their consult again.",
    rating: 5, sortOrder: 20,
  },
  {
    name: "Fatima Al-Sayed", role: "Tenant, Downtown LA",
    quote: "Relocating from abroad was daunting, but the team handled everything — the lease, the furniture, even the utility setup.",
    rating: 4, sortOrder: 30,
  },
];

export const FAQ_SEED = [
  {
    question: "What types of properties does MCBHLUES offer for sale?",
    answer:
      "We offer a comprehensive range of luxury properties including penthouses, villas, estates, lofts, and premium commercial spaces. Each listing is hand-verified to meet our rigorous quality and location standards.",
    category: "buying", sortOrder: 10,
  },
  {
    question: "Do you provide financing assistance for property purchases?",
    answer:
      "Yes. We work with a network of trusted financial institutions and mortgage brokers to help you secure the best financing options. Our consultants will guide you through the entire process.",
    category: "buying", sortOrder: 20,
  },
  {
    question: "How do you verify your property listings?",
    answer:
      "Every listing undergoes a thorough verification process that includes title checks, physical inspections, neighborhood assessments, and legal clearance. This ensures you invest with complete confidence.",
    category: "general", sortOrder: 30,
  },
  {
    question: "Can I schedule property viewings before making a decision?",
    answer:
      "Absolutely. We encourage all prospective buyers to schedule private viewings. Our agents will arrange exclusive tours at your convenience, including virtual walkthroughs for international buyers.",
    category: "buying", sortOrder: 40,
  },
  {
    question: "What is included in the monthly rent?",
    answer:
      "Most of our rental listings include building amenities and facility management. Utilities vary by property — your agent will provide a full breakdown before you sign.",
    category: "renting", sortOrder: 50,
  },
];

export const ANNOUNCEMENT_SEED = [
  {
    title: "New penthouse collection now live",
    body: "Explore the latest additions to our Manhattan portfolio.",
    tone: "info", isActive: true,
  },
];

export const MEDIA_SEED = [
  {
    title: "Azure Sky Penthouse — hero",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600",
    kind: "image", folder: "properties", alt: "Modern penthouse living room with skyline view",
  },
  {
    title: "The Regent Estate — facade",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600",
    kind: "image", folder: "properties", alt: "Estate exterior at dusk",
  },
  {
    title: "2026 Buyer's Guide",
    url: "https://example.com/documents/mcbhlues-buyers-guide-2026.pdf",
    kind: "document", folder: "documents", alt: "MCBHLUES buyer's guide PDF",
  },
];

export const NOTIFICATION_SEED = [
  {
    userEmail: null, // broadcast
    title: "Welcome to the Staff Portal",
    body: "Customers, enquiries, bookings and CMS are now fully live. Explore the Operations section.",
    kind: "system", link: "/portal",
  },
];
