import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServicePaymentData {
  serviceType: string;
  customerName: string;
  customerEmail: string;
  projectNotes?: string;
  fileUrls?: string[];
  additionalData?: Record<string, unknown>;
}

export const useServicePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createPayment = async (data: ServicePaymentData) => {
    setIsProcessing(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "create-service-payment",
        {
          body: data,
        }
      );

      if (error) {
        throw error;
      }

      if (result?.url) {
        // Open Stripe checkout in a new tab
        window.open(result.url, "_blank");
        return result;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to process payment. Please try again.");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createPayment,
    isProcessing,
  };
};
