import { Toast, ToastProps } from "@/components/ui/toast";

interface FeedbackToastProps extends Omit<ToastProps, "variant"> {
  message: string;
  type: "success" | "warning" | "danger" | "info";
}

export default function FeedbackToast({
  message,
  type,
  ...props
}: FeedbackToastProps) {
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-400";
      case "danger":
        return "bg-red-500";
      case "info":
      default:
        return "bg-primary";
    }
  };

  return (
    <Toast
      {...props}
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg text-white font-medium shadow-lg z-50 ${getBackgroundColor()}`}
    >
      {message}
    </Toast>
  );
}
