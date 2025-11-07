import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";

interface Level {
  name: string;
  mark: number;
  color: string;
  description?: string;
}

interface GradingTemplate {
  _id?: string;
  name: string;
  description?: string;
  levels: Level[];
  isActive: boolean;
}

export default function GradingConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<GradingTemplate>({
    name: "",
    description: "",
    levels: [],
    isActive: false,
  });

  // Query grading templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["gradingTemplates"],
    queryFn: async () => {
      const response = await axios.get("/api/grading-configs");
      return response.data;
    },
  });

  // Create new template
  const createTemplate = useMutation({
    mutationFn: async (template: GradingTemplate) => {
      const response = await axios.post("/api/grading-configs", template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingTemplates"] });
      toast({ title: "Success", description: "Template created successfully" });
      setShowNewTemplateDialog(false);
      setNewTemplate({ name: "", description: "", levels: [], isActive: false });
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GradingTemplate> }) => {
      const response = await axios.put(`/api/grading-configs/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingTemplates"] });
      toast({ title: "Success", description: "Template updated successfully" });
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/grading-configs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingTemplates"] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.response?.data?.error || "Failed to delete template",
        variant: "destructive" 
      });
    },
  });

  const handleDeleteTemplate = (templateId: string) => {
    if (templates?.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the only grading configuration. At least one must exist.",
        variant: "destructive"
      });
      return;
    }
    deleteTemplate.mutate(templateId);
  };

  const handleAddLevel = () => {
    setNewTemplate({
      ...newTemplate,
      levels: [
        ...newTemplate.levels,
        { name: "", mark: 0, color: "#000000", description: "" },
      ],
    });
  };

  const handleRemoveLevel = (index: number) => {
    setNewTemplate({
      ...newTemplate,
      levels: newTemplate.levels.filter((_, i) => i !== index),
    });
  };

  const handleUpdateLevel = (index: number, field: keyof Level, value: string | number) => {
    const updatedLevels = [...newTemplate.levels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      [field]: value,
    };
    setNewTemplate({
      ...newTemplate,
      levels: updatedLevels,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplate.mutate(newTemplate);
  };

  const handleToggleActive = (templateId: string, currentlyActive: boolean) => {
    // Show warning for deactivation attempts
    if (currentlyActive && templates?.length === 1) {
      toast({
        title: "Cannot Deactivate",
        description: "At least one grading configuration must remain active.",
        variant: "destructive"
      });
      return;
    }

    // Call the activate endpoint
    axios.put(`/api/grading-configs/${templateId}/activate`)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["gradingTemplates"] });
        toast({ 
          title: "Success", 
          description: currentlyActive ? "Template deactivated successfully" : "Template activated successfully"
        });
      })
      .catch((error) => {
        toast({ 
          title: "Error", 
          description: error.response?.data?.error || "Failed to update template status",
          variant: "destructive" 
        });
      });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const [, setLocation] = useLocation();

  return (
    <div className="mx-auto max-w-5xl bg-white min-h-screen shadow-lg relative">
      <Header showContext={false} onHomeClick={() => {setLocation('/')}} />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Grading Templates</h1>
          <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Grading Template</DialogTitle>
                <DialogDescription>
                  Create a new grading template with customizable levels.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Levels</Label>
                    <div className="space-y-4 mt-2">
                      {newTemplate.levels.map((level, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={level.name}
                                onChange={(e) =>
                                  handleUpdateLevel(index, "name", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label>Mark</Label>
                              <Input
                                type="number"
                                value={level.mark}
                                onChange={(e) =>
                                  handleUpdateLevel(index, "mark", Number(e.target.value))
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label>Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={level.color}
                                  onChange={(e) =>
                                    handleUpdateLevel(index, "color", e.target.value)
                                  }
                                  className="w-16"
                                  required
                                />
                                <Input
                                  value={level.color}
                                  onChange={(e) =>
                                    handleUpdateLevel(index, "color", e.target.value)
                                  }
                                  placeholder="#000000"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLevel(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={handleAddLevel}>
                        <Plus className="mr-2 h-4 w-4" /> Add Level
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Template</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {templates?.map((template: GradingTemplate) => (
            <Card key={template._id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${template._id}`}>Active</Label>
                    <Switch
                      id={`active-${template._id}`}
                      checked={template.isActive}
                      onCheckedChange={() =>
                        handleToggleActive(template._id!, template.isActive)
                      }
                      disabled={template.isActive && templates?.length === 1}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template._id!)}
                    disabled={templates?.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Mark</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.levels.map((level, index) => (
                    <TableRow key={index}>
                      <TableCell>{level.name}</TableCell>
                      <TableCell>{level.mark}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: level.color }}
                          />
                          {level.color}
                        </div>
                      </TableCell>
                      <TableCell>{level.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}