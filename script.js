function logToPage(msg) {
    const logDiv = document.querySelector(".debug-log");
    if (logDiv) {
        const line = document.createElement("div");
        line.textContent = typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg;
        logDiv.appendChild(line);
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

async function copyToClipboard(text) {
    logToPage("📋 Attempting clipboard copy");

    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            logToPage("✅ Copied to clipboard using navigator.clipboard!");
            return;
        } catch (err) {
            logToPage("⚠️ navigator.clipboard failed: " + err);
        }
    }

    logToPage("🔁 Fallback clipboard method triggered");

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
        logToPage(successful ? "✅ Copied (fallback)!" : "❌ Fallback copy failed");
    } catch (err) {
        logToPage("❌ Fallback copy exception: " + err);
    }

    document.body.removeChild(textArea);
}

async function fetchRedditThread(url) {
    logToPage("🚀 fetchRedditThread called");

    try {
        const jsonUrl = url.endsWith(".json") ? url : url.replace(/\/$/, "") + ".json";
        logToPage("🔗 Fetching: " + jsonUrl);

        const res = await fetch(jsonUrl);
        logToPage("📡 Response received: status " + res.status);

        if (!res.ok) throw new Error("HTTP error: " + res.status);

        const data = await res.json();
        logToPage("✅ JSON parsed");

        const post = data[0].data.children[0].data;
        logToPage("📄 Post title: " + post.title);

        const comments = data[1].data.children;

        function parseComments(comments) {
            logToPage("🔍 Parsing " + comments.length + " comments");
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

        logToPage("✅ Final data built");
        return result;

    } catch (err) {
        logToPage("❌ Error in fetchRedditThread: " + err.message);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    logToPage("✅ DOMContentLoaded");

    const redditUrl = document.querySelector(".reddit-url"),
        getTextButton = document.querySelector(".get-text"),
        oldRedditUrl = document.querySelector(".old-url"),
        jsonUrlLink = document.querySelector(".json-url"),
        redditOutput = document.querySelector(".reddit-output");

    getTextButton.addEventListener("click", async () => {
        logToPage("🟡 Button clicked");

        const redditUrlText = redditUrl.value.trim();
        if (!redditUrlText) {
            logToPage("❌ No URL entered");
            return;
        }

        logToPage("📥 URL input: " + redditUrlText);

        // ✅ Generate Old Reddit and JSON URL immediately
        const oldUrl = redditUrlText.replace("www.", "old.");
        oldRedditUrl.href = oldUrl;
        logToPage("🔗 Old Reddit URL updated: " + oldUrl);

        const jsonUrl = oldUrl.replace(/\/$/, "") + ".json";
        jsonUrlLink.href = jsonUrl;
        jsonUrlLink.textContent = jsonUrl;
        logToPage("📎 Reddit JSON URL: " + jsonUrl);

        // ⬇️ Optional fetch — doesn't block JSON URL generation
        const redditData = await fetchRedditThread(redditUrlText);
        if (!redditData) {
            logToPage("❌ No data returned");
            return;
        }

        logToPage("✅ Reddit data fetched");
        redditOutput.textContent = JSON.stringify(redditData, null, 2);
    });

});
