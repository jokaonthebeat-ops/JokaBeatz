import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

const PaymentCanceled = () => {
  return (
    <Layout>
      <section className="py-32 bg-background min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto mb-8 p-6 bg-secondary rounded-full w-fit">
              <XCircle size={64} className="text-muted-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Payment Canceled
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              No worries! Your payment was not processed. Feel free to try again or reach out if you need help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                <Link to="/shop">
                  <ArrowLeft className="mr-2" size={20} />
                  Back to Shop
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background"
              >
                <Link to="/contact">
                  <MessageCircle className="mr-2" size={20} />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentCanceled;
