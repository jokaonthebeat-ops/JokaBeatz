import { supabase } from "@/integrations/supabase/client";

interface UploadMasteringInputParams {
  file: File;
  userId: string;
}

export async function uploadMasteringInputToStorage({
  file,
  userId,
}: UploadMasteringInputParams): Promise<{ publicUrl: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${userId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("mastering-files")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Failed to upload file");
  }

  // Bucket is private — create a signed URL valid for 1 hour for the edge function to access
  const { data: signedData, error: signedError } = await supabase.storage
    .from("mastering-files")
    .createSignedUrl(filePath, 3600);

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL error:", signedError);
    throw new Error("Failed to generate file access URL");
  }

  return { publicUrl: signedData.signedUrl };
}

// Upload multiple stems for multitrack mixing
export async function uploadMultipleStemsToStorage({
  files,
  userId,
}: {
  files: File[];
  userId: string;
}): Promise<{ publicUrls: string[] }> {
  const timestamp = Date.now();
  const uploadPromises = files.map(async (file, index) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${timestamp}-stem-${index + 1}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("mastering-files")
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Upload error for ${file.name}:`, uploadError);
      throw new Error(`Failed to upload ${file.name}`);
    }

    // Bucket is private — create a signed URL valid for 1 hour
    const { data: signedData, error: signedError } = await supabase.storage
      .from("mastering-files")
      .createSignedUrl(filePath, 3600);

    if (signedError || !signedData?.signedUrl) {
      console.error(`Signed URL error for ${file.name}:`, signedError);
      throw new Error(`Failed to generate access URL for ${file.name}`);
    }

    return signedData.signedUrl;
  });

  const publicUrls = await Promise.all(uploadPromises);
  return { publicUrls };
}
