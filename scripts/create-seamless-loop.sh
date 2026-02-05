#!/bin/bash

# NanoGPT Seamless Loop Creation Script
# 
# This script automates the process of:
# 1. Generating a video with Veo 3.1
# 2. Optionally extending it for seamless looping
# 3. Setting it up for the zoom-then-loop pattern
#
# Usage:
#   ./scripts/create-seamless-loop.sh "Your prompt here"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if prompt provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a prompt${NC}"
    echo ""
    echo "Usage:"
    echo "  ./scripts/create-seamless-loop.sh \"DNA helix rotating\""
    echo ""
    echo "Options:"
    echo "  --duration <seconds>  Video duration (default: 8)"
    echo "  --aspect <ratio>      Aspect ratio (default: 16:9)"
    echo "  --no-extend           Skip the extend step"
    exit 1
fi

PROMPT="$1"
DURATION="${DURATION:-8}"
ASPECT="${ASPECT:-16:9}"
SKIP_EXTEND=false

# Parse additional args
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration)
            DURATION="$2"
            shift 2
            ;;
        --aspect)
            ASPECT="$2"
            shift 2
            ;;
        --no-extend)
            SKIP_EXTEND=true
            shift
            ;;
        *)
            echo -e "${YELLOW}Warning: Unknown option $1${NC}"
            shift
            ;;
    esac
done

echo -e "${GREEN}🎬 NanoGPT Seamless Loop Creator${NC}"
echo ""
echo "Prompt: $PROMPT"
echo "Duration: ${DURATION}s"
echo "Aspect Ratio: $ASPECT"
echo ""

# Check for API key
if [ -z "$NANOGPT_API_KEY" ]; then
    echo -e "${RED}❌ Error: NANOGPT_API_KEY not set${NC}"
    echo ""
    echo "Set your API key:"
    echo "  export NANOGPT_API_KEY='your-key-here'"
    echo ""
    echo "Get your key at: https://nano-gpt.com/dashboard/api"
    exit 1
fi

# Create output directory
mkdir -p public/videos

# Step 1: Generate initial video
echo -e "${GREEN}Step 1: Generating initial video...${NC}"
node scripts/generate-video-loop.js "$PROMPT" --duration "$DURATION" --aspect "$ASPECT" --output generated-temp

# Find the generated file
GENERATED_FILE=$(ls -t public/videos/generated-temp*.mp4 | head -1)

if [ ! -f "$GENERATED_FILE" ]; then
    echo -e "${RED}❌ Error: Generated file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Generated: $GENERATED_FILE${NC}"
echo ""

# Step 2: Extend for seamless loop (unless skipped)
if [ "$SKIP_EXTEND" = false ]; then
    echo -e "${GREEN}Step 2: Extending for seamless loop...${NC}"
    node scripts/generate-video-loop.js "$PROMPT (continuation)" --duration "$DURATION" --aspect "$ASPECT" --extend --output extended-temp
    
    EXTENDED_FILE=$(ls -t public/videos/extended-temp*.mp4 | head -1)
    
    if [ -f "$EXTENDED_FILE" ]; then
        echo -e "${GREEN}✓ Extended: $EXTENDED_FILE${NC}"
        echo ""
        
        # Use extended as the main file
        MAIN_FILE="$EXTENDED_FILE"
    else
        echo -e "${YELLOW}⚠ Extension failed, using original${NC}"
        MAIN_FILE="$GENERATED_FILE"
    fi
else
    MAIN_FILE="$GENERATED_FILE"
fi

# Step 3: Split for zoom-then-loop pattern (optional)
echo -e "${GREEN}Step 3: Setting up for zoom-then-loop pattern...${NC}"
echo ""

TIMESTAMP=$(date +%s)
SAFE_PROMPT=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | cut -c1-30)

# Create zoom and closeup versions using ffmpeg
if command -v ffmpeg &> /dev/null; then
    ZOOM_DURATION=5
    
    echo "Splitting video:"
    echo "  - zoom.mp4 (first ${ZOOM_DURATION}s)"
    echo "  - closeup.mp4 (remaining)"
    echo ""
    
    ffmpeg -y -i "$MAIN_FILE" -t "$ZOOM_DURATION" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "public/videos/zoom-${SAFE_PROMPT}-${TIMESTAMP}.mp4"
    ffmpeg -y -ss "00:00:$ZOOM_DURATION" -i "$MAIN_FILE" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "public/videos/closeup-${SAFE_PROMPT}-${TIMESTAMP}.mp4"
    
    echo -e "${GREEN}✓ Created split versions${NC}"
    echo ""
    
    # Create symlinks for easy use
    ln -sf "zoom-${SAFE_PROMPT}-${TIMESTAMP}.mp4" "public/videos/zoom.mp4" 2>/dev/null || true
    ln -sf "closeup-${SAFE_PROMPT}-${TIMESTAMP}.mp4" "public/videos/closeup.mp4" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Linked as zoom.mp4 and closeup.mp4${NC}"
else
    echo -e "${YELLOW}⚠ ffmpeg not found, skipping split${NC}"
    echo "Install ffmpeg to enable zoom-then-loop splitting:"
    echo "  brew install ffmpeg  # macOS"
    echo "  apt install ffmpeg   # Linux"
    echo ""
    
    # Just copy as background.mp4
    cp "$MAIN_FILE" "public/videos/background.mp4"
    echo -e "${GREEN}✓ Copied as background.mp4${NC}"
fi

# Cleanup temp files
rm -f public/videos/generated-temp*.mp4 public/videos/extended-temp*.mp4 2>/dev/null || true

echo ""
echo -e "${GREEN}✨ Complete!${NC}"
echo ""
echo "Files created:"
ls -lh public/videos/*.mp4 2>/dev/null | tail -5
echo ""
echo "Next steps:"
echo "  1. Preview the video: open public/videos/closeup.mp4"
echo "  2. Test locally: npm run dev"
echo "  3. Deploy: npm run build && npm run deploy"
echo ""
