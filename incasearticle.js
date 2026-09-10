// code for hamburger 
const header = document.getElementById('header');
const hamburger = document.querySelector('.hamburger');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 1);
});

hamburger.addEventListener('click', () => {
  sideMenu.classList.add('active');
});

closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('active');
});

async function loadRelatedPosts(currentPost) {
  try {
    const relatedContainer = document.querySelector(".related-blocks");
    relatedContainer.innerHTML = "Loading related content...";

    // 1️⃣ Get 20 latest posts
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(20)
      ]
    );

    let posts = response.documents;

    // 2️⃣ Remove the current post
    posts = posts.filter(p => p.slug !== currentPost.slug);

    // 3️⃣ Find similar posts (based on subheading words)
    const currentWords = currentPost.subheading.toLowerCase().split(" ");

    let similar = posts.filter(post => {
      const words = post.subheading.toLowerCase();
      return currentWords.some(word => words.includes(word));
    });

    // 4️⃣ If similar < 20, fill with other latest posts
    let finalPosts = [...similar];

    for (let post of posts) {
      if (!finalPosts.includes(post)) {
        finalPosts.push(post);
      }
      if (finalPosts.length === 20) break;
    }

    // 5️⃣ Render
    relatedContainer.innerHTML = finalPosts.map(post => `
      <a href="articles.html?slug=${post.slug}">
        <div class="related-item">
          <img src="${post.image}" alt="${post.subheading}" loading="lazy">
          <p>${post.title}</p>
        </div>
      </a>
    `).join("");

  } catch (err) {
    console.error("Related load error:", err);
    document.querySelector(".related-blocks").innerHTML = "Unable to load related content.";
  }
}


// this part is the code that protect my page from right click and others
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
 document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) {
      e.preventDefault();
    }
});

// Check if accepted before
if (!localStorage.getItem('cookieAccepted')) {
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
   <p id="head1"><strong>Consent to cookies & data processing</strong></p> <p>
      This website uses cookies to improve user experience, show ads, and analyze traffic (including IP address data).
      By using this site, you agree to our use of cookies.
    </p>
    <button id="acceptCookies">Accept All</button>
  `;
  document.body.appendChild(banner);

  // Show after 10 seconds
  setTimeout(() => {
    banner.classList.add('show');
  }, 10000);

  // On click, hide and remember
  document.getElementById('acceptCookies').onclick = () => {
    localStorage.setItem('cookieAccepted', 'yes');
    banner.style.display = 'none';
  };
}







// auto.js
const { Query } = Appwrite;

function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");   // reads ?slug=your-slug
}


async function loadPostBySlug() {
    try {
        const slug = getSlugFromURL();

        if (!slug) {
            document.getElementById("post-body").innerText = "No article specified.";
            return;
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal("slug", slug)]
        );

        if (response.documents.length === 0) {
            document.getElementById("post-body").innerText = "Post not found.";
            return;
        }

        const post = response.documents[0];

        // Format date
     const createdAt = new Date(post.$createdAt);

const formattedDate = createdAt.toLocaleString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

document.getElementById("publish-date").innerText =
  "Published " + formattedDate;


        // Content
        document.getElementById("post-title").innerText = post.subheading;
      document.getElementById("post-image").src = post.image;
        document.getElementById("post-body").innerHTML = marked.parse(post.content || "");

        // Canonical URL
        const fullURL = `https://www.trendnestblogs.com/articles.html?slug=${post.slug}`;
        document.getElementById("canonical-link").setAttribute("href", fullURL);

        // SEO
        updateSEO(post, fullURL);

        // Schema
        injectSchema(post, fullURL);
        // Load related posts
loadRelatedPosts(post);

    } catch (error) {
        console.error("Appwrite Error:", error);
        document.getElementById("post-body").innerText = "Error loading post.";
    }
}

function updateSEO(post, url) {
    document.getElementById("page-title").innerText = `${post.title} - Trendnest`;
    document.getElementById("meta-description").setAttribute("content", post.description || "");
    document.getElementById("meta-keywords").setAttribute("content", post.keyword || "");

}

function injectSchema(post, url) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description || "",
        "image": post.image,
        "datePublished": post.$createdAt,
        "dateModified": post.$updatedAt,
        "author": {
            "@type": "person",
            "name": "MEC",
            "url": "https://www.trendnestblogs.com/mec/"
        },
        "publisher": {
            "@type": "Organization",
            "name": "TrendNest",
            "logo": {
                "@type": "ImageObject",
                "url": "https://raw.githubusercontent.com/emmanuel776666/TrendNest-blog/refs/heads/main/trendnest691871f4a48d4cf38ca89def.png"
            }
        },
        "url": url,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        }
    };

    document.getElementById("post-schema").innerText = JSON.stringify(schema);
}

// Start
loadPostBySlug();
