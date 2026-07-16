import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.status(200).send("TrendNest server is running 🚀");
});

/* ===============================
   GLOBAL SITEMAP CACHE
================================ */
let cachedSitemap = null;
let lastCacheTime = 0;
const CACHE_DURATION = 86400000; // ✅ 24 hours

/* ===============================
   GENERATE SITEMAP (FAST + SAFE)
================================ */
async function generateSitemap() {
  try {
    const baseURL = process.env.BASE_URL.trim();
    const allPosts = [];
    let lastId = null;
    let hasMore = true;

    while (hasMore) {
      const query = JSON.stringify({ method: "limit", values: [100] });

      let queryUrl = `${process.env.APPWRITE_ENDPOINT}/databases/${process.env.APPWRITE_DATABASE_ID}/collections/${process.env.APPWRITE_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(query)}`;

      if (lastId) {
        queryUrl += `&queries[]=cursorAfter("${lastId}")`;
      }

      const response = await fetch(queryUrl, {
        headers: {
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
          "X-Appwrite-Key": process.env.APPWRITE_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from Appwrite");
      }

      const data = await response.json();
      const documents = data.documents || [];

      allPosts.push(...documents);

      if (documents.length === 100) {
        lastId = documents[documents.length - 1].$id;
      } else {
        hasMore = false;
      }
    }

    const filteredPosts = allPosts.filter(post => post.slug);

    const urls = filteredPosts.map(post => `
  <url>
    <loc>${baseURL}/articles.html?slug=${encodeURIComponent(post.slug)}</loc>
    <lastmod>${new Date(post.$updatedAt || post.$createdAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    console.log("✅ Sitemap generated:", filteredPosts.length, "posts");

    return sitemap;

  } catch (err) {
    console.error("❌ Sitemap generation error:", err);
    return null;
  }
}

/* ===============================
   PRELOAD SITEMAP ON START
================================ */
(async () => {
  cachedSitemap = await generateSitemap();
  lastCacheTime = Date.now();
})();

/* ===============================
   ROBOTS.TXT (CLEAN)
================================ */
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.status(200).send(
`User-agent: *
Allow: /

Sitemap: ${process.env.SITE_URL.trim()}/sitemap.xml`
  );
});

/* ===============================
   SITEMAP ROUTE (SUPER FAST)
================================ */
app.get("/sitemap.xml", async (req, res) => {
  try {
    const now = Date.now();

    // Refresh cache if expired
    if (!cachedSitemap || now - lastCacheTime > CACHE_DURATION) {
      console.log("♻️ Regenerating sitemap...");
      const newSitemap = await generateSitemap();

      if (newSitemap) {
        cachedSitemap = newSitemap;
        lastCacheTime = now;
      }
    }

    if (!cachedSitemap) {
      return res.status(500).send("Sitemap not available");
    }

    res
      .status(200)
      .header("Content-Type", "application/xml")
      .send(cachedSitemap);

  } catch (err) {
    console.error("❌ Sitemap route error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

/* ===============================
   OG ARTICLE PAGE
================================ */
app.get("/articles.html", async (req, res) => {
  const slug = req.query.slug;
  if (!slug) return res.status(400).send("No slug");

  try {
    const query = JSON.stringify({
      method: "equal",
      attribute: "slug",
      values: [slug]
    });

    const url = `${process.env.APPWRITE_ENDPOINT}/databases/${process.env.APPWRITE_DATABASE_ID}/collections/${process.env.APPWRITE_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY
      }
    });

    const data = await response.json();
    const post = data.documents?.[0];

    if (!post) return res.status(404).send("Post not found");

    const pageURL = `${process.env.BASE_URL}/articles.html?slug=${slug}`;

    res.setHeader("Cache-Control", "public, max-age=600");

    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <title>${post.title} | TrendNest</title>

  <meta property="og:title" content="${post.subheading}">
  <meta property="og:description" content="${post.description || ""}">
  <meta property="og:image" content="${post.image}">
  <meta property="og:url" content="${pageURL}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="TrendNest">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.subheading}">
  <meta name="twitter:image" content="${post.image}">
</head>
<body>

<script>
if (!/facebookexternalhit|facebot|meta-externalagent|twitterbot|twitterbot|whatsapp|linkedinbot/i.test(navigator.userAgent)) {
  window.location.href = "${process.env.SPA_URL}/articles.html?slug=${slug}";
}
</script>

</body>
</html>`);
    
  } catch (err) {
    console.error("❌ OG error:", err);
    res.status(500).send("Server error");
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
