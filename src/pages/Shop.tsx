import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Drum, Settings, GraduationCap, ShoppingCart, Plug, BookOpen, Eye } from "lucide-react";
import { ProductSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { getProductUrl } from "@/lib/utils";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
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

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: Product) => {
    setPurchasingId(product.id);
    
    try {
      // Only send productId - price is validated server-side for security
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          productId: product.id,
        },
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
      setPurchasingId(null);
    }
  };

  const shopShareContent = getPageShareContent("shop");

  return (
    <Layout
      path="/shop"
      seoTitle="Beat Packs, Drum Kits & VST Plugins | Joka Beatz Shop"
      seoDescription="Shop Joka Beatz producer tools: drum kits, sample packs, VST plugins and beat packs. Instant download, studio-quality sounds for hip hop, trap and R&B."
      seoKeywords="drum kits, sample packs, vst plugins, beat packs, producer kits, 808 kits, music production tools"
    >
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Shop", url: "https://jokabeatz.com/shop" },
        ]} 
      />
      
      {/* Product Schemas */}
      {products.map((product) => (
        <ProductSchema
          key={product.id}
          name={product.name}
          description={product.description || ""}
          price={product.price}
          category={product.category}
          image={product.image_url || undefined}
          sku={product.slug || product.id}
          url={`https://jokabeatz.com${getProductUrl(product)}`}
        />
      ))}

      {/* Header */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            Producer Shop
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Premium digital products to level up your production game.
          </p>
          <div className="mt-6">
            <ShareButtons 
              title="Producer Shop | Joka Beatz" 
              path="/shop"
              caption={shopShareContent.caption}
              hashtags={shopShareContent.hashtags}
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                Premium beat packs, drum kits, and production tools will be available shortly. 
                Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {products.map((product) => {
                const Icon = categoryIcons[product.category] || Package;
                return (
                  <Card
                    key={product.id}
                    id={product.id}
                    className="bg-secondary border-border hover:border-primary transition-all card-lift flex flex-col overflow-hidden"
                  >
                    <Link to={getProductUrl(product)} className="block">
                      {product.image_url ? (
                        <div className="aspect-square w-full overflow-hidden bg-muted">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full bg-primary/10 flex items-center justify-center">
                          <Icon size={64} className="text-primary/50" />
                        </div>
                      )}
                      <CardHeader className="text-center pb-2 p-4 md:p-6 pt-4">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                          {product.category}
                        </div>
                        <CardTitle className="text-base md:text-lg font-bold text-foreground line-clamp-2">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 p-4 md:p-6 pt-0 md:pt-0">
                        <CardDescription className="text-muted-foreground text-xs md:text-sm text-center line-clamp-3">
                          {product.description}
                        </CardDescription>
                      </CardContent>
                    </Link>
                    <CardFooter className="flex flex-col gap-3 md:gap-4 pt-0 p-4 md:p-6">
                      <div className="text-xl md:text-2xl font-black text-primary">
                        ${product.price}
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 border-border hover:border-primary min-h-[48px]"
                        >
                          <Link to={getProductUrl(product)}>
                            <Eye className="mr-2" size={18} />
                            View
                          </Link>
                        </Button>
                        <Button
                          onClick={() => handlePurchase(product)}
                          disabled={purchasingId === product.id}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[48px]"
                        >
                          {purchasingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="mr-2" size={18} />
                              Buy
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
