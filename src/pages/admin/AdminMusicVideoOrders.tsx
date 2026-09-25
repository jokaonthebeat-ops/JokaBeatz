import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { MusicVideoDelivery } from "@/components/admin/MusicVideoDelivery";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Eye, Download, Music } from "lucide-react";

interface MusicVideoOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  video_style: string;
  video_quality: string;
  vision_description: string;
  song_url: string;
  base_price: number;
  upgrades: { id: string; name: string; price: number }[];
  total_price: number;
  status: string;
  progress_percent: number;
  progress_note: string | null;
  final_video_url: string | null;
  notification_sent: boolean;
  created_at: string;
}

interface OrderImage {
  id: string;
  image_url: string;
  display_order: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  paid: "bg-blue-500/20 text-blue-500",
  in_progress: "bg-purple-500/20 text-purple-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const AdminMusicVideoOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<MusicVideoOrder | null>(null);
  const [orderImages, setOrderImages] = useState<OrderImage[]>([]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["music-video-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_video_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((order) => ({
        ...order,
        upgrades: (order.upgrades as unknown as { id: string; name: string; price: number }[]) || [],
        progress_percent: order.progress_percent ?? 0,
        notification_sent: order.notification_sent ?? false,
      })) as MusicVideoOrder[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("music_video_orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-video-orders"] });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const openOrderDetail = async (order: MusicVideoOrder) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from("music_video_order_images")
      .select("*")
      .eq("order_id", order.id)
      .order("display_order");
    setOrderImages(data || []);
  };

  const handleOrderUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["music-video-orders"] });
    // Refresh selected order
    if (selectedOrder) {
      supabase
        .from("music_video_orders")
        .select("*")
        .eq("id", selectedOrder.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedOrder({
              ...data,
              upgrades: (data.upgrades as unknown as { id: string; name: string; price: number }[]) || [],
              progress_percent: data.progress_percent ?? 0,
              notification_sent: data.notification_sent ?? false,
            } as MusicVideoOrder);
          }
        });
    }
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Music Video Orders</h1>
        <p className="text-muted-foreground">Manage custom music video orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{order.video_style}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${order.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{order.progress_percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>${order.total_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(status) => updateStatus.mutate({ orderId: order.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openOrderDetail(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Details</p>
                  <p className="font-medium capitalize">
                    {selectedOrder.video_style} • {selectedOrder.video_quality}
                  </p>
                  <p className="text-sm">${selectedOrder.total_price.toFixed(2)}</p>
                </div>
              </div>

              {/* Upgrades */}
              {selectedOrder.upgrades && selectedOrder.upgrades.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Add-Ons</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.upgrades.map((upgrade) => (
                      <Badge key={upgrade.id} variant="secondary">
                        {upgrade.name} (+${upgrade.price})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Vision Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Customer's Vision</p>
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm">{selectedOrder.vision_description}</p>
                </div>
              </div>

              {/* Song */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Song</p>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <audio src={selectedOrder.song_url} controls className="flex-1" />
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedOrder.song_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              {/* Images */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Artist Photos ({orderImages.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {orderImages.map((img) => (
                    <a
                      key={img.id}
                      href={img.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                    >
                      <img
                        src={img.image_url}
                        alt={`Photo ${img.display_order + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </div>

              {/* Delivery & Progress Controls */}
              <MusicVideoDelivery
                orderId={selectedOrder.id}
                customerEmail={selectedOrder.customer_email}
                customerName={selectedOrder.customer_name}
                currentProgress={selectedOrder.progress_percent}
                currentNote={selectedOrder.progress_note}
                finalVideoUrl={selectedOrder.final_video_url}
                notificationSent={selectedOrder.notification_sent}
                onUpdate={handleOrderUpdate}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMusicVideoOrders;
