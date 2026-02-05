# Veo 3.1 Infinite Loop Creator

A robust, checkpoint-based tool for creating seamless infinite loop videos using Google's Veo 3.1 video extension API via NanoGPT.

## Overview

This tool creates optical illusion loops by:
1. Taking your source video
2. Using Veo 3.1's "extend" feature (which uses the **final frame** as the starting point)
3. Generating segments that continue the motion seamlessly
4. Assembling them in various loop configurations

## Quick Start

```bash
# Install dependencies
npm install openai

# Set your API key
export NANOGPT_API_KEY="your-api-key"

# Make sure you have FFmpeg installed
ffmpeg -version  # Should show version info

# Run the tool
npx tsx veo-loop-creator.ts
```

## Workflow Philosophy: Review at Every Step

The tool is designed so you **never have to start over completely**. Every segment is:
- **Reviewed individually** before approval
- **Saved with full metadata** (prompt, seed, URL)
- **Easily regeneratable** with tweaked parameters
- **Independent** - one bad segment doesn't ruin the whole project

## Step-by-Step Usage

### 1. Start a New Project

```bash
npx tsx veo-loop-creator.ts my-project ./source-video.mp4
```

Or run without arguments for interactive mode.

### 2. Generate Segments (Iterative)

The tool will generate Segment 1, then ask you to review it:

```
📋 Review Segment 1
File: ./loop-projects/my-project/segments/segment_1.mp4

Options:
  [a]pprove - Use this segment
  [r]etry   - Regenerate with same prompt
  [e]dit    - Regenerate with modified prompt
  [s]kip    - Discard and stop here
```

**Your choices:**
- **Approve**: Keep it, move to next segment
- **Retry**: Same prompt, different random seed (if visual glitch)
- **Edit**: Modify the prompt (if direction is wrong)
- **Skip**: Stop generation here

### 3. Continue or Pause

After each approval:
```
Continue to segment 2? (y/n):
```

Say **no** anytime to pause. Your progress is saved.

### 4. Resume Later

Run the tool again:
```bash
npx tsx veo-loop-creator.ts
```

It detects your project:
```
Found existing project "my-project". Resume? (y/n): y
```

### 5. Assembly Options

Once you have approved segments, assemble the final loop:

```
Assembly options:
  [1] Forward only (segments in order)
  [2] Ping-pong (forward + reversed) ← Best for infinite loops
  [3] Forward + crossfade
  [4] Create preview grid only
```

**Recommendation**: Start with `[4]` preview grid to see all segments side-by-side, then `[2]` ping-pong for the final loop.

## Regeneration Strategies

### Scenario: Segment 3 looks wrong

```
Main Menu → [2] Regenerate specific segment

Existing segments:
  [1] ✓ Continue the seamless motion...
  [2] ✓ Continue the seamless motion...
  [3] ✓ Continue the seamless motion...

Which segment to regenerate? 3
New prompt (empty to keep): Continue the seamless motion from the final frame. Maintain the water ripple pattern exactly.
New seed (empty for random): 999
```

### Scenario: Want to change direction after segment 2

```
Main Menu → [3] Batch regenerate (change prompt)

Enter new base prompt: Shift to golden hour lighting, continue the flowing water motion
Start from segment (1): 3
```

This discards segments 3+ and lets you continue with a new prompt.

## Directory Structure

```
loop-projects/
└── my-project/
    ├── .loop-state.json          # Project state (auto-saved)
    ├── segments/
    │   ├── segment_1.mp4         # Downloaded segments
    │   ├── segment_2.mp4
    │   └── ...
    ├── reversed/                 # Auto-created for ping-pong
    │   ├── reversed_2.mp4
    │   └── reversed_1.mp4
    └── final/
        ├── my-project-pingpong.mp4
        ├── my-project-info.txt   # Metadata about creation
        └── preview-grid.mp4
```

## Prompt Engineering Tips

### Base Prompt Structure

```
Continue the seamless motion from the final frame. 
Maintain exact [lighting, color palette, camera angle, visual style].
The [subject] should [desired motion] as if the video never ended.
Avoid [undesirable elements].
```

### Examples by Content Type

**Flowing Water/Nature:**
```
Continue the seamless water flowing motion from the final frame. 
Maintain the exact lighting, ripple patterns, and color temperature. 
The stream should flow naturally downstream, keeping the rocks and vegetation consistent.
```

**Abstract/Geometric:**
```
Continue the morphing geometric pattern seamlessly from the final frame.
Maintain the same color palette (deep blues and purples) and glow intensity.
The shapes should transform fluidly without abrupt changes.
```

**Smoke/Fire:**
```
Extend the smoke plume naturally from the final frame.
Keep the same atmospheric lighting and particle density.
The smoke should rise and dissipate consistently.
```

**Character/Subject Motion:**
```
Continue the walking cycle seamlessly from the final frame.
Maintain the same character pose, lighting direction, and background perspective.
The motion should loop naturally for an infinite walk cycle.
```

### Seed Strategy

- **Same seed + different prompt** = Similar style, different content
- **Different seed + same prompt** = Same direction, different random variation
- **Seed = 42, 43, 44...** = Sequential variations
- **Seed = 999, 1337, 12345** = Completely different random seeds

## Troubleshooting

### "Video generation failed"

- Check your `NANOGPT_API_KEY`
- Verify the source video format (MP4 recommended)
- Try reducing resolution to 720p

### "Segment doesn't match"

Veo 3.1 extends from the **final frame**, but may drift over time:
1. Use shorter segments (5s instead of 8s)
2. Add more specific constraints to prompt
3. Use consistent seeds
4. Try the "ping-pong" assembly to minimize drift

### "The loop has a visible seam"

The seam can be at two places:
1. **Between segments** → Try crossfade assembly
2. **At the loop point** → This is the hard one:
   - Ensure your source video ends where it should loop
   - Use ping-pong assembly
   - Consider filming/designing the source specifically for looping

### FFmpeg errors

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

## Advanced: Preparing Source Video

For best results, your source video should:

1. **End at a "neutral" frame** - The final frame should be representative of the loop point
2. **Have consistent lighting** - Avoid time-lapse or lighting changes
3. **Use locked camera** - No camera movement (or very smooth)
4. **Be 5-15 seconds** - Shorter is fine; Veo will extend it

### Example: Creating a Water Loop

```bash
# 1. Start with 8s of flowing water
# 2. Generate 3 extensions (24s total forward)
# 3. Ping-pong assembly (48s total, seamless loop)
```

## Cost Estimates

Based on NanoGPT pricing (check current rates):
- Each Veo 3.1 extension: ~$0.50-2.00 depending on resolution/duration
- 4 segments at 1080p/8s: ~$8-16
- Regenerations cost the same

## Full Menu Reference

```
[1] Generate/continue segments
    → Interactive generation with per-segment review

[2] Regenerate specific segment
    → Pick one segment, modify prompt/seed, retry

[3] Batch regenerate (change prompt)
    → New base prompt, clear segments from N onwards

[4] Assemble final loop
    → Forward / Ping-pong / Crossfade / Preview

[5] View segment status
    → See which are approved/pending/failed

[6] Export segment URLs
    → Get direct URLs for manual download

[q] Quit
    → Saves state, exit safely
```

## Tips for Satisfying Results

1. **Start small**: Generate 2-3 segments first, preview, then continue
2. **Use consistent seeds**: Helps maintain visual coherence
3. **Film/source with looping in mind**: The source matters more than the AI
4. **Ping-pong is forgiving**: Small discontinuities are hidden by reversal
5. **Keep prompts tight**: Specific motion descriptors beat generic ones
6. **Review on loop**: Watch segments in a loop player to catch seams early

## Example Session

```bash
$ npx tsx veo-loop-creator.ts waterfall ./waterfall-source.mp4

🎬 Veo 3.1 Infinite Loop Creator

Initializing project...
✅ Project initialized!

Main Menu
==========
[1] Generate/continue segments
...

Choice: 1

🎯 Target: 4 segments for ~32s total

🎬 Generating Segment 1
Prompt: Continue the seamless motion from the final frame...
Job submitted: job_abc123
Status: completed
✅ Segment 1 complete! (45.2s)

📋 Review Segment 1
Options: [a]pprove [r]etry [e]dit [s]kip
Your choice: a
✓ Approved

Continue to segment 2? (y/n): y

🎬 Generating Segment 2
...

[After all segments]

Choice: 4  # Assemble
Assembly options: [1/2/3/4]
Choose: 2  # Ping-pong

Reversing video: segment_3.mp4...
Reversing video: segment_2.mp4...
Reversing video: segment_1.mp4...
Concatenating segments...

✅ Final video created!
   Path: ./loop-projects/waterfall/final/waterfall-pingpong.mp4
   Duration: 64.0s
```
