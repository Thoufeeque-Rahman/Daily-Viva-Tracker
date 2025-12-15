import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EvaluationScreen from "@/components/EvaluationScreen";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-utils";
import { type Student, type SubjectInfo } from "@/types";
import { useLocation } from "wouter";
import AnnouncementModal from "@/components/AnnouncementModal";

export default function EvaluationPage() {
  const { toast } = useToast();
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [rounds, setRounds] = useState<{ studentsNotAsked: string[]; _id: string }[]>([]);
  const [isLoadingNextStudent, setIsLoadingNextStudent] = useState(false);
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);
  const [punishmentModalOpen, setPunishmentModalOpen] = useState(false);
  const [punishment, setPunishment] = useState<string>();
  const [, navigate] = useLocation();

  // read query params
  const params = new URLSearchParams(window.location.search);
  const subjectParam = params.get("subject");
  const classParam = params.get("class");
  const selectedSubject: SubjectInfo | null = subjectParam && classParam ? { subject: subjectParam, class: Number(classParam) } : null;

  useEffect(() => {
    if (!selectedSubject) {
      navigate("/");
      return;
    }
    (async () => {
      try {
        const studentsResp = await apiFetch(`/api/students/class/${selectedSubject.class}`, { method: "GET" });
        if (!studentsResp.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResp.json();
        setStudents(studentsData);

        const roundResp = await apiFetch(`/api/rounds/${selectedSubject.subject}/${selectedSubject.class}`, { method: "GET" });
        if (!roundResp.ok) {
          // create round
          const createResp = await apiFetch(`/api/rounds/`, {
            method: "POST",
            body: JSON.stringify({
              studentsNotAsked: studentsData.map((s: Student) => s._id),
              subject: selectedSubject.subject,
              class: selectedSubject.class,
              totalStudents: studentsData.length,
              startedAt: new Date(),
            }),
          });
          if (!createResp.ok) throw new Error("Failed to create round");
          const created = await createResp.json();
          setRounds(created);
          await pickRandomStudent(created);
        } else {
          const roundData = await roundResp.json();
          setRounds(roundData);
          await pickRandomStudent(roundData);
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to start evaluation.", variant: "destructive" });
        navigate("/");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickRandomStudent = async (fetchedRounds: { studentsNotAsked: string[] }[]) => {
    if (fetchedRounds.length > 0) {
      const currentRound = fetchedRounds[0];
      const ids = currentRound.studentsNotAsked || [];
      if (ids.length > 0) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        await fetchStudent(id);
        return id;
      } else {
        await increaseRound();
      }
    }
    return null;
  };

  const fetchStudent = async (studentId: string) => {
    const response = await apiFetch(`/api/students/${studentId}`, { method: "GET" });
    if (!response.ok) throw new Error("Failed to fetch student");
    const data = await response.json();
    setCurrentStudent(data as Student);
    setCurrentEvaluation(null);
    return data;
  };

  const increaseRound = async () => {
    const response = await apiFetch(`/api/rounds/${rounds[0]._id}/increaseRound`, {
      method: "POST",
      body: JSON.stringify({ studentsNotAsked: students.map((s) => s._id) }),
    });
    if (!response.ok) throw new Error("Failed to increase round");
    const data = await response.json();
    setRounds(data);
    await pickRandomStudent(data);
  };

  const removeStudentFromRound = async (studentId: string) => {
    const response = await apiFetch(`/api/rounds/${rounds[0]._id}/students/${studentId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Failed to remove student from round");
    const data = await response.json();
    setRounds(data);
    return data;
  };

  const submitEvaluation = async (mark: number) => {
    if (!selectedSubject || !currentStudent) return false;
    setIsSavingEvaluation(true);
    try {
      const response = await apiFetch(`/api/dvtmarks`, {
        method: "POST",
        body: JSON.stringify({
          studentId: currentStudent._id,
          subject: selectedSubject.subject,
          mark,
          adNumber: currentStudent.adNumber,
          class: selectedSubject.class,
          punishment,
        }),
      });
      const data = await response.json();
      return !!data?.success;
    } catch (e) {
      return false;
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const handleEvaluate = async (value: string, mark: number) => {
    setCurrentEvaluation(value);
    const success = await submitEvaluation(mark);
    if (success) {
      toast({ title: `${value.charAt(0).toUpperCase() + value.slice(1)} evaluation recorded` });
      setCurrentEvaluation(null);
      await handleNext();
    } else {
      toast({ title: "Failed to save evaluation", variant: "destructive" });
    }
  };

  const handleNext = async () => {
    setIsLoadingNextStudent(true);
    try {
      if (currentStudent?._id) {
        const updatedRounds = await removeStudentFromRound(String(currentStudent._id));
        await pickRandomStudent(updatedRounds);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to move to next student", variant: "destructive" });
    } finally {
      setIsLoadingNextStudent(false);
    }
  };

  const handleFinish = () => {
    navigate("/");
    setCurrentStudent(null);
    setCurrentEvaluation(null);
  };

  const handleEnd = async () => {
    await increaseRound();
  };

  const handlePunishmentSubmit = (p: string) => {
    setPunishment(p);
    setPunishmentModalOpen(false);
  };

  const handlePunishmentCancel = () => {
    setPunishmentModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
      <Header
        selectedClass={String(selectedSubject?.class)}
        selectedSubject={selectedSubject ? `${selectedSubject.subject} ${selectedSubject.class}` : undefined}
        showContext={true}
        onHomeClick={() => navigate("/")}
      />

      <main className="relative h-full">
        <EvaluationScreen
          currentStudent={currentStudent || undefined}
          currentIndex={0}
          totalStudents={students.length}
          studentsNot={rounds[0]?.studentsNotAsked.length || 0}
          currentEvaluation={currentEvaluation}
          setCurrentEvaluation={setCurrentEvaluation}
          onEvaluate={handleEvaluate}
          allStudents={students}
          onStudentSelect={setCurrentStudent}
          onSkip={async () => { await pickRandomStudent(rounds); }}
          onNext={handleNext}
          onEnd={handleEnd}
          onFinish={handleFinish}
          setPunishmentModalOpen={setPunishmentModalOpen}
          isNextEnabled={!!currentEvaluation}
          selectedSubject={selectedSubject || undefined}
          isLoadingNext={isLoadingNextStudent}
          isSaving={isSavingEvaluation}
        />
      </main>

      {/* Keep announcement modal available */}
      <AnnouncementModal />
    </div>
  );
}
