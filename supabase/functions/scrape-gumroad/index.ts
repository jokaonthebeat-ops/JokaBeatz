import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GumroadProduct {
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  gumroadUrl: string;
}

function detectCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  // Check for Plugins/VSTs first (more specific)
  if (text.includes('plugin') || text.includes('vst') || text.includes('au ') || text.includes('workstation') || text.includes('synth')) {
    return 'Plugins';
  }
  // Check for Courses/Tutorials
  if (text.includes('course') || text.includes('tutorial') || text.includes('masterclass') || text.includes('class') || text.includes('lesson')) {
    return 'Courses';
  }
  if (text.includes('loop') || text.includes('loops') || text.includes('melody') || text.includes('melodies')) {
    return 'Loop Pack';
  }
  if (text.includes('drum') || text.includes('kit') || text.includes('808') || text.includes('percussion')) {
    return 'Drum Kit';
  }
  if (text.includes('sample') || text.includes('samples')) {
    return 'Sample Pack';
  }
  if (text.includes('preset') || text.includes('flp') || text.includes('template')) {
    return 'Preset Pack';
  }
  if (text.includes('beat') && (text.includes('pack') || text.includes('collection'))) {
    return 'Beat Pack';
  }
  
  return 'Other';
}

function parsePrice(priceText: string): number {
  // Extract numeric value from price strings like "$29", "$29.99", "29.99"
  const match = priceText.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return 0;
}

function extractProductsFromMarkdown(markdown: string, html: string): GumroadProduct[] {
  const products: GumroadProduct[] = [];
  
  // Parse the HTML for product cards - Gumroad uses specific patterns
  // Look for product links and associated data
  const productLinkRegex = /href="(https:\/\/diamondloopz\.gumroad\.com\/l\/[^"]+)"/g;
  const productUrls = new Set<string>();
  
  let match;
  while ((match = productLinkRegex.exec(html)) !== null) {
    productUrls.add(match[1]);
  }
  
  // Also check for /l/ paths in markdown
  const markdownLinkRegex = /\[([^\]]+)\]\((https:\/\/diamondloopz\.gumroad\.com\/l\/[^)]+)\)/g;
  while ((match = markdownLinkRegex.exec(markdown)) !== null) {
    productUrls.add(match[2]);
  }

  // Extract product names and prices from markdown structure
  // Gumroad pages typically have product names as headers or strong text
  const lines = markdown.split('\n');
  let currentProduct: Partial<GumroadProduct> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for price patterns (e.g., "$29", "$29.99")
    const priceMatch = line.match(/\$[\d.]+/);
    
    // Look for product name patterns (headers or bold text followed by price)
    const headerMatch = line.match(/^#+\s*(.+)$/) || line.match(/^\*\*(.+)\*\*$/);
    
    if (headerMatch && priceMatch) {
      // This line contains both name and price
      const name = headerMatch[1].replace(/\$[\d.]+/, '').trim();
      if (name.length > 2 && !name.toLowerCase().includes('gumroad')) {
        products.push({
          name,
          description: '',
          price: parsePrice(priceMatch[0]),
          imageUrl: null,
          category: detectCategory(name, ''),
          gumroadUrl: '',
        });
      }
    } else if (headerMatch) {
      // Start tracking a potential product
      const name = headerMatch[1].trim();
      if (name.length > 2 && !name.toLowerCase().includes('gumroad') && !name.toLowerCase().includes('discover')) {
        currentProduct = { name, description: '' };
      }
    } else if (currentProduct && priceMatch) {
      // Found price for current product
      products.push({
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        price: parsePrice(priceMatch[0]),
        imageUrl: null,
        category: detectCategory(currentProduct.name || '', currentProduct.description || ''),
        gumroadUrl: '',
      });
      currentProduct = null;
    }
  }
  
  // Extract images from HTML
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  const images: string[] = [];
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Filter for product images (usually from Gumroad CDN)
    if (src.includes('public-files.gumroad.com') || src.includes('gumroad.com/assets')) {
      images.push(src);
    }
  }
  
  // Try to match images to products (usually in order)
  products.forEach((product, index) => {
    if (images[index]) {
      product.imageUrl = images[index];
    }
  });
  
  return products;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const targetUrl = url || 'https://diamondloopz.gumroad.com/';

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping Gumroad store:', targetUrl);

    // First, use the map feature to discover all product pages
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        limit: 100,
      }),
    });

    const mapData = await mapResponse.json();
    console.log('Map response:', JSON.stringify(mapData, null, 2));

    // Filter for product URLs (Gumroad uses /l/ for products)
    const productUrls = (mapData.links || []).filter((link: string) => 
      link.includes('/l/') && link.includes('gumroad.com')
    );

    console.log('Found product URLs:', productUrls);

    // Scrape the main page for overview
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';

    console.log('Scraped markdown length:', markdown.length);
    console.log('Scraped HTML length:', html.length);

    // Now scrape each product page for detailed info
    const products: GumroadProduct[] = [];
    
    for (const productUrl of productUrls) { // Remove limit - scrape all products
      try {
        console.log('Scraping product:', productUrl);
        
        const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
          }),
        });

        const productData = await productResponse.json();
        
        if (productResponse.ok) {
          const productMarkdown = productData.data?.markdown || productData.markdown || '';
          const productHtml = productData.data?.html || productData.html || '';
          
          // Extract product details
          const lines = productMarkdown.split('\n').filter((l: string) => l.trim());
          
          // First non-empty line is usually the title
          let name = '';
          let description = '';
          let price = 0;
          let imageUrl: string | null = null;
          
          for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip navigation/header elements
            if (trimmed.toLowerCase().includes('gumroad') && trimmed.length < 20) continue;
            if (trimmed.startsWith('[') && trimmed.endsWith(')')) continue;
            
            // Look for price
            const priceMatch = trimmed.match(/\$[\d.]+/);
            if (priceMatch) {
              price = parsePrice(priceMatch[0]);
            }
            
            // First substantial text is likely the title
            if (!name && trimmed.length > 3 && !priceMatch) {
              // Remove markdown formatting
              name = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            } else if (name && !description && trimmed.length > 20 && !priceMatch) {
              description = trimmed.replace(/\*\*/g, '').substring(0, 500);
            }
          }
          
          // Extract image from HTML
          const imgMatch = productHtml.match(/<img[^>]+src="([^"]*(?:public-files\.gumroad\.com|static-2\.gumroad\.com)[^"]*)"/);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
          
          if (name && price > 0) {
            products.push({
              name,
              description: description || `Premium ${detectCategory(name, '')} from Diamond Loopz`,
              price,
              imageUrl,
              category: detectCategory(name, description),
              gumroadUrl: productUrl,
            });
          }
        }
      } catch (err) {
        console.error('Error scraping product:', productUrl, err);
      }
    }

    // If we didn't find products from individual pages, try parsing the main page
    if (products.length === 0) {
      const mainPageProducts = extractProductsFromMarkdown(markdown, html);
      products.push(...mainPageProducts);
    }

    console.log('Extracted products:', products.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        productUrls,
        debug: {
          markdownLength: markdown.length,
          htmlLength: html.length,
          foundUrls: productUrls.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-gumroad:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
