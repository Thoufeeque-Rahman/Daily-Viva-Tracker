import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";

interface Subject {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface SubjectSelectorProps {
  selectedSubject: string;
  onSubjectSelect: (subject: string) => void;
  label?: string;
  placeholder?: string;
  showAllSubjects?: boolean; // New prop to show subjects from all colleges
}

export function SubjectSelector({
  selectedSubject,
  onSubjectSelect,
  label = "Lesson",
  placeholder = "Select lesson...",
  showAllSubjects = false, // Default to false (college-filtered)
}: SubjectSelectorProps) {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch subjects from database
  const fetchSubjects = async () => {
    try {
      // Use different endpoint based on showAllSubjects prop
      const endpoint = showAllSubjects ? "/api/subjects/all" : "/api/subjects";
      console.log("SubjectSelector: Fetching subjects from:", endpoint, "showAllSubjects:", showAllSubjects);
      const response = await axios.get(endpoint);
      console.log("SubjectSelector: Received subjects:", response.data.length, "subjects");
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  // Add new subject to database
  const addNewSubject = async (subjectName: string) => {
    if (!subjectName.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/subjects", {
        name: subjectName.trim(),
        description: `${subjectName.trim()} lesson`,
      });

      // Add to local state
      setSubjects(prev => [...prev, response.data]);
      
      // Select the new subject
      onSubjectSelect(subjectName.trim());
      setSearchInput("");
      setIsOpen(false);

      toast({
        title: "Success",
        description: `"${subjectName}" has been added to the subjects list`,
      });
    } catch (error: any) {
      console.error("Error adding subject:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to add subject",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load subjects on component mount and when showAllSubjects changes
  useEffect(() => {
    fetchSubjects();
  }, [showAllSubjects]); // Add showAllSubjects as dependency

  // Filter subjects based on search input
  const filteredSubjects = subjects.filter(subject =>
    subject.isActive && 
    subject.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div>
      <Label htmlFor="subject">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {selectedSubject || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search lessons..."
              value={searchInput}
              onValueChange={setSearchInput}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    No lesson found.
                  </p>
                  {searchInput.trim() && (
                    <Button
                      size="sm"
                      onClick={() => addNewSubject(searchInput)}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isLoading ? "Adding..." : `Add "${searchInput}"`}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup heading="Available Lessons">
                {filteredSubjects.map((subject) => (
                  <CommandItem
                    key={subject._id}
                    value={subject.name}
                    onSelect={(currentValue) => {
                      onSubjectSelect(
                        currentValue === selectedSubject ? "" : currentValue
                      );
                      setIsOpen(false);
                      setSearchInput("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSubject === subject.name
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {subject.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {searchInput.trim() &&
                !subjects.some(
                  (s) =>
                    s.name.toLowerCase() === searchInput.toLowerCase()
                ) && (
                  <CommandGroup heading="Add New">
                    <CommandItem
                      onSelect={() => addNewSubject(searchInput)}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isLoading ? "Adding..." : `Add "${searchInput}"`}
                    </CommandItem>
                  </CommandGroup>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}