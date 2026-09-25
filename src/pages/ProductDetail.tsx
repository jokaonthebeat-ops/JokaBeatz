import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  Drum, 
  Settings, 
  GraduationCap,
  Plug,
  BookOpen,
  Play
} from "lucide-react";
import { ProductSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getProductShareContent } from "@/lib/shareContent";
import { getProductUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  images: string[] | null;
  youtube_video_id: string | null;
  active: boolean;
}

const categoryIcons: Record<string, typeof Package> = {
  "Beat Pack": Package,
  "Beat Packs": Package,
  "Drum Kit": Drum,
  "Drum Kits": Drum,
  "Sample Pack": Package,
  "Loop Pack": Package,
  "Preset Pack": Settings,
  "Presets": Settings,
  "Plugins": Plug,
  "Courses": GraduationCap,
  "Other": Package,
};

const ProductDetail = () => {
  const { productId: slugOrId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (slugOrId) {
      fetchProduct();
    }
  }, [slugOrId]);

  const fetchProduct = async () => {
    try {
      // First try to find by slug
      let { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slugOrId)
        .eq("active", true)
        .maybeSingle();

      // If not found by slug, try by ID (backward compatibility)
      if (!data && !error) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(slugOrId || '')) {
          const result = await supabase
            .from("products")
            .select("*")
            .eq("id", slugOrId)
            .eq("active", true)
            .maybeSingle();
          data = result.data;
          error = result.error;
        }
      }

      if (error) throw error;
      setProduct(data);

      // Fetch related products from the same category
      if (data) {
        fetchRelatedProducts(data.category, data.id);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category: string, currentProductId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("category", category)
        .neq("id", currentProductId)
        .limit(4);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error) {
      console.error("Error fetching related products:", error);
      setRelatedProducts([]);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;
    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { productId: product.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const Icon = product ? (categoryIcons[product.category] || Package) : Package;
  const productUrl = product ? getProductUrl(product) : `/shop/${slugOrId}`;
  const fullProductUrl = product ? `https://jokabeatz.com${productUrl}` : "";
  const productShareContent = product 
    ? getProductShareContent(product.name, product.category, product.description)
    : { caption: "", hashtags: [] };

  if (loading) {
    return (
      <Layout path={productUrl}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout path={productUrl}>
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This product doesn't exist or is no longer available.
          </p>
          <Button asChild>
            <Link to="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout path={productUrl}>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Shop", url: "https://jokabeatz.com/shop" },
          { name: product.name, url: fullProductUrl },
        ]}
      />
      <ProductSchema
        name={product.name}
        description={product.description || ""}
        price={product.price}
        category={product.category}
        image={product.image_url || undefined}
        images={[product.image_url, ...((product.images as string[] | null) || [])].filter(Boolean) as string[]}
        sku={product.slug || product.id}
        url={fullProductUrl}
      />

      {/* Back Navigation */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/shop"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </div>

      {/* Product Content */}
      <section className="py-8 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Product Image */}
            <div className="relative">
              {(() => {
                const gallery = [product.image_url, ...(product.images || [])].filter(
                  (u): u is string => !!u
                );
                const main = activeImage || gallery[0] || null;
                return main ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(main)}
                      className="block w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border cursor-zoom-in"
                      aria-label="View full image"
                    >
                      <img
                        src={main}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                    {gallery.length > 1 && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {gallery.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setActiveImage(url)}
                            className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                              main === url ? "border-primary" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                    <Icon size={120} className="text-primary/50" />
                  </div>
                );
              })()}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <Badge variant="secondary" className="w-fit mb-4 text-primary">
                {product.category}
              </Badge>

              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                {product.name}
              </h1>

              <div className="text-4xl md:text-5xl font-black text-primary mb-6">
                ${product.price}
              </div>

              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 mb-6"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Buy Now
                  </>
                )}
              </Button>

              {/* Social Share */}
              <div className="border-t border-border pt-6">
                <p className="text-sm text-muted-foreground mb-3">Share this product:</p>
                <ShareButtons
                  title={`Check out ${product.name} by Joka Beatz!`}
                  path={productUrl}
                  caption={productShareContent.caption}
                  hashtags={productShareContent.hashtags}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          {product.description && (
            <div className="max-w-6xl mx-auto mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
              {/^\s*</.test(product.description) ? (
                <div
                  className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* YouTube Video Section */}
          {product.youtube_video_id && (() => {
            const raw = product.youtube_video_id.trim();
            const match = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
            const videoId = match ? match[1] : raw;
            return (
            <div className="max-w-6xl mx-auto mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Play className="h-6 w-6 text-primary" />
                Product Demo
              </h2>
              <div className="aspect-video rounded-lg overflow-hidden border border-border">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`${product.name} Demo Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
            );
          })()}

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="max-w-6xl mx-auto mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                More {product.category} Products
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct) => {
                  const RelatedIcon = categoryIcons[relatedProduct.category] || Package;
                  return (
                    <Link key={relatedProduct.id} to={getProductUrl(relatedProduct)}>
                      <Card className="bg-secondary border-border hover:border-primary transition-all card-lift h-full overflow-hidden">
                        {relatedProduct.image_url ? (
                          <div className="aspect-square w-full overflow-hidden bg-muted">
                            <img
                              src={relatedProduct.image_url}
                              alt={relatedProduct.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square w-full bg-primary/10 flex items-center justify-center">
                            <RelatedIcon size={48} className="text-primary/50" />
                          </div>
                        )}
                        <CardHeader className="text-center p-4">
                          <CardTitle className="text-sm font-bold text-foreground line-clamp-2">
                            {relatedProduct.name}
                          </CardTitle>
                          <div className="text-lg font-black text-primary mt-1">
                            ${relatedProduct.price}
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0 shadow-none">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt={product?.name || "Product image"}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductDetail;
