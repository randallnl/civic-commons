export const civicGuides = [
  {
    href: "/state-government",
    title: "How New Hampshire State Government Works",
    kicker: "Civic Basics",
    category: "Government",
    description:
      "A plain-language guide to the different levels of New Hampshire government, with extra focus on state representatives and senators.",
    readTime: "7 min read",
    image: organizationAssetUrl("Capital banner.png"),
    featured: true,
  },
  {
    href: "/how-bills-become-law",
    title: "How Bills Move Through the NH Legislature",
    kicker: "Legislative Process",
    category: "Bills",
    description:
      "Follow real examples of bills that passed, changed, died early, or went to a Committee of Conference.",
    readTime: "6 min read",
    image: organizationAssetUrl("nh chamber.jpg"),
    featured: true,
  },
  {
    href: "/free-staters",
    title: "What Free State Aligned Means",
    kicker: "Political Context",
    category: "Accountability",
    description:
      "Learn how NH Deserves Better identifies Free State aligned candidates and legislators, and why that context matters.",
    readTime: "5 min read",
    image: organizationAssetUrl("freestateprojectlogo.png"),
    featured: true,
  },
  {
    href: "/vote-grades",
    title: "How Vote Grades Are Calculated",
    kicker: "Data Guide",
    category: "Votes",
    description:
      "Understand how online testimony alignment is used to produce legislator grades and how nonvotes are handled.",
    readTime: "4 min read",
    image: organizationAssetUrl("capital dome.png"),
  },
  {
    href: "/vote-interpretations",
    title: "How Vote Interpretations Work",
    kicker: "Data Guide",
    category: "Votes",
    description:
      "See how recorded votes, motions, bill tracker context, and public testimony become the vote labels shown across the site.",
    readTime: "4 min read",
    image: organizationAssetUrl("nh chamber.jpg"),
  },
  {
    href: "/profile-cleanup-guide",
    title: "Profile Cleanup Work Instructions",
    kicker: "Volunteer Resource",
    category: "Volunteer",
    description:
      "Step-by-step instructions for checking candidate and legislator profiles, finding reliable photos, websites, and public social links.",
    readTime: "8 min read",
    image: "/volunteer-guides/profile-cleanup-queue.svg",
  },
  {
    href: "/reports/nh-education-aid-per-pupil",
    title: "Education Aid Per Pupil Report",
    kicker: "Research",
    category: "Education",
    description:
      "Explore how state education aid and local district context connect to school funding debates.",
    readTime: "Interactive",
    image: organizationAssetUrl("school building.png"),
  },
];

export const featuredCivicGuides = civicGuides.filter((guide) => guide.featured);

function organizationAssetUrl(filename = "") {
  return `/api/organization-assets/${String(filename)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}
