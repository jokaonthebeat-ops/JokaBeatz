import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductToImport {
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  gumroadUrl: string;
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  productName: string
): Promise<string | null> {
  try {
    console.log('Downloading image:', imageUrl);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to download image:', response.status);
      return null;
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Generate unique filename
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `products/${Date.now()}-${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, uint8Array, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('Uploaded image to:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products } = await req.json() as { products: ProductToImport[] };

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No products provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const importedProducts: any[] = [];
    const errors: string[] = [];

    for (const product of products) {
      try {
        console.log('Importing product:', product.name);
        
        // Download and re-upload image if available
        let finalImageUrl: string | null = null;
        if (product.imageUrl) {
          finalImageUrl = await downloadAndUploadImage(supabase, product.imageUrl, product.name);
        }
        
        // Insert product into database
        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description || null,
            price: product.price,
            category: product.category,
            image_url: finalImageUrl,
            active: false, // Set to inactive so admin can review
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Insert error for', product.name, insertError);
          errors.push(`Failed to import "${product.name}": ${insertError.message}`);
        } else {
          importedProducts.push({
            ...insertedProduct,
            gumroadUrl: product.gumroadUrl,
          });
        }
      } catch (err) {
        console.error('Error importing product:', product.name, err);
        errors.push(`Failed to import "${product.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedProducts.length,
        products: importedProducts,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-gumroad-products:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
