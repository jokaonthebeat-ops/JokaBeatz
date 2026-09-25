import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Download, ExternalLink, Image, AlertCircle } from "lucide-react";

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  gumroadUrl: string;
  selected?: boolean;
}

interface GumroadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const GumroadImportDialog = ({ open, onOpenChange, onImportComplete }: GumroadImportDialogProps) => {
  const { toast } = useToast();
  const [gumroadUrl, setGumroadUrl] = useState("https://diamondloopz.gumroad.com/");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-gumroad', {
        body: { url: gumroadUrl },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape products');
      }

      if (data.products && data.products.length > 0) {
        setProducts(data.products.map((p: ScrapedProduct) => ({ ...p, selected: true })));
        setStep("preview");
      } else {
        setError("No products found on the page. The store might be empty or have a different structure.");
      }
    } catch (err) {
      console.error("Error scraping Gumroad:", err);
      setError(err instanceof Error ? err.message : "Failed to scrape products");
      toast({
        title: "Scrape failed",
        description: err instanceof Error ? err.message : "Failed to scrape products from Gumroad",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedProducts = products.filter(p => p.selected);
    
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-gumroad-products', {
        body: { products: selectedProducts },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to import products');
      }

      toast({
        title: "Import successful!",
        description: `Imported ${data.imported} products. They're set to inactive for your review.`,
      });

      // Reset and close
      setProducts([]);
      setStep("input");
      onOpenChange(false);
      onImportComplete();
    } catch (err) {
      console.error("Error importing products:", err);
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleProduct = (index: number) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, selected: !p.selected } : p
    ));
  };

  const toggleAll = (selected: boolean) => {
    setProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const handleClose = () => {
    setProducts([]);
    setStep("input");
    setError(null);
    onOpenChange(false);
  };

  const selectedCount = products.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {step === "input" ? "Import from Gumroad" : "Review Products"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" 
              ? "Scrape products from your Gumroad store and import them to your shop."
              : `Found ${products.length} products. Select which ones to import.`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gumroad-url">Gumroad Store URL</Label>
              <Input
                id="gumroad-url"
                value={gumroadUrl}
                onChange={(e) => setGumroadUrl(e.target.value)}
                placeholder="https://yourstore.gumroad.com/"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Gumroad profile or store URL
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCount === products.length}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select all ({selectedCount}/{products.length})
                </Label>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      product.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
                    }`}
                  >
                    <Checkbox
                      checked={product.selected}
                      onCheckedChange={() => toggleProduct(index)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {product.description || "No description"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.imageUrl ? (
                          <Badge variant="outline" className="text-xs">
                            <Image className="h-3 w-3 mr-1" />
                            Has image
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No image
                          </Badge>
                        )}
                        {product.gumroadUrl && (
                          <a
                            href={product.gumroadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              <p>• Products will be imported as <strong>inactive</strong> for review</p>
              <p>• You'll need to add download links manually</p>
              <p>• Images will be re-uploaded to your storage</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "input" ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleScrape} disabled={isLoading || !gumroadUrl.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Scan Store
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import {selectedCount} Products
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GumroadImportDialog;
