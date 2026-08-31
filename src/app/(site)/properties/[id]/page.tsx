import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { DUMMY_PROPERTIES } from "@/constants";
import { PropertyHeader } from "@/components/sections/properties/details/property-header";
import { PropertyGallery } from "@/components/sections/properties/details/property-gallery";
import { PropertyContent } from "@/components/sections/properties/details/property-content";
import { PropertySidebar } from "@/components/sections/properties/details/property-sidebar";
import { PropertyMap } from "@/components/sections/properties/details/property-map";
import { FeaturedProperties } from "@/components/sections/home/featured-properties";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = DUMMY_PROPERTIES.find((p) => p.id === id);
  return {
    title: property ? property.title : "Property Details",
    description: property ? `Details for ${property.title} in ${property.location}` : "Luxury property details.",
  };
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { id } = await params;
  const property = DUMMY_PROPERTIES.find((p) => p.id === id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex flex-col bg-gray-50/30">
      <PropertyHeader property={property} />
      <PropertyGallery />
      
      <Container className="pb-24">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 flex flex-col gap-12">
            <PropertyContent property={property} />
            <PropertyMap location={property.location} />
          </div>
          <div className="lg:col-span-1">
            <PropertySidebar />
          </div>
        </div>
      </Container>

      <div className="bg-white border-t border-gray-100">
        <FeaturedProperties />
      </div>
    </div>
  );
}
