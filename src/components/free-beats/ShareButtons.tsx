import { Twitter, Facebook, Link2, MessageCircle, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getShareUrls, openShareWindow } from "@/hooks/useShareUrl";

interface ShareButtonsProps {
  title?: string;
  path?: string;
  compact?: boolean;
  caption?: string;
  hashtags?: string[];
}

const ShareButtons = ({ 
  title = "Get 5 Free Beats from Joka Beatz!", 
  path = "/free-beats",
  compact = false,
  caption,
  hashtags,
}: ShareButtonsProps) => {
  const { shareUrl } = getShareUrls(path);

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp') => {
    openShareWindow(platform, shareUrl, title, caption, hashtags);
  };

  const copyLink = async () => {
    try {
      // Copy the share URL so the preview works when pasted
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share it with your fellow artists.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => handleShare("twitter")}
          aria-label="Share on Twitter"
        >
          <Twitter size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => handleShare("facebook")}
          aria-label="Share on Facebook"
        >
          <Facebook size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => handleShare("whatsapp")}
          aria-label="Share on WhatsApp"
        >
          <MessageCircle size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={copyLink}
          aria-label="Copy link"
        >
          <Link2 size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare("twitter")}
      >
        <Twitter size={16} />
        Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare("facebook")}
      >
        <Facebook size={16} />
        Facebook
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleShare("whatsapp")}
      >
        <MessageCircle size={16} />
        WhatsApp
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={copyLink}
      >
        <Link2 size={16} />
        Copy Link
      </Button>
    </div>
  );
};

export default ShareButtons;
