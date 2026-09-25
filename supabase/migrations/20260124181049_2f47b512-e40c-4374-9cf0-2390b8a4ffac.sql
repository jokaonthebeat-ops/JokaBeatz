-- Insert new promotional email templates
INSERT INTO public.email_templates (name, subject, content, category, description, is_default) VALUES

-- Services Promotion Template
('Services Promo', 'Ready to Level Up Your Sound? 🎚️ Professional Services Inside', 
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Services</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" width="120" style="max-width: 120px;">
            </td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #262626;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                Take Your Music to the Next Level 🎚️
              </h1>
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Whether you need custom beats, professional mixing, or industry-standard mastering — we''ve got you covered.
              </p>
              <!-- Services Grid -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" style="background: #1f1f1f; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <h3 style="color: #e11d48; font-size: 18px; margin: 0 0 10px 0;">🎹 Custom Beats</h3>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">Tailored productions crafted specifically for your vision.</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background: #1f1f1f; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <h3 style="color: #e11d48; font-size: 18px; margin: 0 0 10px 0;">🎛️ Mixing</h3>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">Get that clean, balanced sound with professional mixing.</p>
                  </td>
                </tr>
                <tr><td colspan="3" height="16"></td></tr>
                <tr>
                  <td width="48%" style="background: #1f1f1f; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <h3 style="color: #e11d48; font-size: 18px; margin: 0 0 10px 0;">💿 Mastering</h3>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">Industry-ready masters for streaming and distribution.</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background: #1f1f1f; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <h3 style="color: #e11d48; font-size: 18px; margin: 0 0 10px 0;">💬 Consultation</h3>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">1-on-1 sessions to help develop your sound.</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/services" style="display: inline-block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View All Services</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © Joka Beatz. <a href="{{site_url}}/unsubscribe?email={{email}}" style="color: #525252;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', 
'services', 
'Promote your mixing, mastering, and custom beat services', 
true),

-- Shop Products Template
('Shop Promo', '🛒 Exclusive Drops in the Shop - Don''t Sleep', 
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shop Now</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" width="120" style="max-width: 120px;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #262626;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                New in the Shop 🛒
              </h1>
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Fresh products just dropped. Premium beat packs, exclusive samples, and more for serious producers.
              </p>
              <!-- Featured Product -->
              <div style="background: #1f1f1f; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="background: #e11d48; color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">Featured</span>
                <h2 style="color: #ffffff; font-size: 22px; margin: 16px 0 8px 0;">{{product_name}}</h2>
                <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0;">{{product_description}}</p>
                <p style="color: #e11d48; font-size: 24px; font-weight: 700; margin: 0;">{{product_price}}</p>
              </div>
              <!-- CTA -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/shop" style="display: inline-block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Shop Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © Joka Beatz. <a href="{{site_url}}/unsubscribe?email={{email}}" style="color: #525252;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', 
'products', 
'Promote shop products and beat packs', 
true),

-- Seasonal Sale Template
('Seasonal Sale', '🎁 Limited Time: Holiday Sale - Up to 50% Off!', 
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sale</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" width="120" style="max-width: 120px;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #7f1d1d 0%, #1a1a1a 100%); border-radius: 16px; padding: 40px; border: 1px solid #dc2626;">
              <div style="text-align: center;">
                <span style="background: #dc2626; color: white; font-size: 14px; font-weight: 700; padding: 8px 20px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">Limited Time</span>
              </div>
              <h1 style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 24px 0 16px 0; text-align: center;">
                {{discount_percent}}% OFF
              </h1>
              <p style="color: #fca5a5; font-size: 18px; margin: 0 0 8px 0; text-align: center; font-weight: 600;">
                {{sale_name}}
              </p>
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                Save big on beats, sample packs, and services. But hurry — this deal won''t last forever!
              </p>
              <!-- Countdown -->
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <p style="color: #fca5a5; font-size: 14px; margin: 0;">
                  ⏰ Sale ends: <strong>{{sale_end_date}}</strong>
                </p>
              </div>
              <!-- CTA -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/shop" style="display: inline-block; background: #ffffff; color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px;">Shop the Sale</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © Joka Beatz. <a href="{{site_url}}/unsubscribe?email={{email}}" style="color: #525252;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', 
'seasonal', 
'Holiday and seasonal sales promotions', 
true),

-- Re-engagement Template
('Win Back', 'We Miss You! 💔 Here''s Something Special...', 
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" width="120" style="max-width: 120px;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #262626;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                Hey, it''s been a while... 💔
              </h1>
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                We noticed you haven''t stopped by in a while. No pressure — just wanted to let you know we''ve got some fresh stuff you might like.
              </p>
              <!-- Special Offer -->
              <div style="background: linear-gradient(135deg, #7f1d1d 0%, #1f1f1f 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #dc2626;">
                <p style="color: #fca5a5; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Welcome Back Offer</p>
                <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">{{discount_percent}}% OFF</p>
                <p style="color: #a3a3a3; font-size: 14px; margin: 8px 0 0 0;">Use code: <strong style="color: #e11d48;">COMEBACK</strong></p>
              </div>
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                This exclusive offer is just for you. Come check out what''s new!
              </p>
              <!-- CTA -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/beats" style="display: inline-block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Explore New Beats</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © Joka Beatz. <a href="{{site_url}}/unsubscribe?email={{email}}" style="color: #525252;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', 
're_engagement', 
'Win back inactive subscribers with a special offer', 
true),

-- Licensing Announcement Template
('Licensing Info', '💰 New Licensing Options - More Ways to Use Our Beats', 
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Licensing Options</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src="{{site_url}}/joka-beatz-logo.png" alt="Joka Beatz" width="120" style="max-width: 120px;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #262626;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                Licensing Made Simple 💰
              </h1>
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                From personal projects to commercial releases, we have a license that fits your needs.
              </p>
              <!-- License Tiers -->
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: #1f1f1f; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 12px;">
                    <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">Basic License</h3>
                    <p style="color: #e11d48; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">$29</p>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 0;">MP3 • 5K streams • Non-profit use</p>
                  </td>
                </tr>
                <tr><td height="12"></td></tr>
                <tr>
                  <td style="background: linear-gradient(135deg, #7f1d1d 0%, #1f1f1f 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #dc2626;">
                    <span style="background: #e11d48; color: white; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">Popular</span>
                    <h3 style="color: #ffffff; font-size: 18px; margin: 12px 0 8px 0;">Premium License</h3>
                    <p style="color: #e11d48; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">$79</p>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 0;">WAV + MP3 • 50K streams • Commercial use</p>
                  </td>
                </tr>
                <tr><td height="12"></td></tr>
                <tr>
                  <td style="background: #1f1f1f; border-radius: 12px; padding: 20px; text-align: center;">
                    <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">Unlimited License</h3>
                    <p style="color: #e11d48; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">$199</p>
                    <p style="color: #a3a3a3; font-size: 12px; margin: 0;">All files + Stems • Unlimited streams • Full rights</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="{{site_url}}/beats" style="display: inline-block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Browse Beats</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center;">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © Joka Beatz. <a href="{{site_url}}/unsubscribe?email={{email}}" style="color: #525252;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>', 
'announcement', 
'Educate subscribers about licensing tiers and pricing', 
true);