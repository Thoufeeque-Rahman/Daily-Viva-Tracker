import { Menu, Home, History, BarChart, Replace, Users as UsersIcon, BarChart3, GraduationCap, ClipboardList } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useLocation } from "wouter"
import {
  Offcanvas,
  OffcanvasContent,
  OffcanvasTrigger,
  OffcanvasHeader,
  OffcanvasTitle,
} from "@/components/ui/offcanvas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Navigation() {
  const [location, navigate] = useLocation()

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
    ...(user?.role === 'super_admin' ? [
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
      }
      // {
      //   title: "Admin Statistics",
      //   icon: BarChart3,
      //   href: "/admin/stats",
      // },
    ] : [])
  ]

  return (
    <Offcanvas>
      <OffcanvasTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </OffcanvasTrigger>
      <OffcanvasContent>
        <OffcanvasHeader>
          <OffcanvasTitle>Menu</OffcanvasTitle>
        </OffcanvasHeader>
        <nav className="mt-8">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    location === item.href && "bg-accent"
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </OffcanvasContent>
    </Offcanvas>
  )
} 