function logToPage(msg) {
    const logDiv = document.querySelector(".debug-log");
    if (logDiv) {
        const line = document.createElement("div");
        line.textContent = typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg;
        logDiv.appendChild(line);
    }
}

async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            logToPage("Copied to clipboard!");
            return;
        } catch (err) {
            logToPage("navigator.clipboard failed, falling back", err);
        }
    }

    // 🔁 Fallback for mobile
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Required for iOS
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand("copy");
        logToPage(successful ? "Copied (fallback)!" : "Copy failed");
    } catch (err) {
        logToPage("Fallback copy failed: " + err);
    }

    document.body.removeChild(textArea);
}

async function fetchRedditThread(url) {
    try {
        const jsonUrl = url.endsWith(".json") ? url : url.replace(/\/$/, "") + ".json";
        logToPage("Fetching: " + jsonUrl);

        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("Network response was not ok: " + res.status);

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
            }).filter(Boolean); // removes undefined entries
        }

        return {
            post: {
                title: post.title,
                author: post.author,
                upvotes: post.ups,
                body: post.selftext
            },
            comments: parseComments(comments)
        };
    } catch (err) {
        logToPage("❌ Error fetching Reddit thread: " + err.message);
        return null;
    }
}


const redditUrl = document.querySelector(".reddit-url"),
    getTextButton = document.querySelector(".get-text"),
    oldRedditUrl = document.querySelector(".old-url"),
    redditOutput = document.querySelector(".reddit-output")

getTextButton.addEventListener("click", async () => {
    const redditUrlText = redditUrl.value;
    logToPage("trying to get redditData: " + redditUrlText);

    const redditData = await fetchRedditThread(redditUrlText);
    if (!redditData) {
        logToPage("❌ No data returned");
        return;
    }

    logToPage("✅ Data fetched!");
    redditOutput.textContent = JSON.stringify(redditData, null, 2);
    // copyToClipboard(JSON.stringify(redditData, null, 2));
    oldRedditUrl.href = redditUrlText.replace("www", "old");
});
