/**
 * Demo operational content: customers, enquiries, bookings, CMS entries,
 * media assets and notifications. Seeded once per table (only when empty), so
 * anything edited or deleted from the Staff Portal afterwards stays as-is.
 *
 * All demo records are Nigeria-based: names, +234 phone numbers, Naira
 * budgets and Nigerian locations.
 */

export const CUSTOMER_SEED = [
  {
    firstName: "Chiamaka", lastName: "Okonkwo", email: "chiamaka.okonkwo@example.com",
    phone: "+234 803 210 3344", type: "buyer", status: "active", source: "Website",
    budgetMin: 120_000_000, budgetMax: 350_000_000, preferredLocation: "Lekki, Lagos",
    notes: "Looking for a 3 bedroom apartment in a serviced estate, prefers modern finishes.",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    firstName: "Emeka", lastName: "Nwosu", email: "emeka.nwosu@example.com",
    phone: "+234 802 210 7788", type: "investor", status: "active", source: "Referral",
    budgetMin: 400_000_000, budgetMax: 900_000_000, preferredLocation: "Ikoyi, Lagos",
    notes: "Repeat investor. Portfolio acquisitions only, cash buyer.",
    assignedEmail: "admin@mcbhlues.com",
  },
  {
    firstName: "Aisha", lastName: "Bello", email: "aisha.bello@example.com",
    phone: "+234 805 210 9911", type: "renter", status: "lead", source: "Phone",
    budgetMin: 1_500_000, budgetMax: 4_000_000, preferredLocation: "Yaba, Lagos",
    notes: "Relocating to Lagos next month, prefers a furnished unit with internet.",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    firstName: "Ibrahim", lastName: "Yusuf", email: "ibrahim.yusuf@example.com",
    phone: "+234 809 210 5533", type: "seller", status: "active", source: "Walk-in",
    budgetMin: 0, budgetMax: 0, preferredLocation: "Wuse II, Abuja",
    notes: "Considering listing a four bedroom terrace house in Wuse II.",
    assignedEmail: "reception@mcbhlues.com",
  },
];

export const ENQUIRY_SEED = [
  {
    name: "Sofia Okafor", email: "sofia.o@example.com", phone: "+234 803 300 1122",
    subject: "Buying a Property", type: "general", source: "website",
    message: "I am relocating to Lagos and would like to talk to a consultant about buying an apartment on Victoria Island.",
    status: "new", priority: "normal", propertySlug: null,
    assignedEmail: null, customerEmail: null,
  },
  {
    name: "Chisom Eze", email: "chisom.eze@example.com", phone: "+234 802 300 3345",
    subject: "Inquiry: Azure Sky Penthouse", type: "property", source: "website",
    message: "Is the Azure Sky Penthouse on Victoria Island still available? What is the service charge?",
    status: "in_progress", priority: "high", propertySlug: "azure-sky-penthouse",
    assignedEmail: "salesagent@mcbhlues.com", customerEmail: "chiamaka.okonkwo@example.com",
  },
  {
    name: "Aisha Bello", email: "aisha.bello@example.com", phone: "+234 805 300 5577",
    subject: "Schedule a viewing", type: "viewing", source: "website",
    message: "I am interested in the Yaba studio and would like to schedule a viewing this weekend if possible.",
    status: "responded", priority: "high", propertySlug: "yaba-studio",
    assignedEmail: "salesagent@mcbhlues.com", customerEmail: "aisha.bello@example.com",
  },
  {
    name: "David Adeyemi", email: "david.adeyemi@example.com", phone: "",
    subject: "Property management quote", type: "general", source: "phone",
    message: "Called the office asking about facility management for a block of flats in Lekki.",
    status: "closed", priority: "low", propertySlug: null,
    assignedEmail: "admin@mcbhlues.com", customerEmail: null,
  },
];

export const BOOKING_SEED = [
  {
    name: "Aisha Bello", email: "aisha.bello@example.com", phone: "+234 805 300 5577",
    type: "viewing", status: "confirmed", inDays: 2, hour: 10,
    durationMinutes: 45, location: "On-site, Yaba",
    notes: "Meet at the estate gate. The security team has been notified.",
    propertySlug: "yaba-studio", customerEmail: "aisha.bello@example.com",
    assignedEmail: "salesagent@mcbhlues.com",
  },
  {
    name: "Sofia Okafor", email: "sofia.o@example.com", phone: "+234 803 300 1122",
    type: "consultation", status: "pending", inDays: 4, hour: 14,
    durationMinutes: 60, location: "Office, Victoria Island",
    notes: "First consultation: relocation brief for a buyer.",
    propertySlug: null, customerEmail: null,
    assignedEmail: "admin@mcbhlues.com",
  },
  {
    name: "Emeka Nwosu", email: "emeka.nwosu@example.com", phone: "+234 802 210 7788",
    type: "inspection", status: "confirmed", inDays: 7, hour: 9,
    durationMinutes: 120, location: "On-site, Victoria Island",
    notes: "Full building inspection with the investor's surveyor present.",
    propertySlug: "azure-sky-penthouse", customerEmail: "emeka.nwosu@example.com",
    assignedEmail: "propertymanager@mcbhlues.com",
  },
];

// Testimonials are never seeded: anything shown on the homepage is a real,
// published review added from the Staff Portal (Content -> Testimonials).
export const TESTIMONIAL_SEED: {
  name: string;
  role: string;
  quote: string;
  rating: number;
  sortOrder: number;
}[] = [];

export const FAQ_SEED = [
  {
    question: "What areas in Nigeria does MCBHLUES cover?",
    answer:
      "We are based in Lagos and currently manage listings and clients across Lagos (Victoria Island, Ikoyi, Lekki, Yaba and the mainland) and Abuja. For property anywhere in Nigeria, contact us and we will arrange local representation.",
    category: "general", sortOrder: 10,
  },
  {
    question: "What types of properties do you offer for sale?",
    answer:
      "We list apartments, duplexes, terraces, detached homes and commercial space. Every listing is visited and checked before it goes live, and the title is verified before we recommend it to a buyer.",
    category: "buying", sortOrder: 20,
  },
  {
    question: "Do you help buyers with financing?",
    answer:
      "Yes. We work with banks and mortgage providers in Nigeria to help you understand what you can borrow and which financing option fits. Our consultants guide you through the process.",
    category: "buying", sortOrder: 30,
  },
  {
    question: "Can I schedule a viewing before making a decision?",
    answer:
      "Of course. Once you shortlist a property, we arrange a private viewing at a time that suits you, including weekend viewings. For buyers outside Lagos we can arrange a video walkthrough first.",
    category: "buying", sortOrder: 40,
  },
  {
    question: "What does the monthly rent usually include?",
    answer:
      "Most of our rental listings include estate security and building management. Whether power, water or service charges are included varies by property; your agent will give you a full breakdown before you sign.",
    category: "renting", sortOrder: 50,
  },
];

export const ANNOUNCEMENT_SEED = [
  {
    title: "New listings now live in Lagos",
    body: "Explore the latest additions across Victoria Island, Ikoyi and Lekki.",
    tone: "info", isActive: true,
  },
];

export const MEDIA_SEED = [
  {
    title: "Azure Sky Penthouse (hero)",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600",
    kind: "image", folder: "properties", alt: "Modern apartment living room with a skyline view",
  },
  {
    title: "Victoria Island residence (facade)",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600",
    kind: "image", folder: "properties", alt: "Residential building exterior in Lagos",
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
