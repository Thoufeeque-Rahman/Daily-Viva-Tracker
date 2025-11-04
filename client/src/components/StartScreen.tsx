import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, User, Plus } from "lucide-react";
import { ClassInfo, SubjectInfo } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import axios from "@/lib/axios";
import { Redirect } from "wouter";
import {
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import DvtMarksTable from "./DvtMarksTable2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SubjectSelector } from "./SubjectSelector";

interface StartScreenProps {
  selectedClass: ClassInfo | null;
  selectedSubject: SubjectInfo | null;
  onClassSelect: (classItem: ClassInfo) => void;
  onSubjectSelect: (subject: SubjectInfo) => void;
  onProceed: () => void;
  isProceedEnabled: boolean;
  isLoading?: boolean;
}

export default function StartScreen({
  selectedClass,
  selectedSubject,
  onClassSelect,
  onSubjectSelect,
  onProceed,
  isProceedEnabled,
  isLoading = false,
}: StartScreenProps) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [dvtMarks, setDvtMarks] = useState<any[]>([]);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  // Add lesson dialog state
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);
  const [selectedSubjectForAdd, setSelectedSubjectForAdd] = useState("");
  const [classNumber, setClassNumber] = useState("");

  useEffect(() => {
    fetchDvtMarks();
  }, []);

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  const fetchDvtMarks = async () => {
    try {
      const response = await axios.get(`/api/dvtmarks/dvtmarksbydate`);
      console.log("Fetch DVT marks response:", response);
      
      setDvtMarks(response.data.data);
    } catch (error) {
      console.error("Error fetching DVT marks:", error);
      let errorMessage = "Failed to fetch DVT marks. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!classNumber || !selectedSubjectForAdd) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(`/api/teachers/${user?._id}/subjects`, {
        class: Number(classNumber),
        subject: selectedSubjectForAdd,
      });

      if (response.status === 200 || response.status === 201) {
        // Update user state with the new subject
        if (user && response.data) {
          updateUser(response.data);
        }

        toast({
          title: "Success",
          description: "Lesson added successfully",
        });

        // Reset form
        setClassNumber("");
        setSelectedSubjectForAdd("");
        setShowAddLessonDialog(false);
      }
    } catch (error) {
      console.error("Add lesson error:", error);
      toast({
        title: "Error",
        description:
          "Failed to add lesson: " +
          ((error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const colorClasses = [
    {
      bg: "from-blue-500 to-blue-600",
      border: "from-blue-50 to-blue-100",
      text: "text-blue-800",
    },
    {
      bg: "from-green-500 to-green-600",
      border: "from-green-50 to-green-100",
      text: "text-green-800",
    },
    {
      bg: "from-orange-500 to-orange-600",
      border: "from-orange-50 to-orange-100",
      text: "text-orange-800",
    },
    {
      bg: "from-yellow-500 to-yellow-600",
      border: "from-yellow-50 to-yellow-100",
      text: "text-yellow-800",
    },
    {
      bg: "from-purple-500 to-purple-600",
      border: "from-purple-50 to-purple-100",
      text: "text-purple-800",
    },
    {
      bg: "from-pink-500 to-pink-600",
      border: "from-pink-50 to-pink-100",
      text: "text-pink-800",
    },
    {
      bg: "from-red-500 to-red-600",
      border: "from-red-50 to-red-100",
      text: "text-red-800",
    },
    {
      bg: "from-indigo-500 to-indigo-600",
      border: "from-indigo-50 to-indigo-100",
      text: "text-indigo-800",
    },
    {
      bg: "from-cyan-500 to-cyan-600",
      border: "from-cyan-50 to-cyan-100",
      text: "text-cyan-800",
    },
  ];

  const sortedSubjects = [...(user?.subjectsTaught || [])].sort((a, b) =>
    b.class - a.class
  );

  if (isLoading) {
    return (
      <div className="p-6 transition-all duration-300 transform bg-white shadow-lg min-h-dvh h-full">
        {/* <div className="text-start mb-8 mt-4 flex gap-3 items-center">
          <p className="font-medium mt-2 text-blue-600">
            Hi,{" "}
            {user?.name
              ? user.name.charAt(0).toUpperCase() +
                user.name.slice(1).toLowerCase()
              : "there"}
             👋!
          </p>
        </div> */}

        {/* Loading State */}
        <div className="mb-8 bg-white p-3 rounded-lg shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Lesson
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 transition-all duration-300 transform bg-white shadow-lg h-full min-h-dvh">
      {/* <div className="text-start mb-8 mt-4 flex gap-3 items-center"> */}
        {/* <div className="bg-blue-500 inline-block p-3 rounded-full">
          <User className="text-white w-3 h-3" />
        </div> */}
        {/*<h2 className="text-2xl font-bold text-blue-600">Daily Viva Tracker</h2> */}
        {/* <p className="font-medium mt-2 text-blue-600">
          Hi,{" "}
          {user?.name
            ? user.name.charAt(0).toUpperCase() +
              user.name.slice(1).toLowerCase()
            : "there"}
           👋!
        </p> */}
      {/* </div> */}

      {/* Subject Selection */}
      <div className="mb-8 bg-white p-3 rounded-lg shadow-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Lesson
        </label>
        <div className="grid grid-cols-2 gap-3">
          {sortedSubjects.map((subject, index) => {
            const colorIndex = index % colorClasses.length; // Cycle through colors
            const colors = colorClasses[colorIndex];
            
            return (
              <button
                key={index}
                className={`border bg-gradient-to-r ${colors.bg} text-white font-medium border-gray-200 rounded-lg py-3 px-4 text-center hover:bg-gray-50 focus:outline-none transition-all ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (!isLoading) {
                    onSubjectSelect({
                      subject: subject.subject,
                      class: subject.class,
                    });
                  }
                }}
                disabled={isLoading}
              >
                {subject.subject} - {subject.class}
              </button>
            );
          })}
          
          {/* Add Lesson Button - Show when no lessons or always show */}
          <Dialog open={showAddLessonDialog} onOpenChange={setShowAddLessonDialog}>
            <DialogTrigger asChild>
              <button
                className="border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 font-medium rounded-lg py-3 px-4 text-center focus:outline-none transition-all flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Lesson
                </DialogTitle>
                <DialogDescription>
                  Add a new lesson to your teaching subjects.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddLesson} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    type="number"
                    placeholder="Enter class number (1-10)"
                    value={classNumber}
                    onChange={(e) => setClassNumber(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
                
                <SubjectSelector
                  selectedSubject={selectedSubjectForAdd}
                  onSubjectSelect={setSelectedSubjectForAdd}
                  label="Lesson"
                  placeholder="Select or add lesson..."
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddLessonDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Show message when no lessons are available */}
        {sortedSubjects.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No lessons assigned yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Lesson" to get started.</p>
          </div>
        )}
      </div>

      <DvtMarksTable />
    </div>
  );
}
