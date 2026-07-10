// MENU
const menu = document.getElementById('root');

document.getElementById('menuOpen').onclick = () => {
    root.classList.toggle('menuOpen');
    console.log('yo')
}



// CATEGORY BUTTON FUNCTIONALITY
const categoryButtons = document.querySelectorAll(".category-buttons button");

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {

        categoryButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        loadArticles(button.dataset.category);

    });
});

// ALL TEXT OVERFLOW AND REVEAL ON CLICK
const cutoffTexts = document.querySelectorAll('.cutoff-text');
cutoffTexts.forEach(text => {
    text.onclick = () => {
        text.classList.toggle('expanded');
    }
})

const { Query } = Appwrite;

const container = document.getElementById("blogsContainer");

async function loadArticles(category = "all") {

    try {

        let queries = [
            Query.orderDesc("$createdAt"),
            Query.limit(4)
        ];

        if (category !== "all") {
            queries.push(Query.equal("category", category));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            queries
        );

        displayArticles(response.documents);

    } catch (err) {
    console.error("Appwrite Error:", err);
    
}

}


function displayArticles(posts) {

    container.innerHTML = "";

    posts.forEach(post => {

        const createdAt = new Date(post.$createdAt);

        const formattedDate = createdAt.toLocaleString(undefined, {

            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"

        });
        
        const shareLINK = `https://go.trendnestblogs.com/articles.html?slug=${post.slug}`;

        container.innerHTML += `

        <div class="blog">

            <a href="https://www.trendnestblogs.com/articles.html?slug=${post.slug}" style="text-decoration:none;color:inherit;">

                <div class="image">
                    <img src="${post.image}" alt="${post.title}">
                </div>

                <h1 class="">
                    ${post.title}
                </h1>

            </a>

            <div class="tags">
                <span>${post.category}</span>
            </div>

            <div class="blog-bottom">

                <div class="blog-bottom-right">

                    <div class="socials">

            <!-- Facebook -->
            <a
                href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLINK)}"
                target="_blank"
                rel="noopener noreferrer"
                style="font-size:20px;color:white;"
            >
                <i class="fa-brands fa-facebook-f"></i>
            </a>

                                <!-- X (Twitter) -->
                                <a
                                    href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLINK)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style="font-size:20px;color:white;"
                                >
                                    <i class="fa-brands fa-twitter"></i>
                                </a>

            <!-- WhatsApp -->
            <a
                href="https://wa.me/?text=${encodeURIComponent(shareLINK)}"
                target="_blank"
                rel="noopener noreferrer"
                style="font-size:20px;color:white;"
            >
                <i class="fa-brands fa-whatsapp"></i>
            </a>

</div>

                    <p class="date">
                        ${formattedDate}
                    </p>

                </div>

            </div>

        </div>

        `;

    });

}

async function loadPopularPosts() {

    try {

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.orderDesc("$createdAt"),
                Query.offset(4),   // Skip the newest 4
                Query.limit(3)     // Get the next 3
            ]
        );

        const popularContainer = document.getElementById("popularPosts");

        popularContainer.innerHTML = "";

        response.documents.forEach(post => {

            const articleUrl = `https://www.trendnestblogs.com/articles.html?slug=${post.slug}`;

            popularContainer.innerHTML += `

                <a href="${articleUrl}" style="text-decoration:none;color:inherit;">

                    <div class="popular-post">

                        <div class="image">
                            <img src="${post.image}" alt="${post.title}">
                        </div>

                        <div class="info">
                            <h3 class="">${post.title}</h3>
                            
                        </div>

                    </div>

                </a>

            `;

        });

    } catch (error) {

        console.error("Popular Posts Error:", error);

    }

}

async function loadFooterLink(category, elementId) {

    try {

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.equal("category", category),
                Query.orderDesc("$createdAt"),
                Query.limit(1)
            ]
        );

        const link = document.getElementById(elementId);

        if (response.documents.length > 0) {

            const post = response.documents[0];

            link.href = `https://www.trendnestblogs.com/articles.html?slug=${post.slug}`;

        }

    } catch (error) {

        console.error(`${category} footer error:`, error);

    }

}

loadArticles("all");
loadPopularPosts();
loadFooterLink("Travel", "travel");
loadFooterLink("Lifestyle", "lifestyle");
loadFooterLink("Health", "health");
loadFooterLink("Technology", "technology");
loadFooterLink("Football", "football");
loadFooterLink("Products", "products");
loadFooterLink("News", "news");