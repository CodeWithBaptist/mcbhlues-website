import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PropertyHeader } from "@/components/sections/properties/details/property-header";
import { PropertyGallery } from "@/components/sections/properties/details/property-gallery";
import { PropertyContent } from "@/components/sections/properties/details/property-content";
import { PropertySidebar } from "@/components/sections/properties/details/property-sidebar";
import { PropertyMap } from "@/components/sections/properties/details/property-map";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";
import { listPublishedProperties, getPropertyBySlug } from "@/lib/properties/property-service";
import { toPublicProperty, hasMapLocation } from "@/lib/properties/public-property";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const details = await getPropertyBySlug(id);
  const property = details ? toPublicProperty(details) : null;
  return {
    title: property ? property.name : "Property Details",
    description: property
      ? `${property.title} in ${property.location}. ${property.description ?? ""}`.trim()
      : "Property details.",
  };
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { id } = await params;
  const details = await getPropertyBySlug(id);

  if (!details) {
    notFound();
  }

  const property = toPublicProperty(details);
  const allProperties = await listPublishedProperties();
  const featured = allProperties.map(toPublicProperty);
  const showMap = hasMapLocation(property);

  return (
    <div className="flex flex-col bg-gray-50/30">
      <PropertyHeader property={property} />
      <PropertyGallery images={property.images} title={property.name} />
      
      <Container className="pb-24">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 flex flex-col gap-12">
            <PropertyContent
              property={property}
              amenities={property.amenities}
              features={property.features}
            />
            {showMap && (
              <PropertyMap
                location={property.location}
                query={
                  property.address
                    ? [property.address, property.city, property.state, property.country]
                        .filter(Boolean)
                        .join(", ")
                    : property.location
                }
                latitude={property.latitude}
                longitude={property.longitude}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <PropertySidebar propertyId={property.id} propertyTitle={property.name} />
          </div>
        </div>
      </Container>

      <div className="bg-white border-t border-gray-100">
        <FeaturedProperties properties={featured} />
      </div>
    </div>
  );
}
