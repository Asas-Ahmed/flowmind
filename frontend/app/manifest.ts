import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowMind - Focus. Flow. Achieve.",
    short_name: "FlowMind",
    description:
      "An intelligent productivity workspace for tasks, habits, focus sessions, schedules, and productivity insights.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    orientation: "any",
    categories: ["productivity", "utilities", "lifestyle"],
    icons: [
      {
        src: "/brand/flowmind-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/flowmind-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/flowmind-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/pwa/flowmind-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "FlowMind productivity dashboard",
      },
      {
        src: "/pwa/flowmind-mobile.png",
        sizes: "452x973",
        type: "image/png",
        label: "FlowMind mobile productivity dashboard",
      },
    ],
  };
}
