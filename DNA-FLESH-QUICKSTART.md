# DNA → Flesh Infinite Loop - Quick Start

**Video:** `/Users/aaronalston/Downloads/DNA_Sequence_to_Realistic_Flesh_Video.mp4`  
**Specs:** 1280x720, 8 seconds

## One-Command Start

```bash
export NANOGPT_API_KEY="your-key"
npx tsx dna-flesh-loop.ts
```

## What This Does

1. **Analyzes your video** - DNA helix transforming into realistic flesh tissue
2. **Extends from the final frame** (the flesh state) using Veo 3.1
3. **Creates seamless segments** that continue the biological transformation
4. **Assembles an infinite loop** - ping-pong style for perfect seamless playback

## Recommended Settings

### For "Full Circle" Loop (DNA → Flesh → DNA)
- **Style:** `[1] Cycle`
- **Extensions:** `2-3`
- **Assembly:** `[2] Ping-pong loop`
- **Result:** DNA morphs to flesh, then reverses back to DNA - infinite cycle

### For "Living Tissue" Loop (Continuous flesh motion)
- **Style:** `[2] Organic Flow`
- **Extensions:** `2`
- **Assembly:** `[2] Ping-pong loop`
- **Result:** Flesh pulses and flows organically, seamless biological rhythm

### For "Genetic Spiral" Loop (DNA within flesh)
- **Style:** `[3] Spiral DNA`
- **Extensions:** `2-3`
- **Assembly:** `[2] Ping-pong loop`
- **Result:** DNA helixes spiral within the flesh tissue, surfacing and receding

## How Veo 3.1 Extension Works

```
Your Video (8s):
[DNA] → [transforming] → [FLESH - final frame]
                           ↑
                           Veo 3.1 starts here
                           
Extension 1 (8s):
[FLESH] → [continues] → [next phase]
                         ↑
                         Extension 2 starts here
                         
Extension 2 (8s):
[next phase] → [continues] → [loop-ready state]
```

**Ping-pong assembly:** Play forward through all segments, then reverse through them backwards. This hides any seam between the end and beginning.

## Workflow Example

```
$ npx tsx dna-flesh-loop.ts

🧬 DNA → Flesh Infinite Loop Creator

Source: DNA_Sequence_to_Realistic_Flesh_Video.mp4
Resolution: 1280x720 | Duration: 8s

Choose transformation style:
  [1] Cycle (DNA → Flesh → DNA loop)
  [2] Organic Flow (continuous flesh pulsing)
  [3] Spiral DNA (DNA helixes emerging from flesh)
  [4] Infinite Metamorphosis (constant shifting)
  [c] Custom prompt

Choice: 1

How many extensions? (1-4) [2]: 2

📤 Uploading source video...
🎬 Extension 1/2
Job: job_xxx | Waiting.....
✅ Complete! Downloading...
Open to preview? (y/n): y  ← Opens in your video player

🎬 Extension 2/2
...

🎬 Assembly Options:
  [1] Forward only
  [2] Ping-pong loop
  [3] Just save segments

Choice: 2
Creating infinite loop...
✅ Infinite loop created: ./dna-flesh-loop-project/dna-flesh-infinite-loop.mp4
```

## If You're Not Satisfied

### Problem: Extension doesn't match the flesh texture
**Solution:** After preview, choose `n` to not open, then at the prompt modify the prompt to be more specific:
- "Continue with the SAME photorealistic skin texture and lighting"
- "Maintain identical flesh color and subsurface scattering"

### Problem: The loop has a visible jump
**Solution:** 
1. This usually happens between extension 2→3 or at the loop point
2. Try fewer extensions (2 instead of 3)
3. Use ping-pong assembly - it hides seams by reversing
4. Add a custom prompt emphasizing "seamless, no jumps, continuous"

### Problem: The transformation goes off in weird direction
**Solution:**
1. Choose `[c] Custom prompt` and be very specific
2. Use seed control (the script auto-uses 42, 43, 44...)
3. Try a different style (maybe `[2] Organic Flow` is more stable than `[1] Cycle`)

## Prompts Used (for reference)

**Cycle Style:**
> "Continue the biological transformation seamlessly from the final frame. The realistic flesh tissue continues to pulse and flow with microscopic DNA helix patterns visible beneath the surface. Seamless organic motion."

> "Extend the morphing sequence from the flesh state. The tissue gradually reveals spiral genetic patterns within its structure, transitioning back toward the DNA helix form. Maintain biological realism."

**Organic Flow:**
> "Continue the organic flesh motion from the final frame. The living tissue pulses with biological rhythm, maintaining the same lighting and texture. Subtle DNA helix shadows dance within the flesh."

## Output Files

```
dna-flesh-loop-project/
├── segments/
│   ├── ext_1.mp4          # First extension
│   └── ext_2.mp4          # Second extension
├── reversed/
│   ├── rev_2.mp4          # Reversed segment 2
│   └── rev_1.mp4          # Reversed segment 1
├── dna-flesh-infinite-loop.mp4   # FINAL OUTPUT
└── urls.txt               # Direct URLs to re-download
```

## Cost Estimate

- Each extension: ~$0.50-1.00 (720p, 8s)
- 2 extensions: ~$1-2
- 3 extensions: ~$1.50-3

If a generation fails, you can retry that specific one without paying for the others again.

## Quick Retry Command

If you want to try again with different settings:

```bash
# Delete old project and start fresh
rm -rf dna-flesh-loop-project
npx tsx dna-flesh-loop.ts
```

Or use the full `veo-loop-creator.ts` for more granular control.
