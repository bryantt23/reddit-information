const redditUrl = document.querySelector(".reddit-url"),
    getTextButton = document.querySelector(".get-text"),
    oldRedditUrl = document.querySelector(".old-url"),
    inputRedditUrl = document.querySelector(".input-url"),
    jsonUrlLink = document.querySelector(".json-url"),
    redditOutput = document.querySelector(".reddit-output");

const logToPage = (message) => {
    redditOutput.textContent = message
}

const fallbackCopyToClipboard = text => {
    const tempInput = document.createElement("textarea")
    tempInput.value = text
    document.body.appendChild(tempInput)
    tempInput.select()
    document.execCommand('copy')
    document.body.removeChild(tempInput)
}

async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            console.warn("Clipboard API failed, using fallback:", err);
            fallbackCopyToClipboard(text);
            logToPage("✅ Reddit data copied using fallback");
            return
        }
    }

    fallbackCopyToClipboard(text);
    logToPage("✅ Reddit data copied using fallback");
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
    try {
        const redditUrlText = redditUrl.value.trim();
        if (!redditUrlText) {
            logToPage("❌ No URL entered");
            return;
        }

        const url = new URL(redditUrlText)
        if (!url.hostname.includes("reddit.com")) {
            logToPage("❌ URL must be from reddit.com");
            return
        }

        inputRedditUrl.href = redditUrlText

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

        logToPage("✅ Reddit page data copied to clipboard");
        await copyToClipboard(JSON.stringify(redditData))
    } catch (err) {
        logToPage("❌ Invalid URL format");
        console.error(err)
    }
}

getTextButton.addEventListener("click", () => {
    getPostInformation()
});

redditUrl.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
        getPostInformation()
    }
})