function copyToClipboard(text) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
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