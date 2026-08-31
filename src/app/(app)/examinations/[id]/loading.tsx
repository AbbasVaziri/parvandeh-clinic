import { CardSkeleton } from "@/shared/ui/skeletons";

export default function ExaminationLoading() {
  return (
    <div className="space-y-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
