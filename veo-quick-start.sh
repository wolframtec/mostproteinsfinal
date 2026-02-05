#!/bin/bash
# Veo 3.1 Loop Creator - Quick Start Scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
check_deps() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}FFmpeg not found${NC}"
        echo "Install:"
        echo "  macOS:  brew install ffmpeg"
        echo "  Linux:  sudo apt install ffmpeg"
        exit 1
    fi
    
    if [ -z "$NANOGPT_API_KEY" ]; then
        echo -e "${RED}NANOGPT_API_KEY not set${NC}"
        echo "Run: export NANOGPT_API_KEY='your-key'"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Dependencies OK${NC}"
}

# Help
show_help() {
    cat << EOF
Veo 3.1 Infinite Loop Creator - Quick Start

USAGE:
  ./veo-quick-start.sh <command> [options]

COMMANDS:
  new <name> <video>     Create new project
  resume [name]          Resume existing project
  status <name>          Show project status
  assemble <name>        Jump to assembly menu
  preview <name>         Create preview grid
  export <name>          Export all segment URLs

EXAMPLES:
  # Create new waterfall loop project
  ./veo-quick-start.sh new waterfall ./waterfall.mp4
  
  # Resume last project
  ./veo-quick-start.sh resume
  
  # Create preview of current progress
  ./veo-quick-start.sh preview waterfall

EOF
}

# Create new project
cmd_new() {
    local name=$1
    local video=$2
    
    if [ -z "$name" ] || [ -z "$video" ]; then
        echo "Usage: ./veo-quick-start.sh new <project-name> <source-video>"
        exit 1
    fi
    
    if [ ! -f "$video" ]; then
        echo -e "${RED}Video not found: $video${NC}"
        exit 1
    fi
    
    check_deps
    
    echo -e "${YELLOW}Creating project: $name${NC}"
    echo "Source: $video"
    echo ""
    
    npx tsx veo-loop-creator.ts "$name" "$video"
}

# Resume project
cmd_resume() {
    local name=$1
    
    check_deps
    
    if [ -n "$name" ]; then
        cd "loop-projects/$name" 2>/dev/null || true
    fi
    
    npx tsx veo-loop-creator.ts
}

# Show status
cmd_status() {
    local name=$1
    local dir="loop-projects/${name:-$(ls -t loop-projects 2>/dev/null | head -1)}"
    
    if [ ! -f "$dir/.loop-state.json" ]; then
        echo "No project found"
        exit 1
    fi
    
    echo -e "${GREEN}Project: $(basename "$dir")${NC}"
    cat "$dir/.loop-state.json" | node -e "
        const data = '';
        process.stdin.on('data', c => data.push(c));
        process.stdin.on('end', () => {
            const s = JSON.parse(data.join(''));
            console.log('Segments:', s.segments.length);
            console.log('Approved:', s.approvedSegments.length);
            console.log('Resolution:', s.config.resolution);
            console.log('Target Duration:', s.config.targetTotalDuration + 's');
            if (s.finalOutput) console.log('Final Output:', s.finalOutput);
        });
    " 2>/dev/null || cat "$dir/.loop-state.json"
}

# Quick assemble
cmd_assemble() {
    local name=$1
    local dir="loop-projects/${name:-$(ls -t loop-projects 2>/dev/null | head -1)}"
    
    check_deps
    
    echo -e "${YELLOW}Assembly mode - Project: $(basename "$dir")${NC}"
    echo "This will open the main menu - select option 4 to assemble"
    echo ""
    
    cd "$dir" 2>/dev/null || true
    npx tsx ../../veo-loop-creator.ts
}

# Create preview
cmd_preview() {
    local name=$1
    local dir="loop-projects/${name:-$(ls -t loop-projects 2>/dev/null | head -1)}"
    
    check_deps
    
    echo -e "${YELLOW}Creating preview for: $(basename "$dir")${NC}"
    
    # Create a simple preview using ffmpeg directly
    local segments="$dir/segments/segment_*.mp4"
    local output="$dir/final/preview-auto.mp4"
    
    mkdir -p "$dir/final"
    
    # Get list of approved segments
    local files=$(ls -v $dir/segments/segment_*.mp4 2>/dev/null | head -6)
    
    if [ -z "$files" ]; then
        echo -e "${RED}No segments found${NC}"
        exit 1
    fi
    
    echo "Segments found:"
    echo "$files"
    
    # Create concat list
    local concat_list="$dir/.preview-concat.txt"
    echo "$files" | while read f; do
        echo "file '$(realpath "$f")'"
    done > "$concat_list"
    
    ffmpeg -y -f concat -safe 0 -i "$concat_list" -c copy "$output" 2>/dev/null || {
        echo -e "${RED}FFmpeg failed, falling back to interactive mode${NC}"
        cmd_assemble "$name"
        return
    }
    
    rm "$concat_list"
    
    echo -e "${GREEN}✓ Preview created: $output${NC}"
    echo "Duration: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$output" 2>/dev/null)s"
}

# Export URLs
cmd_export() {
    local name=$1
    local dir="loop-projects/${name:-$(ls -t loop-projects 2>/dev/null | head -1)}"
    local output="$dir/final/segment-urls.txt"
    
    cat "$dir/.loop-state.json" | node -e "
        let data = '';
        process.stdin.on('data', c => data += c);
        process.stdin.on('end', () => {
            const s = JSON.parse(data);
            console.log('=== ' + s.projectName + ' ===');
            console.log('Generated: ' + s.updatedAt);
            console.log('');
            s.segments.forEach(seg => {
                if (seg.videoUrl) {
                    console.log('Segment ' + seg.id + ':');
                    console.log('  URL: ' + seg.videoUrl);
                    console.log('  Prompt: ' + seg.prompt.slice(0, 60) + '...');
                    console.log('  Seed: ' + seg.seed);
                    console.log('  Status: ' + seg.status);
                    console.log('');
                }
            });
        });
    " > "$output"
    
    echo -e "${GREEN}✓ URLs exported to: $output${NC}"
    cat "$output"
}

# Main
case "${1:-help}" in
    new)
        cmd_new "$2" "$3"
        ;;
    resume)
        cmd_resume "$2"
        ;;
    status)
        cmd_status "$2"
        ;;
    assemble)
        cmd_assemble "$2"
        ;;
    preview)
        cmd_preview "$2"
        ;;
    export)
        cmd_export "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
