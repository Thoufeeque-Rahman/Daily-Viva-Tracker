import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useImprovements,
  useToggleImprovementStatus,
  Improvement,
} from "@/hooks/use-improvements";
import { CheckCircle, Clock, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImprovementListProps {
  subject?: string;
  classNumber?: number;
}

export function ImprovementList({
  subject,
  classNumber,
}: ImprovementListProps) {
  const { toast } = useToast();
  const {
    data: allImprovements = [],
    isLoading,
    error,
  } = useImprovements(subject, classNumber);
  const toggleStatus = useToggleImprovementStatus();

  // Filter to show only active (given) improvements
  const improvements = allImprovements
    .filter((improvement) => improvement.status === "given")
    .sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );

  // Debug logging
  //   console.log('ImprovementList - Subject:', subject, 'Class:', classNumber);
  //   console.log('ImprovementList - All improvements:', allImprovements);
  //   console.log('ImprovementList - Filtered improvements:', improvements);
  //   console.log('ImprovementList - Loading:', isLoading, 'Error:', error);

  const handleToggleStatus = async (improvement: Improvement) => {
    try {
      await toggleStatus.mutateAsync(improvement._id);
      toast({
        title: "Success",
        description: `Marked as ${
          improvement.status === "given" ? "done" : "given"
        }`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update improvement status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">
            Improvements for {subject} - Class {classNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">
            Improvements for {subject} - Class {classNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500 text-center py-4">
            Error loading improvements: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!improvements.length) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">
            Improvements for {subject} - Class {classNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            {allImprovements.length > 0
              ? `All ${allImprovements.length} improvement tasks are completed!`
              : "No improvement tasks assigned yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Improvements for {subject} - Class {classNumber}
          <Badge variant="outline">{improvements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-3">
            {improvements.map((improvement) => (
              <div
                key={improvement._id}
                className={`p-3 border rounded-lg ${
                  improvement.status === "done"
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {improvement.student.adNumber}{" - "}
                        {improvement.student.name}
                      </span>
                      <Badge
                        variant={
                          improvement.status === "done"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-xs ${
                          improvement.status === "done"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {improvement.status === "done"
                          ? "Completed"
                          : "Assigned"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-xs text-gray-500">
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {improvement.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due:{" "}
                        {new Date(improvement.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(improvement)}
                    disabled={toggleStatus.isPending}
                    className={`ml-2 ${
                      improvement.status === "done"
                        ? "text-green-600 hover:text-green-700"
                        : "text-yellow-600 hover:text-yellow-700"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
