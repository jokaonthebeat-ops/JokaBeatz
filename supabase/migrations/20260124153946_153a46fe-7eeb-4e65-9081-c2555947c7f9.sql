-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view default templates"
ON public.email_templates
FOR SELECT
USING (is_default = true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert pre-built email templates
INSERT INTO public.email_templates (name, subject, content, category, description, is_default) VALUES
(
  'Free Beats Promotion',
  '🎵 Free Beats Waiting For You – No Strings Attached',
  '<div style="background:#0a0a0a; color:#ffffff; padding:40px 20px; font-family:Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>
    </div>
    <h2 style="color:#ffffff; font-size:24px;">Hey there! 🔥</h2>
    <p style="color:#a1a1aa; font-size:16px; line-height:1.6;">We''ve got something special for you – a pack of free, industry-ready beats waiting to be downloaded. No catch, no gimmicks.</p>
    
    <div style="background:#18181b; padding:24px; border-radius:12px; margin:24px 0; border:1px solid #27272a;">
      <h3 style="color:#ffffff; margin-top:0;">What''s Inside:</h3>
      <ul style="color:#a1a1aa; padding-left:20px; line-height:2;">
        <li>✅ High-quality MP3/WAV files</li>
        <li>✅ Royalty-free for non-commercial use</li>
        <li>✅ Multiple genres & styles</li>
        <li>✅ Instant download access</li>
      </ul>
    </div>
    
    <div style="text-align:center; margin:32px 0;">
      <a href="{{site_url}}/free-beats" style="display:inline-block; background:#e11d48; color:#ffffff; text-align:center; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">GET YOUR FREE BEATS</a>
    </div>
    
    <p style="text-align:center; color:#71717a; margin-top:40px; font-size:14px;">Join 1000+ artists already creating with our beats</p>
    
    <hr style="border:none; border-top:1px solid #27272a; margin:30px 0;" />
    <p style="color:#52525b; font-size:12px; text-align:center;">You''re receiving this because you signed up at Joka Beatz.<br/><a href="#" style="color:#e11d48;">Unsubscribe</a></p>
  </div>
</div>',
  'free_beats',
  'Promote free beat downloads to drive traffic and capture leads',
  true
),
(
  'Sync Licensing Guide Promotion',
  '🎬 The Sync Secrets Music Supervisors Won''t Tell You',
  '<div style="background:#0a0a0a; color:#ffffff; padding:40px 20px; font-family:Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>
    </div>
    <h2 style="color:#ffffff; font-size:24px;">Want Your Music in TV & Film? 🎬</h2>
    <p style="color:#a1a1aa; font-size:16px; line-height:1.6;">We just released a comprehensive guide that breaks down everything you need to know about sync licensing – the insider knowledge that music supervisors won''t tell you.</p>
    
    <div style="background:#18181b; padding:24px; border-radius:12px; margin:24px 0; border:1px solid #27272a;">
      <h3 style="color:#ffffff; margin-top:0;">Inside the Guide:</h3>
      <ul style="color:#a1a1aa; padding-left:20px; line-height:2;">
        <li>📺 How sync licensing actually works</li>
        <li>💰 What you can realistically earn</li>
        <li>🎯 How to pitch your music effectively</li>
        <li>📋 Essential contracts & legal terms</li>
        <li>🚀 Step-by-step action plan</li>
      </ul>
    </div>
    
    <div style="background:#27272a; padding:20px; border-radius:8px; margin:24px 0; border-left:4px solid #e11d48;">
      <p style="color:#a1a1aa; font-style:italic; margin:0;">"This guide changed everything for me. Got my first sync placement within 3 months!"</p>
      <p style="color:#71717a; font-size:14px; margin:10px 0 0 0;">— Independent Artist</p>
    </div>
    
    <div style="text-align:center; margin:32px 0;">
      <a href="{{site_url}}/free-guide" style="display:inline-block; background:#e11d48; color:#ffffff; text-align:center; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">DOWNLOAD FREE GUIDE</a>
    </div>
    
    <hr style="border:none; border-top:1px solid #27272a; margin:30px 0;" />
    <p style="color:#52525b; font-size:12px; text-align:center;">You''re receiving this because you signed up at Joka Beatz.<br/><a href="#" style="color:#e11d48;">Unsubscribe</a></p>
  </div>
</div>',
  'sync_guide',
  'Promote the free sync licensing guide to educate and convert leads',
  true
),
(
  'New Beat Drop Announcement',
  '🔥 New Heat Just Dropped – Fresh Beats Available Now',
  '<div style="background:#0a0a0a; color:#ffffff; padding:40px 20px; font-family:Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>
    </div>
    <div style="text-align:center; margin-bottom:20px;">
      <span style="background:#e11d48; color:#ffffff; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:bold;">🚨 NEW RELEASE</span>
    </div>
    <h2 style="color:#ffffff; font-size:24px; text-align:center;">Fresh Beats Just Landed!</h2>
    <p style="color:#a1a1aa; font-size:16px; line-height:1.6; text-align:center;">We just dropped some new fire. Industry-quality production ready for your next hit. Don''t sleep on these – they move fast.</p>
    
    <div style="background:#18181b; padding:24px; border-radius:12px; margin:24px 0; border:1px solid #27272a;">
      <h3 style="color:#ffffff; margin-top:0; text-align:center;">What''s New:</h3>
      <p style="color:#a1a1aa; text-align:center;">{{beat_details}}</p>
    </div>
    
    <div style="text-align:center; margin:32px 0;">
      <a href="{{site_url}}/beats" style="display:inline-block; background:#e11d48; color:#ffffff; text-align:center; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">BROWSE NEW BEATS</a>
    </div>
    
    <p style="text-align:center; color:#71717a; font-size:14px;">As a subscriber, you get first access before anyone else 🎯</p>
    
    <hr style="border:none; border-top:1px solid #27272a; margin:30px 0;" />
    <p style="color:#52525b; font-size:12px; text-align:center;">You''re receiving this because you signed up at Joka Beatz.<br/><a href="#" style="color:#e11d48;">Unsubscribe</a></p>
  </div>
</div>',
  'announcement',
  'Announce new beat releases and drive traffic to the shop',
  true
),
(
  'General Newsletter',
  '{{custom_subject}}',
  '<div style="background:#0a0a0a; color:#ffffff; padding:40px 20px; font-family:Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>
    </div>
    
    <div style="color:#a1a1aa; font-size:16px; line-height:1.8;">
      {{custom_content}}
    </div>
    
    <hr style="border:none; border-top:1px solid #27272a; margin:30px 0;" />
    <p style="color:#52525b; font-size:12px; text-align:center;">You''re receiving this because you signed up at Joka Beatz.<br/><a href="#" style="color:#e11d48;">Unsubscribe</a></p>
  </div>
</div>',
  'general',
  'Clean branded template for custom newsletters and updates',
  true
);