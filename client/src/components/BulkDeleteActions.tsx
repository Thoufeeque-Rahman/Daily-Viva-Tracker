import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkDeleteActionsProps {
  selectedItems: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (itemId: string, checked: boolean) => void;
  onBulkDelete: (itemIds: string[]) => Promise<void>;
  totalItems: number;
  entityName: string; // "students" or "teachers"
  disabled?: boolean;
}

export function BulkDeleteActions({
  selectedItems,
  onSelectAll,
  onSelectItem,
  onBulkDelete,
  totalItems,
  entityName,
  disabled = false,
}: BulkDeleteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    setIsDeleting(true);
    try {
      await onBulkDelete(selectedItems);
      toast({
        title: "Success",
        description: `${selectedItems.length} ${entityName} deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to delete ${entityName}.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) el.indeterminate = isIndeterminate;
          }}
          onCheckedChange={onSelectAll}
          disabled={disabled || totalItems === 0}
        />
        <label className="text-sm font-medium">
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : "Select all"}
        </label>
      </div>

      {selectedItems.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm" 
              disabled={isDeleting || disabled}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected ({selectedItems.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {entityName}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedItems.length} {entityName}? 
                This action cannot be undone and will permanently remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete {selectedItems.length} {entityName}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Hook for managing bulk selection state
export function useBulkSelection<T extends { _id: string }>(items: T[]) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
  };
}