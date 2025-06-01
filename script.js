async function fetchRedditThread(url) {
    const jsonUrl = url.endsWith(".json") ? url : url.replace(/\/$/, "") + ".json";
    const res = await fetch(jsonUrl);
    const data = await res.json();
    console.log("🚀 ~ fetchRedditThread ~ data:", data)

    const post = data[0].data.children[0].data;
    const comments = data[1].data.children;
    console.log("🚀 ~ fetchRedditThread ~ comments:", comments)

    console.log("Title:", post.title);
    console.log("Author:", post.author);
    console.log("Upvotes:", post.ups);
    console.log("Body:", post.selftext);

    function parseComments(comments, indent = 0) {
        comments.forEach(c => {
            if (c.kind !== "t1") return;
            const d = c.data;
            console.log(" ".repeat(indent * 2) + `- ${d.author} (${d.ups}): ${d.body}`);
            if (d.replies && d.replies.data) {
                parseComments(d.replies.data.children, indent + 1);
            }
        });
    }

    parseComments(comments);
}

fetchRedditThread("https://www.reddit.com/r/seduction/comments/1l0j9cw/i_seems_to_me_that_a_lot_of_my_limiting_beliefs/");

const redditUrl = document.querySelector(".reddit-url")

redditUrl.addEventListener("input", () => {
    console.log(this)
    console.log(redditUrl.textContent)
})