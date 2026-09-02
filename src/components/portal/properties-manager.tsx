"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/utils";
import type { PropertyWithDetails } from "@/lib/properties/property-service";
import { useSession } from "./permission-provider";
import { Card, EmptyState, StatusPill } from "./ui";
import { FileUpload } from "./file-upload";

export interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

interface PropertiesManagerProps {
  initialProperties: PropertyWithDetails[];
  staff: StaffOption[];
  canAssign: boolean;
  permissions: string[];
}

interface ImageDraft {
  url: string;
  alt: string;
  isPrimary: boolean;
}
interface AmenityDraft {
  name: string;
  icon: string;
}

interface EditorState {
  id: string | null; // null = creating
  title: string;
  description: string;
  type: "sale" | "rent";
  status: string;
  price: string;
  currency: string;
  beds: string;
  baths: string;
  sqft: string;
  yearBuilt: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  images: ImageDraft[];
  amenities: AmenityDraft[];
  features: string[];
  assignedUserIds: string[];
}

function emptyEditor(): EditorState {
  return {
    id: null,
    title: "",
    description: "",
    type: "sale",
    status: "available",
    price: "",
    currency: DEFAULT_CURRENCY,
    beds: "",
    baths: "",
    sqft: "",
    yearBuilt: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    isFeatured: false,
    isPublished: true,
    images: [],
    amenities: [],
    features: [],
    assignedUserIds: [],
  };
}

function fromProperty(property: PropertyWithDetails): EditorState {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    status: property.status,
    price: String(property.price),
    currency: property.currency,
    beds: String(property.beds),
    baths: String(property.baths),
    sqft: String(property.sqft),
    yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "",
    address: property.address,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode,
    country: property.country,
    latitude: property.latitude,
    longitude: property.longitude,
    googleMapsUrl: property.googleMapsUrl,
    isFeatured: property.isFeatured,
    isPublished: property.isPublished,
    images: property.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isPrimary: image.isPrimary,
    })),
    amenities: property.amenities.map((amenity) => ({ name: amenity.name, icon: amenity.icon })),
    features: property.features.map((feature) => feature.label),
    assignedUserIds: property.assignedUserIds,
  };
}

export function PropertiesManager({
  initialProperties,
  staff,
  canAssign,
  permissions,
}: PropertiesManagerProps) {
  const router = useRouter();
  const { user } = useSession();

  const [properties, setProperties] = useState(initialProperties);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const canCreate = permissions.includes("property:create");
  const canEdit = permissions.includes("property:update");
  const canDelete = permissions.includes("property:delete");
  const canPublish = permissions.includes("property:publish");
  const canUnpublish = permissions.includes("property:unpublish");
  const canStatus = permissions.includes("property:status_update");

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(search.toLowerCase()) ||
        property.city.toLowerCase().includes(search.toLowerCase()) ||
        property.state.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || property.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [properties, search, typeFilter]);

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  async function call(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify(data.error ?? "Request failed.", "error");
      return null;
    }
    return data;
  }

  async function refresh() {
    const data = await call("/api/portal/properties");
    if (data?.properties) {
      setProperties(data.properties);
      router.refresh();
    }
  }

  async function togglePublish(property: PropertyWithDetails) {
    setBusyId(property.id);
    const data = await call(`/api/portal/properties/${property.id}/publish`, {
      method: "POST",
      body: JSON.stringify({ published: !property.isPublished }),
    });
    setBusyId(null);
    if (data?.property) {
      notify(property.isPublished ? "Property unpublished." : "Property published.");
      await refresh();
    }
  }

  async function changeStatus(property: PropertyWithDetails, status: string) {
    setBusyId(property.id);
    const data = await call(`/api/portal/properties/${property.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (data?.property) {
      notify(`Status updated to ${status}.`);
      await refresh();
    }
  }

  async function remove(property: PropertyWithDetails) {
    if (!confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    setBusyId(property.id);
    const data = await call(`/api/portal/properties/${property.id}`, { method: "DELETE" });
    setBusyId(null);
    if (data?.ok) {
      notify("Property deleted.");
      await refresh();
    }
  }

  const staffName = (id: string) => {
    const member = staff.find((row) => row.id === id);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown";
  };

  return (
    <div className="space-y-5">
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by title or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex rounded-lg bg-gray-100 p-1">
            {[
              { label: "All", value: "all" },
              { label: "For Sale", value: "sale" },
              { label: "For Rent", value: "rent" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTypeFilter(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  typeFilter === option.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-dark"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {canCreate && (
          <Button onClick={() => setEditor(emptyEditor())}>
            <Plus className="mr-2 h-4 w-4" />
            Add property
          </Button>
        )}
      </div>

      <Card title="Property listings" description={`${properties.length} total · ${filtered.length} shown`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No properties found"
            description={
              properties.length === 0
                ? "Create your first listing to get started."
                : "Try adjusting your search or filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Visibility</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((property) => (
                  <tr key={property.id} className="border-b border-gray-50 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                          {property.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={property.images[0].url}
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-dark">
                            <span className="truncate">{property.title}</span>
                            {property.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {[property.city, property.state].filter(Boolean).join(", ") || "No location"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {property.beds} bd · {property.baths} ba · {property.sqft.toLocaleString()} sqft
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {property.type === "sale" ? "For Sale" : "For Rent"}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-semibold text-dark">
                      {formatCurrency(property.price, property.currency)}
                      {property.type === "rent" && <span className="text-xs text-gray-400">/mo</span>}
                    </td>

                    <td className="px-3 py-3">
                      <StatusPill status={property.status} />
                    </td>

                    <td className="px-3 py-3">
                      {property.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <Eye className="h-3.5 w-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                          <EyeOff className="h-3.5 w-3.5" /> Draft
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-gray-600">
                      {property.assignedUserIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {property.assignedUserIds.map((id) => (
                            <span key={id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">
                              {staffName(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {canEdit && (
                          <IconAction title="Edit" disabled={busyId !== null} onClick={() => setEditor(fromProperty(property))}>
                            <Pencil className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                        {canStatus && (
                          <select
                            className="rounded border border-gray-200 px-1.5 py-1 text-xs"
                            value={property.status}
                            disabled={busyId !== null}
                            onChange={(event) => changeStatus(property, event.target.value)}
                          >
                            <option value="available">available</option>
                            <option value="pending">pending</option>
                            <option value="sold">sold</option>
                            <option value="rented">rented</option>
                          </select>
                        )}
                        {(canPublish || canUnpublish) && (
                          <IconAction
                            title={property.isPublished ? "Unpublish" : "Publish"}
                            disabled={busyId !== null}
                            onClick={() => togglePublish(property)}
                          >
                            {property.isPublished ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <BadgeCheck className="h-3.5 w-3.5" />
                            )}
                          </IconAction>
                        )}
                        {canDelete && (
                          <IconAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(property)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editor && (
        <PropertyEditor
          state={editor}
          staff={staff}
          canAssign={canAssign}
          canManageImages={permissions.includes("property:image_manage")}
          canManageAmenities={permissions.includes("property:amenity_manage")}
          canManageFeatures={permissions.includes("property:feature_manage")}
          onClose={() => setEditor(null)}
          onSaved={async (createdId?: string) => {
            setEditor(null);
            notify(createdId ? "Property created." : "Property updated.");
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function IconAction({
  children,
  title,
  danger,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function PropertyEditor({
  state: initial,
  staff,
  canAssign,
  canManageImages,
  canManageAmenities,
  canManageFeatures,
  onClose,
  onSaved,
}: {
  state: EditorState;
  staff: StaffOption[];
  canAssign: boolean;
  canManageImages: boolean;
  canManageAmenities: boolean;
  canManageFeatures: boolean;
  onClose: () => void;
  onSaved: (createdId?: string) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditorState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [featureLabel, setFeatureLabel] = useState("");

  const isEdit = Boolean(form.id);
  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  function addImage() {
    const url = imageUrl.trim();
    if (!url) return;
    const images = [...form.images, { url, alt: form.title, isPrimary: form.images.length === 0 }];
    set("images", images);
    setImageUrl("");
  }

  function removeImage(index: number) {
    const images = form.images.filter((_, i) => i !== index);
    if (images.length > 0 && form.images[index]?.isPrimary) {
      images[0].isPrimary = true;
    }
    set("images", images);
  }

  function addAmenity() {
    const name = amenityName.trim();
    if (!name) return;
    set("amenities", [...form.amenities, { name, icon: "" }]);
    setAmenityName("");
  }

  function addFeature() {
    const label = featureLabel.trim();
    if (!label) return;
    set("features", [...form.features, label]);
    setFeatureLabel("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const base = {
      title: form.title,
      description: form.description,
      type: form.type,
      status: form.status,
      price: Number(form.price) || 0,
      currency: form.currency || DEFAULT_CURRENCY,
      beds: Number(form.beds) || 0,
      baths: Number(form.baths) || 0,
      sqft: Number(form.sqft) || 0,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
      address: form.address,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
      latitude: form.latitude,
      longitude: form.longitude,
      googleMapsUrl: form.googleMapsUrl,
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
    };

    let propertyId = form.id;
    let createdId: string | undefined;

    try {
      if (isEdit && propertyId) {
        const data = await api(`/api/portal/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(base) });
        if (!data?.property) throw new Error("Unable to update property.");
      } else {
        const data = await api("/api/portal/properties", { method: "POST", body: JSON.stringify(base) });
        if (!data?.property) throw new Error("Unable to create property.");
        propertyId = data.property.id;
        createdId = data.property.id;
      }
      if (!propertyId) throw new Error("Missing property id.");

      if (canManageImages) {
        const data = await api(`/api/portal/properties/${propertyId}/images`, {
          method: "PUT",
          body: JSON.stringify({ images: form.images }),
        });
        if (!data) throw new Error("Unable to save images.");
      }
      if (canManageAmenities) {
        const data = await api(`/api/portal/properties/${propertyId}/amenities`, {
          method: "PUT",
          body: JSON.stringify({ amenities: form.amenities }),
        });
        if (!data) throw new Error("Unable to save amenities.");
      }
      if (canManageFeatures) {
        const data = await api(`/api/portal/properties/${propertyId}/features`, {
          method: "PUT",
          body: JSON.stringify({ features: form.features }),
        });
        if (!data) throw new Error("Unable to save features.");
      }
      if (canAssign) {
        const original = new Set(initial.assignedUserIds);
        const next = new Set(form.assignedUserIds);
        for (const id of next) {
          if (!original.has(id)) {
            await api(`/api/portal/properties/${propertyId}/assign`, {
              method: "POST",
              body: JSON.stringify({ userId: id }),
            });
          }
        }
        for (const id of original) {
          if (!next.has(id)) {
            await api(`/api/portal/properties/${propertyId}/assign`, {
              method: "POST",
              body: JSON.stringify({ userId: id, unassign: true }),
            });
          }
        }
      }

      onSaved(createdId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
      router.refresh();
    }
  }

  async function api(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Request failed.");
    return data;
  }

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-4xl rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {isEdit ? "Edit property" : "Add property"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? form.title : "Create a new property listing"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {/* Basics */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input
                required
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="e.g. Azure Sky Penthouse"
              />
            </Field>
            <Field label="Listing type">
              <select className={inputClass} value={form.type} onChange={(event) => set("type", event.target.value as "sale" | "rent")}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(event) => set("status", event.target.value)}>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </Field>
            <Field label="Price">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
              />
            </Field>
            <Field label="Currency">
              <select
                className={inputClass}
                value={form.currency}
                onChange={(event) => set("currency", event.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bedrooms">
              <Input type="number" min={0} value={form.beds} onChange={(event) => set("beds", event.target.value)} />
            </Field>
            <Field label="Bathrooms">
              <Input type="number" min={0} value={form.baths} onChange={(event) => set("baths", event.target.value)} />
            </Field>
            <Field label="Square feet">
              <Input type="number" min={0} value={form.sqft} onChange={(event) => set("sqft", event.target.value)} />
            </Field>
            <Field label="Year built">
              <Input type="number" min={0} value={form.yearBuilt} onChange={(event) => set("yearBuilt", event.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={form.description} onChange={(event) => set("description", event.target.value)} />
            </Field>
          </div>

          {/* Location */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark">
              <MapPin className="h-4 w-4 text-primary" /> Location &amp; Google Maps
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Street address" className="sm:col-span-2">
                <Input value={form.address} onChange={(event) => set("address", event.target.value)} />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(event) => set("city", event.target.value)} />
              </Field>
              <Field label="State / Province">
                <Input value={form.state} onChange={(event) => set("state", event.target.value)} />
              </Field>
              <Field label="Postal code">
                <Input value={form.postalCode} onChange={(event) => set("postalCode", event.target.value)} />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(event) => set("country", event.target.value)} />
              </Field>
              <Field label="Latitude">
                <Input value={form.latitude} onChange={(event) => set("latitude", event.target.value)} placeholder="40.7580" />
              </Field>
              <Field label="Longitude">
                <Input value={form.longitude} onChange={(event) => set("longitude", event.target.value)} placeholder="-73.9855" />
              </Field>
              <Field label="Google Maps embed / link URL" className="sm:col-span-2">
                <Input value={form.googleMapsUrl} onChange={(event) => set("googleMapsUrl", event.target.value)} />
              </Field>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              The public detail page pins the map using latitude/longitude when provided, otherwise it falls back to the
              address text.
            </p>
          </div>

          {/* Images */}
          {canManageImages && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark">
                <ImageIcon className="h-4 w-4 text-primary" /> Images
              </h3>
              <div className="flex flex-col gap-3">
                <FileUpload
                  accept="image/*"
                  label="Choose photos from this device"
                  hint="or drag & drop · JPG, PNG, WebP, GIF up to 6 MB each"
                  onUploaded={(file) =>
                    set("images", [
                      ...form.images,
                      { url: file.url, alt: form.title || file.fileName, isPrimary: form.images.length === 0 },
                    ])
                  }
                />
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" /> or paste a link <span className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://…"
                  />
                  <Button type="button" variant="outline" onClick={addImage}>
                    Add
                  </Button>
                </div>
                {form.images.length === 0 && (
                  <p className="text-xs text-gray-400">No images yet. The public card will show a placeholder.</p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.images.map((image, index) => (
                    <div key={index} className="relative overflow-hidden rounded-md border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.alt} className="h-24 w-full object-cover" />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => set("images", form.images.map((img, i) => ({ ...img, isPrimary: i === index })))}
                          className="rounded bg-black/50 p-1 text-white hover:bg-black/70"
                          title="Set as primary"
                          aria-label="Set as primary"
                        >
                          <Star className={cn("h-3 w-3", image.isPrimary ? "fill-amber-400 text-amber-400" : "")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="rounded bg-black/50 p-1 text-white hover:bg-black/70"
                          title="Remove"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {image.isPrimary && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Amenities */}
          {canManageAmenities && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-dark">Amenities</h3>
              <div className="flex gap-2">
                <Input value={amenityName} onChange={(event) => setAmenityName(event.target.value)} placeholder="e.g. Rooftop Pool" />
                <Button type="button" variant="outline" onClick={addAmenity}>
                  Add
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.amenities.map((amenity, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {amenity.name}
                    <button
                      type="button"
                      onClick={() => set("amenities", form.amenities.filter((_, i) => i !== index))}
                      className="text-primary/60 hover:text-red-600"
                      aria-label={`Remove ${amenity.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {form.amenities.length === 0 && <p className="text-xs text-gray-400">No amenities added.</p>}
              </div>
            </div>
          )}

          {/* Features */}
          {canManageFeatures && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-dark">Key features</h3>
              <div className="flex gap-2">
                <Input value={featureLabel} onChange={(event) => setFeatureLabel(event.target.value)} placeholder="e.g. Smart Home System" />
                <Button type="button" variant="outline" onClick={addFeature}>
                  Add
                </Button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {form.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-1.5 text-sm">
                    <span className="text-gray-700">{feature}</span>
                    <button
                      type="button"
                      onClick={() => set("features", form.features.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-600"
                      aria-label={`Remove ${feature}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {form.features.length === 0 && <p className="text-xs text-gray-400">No features added.</p>}
              </div>
            </div>
          )}

          {/* Assignment */}
          {canAssign && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-dark">Assigned staff</h3>
              <div className="flex flex-wrap gap-2">
                {staff.map((member) => {
                  const active = form.assignedUserIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        set(
                          "assignedUserIds",
                          active
                            ? form.assignedUserIds.filter((id) => id !== member.id)
                            : [...form.assignedUserIds, member.id]
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                      )}
                    >
                      {member.firstName} {member.lastName}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Assigned staff see this property under their &quot;Assigned Properties&quot; view.
              </p>
            </div>
          )}

          {/* Flags */}
          <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => set("isFeatured", event.target.checked)}
              />
              Featured on homepage
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => set("isPublished", event.target.checked)}
              />
              Published on the public website
            </label>
          </div>
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">{error}</p>
        )}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create property"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
