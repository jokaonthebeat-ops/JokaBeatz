-- Update all email templates to use logo image instead of text header
UPDATE email_templates 
SET content = REPLACE(
  content, 
  '<h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>',
  '<img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" style="max-width:180px; height:auto; display:block; margin:0 auto 20px;" />'
)
WHERE content LIKE '%<h1 style="color:#e11d48; font-size:28px; margin:0;">JOKA BEATZ</h1>%';