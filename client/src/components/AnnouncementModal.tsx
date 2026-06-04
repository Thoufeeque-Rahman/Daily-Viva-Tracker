import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";

const ANNOUNCEMENT_STORAGE_KEY = "announcement_modal_dismissed";

export default function AnnouncementModal() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the modal
    const dismissed = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (!dismissed) {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, "true");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <DialogTitle className="text-2xl">Exciting Updates! 🎉</DialogTitle>
          </div>
          <DialogDescription className="space-y-4 text-left pt-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                We've Moved to a New Domain!
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                Daily Viva Tracker is now available at:
              </p>
              <a
                href="https://dailyviva.darulirfan.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-base"
              >
                dailyviva.darulirfan.co
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Darul Irfan Official Website is Live!
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm mb-2">
                Visit our official website for more information:
              </p>
              <a
                href="https://darulirfan.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold hover:underline text-base"
              >
                darulirfan.co
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label
                htmlFor="dont-show"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Don't show this again
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
