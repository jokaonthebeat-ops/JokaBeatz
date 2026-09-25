import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, ShoppingCart, Users, DollarSign, Mail, MessageSquare } from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalFreeBeatLeads: number;
  totalNewsletterLeads: number;
  totalMessages: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalFreeBeatLeads: 0,
    totalNewsletterLeads: 0,
    totalMessages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [products, orders, freeBeatLeads, newsletterLeads, messages] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id, amount, status"),
        supabase.from("free_beat_requests").select("id", { count: "exact" }),
        supabase.from("leads").select("id", { count: "exact" }),
        supabase.from("contact_messages").select("id", { count: "exact" }),
      ]);

      const completedOrders = orders.data?.filter((o) => o.status === "completed") || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.amount), 0);

      setStats({
        totalProducts: products.count || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue,
        totalFreeBeatLeads: freeBeatLeads.count || 0,
        totalNewsletterLeads: newsletterLeads.count || 0,
        totalMessages: messages.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active products in shop",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: "All time orders",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "From completed orders",
    },
    {
      title: "Free Beat Leads",
      value: stats.totalFreeBeatLeads,
      icon: Users,
      description: "Free beat requests",
    },
    {
      title: "Newsletter Subscribers",
      value: stats.totalNewsletterLeads,
      icon: Mail,
      description: "Email subscribers",
    },
    {
      title: "Contact Messages",
      value: stats.totalMessages,
      icon: MessageSquare,
      description: "Inbox messages",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the Joka Beatz admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
