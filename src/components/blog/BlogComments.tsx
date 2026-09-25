import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Reply, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogComments, useDeleteComment, type BlogComment } from "@/hooks/useBlogComments";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BlogCommentsProps {
  postId: string;
}

function Comment({ comment, postId }: { comment: BlogComment; postId: string }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { user } = useAuth();
  const deleteComment = useDeleteComment();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, postId });
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const isOwner = user?.id === comment.user_id;
  const displayName = comment.profile?.full_name || "Anonymous";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={comment.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-foreground mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteComment.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-13 pl-3 border-l-2 border-border">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-13 pl-3 border-l-2 border-border space-y-4">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const { data: comments, isLoading } = useBlogComments(postId);

  const totalCount = (comments || []).reduce(
    (acc, comment) => acc + 1 + (comment.replies?.length || 0),
    0
  );

  return (
    <section className="border-t border-border pt-8 mt-12">
      <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        Comments {totalCount > 0 && `(${totalCount})`}
      </h2>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm postId={postId} />
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <Comment key={comment.id} comment={comment} postId={postId} />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </section>
  );
}
