import { Card, CardContent } from "@/components/ui/card";
import { Send, CheckCircle, Eye, MousePointerClick, AlertTriangle } from "lucide-react";

interface CampaignAnalyticsProps {
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  uniqueOpens: number;
  uniqueClicks: number;
}

const CampaignAnalytics = ({
  emailsSent,
  emailsDelivered,
  emailsOpened,
  emailsClicked,
  emailsBounced,
  uniqueOpens,
  uniqueClicks,
}: CampaignAnalyticsProps) => {
  const deliveryRate = emailsSent > 0 ? ((emailsDelivered / emailsSent) * 100).toFixed(1) : "0";
  const openRate = emailsDelivered > 0 ? ((uniqueOpens / emailsDelivered) * 100).toFixed(1) : "0";
  const clickRate = uniqueOpens > 0 ? ((uniqueClicks / uniqueOpens) * 100).toFixed(1) : "0";
  const bounceRate = emailsSent > 0 ? ((emailsBounced / emailsSent) * 100).toFixed(1) : "0";

  const stats = [
    {
      label: "Sent",
      value: emailsSent,
      icon: Send,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Delivered",
      value: emailsDelivered,
      subValue: `${deliveryRate}%`,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Opened",
      value: uniqueOpens,
      subValue: `${openRate}%`,
      totalValue: emailsOpened,
      icon: Eye,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Clicked",
      value: uniqueClicks,
      subValue: `${clickRate}%`,
      totalValue: emailsClicked,
      icon: MousePointerClick,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Bounced",
      value: emailsBounced,
      subValue: `${bounceRate}%`,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              {stat.subValue && (
                <span className={`text-sm ${stat.color}`}>{stat.subValue}</span>
              )}
            </div>
            {stat.totalValue !== undefined && stat.totalValue > stat.value && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.totalValue} total {stat.label.toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CampaignAnalytics;
