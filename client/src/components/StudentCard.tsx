import { useState } from "react";
import { Student } from "@/types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { Book, Forward, ForwardIcon, History, SkipForward } from "lucide-react";
import { StudentHistoryModal } from "./StudentHistoryModal";
import { ImprovementModal } from "./ImprovementModal";

interface StudentCardProps {
  student: Student | undefined;
  onSkip: () => void;
  animate?: boolean;
  subject?: string;
  classNumber?: number;
  onImprovementAssigned?: () => void;
}

export default function StudentCard({
  student,
  onSkip,
  animate = false,
  subject,
  classNumber,
  onImprovementAssigned,
}: StudentCardProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);
  if (!student) {
    return (
      <Card className="bg-white rounded-2xl shadow-md h-[420px] overflow-hidden mb-6">
        <div className="grid grid-flow-col grid-rows-1 gap-2 p-6">
          <div className="row-span-3 flex justify-center items-center">
            <Avatar className="w-24 h-24 border-4 border-primary">
              <AvatarFallback>?</AvatarFallback> 
            </Avatar>
          </div>
          <div className="col-span-2">
            <div className="w-full text-center">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-3 w-2/3 mx-auto"></div>
              <div className="mt-3 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Roll Number:</span>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admission No.:</span>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const getInitials = () => {
    return student.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const animationClass = animate ? "transform transition-all duration-300" : "";

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
  ];

  // Use a deterministic color based on student.rollNumber to avoid repetition on re-render
  const rollNum = Number(student.rollNumber);
  const randomIndex = !isNaN(rollNum)
    ? rollNum % colorClasses.length
    : Math.floor(Math.random() * colorClasses.length);
  const { bg, border, text } = colorClasses[randomIndex];

  return (
    <Card
      className={`bg-gradient-to-r ${bg} shadow-xl overflow-hidden border text-white rounded-3xl mb-6 ${animationClass}`}
      // style={{ height: "fit" }} 
    >
      <div className="h-full flex flex-col items-center gap-2 p-3"> 
        <div className="flex items-center w-full">
          <div className="flex justify-center items-center mr-6">
            <Avatar className={`w-24 h-24`}>
              {student.photoUrl ? (
                <AvatarImage src={student.photoUrl} alt={student.rollNumber} />
              ) : (
                <div
                  className={`flex items-center justify-center w-full h-full bg-white/20 text-5xl font-bold rounded-full `}
                >
                  <h1>{student.rollNumber}</h1>
                </div>
                // <AvatarFallback>{student.rollNumber}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-start`}>{student.name}</h3>
            <div className="mt-2 w-full space-y-2 bg-white/10 p-3 rounded-xl shadow-sm">
              <div className="flex justify-between text-sm"> 
                <span className="text-white/80">Roll Number:</span>
                <span className={`font-medium text-white`}>
                  {student.rollNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Admission No.:</span>
                <span className={`font-medium text-white`}>
                  {student.adNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full mt-auto flex gap-2">
          <Button
            variant="outline"
            className={`flex-1 bg-white/60 ${text} rounded-xl border-0 font-medium hover:bg-white/30 hover:text-white transition-colors`}
            onClick={onSkip}
          >
            Skip <SkipForward />
          </Button>
          <Button 
            variant="outline"
            className={`flex-1 bg-white/60 ${text} rounded-xl border-0 font-medium hover:bg-white/30 hover:text-white transition-colors`}
            onClick={() => setIsHistoryModalOpen(true)}
            disabled={!subject || !classNumber}
          >
            History <History />
          </Button>
          <Button
            variant="outline"
            className={`flex-1 bg-white/60 ${text} rounded-xl border-0 font-medium hover:bg-white/30 hover:text-white transition-colors`}
            onClick={() => setIsImprovementModalOpen(true)}
            disabled={!subject || !classNumber}
          >
            Improvement <Book />
          </Button>
        </div>
      </div>

      {/* Student History Modal */}
      {student && subject && classNumber && (
        <StudentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          student={student}
          subject={subject}
          classNumber={classNumber}
        />
      )}

      {/* Improvement Modal */}
      {student && subject && classNumber && (
        <ImprovementModal
          isOpen={isImprovementModalOpen}
          onClose={() => setIsImprovementModalOpen(false)}
          student={student}
          subject={subject}
          classNumber={classNumber}
          onSuccess={() => {
            onImprovementAssigned?.();
          }}
        />
      )}
    </Card>
  );
}
