import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PunishmentModalProps {
  isOpen: boolean;
  onSubmit: (punishment: string) => void;
  onCancel: () => void;
}

export default function PunishmentModal({
  isOpen,
  onSubmit,
  onCancel,
}: PunishmentModalProps) {
  const [punishment, setPunishment] = useState("");

  const handleSubmit = () => {
    onSubmit(punishment);
    setPunishment("");
  };

  const handleCancel = () => {
    onCancel();
    setPunishment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            Enter Punishment
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-4">
          Please specify the punishment for the student's performance:
        </p>
        <Textarea
          value={punishment}
          onChange={(e) => setPunishment(e.target.value)}
          placeholder="Type punishment details here..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary"
          rows={4}
        />
        <DialogFooter className="flex justify-end space-x-3 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
