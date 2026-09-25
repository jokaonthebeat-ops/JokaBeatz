import { useState } from "react";
import { Plus, Sparkles, Edit, Trash2, Eye, MoreVertical, ImageIcon, ImagePlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAdminBlogPosts, useDeleteBlogPost, type BlogPost } from "@/hooks/useBlogPosts";
import { BlogPostEditor } from "@/components/blog/BlogPostEditor";
import { GeneratePostModal } from "@/components/blog/GeneratePostModal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  published: "bg-green-500/20 text-green-400",
  scheduled: "bg-blue-500/20 text-blue-400",
};

const categoryLabels: Record<string, string> = {
  "music-business": "Making Money",
  "industry-news": "Industry News",
  "ai-music": "AI in Music",
};

const AdminBlog = () => {
  const { data: posts, isLoading } = useAdminBlogPosts();
  const deletePost = useDeleteBlogPost();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fixingImages, setFixingImages] = useState(false);

  const postsWithoutImages = posts?.filter(p => !p.featured_image) || [];

  const handleFixMissingImages = async () => {
    if (postsWithoutImages.length === 0) return;
    setFixingImages(true);
    let fixed = 0;

    for (const post of postsWithoutImages) {
      try {
        const { data, error } = await supabase.functions.invoke("regenerate-blog-images", {
          body: { postId: post.id, title: post.title, content: post.content, generateInline: false, generateOg: !post.og_image },
        });

        if (!error && data?.featuredImage) {
          fixed++;
        }
      } catch (err) {
        console.error("Failed to fix image for:", post.title, err);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    setFixingImages(false);
    toast({
      title: `Fixed ${fixed} of ${postsWithoutImages.length} posts`,
      description: fixed > 0 ? "Images have been generated for posts that were missing them." : "Could not generate images. Please try again later.",
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePost.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPost(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <div className="flex gap-2">
          {postsWithoutImages.length > 0 && (
            <Button variant="outline" onClick={handleFixMissingImages} disabled={fixingImages}>
              {fixingImages ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4 mr-2" />
              )}
              Fix {postsWithoutImages.length} Missing {postsWithoutImages.length === 1 ? "Image" : "Images"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowGenerateModal(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-12 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.featured_image ? (
                      <img 
                        src={post.featured_image} 
                        alt="" 
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium line-clamp-1">{post.title}</span>
                      {post.is_ai_generated && (
                        <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {categoryLabels[post.category] || post.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[post.status]}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {post.published_at 
                        ? format(new Date(post.published_at), "MMM d, yyyy")
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.status === "published" && (
                          <DropdownMenuItem asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEdit(post)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(post.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No blog posts yet. Create your first post or generate one with AI!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <BlogPostEditor post={editingPost} onClose={handleCloseEditor} />
      )}

      {/* Generate Modal */}
      <GeneratePostModal 
        open={showGenerateModal} 
        onOpenChange={setShowGenerateModal} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlog;
