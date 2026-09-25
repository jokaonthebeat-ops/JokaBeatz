import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Music, Loader2, ExternalLink, Play, Pause } from "lucide-react";

import type { Json } from "@/integrations/supabase/types";

interface ServiceOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  price: number;
  status: string;
  project_notes: string | null;
  file_urls: Json;
  additional_data: Json;
  progress_percent: number;
  progress_note: string | null;
  final_delivery_url: string | null;
  created_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  custom_beats: "Custom Beats",
  mixing: "Mixing",
  mastering: "Mastering",
  consultation: "Consultation",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const AdminServiceOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["service-orders", filterStatus, filterService],
    queryFn: async () => {
      let query = supabase
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterService !== "all") {
        query = query.eq("service_type", filterService);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceOrder[];
    },
  });

  const updateOrder = useMutation({
    mutationFn: async (updates: Partial<ServiceOrder> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("service_orders")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-orders"] });
      toast.success("Order updated");
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  const playAudio = (url: string) => {
    if (playingAudio === url && audioElement) {
      audioElement.pause();
      setPlayingAudio(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setPlayingAudio(null);
        setAudioElement(null);
      };
      setPlayingAudio(url);
      setAudioElement(audio);
    }
  };

  const isAudioFile = (url: string) => {
    return /\.(mp3|wav|aiff?|m4a|ogg)$/i.test(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Service Orders</h1>
        <div className="flex gap-2">
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="custom_beats">Custom Beats</SelectItem>
              <SelectItem value="mixing">Mixing</SelectItem>
              <SelectItem value="mastering">Mastering</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders?.length === 0 ? (
        <Card className="bg-secondary">
          <CardContent className="py-12 text-center text-muted-foreground">
            No service orders found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders?.map((order) => (
            <Card
              key={order.id}
              className="bg-secondary border-border cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedOrder(order)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.customer_name}</span>
                      <Badge className={STATUS_COLORS[order.status]}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {SERVICE_LABELS[order.service_type]}
                    </Badge>
                    <span className="font-bold text-primary">
                      ${order.price}
                    </span>
                    {order.status !== "pending" && order.status !== "cancelled" && (
                      <div className="text-xs text-muted-foreground">
                        {order.progress_percent}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
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
                  <label className="text-xs text-muted-foreground">Customer</label>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Service</label>
                  <p className="font-medium">{SERVICE_LABELS[selectedOrder.service_type]}</p>
                  <p className="text-sm text-primary font-bold">${selectedOrder.price}</p>
                </div>
              </div>

              {/* Project Notes */}
              {selectedOrder.project_notes && (
                <div>
                  <label className="text-xs text-muted-foreground">Project Notes</label>
                  <p className="text-sm bg-background p-3 rounded-lg mt-1">
                    {selectedOrder.project_notes}
                  </p>
                </div>
              )}

              {/* Additional Data */}
              {Object.keys(selectedOrder.additional_data || {}).length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Additional Info</label>
                  <div className="bg-background p-3 rounded-lg mt-1 text-sm">
                    {Object.entries(selectedOrder.additional_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                        <span>{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {Array.isArray(selectedOrder.file_urls) && selectedOrder.file_urls.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Uploaded Files</label>
                  <div className="space-y-2 mt-1">
                    {(selectedOrder.file_urls as string[]).map((url, idx) => {
                      const fileName = url.split("/").pop() || `File ${idx + 1}`;
                      const isAudio = isAudioFile(url);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-background rounded-lg"
                        >
                          {isAudio ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAudio(url)}
                            >
                              {playingAudio === url ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </Button>
                          ) : (
                            <Music size={16} className="text-muted-foreground" />
                          )}
                          <span className="text-sm flex-1 truncate">{fileName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(url, "_blank")}
                          >
                            <Download size={16} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status & Progress */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) =>
                        updateOrder.mutate({ id: selectedOrder.id, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Progress: {selectedOrder.progress_percent}%
                    </label>
                    <Slider
                      value={[selectedOrder.progress_percent]}
                      min={0}
                      max={100}
                      step={5}
                      onValueCommit={(value) =>
                        updateOrder.mutate({
                          id: selectedOrder.id,
                          progress_percent: value[0],
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Progress Note</label>
                  <div className="flex gap-2">
                    <Input
                      defaultValue={selectedOrder.progress_note || ""}
                      placeholder="Add a note about the progress..."
                      onBlur={(e) => {
                        if (e.target.value !== (selectedOrder.progress_note || "")) {
                          updateOrder.mutate({
                            id: selectedOrder.id,
                            progress_note: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Final Delivery URL</label>
                  <Input
                    defaultValue={selectedOrder.final_delivery_url || ""}
                    placeholder="Paste the delivery link here..."
                    onBlur={(e) => {
                      if (e.target.value !== (selectedOrder.final_delivery_url || "")) {
                        updateOrder.mutate({
                          id: selectedOrder.id,
                          final_delivery_url: e.target.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceOrders;
