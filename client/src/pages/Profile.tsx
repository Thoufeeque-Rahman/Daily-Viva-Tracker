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
import { User, Mail, Phone, GraduationCap, Calendar, Shield, Key, Plus, Trash2 } from "lucide-react";
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

export default function Profile() {
  const { user, login } = useAuth();
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = async () => {
    try {
      await axios.put('/api/teachers/profile', profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
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

    try {
      await axios.put('/api/teachers/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const response = await axios.post(`/api/teachers/${user?._id}/subjects`, {
        class: Number(formData.get("class")),
        subject: formData.get("subject"),
        periodsInSemester: Number(formData.get("periods")),
      });
      // Update the user context with the new data
      if (login) {
        login(response.data);
      }
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
      e.currentTarget.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subject",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    try {
      const response = await axios.delete(`/api/teachers/${user?._id}/subjects/${subjectId}`);
      // Update the user context with the new data
      if (login) {
        login(response.data);
      }
      toast({
        title: "Success",
        description: "Subject removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove subject",
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

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={false} onHomeClick={() => {}} />
      
      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Profile</h1>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{user?.name || "N/A"}</h3>
                <p className="text-sm text-gray-600">{user?.email || "N/A"}</p>
              </div>
              <Badge variant={user?.role === "super_admin" ? "destructive" : "default"}>
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
                <span>{user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>{user?.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Taught */}
        {user?.subjectsTaught && user.subjectsTaught.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Subjects Taught
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.subjectsTaught.map((subject, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{subject.subject}</span>
                    <Badge variant="outline">Class {subject.class}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Profile Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-wrap gap-2 items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </span>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      Edit Profile
                    </Button>
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
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
                            Enter your current password and new password to update.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                          </div>
                          <Button onClick={handlePasswordChange} className="w-full">
                            Update Password
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      Save
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
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Textarea
                id="qualification"
                value={profileData.qualification}
                onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subjects Management */}
        <Card>
          <CardHeader>
            <CardTitle>Lessons Taught</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Lesson</TableHead>
                  {/* <TableHead>Periods/Semester</TableHead> */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user?.subjectsTaught?.map((subject: any) => (
                  <TableRow key={subject._id}>
                    <TableCell>{subject.class}</TableCell>
                    <TableCell>{subject.subject}</TableCell>
                    {/* <TableCell>{subject.periodsInSemester}</TableCell> */}
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {subject.subject} for class {subject.class} from your subjects.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveSubject(subject._id)}
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
              <h3 className="text-lg font-semibold mb-2">Add New Lesson</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Input id="class" name="class" type="number" placeholder="Class" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Lesson</Label>
                    <Input id="subject" name="subject" placeholder="Lesson Name" />
                  </div>
                  <div>
                    <Label htmlFor="periods">Periods</Label>
                    <Input id="periods" name="periods" type="number" placeholder="Periods per Semester" />
                  </div>
                </div>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


