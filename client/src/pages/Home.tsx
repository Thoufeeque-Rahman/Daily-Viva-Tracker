import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StartScreen from "@/components/StartScreen";
import EvaluationScreen from "@/components/EvaluationScreen";
import { useToast } from "@/hooks/use-toast";
import FeedbackToast from "@/components/FeedbackToast";
import { useQuery } from "@tanstack/react-query";
import { type Student, type SubjectInfo, type ClassInfo } from "@/types";
import PunishmentModal from "@/components/PunishmentModal";
import { s } from "vite/dist/node/types.d-aGj9QkWt";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<"start" | "evaluation">(
    "start"
  );
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(
    null
  );
  const [rounds, setRounds] = useState<
    { studentsNotAsked: string[]; _id: string }[]
  >([]);
  const { user } = useAuth();
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [punishmentModalOpen, setPunishmentModalOpen] = useState(false);
  const [punishment, setPunishment] = useState<string>();
  const [currentEvaluation, setCurrentEvaluation] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const { toast } = useToast();
  
  // Loading states
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingRound, setIsLoadingRound] = useState(false);
  const [isLoadingNextStudent, setIsLoadingNextStudent] = useState(false);
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  const handleProceed = async () => {
    if (selectedSubject && selectedSubject.subject && selectedSubject.class) {
      //if (selectedClass && selectedSubject) {
      console.log("Evaluation started");
      setIsLoadingStudents(true);
      try {
        const students = await fetchStudents(selectedSubject.class);
        console.log("Data:", students);
        console.log("Students:", students);
        await fetchRound(selectedSubject, students);
        // setActiveScreen("evaluation");
      } catch (error) {
        console.error("Error during proceed:", error);
        toast({
          title: "Error",
          description: "Failed to start evaluation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStudents(false);
      }
    }
  };

  // const baseUrl = "http://localhost:5000"; // Change to your backend URL
  const baseUrl = import.meta.env.VITE_BASE_URL; // Change to your backend URL

  // Fetch students based on selected class
  const fetchStudents = async (classId: number) => {
    console.log("Fetching students for class ID:", classId);

    const response = await fetch(`${baseUrl}/api/students/class/${classId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch students");
    }
    const data = await response.json();
    console.log("Fetched Students:", data);
    setStudents(data);
    return data;
  };

  const createRound = async (subject: SubjectInfo, students: Student[]) => {
    console.log("Creating round for subject:", subject);

    const response = await fetch(`${baseUrl}/api/rounds/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        studentsNotAsked: students.map((student) => student._id),
        subject: subject.subject,
        class: subject.class,
        totalStudents: students.length,
        startedAt: new Date(),
      }),
    });
    if (!response.ok) {
      console.log("Failed to create round:", response.statusText);
      throw new Error("Failed to create round" + response.statusText);
    }
    const data = await response.json();
    setRounds(data);
    console.log("Created Round:", data);
    const currentStudent = await getRandomStudent(data);
    setActiveScreen("evaluation");

    console.log("Random Student:", currentStudent);
  };

  // Fetch round based on selected subject and class
  const fetchRound = async (subject: SubjectInfo, students: Student[]) => {
    console.log("Fetching round for subject:", subject);
    setIsLoadingRound(true);
    try {
      const response = await fetch(
        `${baseUrl}/api/rounds/${subject.subject}/${subject.class}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (!response.ok) {
        console.log(students);
        await createRound(subject, students);
        // throw new Error("Failed to fetch round");
      } else {
        const data = await response.json();
        setRounds(data);

        const currentStudent = await getRandomStudent(data);
        setActiveScreen("evaluation");

        console.log("Random Student:", currentStudent);
        console.log("Fetched Round:", data);
      }
    } finally {
      setIsLoadingRound(false);
    }
  };

  const getRandomStudent = async (fetchedRounds: string | any[]) => {
    console.log("getRandomStudent called with rounds:", fetchedRounds);

    if (fetchedRounds.length > 0) {
      const currentRound = fetchedRounds[0] as { studentsNotAsked: string[] }; // Assuming the first round is the active one
      const studentsNotAsked = currentRound.studentsNotAsked;
      console.log("Students Not Asked:", studentsNotAsked);
      if (studentsNotAsked && studentsNotAsked.length > 0) {
        const randomIndex = Math.floor(Math.random() * studentsNotAsked.length);
        console.log("Selected random index:", randomIndex, "for student ID:", studentsNotAsked[randomIndex]);
        await fetchStudent(studentsNotAsked[randomIndex]);
        return studentsNotAsked[randomIndex];
      } else {
        console.log("No students left in round, increasing round");
        increaseRound();
      }
    }
    return null;
  };

  const increaseRound = async () => {
    console.log("Increasing round", rounds[0]);
    const response = await fetch(
      `${baseUrl}/api/rounds/${rounds[0]._id}/increaseRound`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentsNotAsked: students.map((student) => student._id),
        }),
        credentials: "include",
      }
    );
    if (!response.ok) {
      console.log("Failed to increase round:", response.statusText);
      throw new Error("Failed to increase round" + response.statusText);
    }
    const data = await response.json();
    setRounds(data);
    console.log("Increased Round:", data);
    const currentStudent = await getRandomStudent(data);
    setActiveScreen("evaluation");
    console.log("Random Student:", currentStudent);
    return currentStudent;
  };

  const fetchStudent = async (studentId: string) => {
    console.log("Fetching student with ID:", studentId);
    const response = await fetch(`${baseUrl}/api/students/${studentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      console.log("Failed to fetch student:", response.statusText);
      throw new Error("Failed to fetch student" + response.statusText);
    }
    const data = await response.json();
    console.log("Fetched Student:", data.name, "ID:", data._id);
    console.log("Setting current student to:", data.name);
    setCurrentStudent(data as Student);
    // Clear any previous evaluation when switching to a new student
    setCurrentEvaluation(null);
    return data;
  };
  // const getRandomStudentIndex = (rounds: { studentsNotAsked: string[] }[]) => {

  // console.log("Current Student Index:", currentStudentIndex);
  // console.log("Students:", students);
  // console.log("Current Student:", currentStudent);

  const handleClassSelect = (classItem: ClassInfo) => {
    setSelectedClass(classItem);
  };

  const handleSubjectSelect = async ({
    subject,
    class: classItem,
  }: {
    subject: any;
    class: any;
  }) => {
    await setSelectedSubject({ subject, class: classItem }); // Schedule the state update
    console.log("Selected Subject:", selectedSubject);
  };

  useEffect(() => {
    if (selectedSubject) {
      handleProceed(); // React to the updated state
      console.log("Selected Subject:", selectedSubject);
    }
  }, [selectedSubject]); // Runs whenever selectedSubject changes

  // const handleSubjectSelect = async (subject: SubjectInfo) => {
  //   await setSelectedSubject(subject);
  //   if (selectedSubject) {
  //     handleProceed();
  //   } else {
  //     setSelectedSubject(subject);
  //     handleProceed();
  //   }
  // };

  const removeStudentFromRound = async (studentId: string) => {
    console.error(rounds);
    if (!rounds[0] || !rounds[0]._id) {
      console.error("No active round found.", rounds);
      toast({
        title: "No active round found",
        description: "Cannot remove student because no round is active.",
        variant: "destructive",
      });
      return;
    }
    console.log("Removing student from round:", studentId);
    const response = await fetch(
      `${baseUrl}/api/rounds/${rounds[0]._id}/students/${studentId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        credentials: "include",
      }
    );
    if (!response.ok) {
      console.log("Failed to remove student from round:", response.statusText);
      throw new Error(
        "Failed to remove student from round" + response.statusText
      );
    }
    const data = await response.json();
    setRounds(data);
    console.log("Removed Student from Round:", data);
    return data;
  };

  const handleGoHome = () => {
    setActiveScreen("start");
    setCurrentStudentIndex(0);
    setCurrentEvaluation(null);
  };

  const handleEvaluate = async (value: string, mark: number) => {
    setCurrentEvaluation(value);

    console.log(
      currentStudent,
      selectedSubject?.subject,
      selectedSubject?.class,
      `Evaluation: ${value}, Mark: ${mark}`
    );
    
    // Submit evaluation with the provided mark and wait for it to complete
    const success = await submitEvaluation(mark, punishment);
    
    if (success) {
      toast({
        title: `${value.charAt(0).toUpperCase() + value.slice(1)} evaluation recorded`,
      });
      
      // Clear current evaluation state before moving to next student
      setCurrentEvaluation(null);
      
      // Move to next student after evaluation is saved
      await handleNext();
    }

    // if (value !== "great") {
    //   // setPunishmentModalOpen(true);
    // }
  };

  const handlePunishmentSubmit = (punishment: string) => {
    setPunishment(punishment);
    setPunishmentModalOpen(false);
  };

  const handlePunishmentCancel = () => {
    setPunishmentModalOpen(false);
  };

  const handleSkip = async () => {
    // Move to next student without evaluation - just get a new random student
    await getRandomStudent(rounds);
  };

  const handleNext = async () => {
    console.log("handleNext called, current student:", currentStudent?.name);
    setIsLoadingNextStudent(true);
    try {
      // Remove student from round and get updated rounds
      console.log("Removing student from round:", currentStudent?._id);
      const updatedRounds = await removeStudentFromRound(String(currentStudent?._id));

      // Move to next student using the updated rounds
      console.log("Getting next random student from updated rounds");
      await getRandomStudent(updatedRounds);
    } catch (error) {
      console.error("Error moving to next student:", error);
      toast({
        title: "Error",
        description: "Failed to move to next student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNextStudent(false);
    }
  };

  const handleFinish = () => {
    // Reset state and go back to start screen
    setActiveScreen("start");
    setCurrentStudentIndex(0);
    setCurrentEvaluation(null);
    setCurrentStudent({} as Student);

    toast({
      title: "Evaluation session completed",
    });
  };

  const handleEnd = () => {
    // End the current evaluation session and increase the round
    increaseRound().then(async (currentStudentId) => {
      if (typeof currentStudentId === "string") {
        const studentData = await fetchStudent(currentStudentId);
        setCurrentStudent(studentData);
      } else {
        setCurrentStudent({} as Student);
      }
      setCurrentEvaluation(null);
      setCurrentStudentIndex(0);
      toast({
        title: "Round ended, new round started",
        description: "You can now evaluate the next student.",
      });
    });
  };

  const submitEvaluation = async (mark: number, punishment?: string) => {
    if (!selectedSubject || !currentStudent) {
      toast({
        title: "Error",
        description: "No student or subject selected",
        variant: "destructive",
      });
      return false;
    }

    setIsSavingEvaluation(true);
    try {
        const response = await fetch(`${baseUrl}/api/dvtmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: currentStudent._id,
          subject: selectedSubject.subject,
          mark,
          adNumber: currentStudent.adNumber,
          class: selectedSubject.class,
          tId: user?.tId,
          punishment,
        }),
        credentials: "include",
      }); 

      const data = await response.json();
      console.log("Evaluation saved successfully:", data);
      if (data.success) {
        console.log("Evaluation submitted successfully, clearing state");
        return true;
      } else {
        toast({
          title: "Failed to save evaluation",
          description: "Please try again",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to submit evaluation:", error);
      toast({
        title: "Failed to save evaluation",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
      <Header
        selectedClass={selectedClass?.name}
        selectedSubject={
          selectedSubject?.subject + " " + selectedSubject?.class
        }
        showContext={activeScreen === "evaluation"}
        onHomeClick={handleGoHome}
      />

      <main className="relative h-full">
        {activeScreen === "start" ? (
          <StartScreen
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            onClassSelect={handleClassSelect}
            onSubjectSelect={handleSubjectSelect}
            onProceed={handleProceed}
            isProceedEnabled={!!selectedSubject}
            isLoading={isLoadingStudents || isLoadingRound}
          />
        ) : (
          <EvaluationScreen
            currentStudent={currentStudent || undefined} //? currentStudent : ()=> getRandomStudentIndex(rounds)
            currentIndex={currentStudentIndex}
            totalStudents={students.length}
            studentsNot={rounds[0]?.studentsNotAsked.length || 0}
            currentEvaluation={currentEvaluation}
            setCurrentEvaluation={setCurrentEvaluation}
            onEvaluate={handleEvaluate}
            allStudents={students}
            onStudentSelect={setCurrentStudent}
            onSkip={handleSkip}
            onNext={handleNext}
            onEnd={handleEnd}
            onFinish={handleFinish}
            setPunishmentModalOpen={setPunishmentModalOpen}
            isNextEnabled={!!currentEvaluation}
            selectedSubject={selectedSubject || undefined}
            isLoadingNext={isLoadingNextStudent}
            isSaving={isSavingEvaluation}
          />
        )}
      </main>

      <PunishmentModal
        isOpen={punishmentModalOpen}
        onSubmit={handlePunishmentSubmit}
        onCancel={handlePunishmentCancel}
      />
    </div>
  );
}
