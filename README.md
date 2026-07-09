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
`assets/video/hero-bridge-truck.mp4` was delivered as a 138MB 4K master (3840x2160,
45Mbps, with audio). That's committed to git (GitHub rejects anything over 100MB) and
far too heavy to serve as a background video on any host. It's been re-encoded to
1080p H.264, audio stripped (it only ever plays muted), `crf 26`, with `+faststart`
for progressive playback:

```
ffmpeg -i hero-bridge-truck.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset medium -an -movflags +faststart hero-bridge-truck.mp4
```

Result: 138MB → 26MB. If the original 4K master is needed again, ask for it —
it isn't kept in this repo.

Referenced in:
- `index.html` — hero slider, slide 1
- `index.html` — Fleet Strength section
- `fleet.html` — Fleet Overview section
- `solutions.html` — sections 01 and 03

## Deploy
No build step — any static host (Netlify, Vercel, GitHub Pages, S3) can serve this
folder as-is once the video is handled per above.
