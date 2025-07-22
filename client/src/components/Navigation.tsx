import { Menu, Home, History, BarChart, Replace } from "lucide-react"
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
      title: "Convert to CCE",
      icon: Replace,
      href: "/cnvrt2cce",
    },
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