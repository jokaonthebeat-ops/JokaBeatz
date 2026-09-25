import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Send, CheckCircle, Eye, MousePointerClick, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StepAnalytics {
  step_id: string;
  step_order: number;
  subject: string;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  unique_opens: number;
  unique_clicks: number;
}

interface SequenceAnalyticsProps {
  sequenceId: string;
  steps: Array<{ id: string; step_order: number; subject: string }>;
}

export default function SequenceAnalytics({ sequenceId, steps }: SequenceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<StepAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalEnrollments: 0,
    completedEnrollments: 0,
    activeEnrollments: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // Fetch enrollment counts
        const { data: enrollments } = await supabase
          .from("email_sequence_enrollments")
          .select("id, status, current_step")
          .eq("sequence_id", sequenceId);
        
        const totalEnrollments = enrollments?.length || 0;
        const completedEnrollments = enrollments?.filter(e => e.status === "completed").length || 0;
        const activeEnrollments = enrollments?.filter(e => e.status === "active").length || 0;
        
        setTotals({ totalEnrollments, completedEnrollments, activeEnrollments });

        // Fetch step-level analytics from sequence logs
        const { data: logs } = await supabase
          .from("email_sequence_logs")
          .select("step_id, status, delivered_at, opened_at, clicked_at, bounced_at, open_count, click_count")
          .in("step_id", steps.map(s => s.id));
        
        // Aggregate by step
        const stepAnalyticsMap = new Map<string, StepAnalytics>();
        
        steps.forEach(step => {
          stepAnalyticsMap.set(step.id, {
            step_id: step.id,
            step_order: step.step_order,
            subject: step.subject,
            total_sent: 0,
            total_delivered: 0,
            total_opened: 0,
            total_clicked: 0,
            total_bounced: 0,
            unique_opens: 0,
            unique_clicks: 0,
          });
        });
        
        logs?.forEach(log => {
          const stepData = stepAnalyticsMap.get(log.step_id);
          if (stepData) {
            stepData.total_sent++;
            if (log.delivered_at) stepData.total_delivered++;
            if (log.opened_at) {
              stepData.unique_opens++;
              stepData.total_opened += log.open_count || 1;
            }
            if (log.clicked_at) {
              stepData.unique_clicks++;
              stepData.total_clicked += log.click_count || 1;
            }
            if (log.bounced_at) stepData.total_bounced++;
          }
        });
        
        setAnalytics(Array.from(stepAnalyticsMap.values()).sort((a, b) => a.step_order - b.step_order));
      } catch (error) {
        console.error("Error fetching sequence analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (steps.length > 0) {
      fetchAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [sequenceId, steps]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No steps to analyze</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            Add steps to your sequence to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = totals.totalEnrollments > 0 
    ? ((totals.completedEnrollments / totals.totalEnrollments) * 100).toFixed(1)
    : "0";

  // Prepare chart data
  const chartData = analytics.map(step => ({
    name: `Step ${step.step_order}`,
    openRate: step.total_sent > 0 ? Math.round((step.unique_opens / step.total_sent) * 100) : 0,
    clickRate: step.unique_opens > 0 ? Math.round((step.unique_clicks / step.unique_opens) * 100) : 0,
    sent: step.total_sent,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Send className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">Total Enrolled</span>
            </div>
            <span className="text-2xl font-bold">{totals.totalEnrollments}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <span className="text-2xl font-bold">{totals.activeEnrollments}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <CheckCircle className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <span className="text-2xl font-bold">{totals.completedEnrollments}</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10">
                <Eye className="h-4 w-4 text-orange-400" />
              </div>
              <span className="text-xs text-muted-foreground">Completion Rate</span>
            </div>
            <span className="text-2xl font-bold">{completionRate}%</span>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.some(d => d.sent > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement by Step</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value, name) => [`${value}%`, name === "openRate" ? "Open Rate" : "Click Rate"]}
                  />
                  <Bar dataKey="openRate" name="Open Rate" fill="hsl(270, 80%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clickRate" name="Click Rate" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Step Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step-by-Step Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((step, index) => {
              const openRate = step.total_sent > 0 
                ? ((step.unique_opens / step.total_sent) * 100).toFixed(1) 
                : "0";
              const clickRate = step.unique_opens > 0 
                ? ((step.unique_clicks / step.unique_opens) * 100).toFixed(1) 
                : "0";
              const deliveryRate = step.total_sent > 0
                ? ((step.total_delivered / step.total_sent) * 100).toFixed(1)
                : "0";

              return (
                <div key={step.step_id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {step.step_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{step.subject}</h4>
                    </div>
                    {step.total_sent === 0 && (
                      <Badge variant="secondary">No sends yet</Badge>
                    )}
                  </div>
                  
                  {step.total_sent > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium">{step.total_sent}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-sm font-medium">{step.total_delivered} <span className="text-green-400">({deliveryRate}%)</span></p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-400" />
                        <div>
                          <p className="text-sm font-medium">{step.unique_opens} <span className="text-purple-400">({openRate}%)</span></p>
                          <p className="text-xs text-muted-foreground">Opened</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-orange-400" />
                        <div>
                          <p className="text-sm font-medium">{step.unique_clicks} <span className="text-orange-400">({clickRate}%)</span></p>
                          <p className="text-xs text-muted-foreground">Clicked</p>
                        </div>
                      </div>
                      {step.total_bounced > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-red-400">{step.total_bounced}</p>
                            <p className="text-xs text-muted-foreground">Bounced</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
