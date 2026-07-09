# NiBha Logistics — Website

Static, dependency-free HTML/CSS/JS site for NiBha Logistics (pan-India cold chain transport).

## Pages
- `index.html` — Home
- `about.html` — About Us
- `solutions.html` — Solutions
- `fleet.html` — Fleet
- `contact.html` — Contact
- `careers.html` — Careers

## Structure
```
assets/
  css/style.css   — shared stylesheet for all pages
  js/main.js      — nav, reveal animations, testimonial slider, hero slider
  img/            — photos, logo, banner artwork
  video/          — hero background video (not committed, see below)
```

## Hero video
`assets/video/hero-bridge-truck.mp4` is excluded from this repo via `.gitignore` — at
138MB it exceeds GitHub's 100MB per-file push limit and is too large to serve raw
from a git-based host anyway. Before deploying:

1. Compress it (e.g. `ffmpeg -i hero-bridge-truck.mp4 -vcodec libx264 -crf 28 -vf scale=1920:-2 hero-bridge-truck.mp4`) to a web-friendly size, or
2. Host it on a CDN (Cloudinary, Bunny, S3 + CloudFront, etc.) and update the `<source>` URLs in `index.html`, `fleet.html`, and `solutions.html`.

It's referenced in three places:
- `index.html` — hero slider, slide 1
- `index.html` — Fleet Strength section
- `fleet.html` — Fleet Overview section
- `solutions.html` — sections 01 and 03

## Deploy
No build step — any static host (Netlify, Vercel, GitHub Pages, S3) can serve this
folder as-is once the video is handled per above.
