# Video Background Setup

## Step 1: Add Your Video File

Place your MP4 video file at:
```
public/videos/background.mp4
```

### Video Requirements:
- **Format**: MP4 (H.264 codec for best compatibility)
- **Resolution**: 1920x1080 minimum (4K recommended)
- **Duration**: 10-30 seconds (will loop)
- **File Size**: Keep under 10MB for fast loading
- **Style**: Dark, subtle animations work best with text overlay

## Step 2: Optimize Your Video

### Compression (recommended tools):
- **HandBrake** (free): https://handbrake.fr/
- **FFmpeg** (command line):
  ```bash
  ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k -movflags +faststart output.mp4
  ```
- **Online**: https://www.videosmaller.com/

### Best Practices:
1. **Compress aggressively** - Use H.264 codec
2. **Remove audio** or keep it muted (autoplay requires muted)
3. **First frame as poster** - The video starts immediately
4. **Dark colors** - Text needs to be readable over the video

## Step 3: Test Locally

```bash
# Place video in public/videos/background.mp4
npm run dev
# Visit http://localhost:3000
```

## How It Works

### Component Features (`VideoBackground.tsx`):
- ✅ **Autoplay** - Starts immediately on desktop
- ✅ **Loop** - Seamless continuous playback
- ✅ **Muted** - Required for autoplay
- ✅ **Mobile fallback** - CSS gradient on mobile devices
- ✅ **Dark overlay** - Ensures text readability
- ✅ **Lazy loading** - Poster image shown until loaded
- ✅ **Performance** - Disabled on mobile to save battery

### Current Setup:
The video background replaces the 3D DNA helix animation. To switch back:

**In `src/App.tsx`:**

```tsx
// Use VIDEO background (current)
<VideoBackground 
  videoSrc="/videos/background.mp4"
  overlayOpacity={0.6}
/>

{/* 3D Scene (commented out) */}
{/* <div className="canvas-container">
  <Scene3DWrapper scrollProgress={scrollProgress} />
</div> */}
```

**To use BOTH video + 3D:**
```tsx
<VideoBackground 
  videoSrc="/videos/background.mp4"
  overlayOpacity={0.4}  // Lower opacity to see 3D through video
/>

<div className="canvas-container" style={{ opacity: 0.5 }}>
  <Scene3DWrapper scrollProgress={scrollProgress} />
</div>
```

**To use 3D ONLY (original):**
```tsx
{/* <VideoBackground ... /> */}

<div className="canvas-container">
  <Scene3DWrapper scrollProgress={scrollProgress} />
</div>
```

## Adjusting Opacity

The `overlayOpacity` prop controls how dark the overlay is:
- `0.0` - No overlay (video at full brightness)
- `0.6` - Default (good balance)
- `0.8` - Dark (better text readability)
- `1.0` - Completely black

## Troubleshooting

### Video not playing?
- Check file is at `public/videos/background.mp4`
- Ensure video is H.264 encoded MP4
- Check browser console for errors

### Video too slow/large?
- Compress with HandBrake
- Reduce resolution to 1080p
- Lower bitrate (1-2 Mbps)

### Text hard to read?
- Increase `overlayOpacity` to 0.7 or 0.8
- Use darker video content
- Add text shadows in CSS

### Mobile performance?
- Video automatically disabled on mobile
- Falls back to CSS gradient background
- This is intentional to save battery

## Free Stock Video Resources

If you need a background video:
- **Pexels**: https://www.pexels.com/videos/
- **Pixabay**: https://pixabay.com/videos/
- **Coverr**: https://coverr.co/
- **Mixkit**: https://mixkit.co/free-stock-video/

Search for: "abstract dark", "particles", "technology", "liquid"

## Performance Impact

- **Desktop**: ~2-5MB video download, minimal CPU usage
- **Mobile**: Video disabled, no impact
- **CDN**: Videos cached for 1 year (immutable)

## Deploy

```bash
npm run build
npm run deploy
```

Your video will be served from `/videos/background.mp4` with proper caching headers.
