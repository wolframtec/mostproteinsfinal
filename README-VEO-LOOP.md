# 🎬 Veo 3.1 Infinite Loop Creator

Create seamless, infinite-loop optical illusion videos using Google's Veo 3.1 video extension API via NanoGPT.

## What You Get

| File | Purpose |
|------|---------|
| `veo-loop-creator.ts` | **Main tool** - Full interactive workflow with checkpoints |
| `veo-quick-start.sh` | Bash helper for common operations |
| `veo-quick-test.ts` | Rapid prompt testing without project setup |
| `veo-prompt-templates.json` | Curated prompt library by category |
| `VEO-LOOP-GUIDE.md` | Comprehensive documentation |

## Quick Start (3 options)

### Option 1: Full Project Workflow (Recommended)
```bash
# Setup
npm install openai
export NANOGPT_API_KEY="your-key"

# Create project
npx tsx veo-loop-creator.ts my-project ./source-video.mp4

# Interactive menu guides you through:
# 1. Generate segments one by one
# 2. Review and approve each segment
# 3. Retry if not satisfied
# 4. Assemble final loop
```

### Option 2: Quick Test
```bash
# Test a prompt immediately without project overhead
npx tsx veo-quick-test.ts ./source-video.mp4 "Continue the flowing water motion seamlessly"
```

### Option 3: Bash Helper
```bash
chmod +x veo-quick-start.sh

# New project
./veo-quick-start.sh new my-project ./video.mp4

# Resume
./veo-quick-start.sh resume

# Quick preview
./veo-quick-start.sh preview my-project
```

## The "Never Start Over" Guarantee

Every tool is designed for **iterative refinement**:

1. **Segment-level review** - Each extension is reviewed before approval
2. **Persistent state** - Progress auto-saved to `.loop-state.json`
3. **Selective regeneration** - Re-do any single segment without affecting others
4. **Batch re-prompt** - Change the prompt direction mid-project
5. **Multiple assembly modes** - Forward, ping-pong, crossfade

### Common Scenarios

| Problem | Solution |
|---------|----------|
| Segment 3 looks weird | Menu → `[2] Regenerate specific segment` → Pick #3 → New prompt/seed |
| Want different style after segment 2 | Menu → `[3] Batch regenerate` → New prompt → Start from 3 |
| Loop has visible seam | Try ping-pong assembly; or regenerate last segment with tighter prompt |
| Out of API credits | State is saved; resume anytime with `./veo-quick-start.sh resume` |

## Prompt Templates

See `veo-prompt-templates.json` for:
- Nature (water, clouds, fire, smoke)
- Abstract (shapes, particles, fluids)
- Organic (plants, pulsing, swirls)
- Urban (traffic, mechanical, spinning)
- Character (walk cycles, idle)

## Workflow Example

```bash
# 1. Start
npx tsx veo-loop-creator.ts waterfall ./waterfall-source.mp4

# 2. Generate Segment 1
#    Review → Approve → Continue

# 3. Generate Segment 2  
#    Review → Not quite right → Edit prompt → Regenerate → Approve

# 4. Generate Segments 3-4
#    All approved on first try

# 5. Assemble
#    Choose ping-pong mode

# 6. Result: waterfall-pingpong.mp4 (seamless infinite loop)
```

## Requirements

- Node.js 18+
- FFmpeg (`brew install ffmpeg` or `apt install ffmpeg`)
- NanoGPT API key

## Cost

Veo 3.1 extensions cost ~$0.50-2.00 each depending on resolution/duration. The tool minimizes waste by:
- Letting you review before generating more
- Saving all URLs for re-download
- Supporting regeneration of individual segments

## Next Steps

1. Read `VEO-LOOP-GUIDE.md` for detailed docs
2. Check `veo-prompt-templates.json` for inspiration
3. Run `npx tsx veo-loop-creator.ts` to start
