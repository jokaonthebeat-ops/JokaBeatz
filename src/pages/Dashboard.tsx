import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { MusicVideoProjects } from "@/components/dashboard/MusicVideoProjects";
import { BeatPurchases } from "@/components/dashboard/BeatPurchases";
import { 
  Loader2, 
  Download, 
  Package, 
  User, 
  ShoppingBag, 
  LogOut, 
  Shield,
  Calendar,
  Music,
  Video
} from "lucide-react";

interface Order {
  id: string;
  product_id: string | null;
  status: string;
  amount: number;
  created_at: string;
  products: {
    name: string;
    description: string | null;
    category: string;
  } | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchProfile();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          product_id,
          status,
          amount,
          created_at,
          products (
            name,
            description,
            category
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFullName(data.full_name || "");
      setEmail(data.email);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownload = async (productId: string, productName: string) => {
    setDownloadingFile(productId);

    try {
      // Fetch product files for this product
      const { data: files, error } = await supabase
        .from("product_files")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;

      if (!files || files.length === 0) {
        toast({
          title: "No files available",
          description: "This product has no downloadable files yet.",
          variant: "destructive",
        });
        return;
      }

      // Open each file link
      for (const file of files) {
        // Check if it's an external URL or storage path
        if (file.file_path.startsWith("http://") || file.file_path.startsWith("https://")) {
          // External URL - open in new tab
          window.open(file.file_path, "_blank");
        } else {
          // Storage file - download from Supabase
          const { data, error: downloadError } = await supabase.storage
            .from("product-files")
            .download(file.file_path);

          if (downloadError) throw downloadError;

          // Create download link
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      toast({
        title: "Download started",
        description: `${productName} is ready for download.`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {isAdmin && (
                <Button asChild variant="outline">
                  <Link to="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Purchases</CardDescription>
                <CardTitle className="text-3xl">{completedOrders.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground text-sm">
                  <ShoppingBag className="mr-1 h-4 w-4" />
                  Products owned
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Spent</CardDescription>
                <CardTitle className="text-3xl">
                  ${completedOrders.reduce((sum, o) => sum + Number(o.amount), 0).toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Music className="mr-1 h-4 w-4" />
                  On beats & products
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Member Since</CardDescription>
                <CardTitle className="text-3xl">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  Joka Beatz member
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="video-projects" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="video-projects" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Projects
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                My Purchases
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video-projects">
              <MusicVideoProjects />
            </TabsContent>

            <TabsContent value="purchases">
              <BeatPurchases />
              <Card>
                <CardHeader>
                  <CardTitle>My Purchases</CardTitle>
                  <CardDescription>
                    View and download your purchased products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : completedOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No purchases yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Check out our shop to find amazing beats and products.
                      </p>
                      <Button asChild>
                        <Link to="/shop">Browse Shop</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                              {order.products?.name || "Product"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {order.products?.category} • Purchased{" "}
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-foreground">
                              ${Number(order.amount).toFixed(2)}
                            </span>
                            {order.product_id && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleDownload(order.product_id!, order.products?.name || "Product")
                                }
                                disabled={downloadingFile === order.product_id}
                              >
                                {downloadingFile === order.product_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input
                          id="profile-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your name"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                          id="profile-email"
                          value={email}
                          disabled
                          className="h-12 bg-secondary"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>

                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
