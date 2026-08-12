import { getArticlePreview } from "./articlePreviews";
import { profilePhotoUrl } from "./photos";
import { cleanText } from "./text";

export async function getCommunityUpdateCards(updates = []) {
  return Promise.all(updates.map(updateViewModel));
}

export async function updateViewModel(update = {}) {
  const social = socialPreview(update.linkUrl);
  const linkPreview = update.linkUrl
    ? await getArticlePreview(update.linkUrl)
    : null;
  const mentions = uniqueMentions(update.mentions || []);

  return {
    ...update,
    social,
    linkPreview: linkPreview || genericLinkPreview(update.linkUrl, social),
    mentions,
    people: mentions.map(personPreview),
  };
}

export function previewTitle(preview = null) {
  return cleanText(preview?.title || "Linked context");
}

export function previewDescription(preview = null, linkUrl = "") {
  return cleanText(preview?.description || linkHost(linkUrl));
}

export function mentionParts(comment = "", mentions = []) {
  const text = cleanText(comment);
  const activeMentions = mentions.filter((mention) => mention.name && mention.path);
  if (!text || !activeMentions.length) return [{ text }];

  const pattern = new RegExp(
    `@(${activeMentions.map((mention) => escapeRegExp(mention.name)).join("|")})`,
    "gi",
  );
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    const name = cleanText(match[1]);
    const mention = activeMentions.find((item) => item.name.toLowerCase() === name.toLowerCase());
    parts.push({
      text: `@${name}`,
      href: peopleProfilePath(mention),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex) });
  return parts;
}

function uniqueMentions(mentions = []) {
  const seen = new Set();
  return mentions.filter((mention) => {
    const key = mention.personId || mention.personid || mention.filerEntityNumber || mention.path || mention.name;
    if (!key || seen.has(String(key))) return false;
    seen.add(String(key));
    return true;
  });
}

function personPreview(mention = {}) {
  const photoUrl = profilePhotoUrl(
    mention.photoUrl ||
      mention.photo_url ||
      mention.photo ||
      mention.profilePhotoUrl ||
      mention.profile_photo_url ||
      mention.personPhotoUrl ||
      mention.person_photo_url ||
      mention.legislatorPhotoUrl ||
      mention.legislator_photo_url ||
      mention.candidatePhotoUrl ||
      mention.candidate_photo_url,
  );
  const role =
    mention.office ||
    mention.roleLabel ||
    mention.chamber ||
    (mention.isCurrentLegislator ? "Legislator" : mention.is2026Candidate ? "Candidate" : "");
  const district = mention.profileDistrict || mention.district || "";
  const districtLabel = [
    mention.county,
    district ? `District ${district}` : "",
  ].filter(Boolean).join(", ");

  return {
    ...mention,
    path: peopleProfilePath(mention),
    photoUrl,
    role,
    districtLabel,
  };
}

export function peopleProfilePath(mention = {}) {
  const existingPath = String(mention.path || "").trim();
  const key =
    mention.peopleSlug ||
    mention.people_slug ||
    mention.personSlug ||
    mention.person_slug ||
    mention.unifiedSlug ||
    mention.unified_slug ||
    mention.personId ||
    mention.person_id ||
    mention.personid ||
    mention.gcPersonid ||
    mention.gc_personid ||
    mention.employeeno ||
    mention.filerEntityNumber ||
    mention.filer_entity_number ||
    mention.slug;

  if (key) return `/people/${encodeURIComponent(String(key))}`;
  if (existingPath.startsWith("/people/")) return existingPath;
  if (existingPath.startsWith("/candidates/")) {
    return `/people/${existingPath.replace(/^\/candidates\/+/, "")}`;
  }

  return existingPath;
}

function linkHost(value = "") {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function instagramPreview(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["instagram.com", "instagr.am"].includes(host)) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const first = parts[0]?.toLowerCase() || "";
    const reservedPaths = new Set([
      "about",
      "accounts",
      "api",
      "developer",
      "directory",
      "explore",
      "legal",
      "oauth",
      "privacy",
      "terms",
    ]);
    const labels = {
      p: "Instagram post",
      reel: "Instagram reel",
      reels: "Instagram reel",
      tv: "Instagram video",
      stories: "Instagram story",
    };
    const isProfile = Boolean(first && !labels[first] && !reservedPaths.has(first));
    const isEmbeddable = Boolean(labels[first] && first !== "stories");
    const label = labels[first] || (isProfile ? "Instagram profile" : "Instagram link");
    const handle =
      first === "stories"
        ? parts[1]
        : labels[first]
          ? ""
          : parts[0] || "";

    return {
      label,
      handle,
      host,
      isEmbeddable,
      isProfile,
      permalink: cleanPermalink(url),
    };
  } catch {
    return null;
  }
}

function tiktokPreview(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"].includes(host)) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const handle = parts.find((part) => part.startsWith("@"))?.replace(/^@/, "") || "";
    const videoIndex = parts.findIndex((part) => part.toLowerCase() === "video");
    const videoId = videoIndex >= 0 ? parts[videoIndex + 1] || "" : "";
    const isProfile = Boolean(handle && !videoId);
    const isEmbeddable = Boolean(videoId);

    return {
      label: videoId ? "TikTok video" : isProfile ? "TikTok profile" : "TikTok link",
      handle,
      host,
      isEmbeddable,
      isProfile,
      videoId,
      permalink: cleanPermalink(url),
    };
  } catch {
    return null;
  }
}

function facebookPreview(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["facebook.com", "m.facebook.com", "fb.watch"].includes(host)) return null;

    const permalink = cleanPermalink(url, { keepSearch: true });
    const path = url.pathname.toLowerCase();
    const label = host === "fb.watch" || path.includes("/reel/") || path.includes("/videos/") || path.includes("/watch/")
      ? "Facebook video"
      : path.includes("/posts/") || path.includes("/permalink/")
        ? "Facebook post"
        : "Facebook link";

    return {
      label,
      host,
      permalink,
      embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(permalink)}&show_text=true&width=500`,
    };
  } catch {
    return null;
  }
}

function substackPreview(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const isSubstackHost = host === "substack.com" || host.endsWith(".substack.com");
    if (!isSubstackHost) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const first = parts[0]?.toLowerCase() || "";
    const publication = host.endsWith(".substack.com")
      ? host.replace(/\.substack\.com$/, "")
      : "";
    const handle = parts.find((part) => part.startsWith("@"))?.replace(/^@/, "") || "";
    const isPost = parts.includes("p") || first === "p";
    const isProfile = Boolean(handle || (!isPost && (publication || first === "profile")));

    return {
      label: isPost ? "Substack post" : isProfile ? "Substack profile" : "Substack link",
      handle,
      host,
      isPost,
      isProfile,
      publication,
      permalink: cleanPermalink(url, { keepSearch: true }),
    };
  } catch {
    return null;
  }
}

function cleanPermalink(url, { keepSearch = false } = {}) {
  const cleanUrl = new URL(url.toString());
  if (!keepSearch) cleanUrl.search = "";
  cleanUrl.hash = "";
  return cleanUrl.toString();
}

export function socialPreview(value = "") {
  const tikTok = tiktokPreview(value);
  if (tikTok) return { ...tikTok, type: "tiktok" };
  const facebook = facebookPreview(value);
  if (facebook) return { ...facebook, type: "facebook" };
  const instagram = instagramPreview(value);
  if (instagram) return { ...instagram, type: "instagram" };
  const substack = substackPreview(value);
  if (substack) return { ...substack, type: "substack" };
  return null;
}

function genericLinkPreview(value = "", social = null) {
  if (!value) return null;
  const substackDescription = social?.type === "substack"
    ? social.handle
      ? `@${social.handle} on Substack`
      : social.publication
        ? `${social.publication} on Substack`
        : "Substack"
    : "";

  return {
    title: social?.label || "Linked context",
    description: substackDescription || (social?.handle ? `@${social.handle}` : linkHost(value)),
    imageUrl: "",
  };
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
