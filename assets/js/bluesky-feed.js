// Renders a Bluesky author feed from the public, unauthenticated Bluesky API.
// Markup lives in _includes/bluesky_feed.liquid; styles in assets/css/bluesky-feed.css.
(function () {
  const API = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed";

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(href, className, text) {
    const a = el("a", className, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function postUrl(post) {
    const rkey = post.uri.split("/").pop();
    return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  // Facet indices are UTF-8 byte offsets, so slice the encoded text rather than the JS string.
  function renderText(record) {
    const p = el("p", "bsky-post-text");
    const text = record.text || "";
    const facets = (record.facets || []).slice().sort((a, b) => a.index.byteStart - b.index.byteStart);
    if (!facets.length) {
      p.textContent = text;
      return p;
    }
    const bytes = new TextEncoder().encode(text);
    const decoder = new TextDecoder();
    let cursor = 0;
    facets.forEach((facet) => {
      const { byteStart, byteEnd } = facet.index;
      if (byteStart < cursor || byteEnd > bytes.length) return;
      p.append(decoder.decode(bytes.slice(cursor, byteStart)));
      const segment = decoder.decode(bytes.slice(byteStart, byteEnd));
      const feature = (facet.features || [])[0] || {};
      let href = null;
      if (feature.$type === "app.bsky.richtext.facet#link") href = feature.uri;
      else if (feature.$type === "app.bsky.richtext.facet#mention") href = `https://bsky.app/profile/${feature.did}`;
      else if (feature.$type === "app.bsky.richtext.facet#tag") href = `https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}`;
      if (href && /^https?:\/\//.test(href)) p.append(link(href, null, segment));
      else p.append(segment);
      cursor = byteEnd;
    });
    p.append(decoder.decode(bytes.slice(cursor)));
    return p;
  }

  function renderEmbed(embed, fallbackUrl) {
    if (!embed) return null;
    const type = embed.$type || "";
    if (type.startsWith("app.bsky.embed.images")) {
      const images = embed.images || [];
      const grid = el("div", "bsky-post-images" + (images.length === 1 ? " single" : ""));
      images.slice(0, 4).forEach((image) => {
        const a = link(fallbackUrl);
        const img = el("img");
        img.src = image.thumb;
        img.alt = image.alt || "";
        img.loading = "lazy";
        a.append(img);
        grid.append(a);
      });
      return grid;
    }
    if (type.startsWith("app.bsky.embed.external") && embed.external) {
      const ext = embed.external;
      if (!/^https?:\/\//.test(ext.uri)) return null;
      const card = link(ext.uri, "bsky-post-card");
      card.append(el("strong", null, ext.title || ext.uri));
      try {
        card.append(el("span", "bsky-post-card-domain", new URL(ext.uri).hostname));
      } catch (e) {}
      return card;
    }
    if (type.startsWith("app.bsky.embed.recordWithMedia")) {
      return renderEmbed(embed.media, fallbackUrl);
    }
    if (type.startsWith("app.bsky.embed.video")) {
      if (!embed.thumbnail) return null;
      return renderEmbed({ $type: "app.bsky.embed.images#view", images: [{ thumb: embed.thumbnail, alt: embed.alt }] }, fallbackUrl);
    }
    return null;
  }

  function renderItem(item, handle) {
    const post = item.post;
    const li = el("li", "bsky-post");
    const meta = el("div", "bsky-post-meta");
    const isRepost = item.reason && item.reason.$type === "app.bsky.feed.defs#reasonRepost";
    meta.append(el("span", null, isRepost ? `Reposted @${post.author.handle}` : post.author.handle === handle ? "" : `@${post.author.handle}`));
    meta.append(link(postUrl(post), null, formatDate(post.record.createdAt || post.indexedAt)));
    li.append(meta);
    li.append(renderText(post.record));
    const embed = renderEmbed(post.embed, postUrl(post));
    if (embed) li.append(embed);
    const stats = [];
    if (post.likeCount) stats.push(`♥ ${post.likeCount}`);
    if (post.repostCount) stats.push(`⟲ ${post.repostCount}`);
    if (post.replyCount) stats.push(`💬 ${post.replyCount}`);
    if (stats.length) li.append(el("div", "bsky-post-stats", stats.join("  ·  ")));
    return li;
  }

  async function load(list) {
    const handle = list.dataset.bskyHandle;
    const limit = Math.min(parseInt(list.dataset.bskyLimit, 10) || 8, 50);
    const status = (message) => {
      list.replaceChildren(el("li", "bsky-feed-status", message));
    };
    try {
      const url = `${API}?actor=${encodeURIComponent(handle)}&limit=${limit}&filter=posts_no_replies`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = (data.feed || []).filter((item) => item.post && item.post.record);
      if (!items.length) {
        status("No posts yet.");
        return;
      }
      list.replaceChildren(...items.map((item) => renderItem(item, handle)));
    } catch (error) {
      list.replaceChildren();
      const li = el("li", "bsky-feed-status", "Couldn't load posts. ");
      li.append(link(`https://bsky.app/profile/${handle}`, null, "View them on Bluesky."));
      list.append(li);
    }
  }

  function init() {
    document.querySelectorAll("[data-bsky-handle]").forEach(load);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
