import {
  Menu,
  Home,
  History,
  BarChart,
  Replace,
  Users as UsersIcon,
  BarChart3,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  Offcanvas,
  OffcanvasContent,
  OffcanvasTrigger,
  OffcanvasHeader,
  OffcanvasTitle,
} from "@/components/ui/offcanvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location, navigate] = useLocation();

  const { user } = useAuth();

  const menuItems = [
    {
      title: "Home",
      icon: Home,
      href: "/",
    },
    {
      title: "History",
      icon: History,
      href: "/history",
    },
    {
      title: "Performance Board",
      icon: BarChart,
      href: "/performance",
    },
    {
      title: "DV to CCE",
      icon: Replace,
      href: "/cnvrt2cce",
    },
    {
      title: "Assignments",
      icon: ClipboardList,
      href: "/assignments",
    },
    {
      title: "Assignment to CCE",
      icon: Replace,
      href: "/assignment2cce",
    },
    ...(user?.role === "super_admin"
      ? [
          {
            title: "Manage Teachers",
            icon: UsersIcon,
            href: "/admin/teachers",
          },
          {
            title: "Manage Students",
            icon: GraduationCap,
            href: "/admin/students",
          },
          {
            title: "Super Admin Dashboard",
            icon: BarChart3,
            href: "/admin/superadmin",
          },
          // {
          //   title: "Admin Statistics",
          //   icon: BarChart3,
          //   href: "/admin/stats",
          // },
        ]
      : []),
  ];

  return (
    <Offcanvas>
      <OffcanvasTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-md">
          <Menu className="h-10 w-10" />
          {/* <span className="sr-only">Toggle navigation menu</span> */}
        </Button>
      </OffcanvasTrigger>
      <OffcanvasContent>
        <OffcanvasHeader>
          <OffcanvasTitle>Menu</OffcanvasTitle>
        </OffcanvasHeader>
        <nav className="mt-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const active = location === item.href;
              return (
                <li key={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center text-start gap-3 px-3 py-2 rounded-md transition-colors",
                      active
                        ? "bg-accent/10 font-medium"
                        : "hover:bg-accent/5 text-foreground/90",
                    )}
                    onClick={() => navigate(item.href)}
                    aria-current={active ? "page" : undefined}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-md shrink-0",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>

                    <span className="flex-1 text-sm">{item.title}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </OffcanvasContent>
    </Offcanvas>
  );
}
