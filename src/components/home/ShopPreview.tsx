import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Drum, Settings, GraduationCap, Plug, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getProductUrl } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  image_url: string | null;
  price: number;
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

// Static fallback items when no products exist
const fallbackItems = [
  { icon: Package, title: "Beat Packs" },
  { icon: Drum, title: "Drum Kits" },
  { icon: Settings, title: "Presets" },
  { icon: GraduationCap, title: "Courses" },
];

export const ShopPreview = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, image_url, price")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated grid pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_hsl(0_0%_100%_/_0.02)_1px,_transparent_1px),linear-gradient(to_bottom,_hsl(0_0%_100%_/_0.02)_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Scanning line effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-line" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/20" />

      {/* Floating icon particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        <Package className="absolute top-1/4 left-10 w-8 h-8 text-primary animate-float-particle" />
        <Drum className="absolute top-1/3 right-20 w-6 h-6 text-primary animate-float-particle-delayed" />
        <Settings className="absolute bottom-1/4 left-1/4 w-7 h-7 text-primary animate-float-particle-slow" />
        <GraduationCap className="absolute bottom-1/3 right-1/3 w-6 h-6 text-primary animate-float-particle" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Digital Products
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length > 0 ? (
          // Show real products from database
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
            {products.map((product) => {
              const Icon = categoryIcons[product.category] || Package;
              return (
                <Link key={product.id} to={getProductUrl(product)}>
                  <Card className="bg-card border-border hover:border-primary transition-all card-lift h-full backdrop-blur-sm overflow-hidden">
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
                        <Icon size={48} className="text-primary/50" />
                      </div>
                    )}
                    <CardHeader className="text-center p-4">
                      <CardTitle className="text-sm font-bold text-foreground line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <div className="text-lg font-black text-primary mt-1">
                        ${product.price}
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          // Show category placeholders when no products
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
            {fallbackItems.map((item, index) => (
              <Link key={index} to="/shop">
                <Card className="bg-card border-border hover:border-primary transition-all card-lift h-full backdrop-blur-sm">
                  <CardHeader className="text-center p-6">
                    <div className="mx-auto mb-3 p-4 bg-primary/10 rounded-lg w-fit relative group">
                      <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <item.icon size={28} className="text-primary relative z-10" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-foreground text-foreground hover:bg-foreground hover:text-background font-bold"
          >
            <Link to="/shop">Visit Shop</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
