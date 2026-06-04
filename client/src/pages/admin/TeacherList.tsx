import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
    _id: string;
    name: string;
    email: string;
    phone: string;
    qualification: string;
    role: string;
}

export default function TeacherList() {
    const [, navigate] = useLocation();
    const { toast } = useToast();

    console.log('TeacherList component rendered');
    
    const { data: teachers, isLoading, error } = useQuery<Teacher[]>({
        queryKey: ['teachers'],
        queryFn: async () => {
            console.log('Fetching teachers data...');
            try {
                const response = await axios.get('/api/superadmin/teachers');
                console.log('Teachers data:', response.data);
                return response.data;
            } catch (err) {
                console.error('Error fetching teachers:', err);
                toast({
                    title: "Error",
                    description: "Failed to load teachers list",
                    variant: "destructive",
                });
                throw err;
            }
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Error loading teachers list. Please try again.</p>
            </div>
        );
    }

    if (!teachers?.length) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No teachers found.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Teachers List</h1>
            </div>
            
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.map((teacher) => (
                            <TableRow key={teacher._id}>
                                <TableCell>{teacher.name}</TableCell>
                                <TableCell>{teacher.email}</TableCell>
                                <TableCell>{teacher.phone}</TableCell>
                                <TableCell>{teacher.qualification}</TableCell>
                                <TableCell>{teacher.role}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (teacher._id) {
                                                navigate(`/admin/teachers/${teacher._id}`);
                                            } else {
                                                toast({
                                                    title: "Error",
                                                    description: "Teacher ID is missing",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}