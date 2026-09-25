import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmailSequences } from "@/hooks/useEmailSequences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Send, CheckCircle, Eye, MousePointerClick, AlertTriangle, Clock, User, Workflow } from "lucide-react";
import { toast } from "sonner";
import CampaignAnalytics from "@/components/admin/CampaignAnalytics";
import CampaignEngagementChart from "@/components/admin/CampaignEngagementChart";

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

interface TrackingEvent {
  id: string;
  campaign_id: string | null;
  recipient_email: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

interface RecipientEngagement {
  email: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  openCount: number;
  clickCount: number;
  lastActivity: string;
  clickedLinks: string[];
}

const AdminCampaignDetail = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  
  const { data: sequences } = useEmailSequences();

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch tracking events
      const { data: eventData, error: eventError } = await supabase
        .from("email_tracking_events")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });

      if (eventError) throw eventError;
      // Cast the event_data to our expected type
      const typedEvents: TrackingEvent[] = (eventData || []).map((e) => ({
        ...e,
        event_data: e.event_data as Record<string, unknown> | null,
      }));
      setEvents(typedEvents);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process events into recipient-level engagement data
  const getRecipientEngagement = (): RecipientEngagement[] => {
    const engagementMap = new Map<string, RecipientEngagement>();

    events.forEach((event) => {
      const email = event.recipient_email;
      if (!engagementMap.has(email)) {
        engagementMap.set(email, {
          email,
          delivered: false,
          opened: false,
          clicked: false,
          bounced: false,
          openCount: 0,
          clickCount: 0,
          lastActivity: event.created_at,
          clickedLinks: [],
        });
      }

      const engagement = engagementMap.get(email)!;
      engagement.lastActivity = event.created_at;

      switch (event.event_type) {
        case "delivered":
          engagement.delivered = true;
          break;
        case "opened":
          engagement.opened = true;
          engagement.openCount++;
          break;
        case "clicked":
          engagement.clicked = true;
          engagement.clickCount++;
          const clickLink = event.event_data?.click_link;
          if (typeof clickLink === "string") {
            engagement.clickedLinks.push(clickLink);
          }
          break;
        case "bounced":
          engagement.bounced = true;
          break;
      }
    });

    return Array.from(engagementMap.values()).sort((a, b) => {
      // Sort by engagement level: clicked > opened > delivered > bounced
      if (a.clicked !== b.clicked) return a.clicked ? -1 : 1;
      if (a.opened !== b.opened) return a.opened ? -1 : 1;
      if (a.delivered !== b.delivered) return a.delivered ? -1 : 1;
      return 0;
    });
  };

  // Process events into time-series data for chart
  const getTimeSeriesData = () => {
    const timeMap = new Map<string, { opens: number; clicks: number }>();

    events
      .filter((e) => e.event_type === "opened" || e.event_type === "clicked")
      .forEach((event) => {
        const date = new Date(event.created_at);
        const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;

        if (!timeMap.has(hourKey)) {
          timeMap.set(hourKey, { opens: 0, clicks: 0 });
        }

        const entry = timeMap.get(hourKey)!;
        if (event.event_type === "opened") {
          entry.opens++;
        } else if (event.event_type === "clicked") {
          entry.clicks++;
        }
      });

    return Array.from(timeMap.entries())
      .map(([time, data]) => ({
        time,
        opens: data.opens,
        clicks: data.clicks,
      }))
      .sort((a, b) => {
        // Parse time for sorting
        const [dateA, hourA] = a.time.split(" ");
        const [dateB, hourB] = b.time.split(" ");
        return dateA.localeCompare(dateB) || hourA.localeCompare(hourB);
      });
  };

  const getRecipientTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      free_beats: "Free Beat Leads",
      newsletter: "Newsletter",
      both: "All Leads",
    };
    return <Badge variant="secondary">{labels[type] || type}</Badge>;
  };

  const handleEnrollSequence = async () => {
    if (!selectedSequence || !campaignId) return;
    
    setIsEnrolling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("enroll-sequence-recipients", {
        body: { campaignId, sequenceId: selectedSequence },
      });

      if (response.error) throw response.error;
      
      const result = response.data;
      if (result.enrolled > 0) {
        toast.success(`Enrolled ${result.enrolled} recipients into sequence`);
      } else {
        toast.info("No new eligible recipients found for this sequence");
      }
      setSelectedSequence("");
    } catch (error) {
      console.error("Error enrolling sequence:", error);
      toast.error("Failed to enroll recipients");
    } finally {
      setIsEnrolling(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "delivered":
        return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
      case "opened":
        return <Eye className="h-3.5 w-3.5 text-purple-400" />;
      case "clicked":
        return <MousePointerClick className="h-3.5 w-3.5 text-orange-400" />;
      case "bounced":
        return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <Send className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold text-foreground mb-2">Campaign not found</h2>
        <Link to="/admin/emails">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const recipientEngagement = getRecipientEngagement();
  const timeSeriesData = getTimeSeriesData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/emails"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{campaign.subject}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getRecipientTypeBadge(campaign.recipient_type)}
            <span className="text-sm text-muted-foreground">
              Sent {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "—"}
            </span>
            <span className="text-sm text-muted-foreground">
              • {campaign.recipient_count} recipients
            </span>
          </div>
        </div>

        {/* Sequence Enrollment */}
        {sequences && sequences.filter((s) => s.is_active).length > 0 && (
          <Card className="p-4 lg:w-80">
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Enroll in Sequence</span>
            </div>
            <div className="flex gap-2">
              <Select value={selectedSequence} onValueChange={setSelectedSequence}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select sequence..." />
                </SelectTrigger>
                <SelectContent>
                  {sequences
                    .filter((s) => s.is_active)
                    .map((seq) => (
                      <SelectItem key={seq.id} value={seq.id}>
                        {seq.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleEnrollSequence}
                disabled={!selectedSequence || isEnrolling}
                size="sm"
              >
                {isEnrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
              </Button>
            </div>
          </Card>
        )}
      </div>


      {/* Overall Analytics */}
      <CampaignAnalytics
        emailsSent={campaign.emails_sent || 0}
        emailsDelivered={campaign.emails_delivered || 0}
        emailsOpened={campaign.emails_opened || 0}
        emailsClicked={campaign.emails_clicked || 0}
        emailsBounced={campaign.emails_bounced || 0}
        uniqueOpens={campaign.unique_opens || 0}
        uniqueClicks={campaign.unique_clicks || 0}
      />

      {/* Engagement Over Time Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Engagement Over Time
            </CardTitle>
            <CardDescription>Opens and clicks by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <CampaignEngagementChart data={timeSeriesData} />
          </CardContent>
        </Card>
      )}

      {/* Recipient-Level Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Recipient Engagement
          </CardTitle>
          <CardDescription>
            Individual recipient activity ({recipientEngagement.length} recipients tracked)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recipientEngagement.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No engagement data yet</p>
              <p className="text-sm">Events will appear as recipients interact with the email</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="text-center">Delivered</TableHead>
                    <TableHead className="text-center">Opened</TableHead>
                    <TableHead className="text-center">Clicked</TableHead>
                    <TableHead className="text-center">Bounced</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipientEngagement.slice(0, 100).map((recipient) => (
                    <TableRow key={recipient.email}>
                      <TableCell className="font-medium">{recipient.email}</TableCell>
                      <TableCell className="text-center">
                        {recipient.delivered ? (
                          <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {recipient.opened ? (
                          <Eye className="h-4 w-4 text-purple-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {recipient.clicked ? (
                          <MousePointerClick className="h-4 w-4 text-orange-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {recipient.bounced ? (
                          <AlertTriangle className="h-4 w-4 text-red-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {recipient.openCount > 0 ? (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                            {recipient.openCount}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {recipient.clickCount > 0 ? (
                          <Badge variant="secondary" className="bg-orange-500/10 text-orange-400">
                            {recipient.clickCount}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(recipient.lastActivity).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {recipientEngagement.length > 100 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                  Showing first 100 of {recipientEngagement.length} recipients
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Real-time activity feed (last 50 events)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {events
                .slice(-50)
                .reverse()
                .map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.recipient_email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {event.event_type}
                        {typeof event.event_data?.click_link === "string" && (
                          <span className="ml-1">
                            • {(() => {
                              try {
                                return new URL(event.event_data.click_link as string).pathname;
                              } catch {
                                return event.event_data.click_link;
                              }
                            })()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCampaignDetail;
