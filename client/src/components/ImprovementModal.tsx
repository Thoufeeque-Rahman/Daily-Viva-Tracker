import { useState } from "react";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [formData, setFormData] = useState({
    description: "",
    dueDate: "",
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
        dueDate: "",
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
        dueDate: "",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Improvement Task</DialogTitle>
          <DialogDescription>
            Assign an improvement task to {student.name} ({student.rollNumber}) for {subject} - Class {classNumber}.
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
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                disabled={createImprovement.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createImprovement.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createImprovement.isPending}>
              {createImprovement.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}