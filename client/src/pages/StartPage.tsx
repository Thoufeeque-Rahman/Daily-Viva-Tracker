import { useState } from "react";
import Header from "@/components/Header";
import StartScreen from "@/components/StartScreen";
import { useToast } from "@/hooks/use-toast";
import { type SubjectInfo, type ClassInfo } from "@/types";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function StartPage() {
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleClassSelect = (classItem: ClassInfo) => {
    setSelectedClass(classItem);
  };

  const handleSubjectSelect = ({ subject, class: classItem }: { subject: any; class: any; }) => {
    setSelectedSubject({ subject, class: classItem });
  };

  // Auto-proceed when a subject is chosen (matches previous behavior where clicking a lesson moved you forward)
  useEffect(() => {
    if (selectedSubject) {
      handleProceed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  const handleProceed = async () => {
    if (!selectedSubject?.subject || !selectedSubject.class) {
      toast({ title: "Select subject & class", variant: "destructive" });
      return;
    }
    const qs = new URLSearchParams({ subject: String(selectedSubject.subject), class: String(selectedSubject.class) });
    navigate(`/evaluation?${qs.toString()}`);
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
      <Header
        selectedClass={selectedClass?.name}
        selectedSubject={selectedSubject ? `${selectedSubject.subject} ${selectedSubject.class}` : undefined}
        showContext={false}
        onHomeClick={() => navigate("/")}
      />

      <main className="relative h-full">
        <StartScreen
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          onClassSelect={handleClassSelect}
          onSubjectSelect={handleSubjectSelect}
          onProceed={handleProceed}
          isProceedEnabled={!!selectedSubject}
          isLoading={false}
        />
      </main>
    </div>
  );
}
