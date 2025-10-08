import { Home, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import Navigation from "./Navigation";

interface HeaderProps {
  selectedClass?: string;
  selectedSubject?: string;
  showContext: boolean;
  onHomeClick: () => void;
}

export default function Header({
  selectedClass,
  selectedSubject,
  showContext,
  onHomeClick,
}: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfileClick = () => {
    setLocation('/profile');
  };

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 shadow-md relative z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Navigation />
          <div>
            <h1 className="text-xl font-bold">Daily Viva Tracker</h1>
            <div
              className={`text-sm mt-1 transition-opacity duration-300 ${
                showContext ? "opacity-100" : "opacity-0"
              }`}
            >
              <span>{selectedSubject}</span>
            </div> 
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onHomeClick}
            className={`text-white transition-opacity duration-300 ${
              showContext ? "opacity-100" : "opacity-0"
            }`}
          >
            <Home className="w-5 h-5" />
          </button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar className="h-8 w-8 border-2 border-blue-100">  
                    <AvatarFallback className="bg-transparent text-blue-100 text-sm"> 
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{"Logout"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
