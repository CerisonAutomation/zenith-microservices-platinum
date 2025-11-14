import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarLoading() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}
