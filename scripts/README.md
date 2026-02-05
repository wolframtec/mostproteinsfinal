# NanoGPT Veo 3.1 Video Generation

Generate AI videos using Google's Veo 3.1 model through the NanoGPT API.

## Setup

1. **Get your API key:**
   - Visit: https://nano-gpt.com/dashboard/api
   - Copy your API key

2. **Set environment variable:**
   ```bash
   export NANOGPT_API_KEY="your-api-key-here"
   ```

   Or create a `.env` file in the project root:
   ```
   NANOGPT_API_KEY=your-api-key-here
   ```

## Usage

### Extend Your Existing Video (Recommended for Your Use Case)

If you already have a video and want to extend it for seamless looping:

```bash
# Basic extension
npm run video:extend -- public/videos/closeup.mp4

# With custom prompt and auto-split
npm run video:extend -- public/videos/closeup.mp4 --prompt "DNA helix continuation" --split

# Full options
npm run video:extend -- public/videos/background.mp4 \
  --prompt "Seamless DNA animation continuation" \
  --duration 8 \
  --split \
  --zoom-duration 5
```

This will:
1. Upload your existing video to NanoGPT
2. Generate an extension using Veo 3.1
3. Download the extended version
4. Optionally split into zoom.mp4 + closeup.mp4

### Generate New Video

### Basic Generation

```bash
# Generate a simple video
node scripts/generate-video-loop.js "DNA helix rotating in dark void"

# Specify duration and aspect ratio
node scripts/generate-video-loop.js "Abstract biotech particles" --duration 10 --aspect 16:9

# Generate vertical video for mobile
node scripts/generate-video-loop.js "Microscopic cells" --aspect 9:16 --duration 8
```

### Creating Seamless Loops

Veo 3.1 has an **extend** feature that creates seamless loops:

```bash
# Generate with loop flag
node scripts/generate-video-loop.js "DNA strands intertwining" --loop

# Or use extend mode for longer videos
node scripts/generate-video-loop.js "Biotech laboratory" --extend --duration 16
```

### Custom Output Name

```bash
node scripts/generate-video-loop.js "Abstract particles" --output my-background
# Saves to: public/videos/my-background.mp4
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--duration <seconds>` | Video length | 8 |
| `--aspect <ratio>` | Aspect ratio (16:9, 9:16, 1:1) | 16:9 |
| `--output <name>` | Output filename | auto-generated |
| `--extend` | Use extend mode | false |
| `--loop` | Optimize for seamless loop | false |

## Prompt Tips for Seamless Loops

Best practices for loopable video prompts:

1. **Continuous motion:**
   - "Rotating DNA helix"
   - "Floating particles"
   - "Pulsing bioluminescent cells"

2. **Avoid directional movement:**
   - ❌ "Car driving left to right" (exits frame)
   - ✅ "Abstract waves flowing" (stays in frame)

3. **Specify looping:**
   - The script automatically adds "seamless loop" to prompts when using `--loop`

## Integration with Your Site

After generating:

```bash
# 1. Generate your video
node scripts/generate-video-loop.js "DNA helix dark background" --loop

# 2. Copy to your videos folder
cp public/videos/veo-dna-helix-*.mp4 public/videos/closeup.mp4

# 3. Rebuild and deploy
npm run build && npm run deploy
```

## API Reference

Based on [NanoGPT Video API Docs](https://docs.nano-gpt.com/api-reference/endpoint/video-generation)

### Models
- `veo3-1-extend` - Google's Veo 3.1 with extend capability (recommended)

### Pricing
Check https://nano-gpt.com/pricing for current rates

### Rate Limits
- Veo 3.1: 1 generation at a time per account
- Generation time: 30 seconds - 2 minutes typically

## Troubleshooting

### "NANOGPT_API_KEY not set"
```bash
export NANOGPT_API_KEY="your-key"
```

### Generation fails
- Check your account balance at https://nano-gpt.com/dashboard
- Ensure prompt doesn't violate content policies

### Video doesn't loop seamlessly
- Use the `--loop` flag for better results
- Try prompts with continuous, non-directional motion
- Consider using the `--extend` feature

## Examples

### DNA Background (Your Use Case)

```bash
# For desktop background (16:9)
node scripts/generate-video-loop.js "DNA double helix structure rotating slowly in dark biotech laboratory, subtle blue glow, microscopic view, cinematic lighting" --duration 10 --loop --output dna-desktop

# For mobile (9:16)
node scripts/generate-video-loop.js "DNA strands forming helix, dark background, bioluminescent particles, seamless rotation" --aspect 9:16 --duration 8 --loop --output dna-mobile
```

### Abstract Biotech

```bash
node scripts/generate-video-loop.js "Abstract microscopic biotech particles floating in dark void, cyan and teal colors, subtle movement, seamless loop" --loop --output particles
```

### Laboratory Theme

```bash
node scripts/generate-video-loop.js "Futuristic laboratory with holographic DNA displays, dark aesthetic, green accent lighting, sci-fi biotech environment" --duration 10 --output lab-bg
```

## Notes

- Generated videos are saved to `public/videos/`
- The script polls every 5 seconds for completion
- Maximum wait time: 5 minutes
- All generations include metadata with prompt and settings
