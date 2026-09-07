import { PropertyGridSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return <PropertyGridSkeleton count={3} withFilters={false} />;
}
