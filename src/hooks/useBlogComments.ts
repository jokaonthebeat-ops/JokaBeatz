import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: BlogComment[];
}

export function useBlogComments(postId: string) {
  return useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      // Fetch all comments for this post
      const { data: comments, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all users
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Attach profiles to comments
      const commentsWithProfiles = comments?.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || { full_name: null, avatar_url: null }
      })) || [];

      // Organize into threaded structure
      const topLevel: BlogComment[] = [];
      const replyMap = new Map<string, BlogComment[]>();

      commentsWithProfiles.forEach(comment => {
        if (comment.parent_id) {
          const replies = replyMap.get(comment.parent_id) || [];
          replies.push(comment);
          replyMap.set(comment.parent_id, replies);
        } else {
          topLevel.push({ ...comment, replies: [] });
        }
      });

      // Attach replies to parent comments
      topLevel.forEach(comment => {
        comment.replies = replyMap.get(comment.id) || [];
      });

      return topLevel;
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in to comment");

      const { data, error } = await supabase
        .from("blog_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", variables.postId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", data.postId] });
    },
  });
}

export function useCommentCount(postId: string) {
  return useQuery({
    queryKey: ["blog-comment-count", postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blog_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("is_approved", true);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!postId,
  });
}
