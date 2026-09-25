import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useEmailSequence,
  useEmailSequenceSteps,
  useCreateSequenceStep,
  useUpdateSequenceStep,
  useDeleteSequenceStep,
  useSequenceEnrollments,
  useDeleteSequenceEnrollment,
} from "@/hooks/useEmailSequences";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useSenderDomains } from "@/hooks/useSenderDomains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Clock, Mail, GripVertical, Edit, BarChart3, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SequenceAnalytics from "@/components/admin/SequenceAnalytics";
import EmailPreviewModal from "@/components/admin/EmailPreviewModal";
import TestEmailModal from "@/components/admin/TestEmailModal";

export default function AdminSequenceDetail() {
  const { sequenceId } = useParams<{ sequenceId: string }>();
  const navigate = useNavigate();
  
  const { data: sequence, isLoading: isLoadingSequence } = useEmailSequence(sequenceId!);
  const { data: steps, isLoading: isLoadingSteps } = useEmailSequenceSteps(sequenceId!);
  const { data: enrollments } = useSequenceEnrollments(sequenceId!);
  const { data: templates } = useEmailTemplates();
  const { data: senderDomains } = useSenderDomains();
  
  const createStep = useCreateSequenceStep();
  const updateStep = useUpdateSequenceStep();
  const deleteStep = useDeleteSequenceStep();
  const deleteEnrollment = useDeleteSequenceEnrollment();

  const defaultSender = senderDomains?.find(s => s.is_default) || senderDomains?.[0];

  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState<{ subject: string; content: string } | null>(null);
  const [testEmailStep, setTestEmailStep] = useState<{ subject: string; content: string } | null>(null);
  const [stepForm, setStepForm] = useState({
    delay_hours: 24,
    subject: "",
    content: "",
    template_id: "",
  });

  const handleAddStep = async () => {
    if (!stepForm.subject.trim() || !stepForm.content.trim()) {
      toast.error("Please fill in subject and content");
      return;
    }

    try {
      const nextOrder = (steps?.length || 0) + 1;
      await createStep.mutateAsync({
        sequence_id: sequenceId!,
        step_order: nextOrder,
        delay_hours: stepForm.delay_hours,
        subject: stepForm.subject,
        content: stepForm.content,
        template_id: stepForm.template_id || null,
      });
      toast.success("Step added successfully");
      setIsAddStepOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to add step");
    }
  };

  const handleUpdateStep = async (stepId: string) => {
    try {
      await updateStep.mutateAsync({
        id: stepId,
        delay_hours: stepForm.delay_hours,
        subject: stepForm.subject,
        content: stepForm.content,
        template_id: stepForm.template_id || null,
      });
      toast.success("Step updated successfully");
      setEditingStep(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update step");
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Delete this step?")) return;
    
    try {
      await deleteStep.mutateAsync({ id: stepId, sequenceId: sequenceId! });
      toast.success("Step deleted");
    } catch (error) {
      toast.error("Failed to delete step");
    }
  };

  const resetForm = () => {
    setStepForm({ delay_hours: 24, subject: "", content: "", template_id: "" });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setStepForm({
        ...stepForm,
        template_id: templateId,
        subject: template.subject,
        content: template.content,
      });
    }
  };

  const openEditStep = (step: typeof steps extends (infer T)[] ? T : never) => {
    setEditingStep(step.id);
    setStepForm({
      delay_hours: step.delay_hours,
      subject: step.subject,
      content: step.content,
      template_id: step.template_id || "",
    });
  };

  if (isLoadingSequence || isLoadingSteps) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Sequence not found</h2>
        <Button variant="link" onClick={() => navigate("/admin/sequences")}>
          Back to Sequences
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/sequences")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{sequence.name}</h1>
          {sequence.description && (
            <p className="text-muted-foreground">{sequence.description}</p>
          )}
        </div>
        <Badge variant={sequence.is_active ? "default" : "secondary"} className="ml-auto">
          {sequence.is_active ? "Active" : "Paused"}
        </Badge>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="steps">Steps ({steps?.length || 0})</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments ({enrollments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SequenceAnalytics 
            sequenceId={sequenceId!} 
            steps={steps?.map(s => ({ id: s.id, step_order: s.step_order, subject: s.subject })) || []} 
          />
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddStepOpen} onOpenChange={(open) => {
              setIsAddStepOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Sequence Step</DialogTitle>
                  <DialogDescription>
                    Configure the email that will be sent at this step.
                  </DialogDescription>
                </DialogHeader>
                <StepForm
                  form={stepForm}
                  setForm={setStepForm}
                  templates={templates || []}
                  onTemplateSelect={handleTemplateSelect}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewStep({ subject: stepForm.subject, content: stepForm.content })}
                    disabled={!stepForm.content}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={handleAddStep} disabled={createStep.isPending}>
                    Add Step
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {steps?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No steps yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Add your first step to define the emails in this sequence.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {steps?.map((step, index) => (
                <Card key={step.id}>
                  <CardContent className="p-4">
                    {editingStep === step.id ? (
                      <div className="space-y-4">
                        <StepForm
                          form={stepForm}
                          setForm={setStepForm}
                          templates={templates || []}
                          onTemplateSelect={handleTemplateSelect}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => {
                            setEditingStep(null);
                            resetForm();
                          }}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleUpdateStep(step.id)} disabled={updateStep.isPending}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="h-5 w-5" />
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {step.delay_hours}h after trigger
                            </span>
                          </div>
                          <h4 className="font-medium truncate">{step.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {step.content.replace(/<[^>]*>/g, "").slice(0, 150)}...
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewStep({ subject: step.subject, content: step.content })}
                            title="Preview email"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTestEmailStep({ subject: step.subject, content: step.content })}
                            title="Send test email"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditStep(step)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Recipients</CardTitle>
              <CardDescription>
                Recipients currently enrolled in this sequence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recipients enrolled yet. Recipients will be enrolled when you attach this sequence to a campaign.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Next Send</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments?.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.recipient_email}</TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{enrollment.current_step}/{steps?.length || 0}</TableCell>
                        <TableCell>{format(new Date(enrollment.enrolled_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell>
                          {enrollment.next_send_at
                            ? format(new Date(enrollment.next_send_at), "MMM d, HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Remove ${enrollment.recipient_email} from this sequence?`)) {
                                deleteEnrollment.mutate(
                                  { id: enrollment.id, sequenceId: sequenceId! },
                                  {
                                    onSuccess: () => toast.success("Recipient removed"),
                                    onError: () => toast.error("Failed to remove recipient"),
                                  }
                                );
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmailPreviewModal
        open={!!previewStep}
        onOpenChange={(open) => !open && setPreviewStep(null)}
        subject={previewStep?.subject || ""}
        content={previewStep?.content || ""}
      />

      <TestEmailModal
        open={!!testEmailStep}
        onOpenChange={(open) => !open && setTestEmailStep(null)}
        subject={testEmailStep?.subject || ""}
        content={testEmailStep?.content || ""}
        senderEmail={defaultSender?.email}
        senderName={defaultSender?.name}
      />
    </div>
  );
}

interface StepFormState {
  delay_hours: number;
  subject: string;
  content: string;
  template_id: string;
}

interface StepFormProps {
  form: StepFormState;
  setForm: React.Dispatch<React.SetStateAction<StepFormState>>;
  templates: Array<{ id: string; name: string; subject: string; content: string }>;
  onTemplateSelect: (templateId: string) => void;
}

function StepForm({ form, setForm, templates, onTemplateSelect }: StepFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="delay">Delay (hours)</Label>
          <Input
            id="delay"
            type="number"
            min={1}
            value={form.delay_hours}
            onChange={(e) => setForm({ ...form, delay_hours: parseInt(e.target.value) || 24 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template">Use Template (optional)</Label>
          <Select value={form.template_id} onValueChange={onTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="Follow-up on your free beats..."
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content (HTML)</Label>
        <Textarea
          id="content"
          rows={8}
          placeholder="<html>..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      </div>
    </div>
  );
}
