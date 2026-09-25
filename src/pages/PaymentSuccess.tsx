import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductFile {
  file_name: string;
  file_path: string;
}

interface OrderDetails {
  id: string;
  amount: number;
  products: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useAuth();

  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        setVerified(true); // Show success even without session for direct navigation
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
        });

        if (error) throw error;

        if (data.success) {
          setVerified(true);
          setOrder(data.order);
          setProductFiles(data.productFiles || []);
        } else {
          setError(data.error || "Payment verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Failed to verify payment. Please contact support.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <Layout>
        <section className="py-32 bg-background min-h-[80vh] flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground">Verifying your payment...</h1>
              <p className="text-muted-foreground mt-2">Please wait a moment.</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="py-32 bg-background min-h-[80vh] flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="mx-auto mb-8 p-6 bg-destructive/10 rounded-full w-fit">
                <CheckCircle size={64} className="text-destructive" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-4">Verification Issue</h1>
              <p className="text-lg text-muted-foreground mb-8">{error}</p>
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-32 bg-background min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto mb-8 p-6 bg-primary/10 rounded-full w-fit">
                <CheckCircle size={64} className="text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                Payment Successful!
              </h1>
              <p className="text-lg text-muted-foreground">
                Thank you for your purchase.
              </p>
            </div>

            {order && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Order ID: {order.id.slice(0, 8)}...</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium">{order.products?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">${Number(order.amount).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {productFiles.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Your Downloads
                  </CardTitle>
                  <CardDescription>Click below to download your files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productFiles.map((file, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between"
                      asChild
                    >
                      <a href={file.file_path} target="_blank" rel="noopener noreferrer">
                        <span>{file.file_name}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user && (
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  <Link to="/dashboard">
                    <Download className="mr-2" size={20} />
                    Go to Dashboard
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
              >
                <Link to="/shop">
                  <ArrowLeft className="mr-2" size={20} />
                  Back to Shop
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-8 text-center">
              Questions? <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
