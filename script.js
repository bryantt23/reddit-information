async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
            return;
        } catch (err) {
            console.warn("navigator.clipboard failed, falling back", err);
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
        alert(successful ? "Copied (fallback)!" : "Copy failed");
    } catch (err) {
        alert("Fallback copy failed: " + err);
    }

    document.body.removeChild(textArea);
}



async function fetchRedditThread(url) {
    const jsonUrl = url.endsWith(".json") ? url : url.replace(/\/$/, "") + ".json";
    const res = await fetch(jsonUrl);
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
            }
        });
    };

    return {
        post: {
            title: post.title,
            author: post.author,
            upvotes: post.ups,
            body: post.selftext
        },
        comments:
            parseComments(comments)
    }
}

const redditUrl = document.querySelector(".reddit-url"),
    getTextButton = document.querySelector(".get-text"),
    oldRedditUrl = document.querySelector(".old-url")

getTextButton.addEventListener("click", async () => {
    const redditUrlText = redditUrl.value
    console.log("🚀 ~ getTextButton.addEventListener ~ redditUrlText:", redditUrlText)
    const redditData = await fetchRedditThread(redditUrlText)
    copyToClipboard(JSON.stringify(redditData, null, 2));
    oldRedditUrl.href = redditUrlText.replace("www", "old")
})