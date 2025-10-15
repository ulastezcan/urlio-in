from fastapi import APIRouter, Response
from datetime import datetime

router = APIRouter(tags=["seo"])

@router.get("/sitemap.xml", response_class=Response)
async def get_sitemap():
    """
    Generate dynamic sitemap.xml
    """
    
    current_date = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')
    
    sitemap_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://urlio.in/</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://urlio.in/login</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://urlio.in/register</loc>
    <lastmod>{current_date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""
    
    return Response(
        content=sitemap_xml,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": "noindex"
        }
    )


@router.get("/robots.txt", response_class=Response)
async def get_robots():
    """
    Generate robots.txt
    """
    
    robots_txt = """# robots.txt for urlio.in

# All bots allowed by default
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/

# Sitemap location
Sitemap: https://urlio.in/sitemap.xml

# Crawl-delay for search engines
User-agent: Googlebot
Crawl-delay: 0

User-agent: Bingbot
Crawl-delay: 0

# Block AI bots
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /
"""
    
    return Response(
        content=robots_txt,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=86400"}
    )
