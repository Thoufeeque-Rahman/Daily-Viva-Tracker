import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Delete, Loader2, Trash2 } from "lucide-react";

export default function TeacherDetails() {
  const params = useParams();
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log("Teacher ID:", id); // Debug log

  // Return early if no ID is provided
  if (!id) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-5 text-red-600">Error</h1>
          <p>No teacher ID provided</p>
        </Card>
      </div>
    );
  }

  const {
    data: teacher,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["teacher", id],
    queryFn: async () => {
      const response = await axios.get(`/api/superadmin/teachers/${id}`);
      return response.data;
    },
    enabled: !!id, // Only run query if id exists
    retry: 1, // Limit retries on error
  });

  const updateTeacher = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await axios.put(
        `/api/superadmin/teachers/${id}`,
        updatedData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      toast({
        title: "Success",
        description: "Teacher details updated successfully",
      });
    },
  });

  const addSubject = useMutation({
    mutationFn: async (subjectData: any) => {
      const response = await axios.post(
        `/api/superadmin/teachers/${id}/subjects`,
        subjectData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
    },
  });

  const removeSubject = useMutation({
    mutationFn: async (subjectId: string) => {
      const response = await axios.delete(
        `/api/superadmin/teachers/${id}/subjects/${subjectId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      toast({
        title: "Success",
        description: "Subject removed successfully",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-5 text-red-600">Error</h1>
          <p>{(error as Error)?.message || "Failed to load teacher details"}</p>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-5 text-yellow-600">No Data</h1>
          <p>No teacher found with the provided ID</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={false} onHomeClick={() => {}} />
      <main className="relative h-full">
        <div className="flex-1 p-6">
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-5">Teacher Details</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <Input
                  defaultValue={teacher.name}
                  onChange={(e) =>
                    updateTeacher.mutate({ ...teacher, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input
                  defaultValue={teacher.email}
                  onChange={(e) =>
                    updateTeacher.mutate({ ...teacher, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <Input
                  defaultValue={teacher.phone}
                  onChange={(e) =>
                    updateTeacher.mutate({ ...teacher, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Qualification
                </label>
                <Input
                  defaultValue={teacher.qualification}
                  onChange={(e) =>
                    updateTeacher.mutate({
                      ...teacher,
                      qualification: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Lessons Taught</h2>
              <Table>
                <TableHeader>
                  <TableRow> 
                    <TableHead>Class</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacher.subjectsTaught?.map((subject: any) => (
                    <TableRow key={subject._id}>
                      <TableCell>{subject.class}</TableCell>
                      <TableCell>{subject.subject}</TableCell>
                      {/* <TableCell>{subject.periodsInSemester}</TableCell> */}
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {subject.subject} for class {subject.class} from this teacher's subjects.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeSubject.mutate(subject._id)}
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
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addSubject.mutate({
                      class: Number(formData.get("class")),
                      subject: formData.get("subject"),
                      periodsInSemester: Number(formData.get("periods")),
                    });
                    e.currentTarget.reset();
                  }}
                  className="space-y-4"
                >
                  <Input name="class" type="number" placeholder="Class" />
                  <Input name="subject" placeholder="Subject Name" />
                  <Input
                    name="periods"
                    type="number"
                    placeholder="Periods per Semester"
                  />
                  <Button type="submit">Add Lesson</Button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
