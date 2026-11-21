import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "./video";

describe("videoEmbedUrl", () => {
  it.each([
    [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    ],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    [
      "https://m.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    ],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
  ])("embeds %s", (url, embed) => {
    expect(videoEmbedUrl(url)).toBe(embed);
  });

  it.each([
    null,
    "",
    "not a url",
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=<script>",
    "https://example.com/video.mp4",
    "https://vimeo.com/channels/staff",
  ])("gives null for %s", (url) => {
    expect(videoEmbedUrl(url)).toBeNull();
  });
});
