import { useState } from "react";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateImprovement } from "@/hooks/use-improvements";

interface ImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  subject: string;
  classNumber: number;
  onSuccess?: () => void;
}

export function ImprovementModal({
  isOpen,
  onClose,
  student,
  subject,
  classNumber,
  onSuccess,
}: ImprovementModalProps) {
  const { toast } = useToast();
  const createImprovement = useCreateImprovement();

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    description: "",
    dueDate: getTomorrowDate(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createImprovement.mutateAsync({
        studentId: student._id,
        subject,
        class: classNumber,
        description: formData.description.trim(),
        dueDate: formData.dueDate,
      });

      toast({
        title: "Success",
        description: "Improvement task assigned successfully.",
      });

      // Reset form
      setFormData({
        description: "",
        dueDate: getTomorrowDate(),
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating improvement:", error);
      toast({
        title: "Error",
        description: "Failed to assign improvement task.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!createImprovement.isPending) {
      setFormData({
        description: "",
        dueDate: getTomorrowDate(),
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}> 
      <DialogContent className="sm:max-w-[425px] bg-transparent border-0 shadow-none">
        <div className="rounded-lg mx-3 justify-center bg-white p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Assign Improvement Task</DialogTitle>
            <DialogDescription>
              Assign an improvement task to {student.name} ({student.rollNumber}
              ) for {subject} - Class {classNumber}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  What is the punishment/improvement needed?
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what the student needs to improve..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  disabled={createImprovement.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <DatePicker
                  id="dueDate"
                  date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                  onDateChange={(date) =>
                    setFormData({ ...formData, dueDate: date ? date.toISOString().split("T")[0] : "" })
                  }
                  placeholder="Pick due date or type naturally..."
                  disabled={createImprovement.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose} className="md:mt-0 mt-2"
                disabled={createImprovement.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createImprovement.isPending}>
                {createImprovement.isPending ? "Assigning..." : "Assign Task"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
