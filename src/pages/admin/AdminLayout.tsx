import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Mail,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Music,
  Settings,
  Workflow,
  Video,
  Film,
  FileText,
  Briefcase,
  AudioWaveform,
  Youtube,
  Disc3,
  Smartphone,
  Mic,
} from "lucide-react";

const navItems = [
  { name: "Overview", path: "/admin", icon: LayoutDashboard },
  { name: "Products", path: "/admin/products", icon: Package },
  { name: "Beats", path: "/admin/beats", icon: Disc3 },
  { name: "App Content", path: "/admin/app-content", icon: Smartphone },
  { name: "Recordings & Lyrics", path: "/admin/recordings", icon: Mic },
  { name: "Free Beats", path: "/admin/free-beats", icon: Music },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { name: "Music Video Orders", path: "/admin/music-video-orders", icon: Film },
  { name: "Service Orders", path: "/admin/service-orders", icon: Briefcase },
  { name: "AI Mastering", path: "/admin/mastering", icon: AudioWaveform },
  { name: "YouTube Uploader", path: "/admin/youtube-uploader", icon: Youtube },
  { name: "Music Video Settings", path: "/admin/music-video-settings", icon: Video },
  { name: "Blog Posts", path: "/admin/blog", icon: FileText },
  { name: "Blog Settings", path: "/admin/blog-settings", icon: Settings },
  { name: "Free Beat Leads", path: "/admin/leads/free-beats", icon: Users },
  { name: "Newsletter Leads", path: "/admin/leads/newsletter", icon: Users },
  { name: "Email Campaigns", path: "/admin/emails", icon: Mail },
  { name: "Email Sequences", path: "/admin/sequences", icon: Workflow },
  { name: "Contact Messages", path: "/admin/messages", icon: MessageSquare },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to="/admin">
              <img src={jokaBeatzLogo} alt="Joka Beatz" className="h-8" />
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Home size={20} />
              <span className="font-medium">View Site</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Admin</span>
                <ChevronRight size={16} />
                <span>
                  {navItems.find((item) => item.path === location.pathname)?.name || "Dashboard"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
