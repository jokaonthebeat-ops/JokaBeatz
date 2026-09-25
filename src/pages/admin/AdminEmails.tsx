import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Send, Users, FileText, Eye, FlaskConical, Sparkles, BarChart3, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import EmailTemplateCard from "@/components/admin/EmailTemplateCard";
import EmailPreviewModal from "@/components/admin/EmailPreviewModal";
import TestEmailModal from "@/components/admin/TestEmailModal";
import GenerateVariationModal from "@/components/admin/GenerateVariationModal";
import CampaignAnalytics from "@/components/admin/CampaignAnalytics";
import SenderDomainSelect from "@/components/admin/SenderDomainSelect";
import { useSenderDomains } from "@/hooks/useSenderDomains";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  recipient_type: string;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_bounced: number;
  unique_opens: number;
  unique_clicks: number;
}

const AdminEmails = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [beatDetails, setBeatDetails] = useState("");
  const [recipientType, setRecipientType] = useState<string>("");
  const [selectedSenderId, setSelectedSenderId] = useState<string>("");
  const [composerMode, setComposerMode] = useState<"template" | "custom">("template");

  // Sender domains
  const { data: senderDomains } = useSenderDomains();

  // Modal states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [variationTemplate, setVariationTemplate] = useState<EmailTemplate | null>(null);

  // Templates
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setContent(template.content);
    setSelectedTemplate(template);
    setComposerMode("custom"); // Switch to composer view after selecting
    toast({
      title: "Template loaded",
      description: `"${template.name}" template is ready to customize.`,
    });
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handlePreviewComposer = () => {
    setPreviewTemplate(null);
    setPreviewOpen(true);
  };

  const handleGenerateVariation = (template: EmailTemplate) => {
    setVariationTemplate(template);
    setVariationModalOpen(true);
  };

  const handleUseVariation = (subject: string, content: string) => {
    setSubject(subject);
    setContent(content);
    setComposerMode("custom");
    toast({
      title: "Variation applied",
      description: "AI-generated variation loaded into composer.",
    });
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !content.trim() || !recipientType || !selectedSenderId) {
      toast({
        title: "Error",
        description: "Please fill in all fields including sender.",
        variant: "destructive",
      });
      return;
    }

    // Get the selected sender domain info
    const selectedSender = senderDomains?.find(d => d.id === selectedSenderId);
    if (!selectedSender) {
      toast({
        title: "Error",
        description: "Please select a valid sender domain.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-email-campaign", {
        body: {
          subject,
          content,
          beatDetails,
          recipientType,
          senderEmail: selectedSender.email,
          senderName: selectedSender.name,
        },
      });

      if (error) throw error;

      toast({
        title: "Campaign sent!",
        description: `Successfully sent to ${data.recipientCount} recipients.`,
      });

      // Reset form
      setSubject("");
      setContent("");
      setBeatDetails("");
      setRecipientType("");
      setSelectedTemplate(null);
      // Keep sender selection for convenience

      // Refresh campaigns
      fetchCampaigns();
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send email campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      free_beats: "Free Beat Leads",
      newsletter: "Newsletter",
      both: "All Leads",
    };
    return <Badge variant="secondary">{labels[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
        <p className="text-muted-foreground">Send emails to your leads and subscribers</p>
      </div>


      {/* Compose Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </CardTitle>
          <CardDescription>Choose a template or write a custom email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={composerMode} onValueChange={(v) => setComposerMode(v as "template" | "custom")}>
            <TabsList className="grid w-full max-w-[300px] grid-cols-2">
              <TabsTrigger value="template" className="text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-sm">
                <Mail className="h-4 w-4 mr-2" />
                Compose
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-6">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {templates.map((template) => (
                    <EmailTemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                      onPreview={handlePreviewTemplate}
                      onGenerateVariation={handleGenerateVariation}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-6 space-y-4">
              {selectedTemplate && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                      Template
                    </Badge>
                    <span className="text-sm text-foreground">{selectedTemplate.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setSubject("");
                      setContent("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Sender Domain Selection */}
              <SenderDomainSelect value={selectedSenderId} onChange={setSelectedSenderId} />

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipients</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_beats">Free Beat Leads</SelectItem>
                    <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                    <SelectItem value="both">All Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beat-details">
                  New Beat Types <span className="text-muted-foreground text-xs">(replaces {"{{beat_details}}"} in template)</span>
                </Label>
                <Input
                  id="beat-details"
                  value={beatDetails}
                  onChange={(e) => setBeatDetails(e.target.value)}
                  placeholder="e.g. 3 new trap beats, 2 R&B instrumentals, 1 lo-fi vibe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {selectedTemplate ? "Email Content (HTML)" : "Message"}
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={selectedTemplate ? "Edit the HTML template content..." : "Write your email message here..."}
                  rows={selectedTemplate ? 16 : 8}
                  className={selectedTemplate ? "font-mono text-xs" : ""}
                />
                {selectedTemplate && (
                  <p className="text-xs text-muted-foreground">
                    Placeholders: {"{{site_url}}"}, {"{{email}}"}, {"{{beat_details}}"}, {"{{custom_content}}"}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreviewComposer}
                  disabled={!content.trim()}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTestEmailOpen(true)}
                  disabled={!subject.trim() || !content.trim()}
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Send Test
                </Button>
                <Button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Campaign
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
          <CardDescription>Previously sent email campaigns</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground">Your sent campaigns will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <Collapsible
                  key={campaign.id}
                  open={expandedCampaign === campaign.id}
                  onOpenChange={(open) => setExpandedCampaign(open ? campaign.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {campaign.sent_at
                            ? new Date(campaign.sent_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{campaign.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getRecipientTypeBadge(campaign.recipient_type)}
                            <span className="text-xs text-muted-foreground">
                              {campaign.recipient_count} recipients
                            </span>
                          </div>
                        </div>
                        {/* Quick stats */}
                        <div className="hidden md:flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            <span>
                              {campaign.emails_delivered > 0
                                ? `${((campaign.unique_opens / campaign.emails_delivered) * 100).toFixed(0)}%`
                                : "0%"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>
                              {campaign.unique_opens > 0
                                ? `${((campaign.unique_clicks / campaign.unique_opens) * 100).toFixed(0)}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {expandedCampaign === campaign.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 bg-muted/30 space-y-4">
                      <CampaignAnalytics
                        emailsSent={campaign.emails_sent || 0}
                        emailsDelivered={campaign.emails_delivered || 0}
                        emailsOpened={campaign.emails_opened || 0}
                        emailsClicked={campaign.emails_clicked || 0}
                        emailsBounced={campaign.emails_bounced || 0}
                        uniqueOpens={campaign.unique_opens || 0}
                        uniqueClicks={campaign.unique_clicks || 0}
                      />
                      <div className="flex justify-end">
                        <Link to={`/admin/emails/${campaign.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Detailed Analytics
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EmailPreviewModal
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewTemplate(null);
        }}
        subject={previewTemplate?.subject || subject}
        content={previewTemplate?.content || content}
        onUseTemplate={previewTemplate ? () => handleSelectTemplate(previewTemplate) : undefined}
      />

      <TestEmailModal
        open={testEmailOpen}
        onOpenChange={setTestEmailOpen}
        subject={subject}
        content={content}
        senderEmail={senderDomains?.find(d => d.id === selectedSenderId)?.email}
        senderName={senderDomains?.find(d => d.id === selectedSenderId)?.name}
      />

      <GenerateVariationModal
        open={variationModalOpen}
        onOpenChange={setVariationModalOpen}
        template={variationTemplate}
        onUseVariation={handleUseVariation}
      />
    </div>
  );
};

export default AdminEmails;
