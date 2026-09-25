import { useState } from "react";
import { useMasteringServices, useUpdateService, useCreateService, useDeleteService } from "@/hooks/useMasteringServices";
import { MasteringService, MasteringSettings, MUSICAL_STYLES, LOUDNESS_LEVELS, SAMPLE_RATES } from "@/types/mastering";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const SERVICE_TYPES = [
  { value: "mastering", label: "Mastering" },
  { value: "batch_mastering", label: "Batch Mastering" },
  { value: "mix_enhance", label: "Mix Enhancement" },
  { value: "mix_analysis", label: "Mix Analysis" },
  { value: "audio_cleanup", label: "Audio Cleanup" },
];

interface ServiceFormData {
  name: string;
  slug: string;
  description: string;
  service_type: MasteringService["service_type"];
  price_cents: number;
  sale_price_cents: number | null;
  stripe_price_id: string | null;
  features: string[];
  default_settings: MasteringSettings;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

const defaultFormData: ServiceFormData = {
  name: "",
  slug: "",
  description: "",
  service_type: "mastering",
  price_cents: 999,
  sale_price_cents: null,
  stripe_price_id: null,
  features: [],
  default_settings: {
    musicalStyle: "OTHER",
    desiredLoudness: "MEDIUM",
    sampleRate: "44100",
  },
  is_active: true,
  is_featured: false,
  display_order: 0,
};

const AdminMastering = () => {
  const { data: services, isLoading } = useMasteringServices();
  const updateService = useUpdateService();
  const createService = useCreateService();
  const deleteService = useDeleteService();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MasteringService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [featuresText, setFeaturesText] = useState("");

  const openCreateDialog = () => {
    setEditingService(null);
    setFormData(defaultFormData);
    setFeaturesText("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: MasteringService) => {
    setEditingService(service);
    const ds = service.default_settings as unknown as Record<string, unknown>;
    setFormData({
      name: service.name,
      slug: service.slug,
      description: service.description || "",
      service_type: service.service_type,
      price_cents: service.price_cents,
      sale_price_cents: service.sale_price_cents,
      stripe_price_id: service.stripe_price_id,
      features: service.features,
      default_settings: {
        musicalStyle: (ds.musicalStyle as MasteringSettings["musicalStyle"]) || "OTHER",
        desiredLoudness: (ds.desiredLoudness as MasteringSettings["desiredLoudness"]) || "MEDIUM",
        sampleRate: (ds.sampleRate as MasteringSettings["sampleRate"]) || "44100",
      },
      is_active: service.is_active,
      is_featured: service.is_featured,
      display_order: service.display_order,
    });
    setFeaturesText(service.features.join("\n"));
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const features = featuresText.split("\n").filter((f) => f.trim());
    const serviceData = {
      ...formData,
      features,
    };

    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...serviceData });
      } else {
        await createService.mutateAsync(serviceData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDelete = async (service: MasteringService) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;
    await deleteService.mutateAsync(service.id);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Mastering Services</h1>
          <p className="text-muted-foreground">Manage pricing and settings for mastering services</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>All available mastering service tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <span className="text-muted-foreground">{service.display_order}</span>
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.service_type}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(service.price_cents)}</TableCell>
                  <TableCell>
                    {service.sale_price_cents ? formatPrice(service.sale_price_cents) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {service.is_featured && <Badge variant="default">Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(service)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(service)}
                        disabled={deleteService.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!services || services.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No services found. Create your first service.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Create Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update the service details below" : "Add a new mastering service tier"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Standard Mastering"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="standard-mastering"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Perfect for independent artists..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(v) => setFormData({ ...formData, service_type: v as MasteringService["service_type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (cents)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(formData.price_cents)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price (cents, optional)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={formData.sale_price_cents || ""}
                  onChange={(e) => setFormData({ ...formData, sale_price_cents: e.target.value ? parseInt(e.target.value) : null })}
                />
                {formData.sale_price_cents && (
                  <p className="text-xs text-muted-foreground">
                    = {formatPrice(formData.sale_price_cents)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="AI-powered analysis&#10;Streaming-optimized LUFS&#10;24-hour delivery"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Default Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Musical Style</Label>
                  <Select
                    value={formData.default_settings.musicalStyle}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        default_settings: { ...formData.default_settings, musicalStyle: v as MasteringSettings["musicalStyle"] },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSICAL_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loudness Level</Label>
                  <Select
                    value={formData.default_settings.desiredLoudness}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        default_settings: { ...formData.default_settings, desiredLoudness: v as MasteringSettings["desiredLoudness"] },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOUDNESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sample Rate</Label>
                  <Select
                    value={formData.default_settings.sampleRate}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        default_settings: { ...formData.default_settings, sampleRate: v as MasteringSettings["sampleRate"] },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_RATES.map((rate) => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateService.isPending || createService.isPending}>
                {(updateService.isPending || createService.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMastering;
