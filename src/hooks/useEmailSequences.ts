import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: "opened_not_clicked" | "not_opened" | "clicked" | "all_recipients";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  delay_hours: number;
  subject: string;
  content: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceEnrollment {
  id: string;
  sequence_id: string;
  campaign_id: string;
  recipient_email: string;
  current_step: number;
  status: "active" | "completed" | "unsubscribed" | "paused";
  enrolled_at: string;
  next_send_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailSequenceLog {
  id: string;
  enrollment_id: string;
  step_id: string;
  sent_at: string;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";
  created_at: string;
}

export const useEmailSequences = () => {
  return useQuery({
    queryKey: ["email-sequences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EmailSequence[];
    },
  });
};

export const useEmailSequence = (sequenceId: string) => {
  return useQuery({
    queryKey: ["email-sequence", sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequences")
        .select("*")
        .eq("id", sequenceId)
        .single();

      if (error) throw error;
      return data as EmailSequence;
    },
    enabled: !!sequenceId,
  });
};

export const useEmailSequenceSteps = (sequenceId: string) => {
  return useQuery({
    queryKey: ["email-sequence-steps", sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", sequenceId)
        .order("step_order", { ascending: true });

      if (error) throw error;
      return data as EmailSequenceStep[];
    },
    enabled: !!sequenceId,
  });
};

export const useSequenceEnrollments = (sequenceId: string) => {
  return useQuery({
    queryKey: ["sequence-enrollments", sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sequence_enrollments")
        .select("*")
        .eq("sequence_id", sequenceId)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data as EmailSequenceEnrollment[];
    },
    enabled: !!sequenceId,
  });
};

export const useCreateEmailSequence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sequence: Omit<EmailSequence, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("email_sequences")
        .insert(sequence)
        .select()
        .single();

      if (error) throw error;
      return data as EmailSequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
    },
  });
};

export const useUpdateEmailSequence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailSequence> & { id: string }) => {
      const { data, error } = await supabase
        .from("email_sequences")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailSequence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
      queryClient.invalidateQueries({ queryKey: ["email-sequence", data.id] });
    },
  });
};

export const useDeleteEmailSequence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_sequences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sequences"] });
    },
  });
};

export const useCreateSequenceStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: Omit<EmailSequenceStep, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .insert(step)
        .select()
        .single();

      if (error) throw error;
      return data as EmailSequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-sequence-steps", data.sequence_id] });
    },
  });
};

export const useUpdateSequenceStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailSequenceStep> & { id: string }) => {
      const { data, error } = await supabase
        .from("email_sequence_steps")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EmailSequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-sequence-steps", data.sequence_id] });
    },
  });
};

export const useDeleteSequenceStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequenceId }: { id: string; sequenceId: string }) => {
      const { error } = await supabase.from("email_sequence_steps").delete().eq("id", id);
      if (error) throw error;
      return { sequenceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-sequence-steps", data.sequenceId] });
    },
  });
};

export const useDeleteSequenceEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequenceId }: { id: string; sequenceId: string }) => {
      const { error } = await supabase.from("email_sequence_enrollments").delete().eq("id", id);
      if (error) throw error;
      return { sequenceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sequence-enrollments", data.sequenceId] });
    },
  });
};
