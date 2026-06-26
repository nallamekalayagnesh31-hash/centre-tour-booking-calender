import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case "enquiry":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "tour_scheduled":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "demo":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "admission_confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLabel = (s: string) => {
    return s.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  return (
    <Badge variant="outline" className={`font-medium ${getBadgeStyle(status)}`}>
      {getLabel(status)}
    </Badge>
  );
}
