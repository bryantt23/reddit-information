const redditUrl = document.querySelector(".reddit-url"),
    getTextButton = document.querySelector(".get-text"),
    oldRedditUrl = document.querySelector(".old-url"),
    jsonUrlLink = document.querySelector(".json-url"),
    redditOutput = document.querySelector(".reddit-output");

const logToPage = (message) => {
    redditOutput.textContent = message
}

async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            logToPage("⚠️ navigator.clipboard failed: " + err);
        }
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand("copy");
    } catch (err) {
        logToPage("❌ Fallback copy exception: " + err);
    }

    document.body.removeChild(textArea);
}

async function fetchRedditThread(url) {
    try {
        logToPage("Attempting to fetch data...")
        const jsonUrl = url.endsWith(".json") ? url : url.replace(/\/$/, "") + ".json";
        const proxyUrl = `https://reddit-information-node.onrender.com/reddit?url=${encodeURIComponent(jsonUrl)}`;
        const res = await fetch(proxyUrl);

        if (!res.ok) throw new Error("HTTP error: " + res.status);

        const data = await res.json();

        const post = data[0].data.children[0].data;

        const comments = data[1].data.children;

        function parseComments(comments) {
            return comments.map(c => {
                if (c.kind !== "t1") return;
                const d = c.data;
                let children;
                if (d.replies && d.replies.data) {
                    children = parseComments(d.replies.data.children);
                }
                return {
                    author: d.author,
                    upvotes: d.ups,
                    body: d.body,
                    children
                };
            }).filter(Boolean);
        }

        const result = {
            post: {
                title: post.title,
                author: post.author,
                upvotes: post.ups,
                body: post.selftext
            },
            comments: parseComments(comments)
        };

        return result;

    } catch (err) {
        return null;
    }
}

const getPostInformation = async () => {
    const redditUrlText = redditUrl.value.trim();
    if (!redditUrlText) {
        logToPage("❌ No URL entered");
        return;
    }

    // ✅ Generate Old Reddit and JSON URL immediately
    const oldUrl = redditUrlText.replace("www.", "old.");
    oldRedditUrl.href = oldUrl;

    const jsonUrl = oldUrl.replace(/\/$/, "") + ".json";
    jsonUrlLink.href = jsonUrl;
    jsonUrlLink.textContent = jsonUrl;

    // ⬇️ Optional fetch — doesn't block JSON URL generation
    const redditData = await fetchRedditThread(redditUrlText);
    if (!redditData) {
        logToPage("❌ No data returned");
        return;
    }

    redditOutput.textContent = JSON.stringify(redditData, null, 2);
    copyToClipboard(JSON.stringify(redditData))
}

getTextButton.addEventListener("click", () => {
    getPostInformation()
});

redditUrl.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
        getPostInformation()
    }
})