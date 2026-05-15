import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-utils";

export default function CompleteProfileDialog() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { toast } = useToast();
  const [isSkipped, setIsSkipped] = useState(false);

  const skipStorageKey = useMemo(() => {
    if (!user?._id) {
      return "";
    }

    return `complete-profile-skipped-${user._id}`;
  }, [user?._id]);

  const isOpen = useMemo(() => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (isSkipped) {
      return false;
    }

    return Boolean(user.mustUpdateCredentials || !user.username);
  }, [isAuthenticated, user, isSkipped]);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    setEmail(user.email || "");
    setUsername(user.username || "");
  }, [isOpen, user]);

  useEffect(() => {
    if (!skipStorageKey) {
      return;
    }

    try {
      const skipped = sessionStorage.getItem(skipStorageKey) === "true";
      setIsSkipped(skipped);
    } catch {
      setIsSkipped(false);
    }
  }, [skipStorageKey]);

  const handleSave = async () => {
    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedEmail || !normalizedUsername) {
      toast({
        title: "Missing details",
        description: "Email and username are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/api/teachers/complete-profile", {
        method: "PUT",
        body: JSON.stringify({
          email: normalizedEmail,
          username: normalizedUsername,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      updateUser(data.teacher);
      if (skipStorageKey) {
        sessionStorage.removeItem(skipStorageKey);
      }
      setIsSkipped(false);

      toast({
        title: "Profile updated",
        description: "You can now continue using the app.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipForNow = () => {
    if (skipStorageKey) {
      try {
        sessionStorage.setItem(skipStorageKey, "true");
      } catch {
        // Ignore storage write errors and still allow skipping.
      }
    }

    setIsSkipped(true);
    toast({
      title: "You can update later",
      description: "Use Profile or login again to complete email and username setup.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Complete your account</DialogTitle>
          <DialogDescription>
            Please set your real email and choose a username. OTP email verification will be added next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complete-email">Email</Label>
            <Input
              id="complete-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complete-username">Username</Label>
            <Input
              id="complete-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.username"
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save and continue"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleSkipForNow}
              disabled={isSaving}
            >
              Skip, do it later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
