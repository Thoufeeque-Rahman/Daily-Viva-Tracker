import { useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Shield,
  Key,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User as UserType } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectSelector } from "@/components/SubjectSelector";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    qualification: user?.qualification || "",
  });

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showLessonsDialog, setShowLessonsDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedSubject, setSelectedSubject] = useState("");

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState<string | null>(
    null
  );

  const handleSave = async () => {
    setIsSavingProfile(true);
    try {
      await axios.put("/api/teachers/profile", profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      setShowProfileDialog(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.put("/api/teachers/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setShowPasswordDialog(false);
      setShowProfileDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classValue = formData.get("class");
    console.log(classValue, selectedSubject);

    if (classValue && selectedSubject) {
      try {
        const response = await axios.post(
          `/api/teachers/${user?._id}/subjects`,
          {
            class: Number(classValue),
            subject: selectedSubject,
          }
        );

        console.log("Add subject response:", response);

        if (response.status === 200 || response.status === 201) {
          // Update user state with the new subject
          if (user && response.data) {
            updateUser(response.data);
          }

          toast({
            title: "Success",
            description: "Subject added successfully",
          });

          // Reset form safely
          const form = e.currentTarget;
          if (form) {
            form.reset();
          }
          setSelectedSubject("");
        }
      } catch (error) {
        console.error("Add subject error:", error);
        toast({
          title: "Error",
          description:
            "Failed to add subject: " +
            ((error as any)?.response?.data?.error ||
              (error as any)?.message ||
              "Unknown error"),
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    try {
      const response = await axios.delete(
        `/api/teachers/${user?._id}/subjects/${subjectId}`
      );

      if (response.status === 200) {
        // Update user state by removing the subject
        if (user && response.data) {
          updateUser(response.data);
        }

        toast({
          title: "Success",
          description: "Subject removed successfully",
        });
      }
    } catch (error) {
      console.error("Remove subject error:", error);
      toast({
        title: "Error",
        description:
          "Failed to remove subject: " +
          ((error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      qualification: user?.qualification || "",
    });
    setIsEditing(false);
  };

  const sortedSubjects = [...(user?.subjectsTaught || [])].sort(
    (a, b) => b.class - a.class
  );

  if (!user) {
    return null;
  }



  const [, navigate] = useLocation(); 

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => {navigate("/")}} />

      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Profile</h1>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </div>
              <Dialog
                open={showProfileDialog}
                onOpenChange={setShowProfileDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information or change your password.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="profile">Profile Info</TabsTrigger>
                      <TabsTrigger value="password">
                        Change Password
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="dialog-name">Name</Label>
                          <Input
                            id="dialog-name"
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dialog-email">Email</Label>
                          <Input
                            id="dialog-email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dialog-phone">Phone</Label>
                          <Input
                            id="dialog-phone"
                            value={profileData.phone}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dialog-qualification">
                            Qualification
                          </Label>
                          <Textarea
                            id="dialog-qualification"
                            value={profileData.qualification}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                qualification: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={handleSave}
                          className="w-full"
                          loading={isSavingProfile}
                        >
                          {isSavingProfile ? "Updating..." : "Update Profile"}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="password" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="dialog-currentPassword">
                            Current Password
                          </Label>
                          <Input
                            id="dialog-currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dialog-newPassword">
                            New Password
                          </Label>
                          <Input
                            id="dialog-newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dialog-confirmPassword">
                            Confirm New Password
                          </Label>
                          <Input
                            id="dialog-confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button
                          onClick={handlePasswordChange}
                          className="w-full"
                          loading={isChangingPassword}
                        >
                          {isChangingPassword
                            ? "Updating..."
                            : "Update Password"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{user?.name || "N/A"}</h3>
                <p className="text-sm text-gray-600">{user?.email || "N/A"}</p>
              </div>
              <Badge
                variant={
                  user?.role === "super_admin" ? "destructive" : "default"
                }
              >
                {user?.role === "super_admin" ? "Super Admin" : "Teacher"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{user?.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>{user?.qualification || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  {user?.joinedAt
                    ? new Date(user.joinedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>{user?.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Taught */}
        {user?.subjectsTaught && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Lessons Teaching
                </div>
                <Dialog
                  open={showLessonsDialog}
                  onOpenChange={setShowLessonsDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      {user.subjectsTaught.length > 0 ? (
                        <>
                          <Edit className="h-4 w-4" />
                          Edit Lessons
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> 
                          Add Lesson
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Lessons</DialogTitle>
                      <DialogDescription>
                        Add or remove lessons that you teach.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Lessons</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead>Lesson</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedSubjects?.map((subject: any) => (
                                <TableRow key={subject._id}>
                                  <TableCell>{subject.class}</TableCell>
                                  <TableCell>{subject.subject}</TableCell>
                                  <TableCell>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove {subject.subject}{" "}
                                            for class {subject.class} from your
                                            subjects. This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleRemoveSubject(subject._id)
                                            }
                                            className="bg-red-500 hover:bg-red-600"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">
                              Add New Lesson
                            </h3>
                            <form
                              onSubmit={handleAddSubject}
                              className="space-y-4"
                            >
                              <div className="flex flex-col gap-4">
                                <div>
                                  <Label htmlFor="dialog-class">Class</Label>
                                  <Input
                                    id="dialog-class"
                                    name="class"
                                    type="number"
                                    placeholder="Class"
                                  />
                                </div>
                                <SubjectSelector
                                  selectedSubject={selectedSubject}
                                  onSubjectSelect={setSelectedSubject}
                                  label="Lesson"
                                  placeholder="Select lesson..."
                                  showAllSubjects={true}
                                />
                              </div>
                              <Button type="submit">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lesson
                              </Button>
                            </form>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedSubjects.map((subject, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{subject.subject}</span>
                    <Badge variant="outline">Class {subject.class}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Profile Form */}
        {/* <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </span>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      Edit Profile
                    </Button>
                    <Dialog
                      open={showPasswordDialog}
                      onOpenChange={setShowPasswordDialog}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and new password to
                            update.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                              Current Password
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  currentPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  newPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirm New Password
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  confirmPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button
                            onClick={handlePasswordChange}
                            className="w-full"
                          >
                            Update Password
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" loading={isSavingProfile}>
                      {isSavingProfile ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Textarea
                id="qualification"
                value={profileData.qualification}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    qualification: e.target.value,
                  })
                }
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card> */}
      </main>
    </div>
  );
}
