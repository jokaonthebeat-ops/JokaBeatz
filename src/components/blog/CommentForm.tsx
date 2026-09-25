import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateComment } from "@/hooks/useBlogComments";
import { toast } from "sonner";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({ postId, parentId, onCancel, placeholder = "Write a comment..." }: CommentFormProps) {
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    try {
      await createComment.mutateAsync({
        postId,
        content: content.trim(),
        parentId,
      });
      setContent("");
      toast.success(parentId ? "Reply posted!" : "Comment posted!");
      onCancel?.();
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">
          Sign in to join the conversation
        </p>
        <Button asChild>
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={1000}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/1000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            size="sm"
            disabled={!content.trim() || createComment.isPending}
          >
            {createComment.isPending ? "Posting..." : parentId ? "Reply" : "Post Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
