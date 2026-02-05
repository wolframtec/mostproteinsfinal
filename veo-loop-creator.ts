#!/usr/bin/env tsx
/**
 * Veo 3.1 Infinite Loop Creator
 * 
 * A robust, iterative tool for creating seamless infinite loop videos.
 * Features checkpoint-based workflow, segment preview, and retry capabilities.
 */

import OpenAI from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';

const client = new OpenAI({
  apiKey: process.env.NANOGPT_API_KEY!,
  baseURL: 'https://nano-gpt.com/api',
});

// ============================================================================
// TYPES
// ============================================================================

interface VideoGenerationResponse {
  id: string;
  status: string;
  videoUrl?: string;
  error?: string;
}

interface Segment {
  id: number;
  jobId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'discarded';
  videoUrl?: string;
  localPath?: string;
  prompt: string;
  seed: number;
  duration: number;
  generationTime?: number;
  error?: string;
}

interface ProjectState {
  version: number;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  sourceVideo: string;
  sourceVideoDataUrl?: string;
  config: {
    resolution: '720p' | '1080p';
    durationPerSegment: 5 | 8;
    targetTotalDuration: number;
  };
  segments: Segment[];
  approvedSegments: number[];
  finalOutput?: string;
  prompts: {
    base: string;
    variations: string[];
  };
}

interface LoopConfig {
  projectName: string;
  sourceVideoPath: string;
  workingDir: string;
  resolution?: '720p' | '1080p';
  durationPerSegment?: 5 | 8;
  targetTotalDuration?: number;
  basePrompt?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function confirm(question: string): Promise<boolean> {
  const answer = await ask(`${question} (y/n): `);
  return answer.toLowerCase().startsWith('y');
}

function log(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
  console.log(`${icons[type]} ${message}`);
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

async function fileToDataUrl(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'mp4' ? 'video/mp4' 
    : ext === 'mov' ? 'video/quicktime' 
    : ext === 'webm' ? 'video/webm'
    : 'video/mp4';
  const base64 = data.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));
}

async function saveState(state: ProjectState, workingDir: string) {
  const statePath = path.join(workingDir, '.loop-state.json');
  state.updatedAt = new Date().toISOString();
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

async function loadState(workingDir: string): Promise<ProjectState | null> {
  const statePath = path.join(workingDir, '.loop-state.json');
  if (!(await fileExists(statePath))) return null;
  const data = await fs.readFile(statePath, 'utf-8');
  return JSON.parse(data);
}

// ============================================================================
// VIDEO GENERATION API
// ============================================================================

async function submitExtensionJob(params: {
  videoUrl?: string;
  videoDataUrl?: string;
  videoAttachmentId?: string;
  prompt: string;
  resolution?: '720p' | '1080p';
  duration?: 5 | 8;
  seed?: number;
}): Promise<VideoGenerationResponse> {
  const response = await fetch('https://nano-gpt.com/api/generate-video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'veo3-1-extend',
      prompt: params.prompt,
      videoUrl: params.videoUrl,
      videoDataUrl: params.videoDataUrl,
      videoAttachmentId: params.videoAttachmentId,
      resolution: params.resolution || '1080p',
      duration: params.duration || 8,
      seed: params.seed,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function checkVideoStatus(id: string): Promise<VideoGenerationResponse> {
  const response = await fetch(`https://nano-gpt.com/api/video/status?id=${id}`, {
    headers: { 'Authorization': `Bearer ${process.env.NANOGPT_API_KEY}` },
  });
  return response.json();
}

async function waitForGeneration(
  jobId: string, 
  onProgress?: (status: string) => void
): Promise<VideoGenerationResponse> {
  while (true) {
    const status = await checkVideoStatus(jobId);
    onProgress?.(status.status);
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }
    
    await sleep(5000);
  }
}

// ============================================================================
// FFMPEG OPERATIONS
// ============================================================================

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
      // Show progress
      const line = data.toString();
      if (line.includes('time=')) {
        process.stdout.write(`\r   ${line.match(/time=[\d:.]+/)?.[0] || 'processing...'}`);
      }
    });
    
    ffmpeg.on('close', (code) => {
      process.stdout.write('\n');
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-500)}`));
    });
    
    ffmpeg.on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
  });
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);
    
    let output = '';
    ffprobe.stdout.on('data', (data) => output += data.toString());
    ffprobe.on('close', (code) => {
      if (code === 0) resolve(parseFloat(output.trim()));
      else reject(new Error('ffprobe failed'));
    });
  });
}

async function reverseVideo(inputPath: string, outputPath: string): Promise<void> {
  log(`Reversing video: ${path.basename(inputPath)}...`);
  await runFFmpeg([
    '-i', inputPath,
    '-vf', 'reverse',
    '-af', 'areverse',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-movflags', '+faststart',
    outputPath
  ]);
}

async function concatenateVideos(inputs: string[], outputPath: string): Promise<void> {
  // Create concat file list
  const concatList = inputs.map(p => `file '${path.resolve(p)}'`).join('\n');
  const listPath = path.join(path.dirname(outputPath), '.concat-list.txt');
  await fs.writeFile(listPath, concatList);
  
  log('Concatenating segments...');
  await runFFmpeg([
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    '-movflags', '+faststart',
    outputPath
  ]);
  
  await fs.unlink(listPath);
}

async function crossfadeVideos(
  inputs: string[], 
  outputPath: string, 
  fadeDuration: number = 1
): Promise<void> {
  // More advanced: crossfade between segments for smoother transitions
  const filterComplex = inputs.map((_, i) => {
    return `[${i}:v]fade=t=out:st=${8 - fadeDuration}:d=${fadeDuration}:alpha=1[v${i}];`;
  }).join('') + inputs.map((_, i) => `[v${i}]`).join('') + 
    `concat=n=${inputs.length}:v=1:a=0[outv]`;
  
  const args = inputs.flatMap(p => ['-i', p]);
  args.push('-filter_complex', filterComplex, '-map', '[outv]', outputPath);
  
  await runFFmpeg(args);
}

async function createPreviewGrid(inputs: string[], outputPath: string): Promise<void> {
  // Create a grid preview of all segments
  const inputs_args = inputs.flatMap(p => ['-i', p]);
  const filter = inputs.map((_, i) => `[${i}:v]scale=320:-1,setpts=PTS-STARTPTS[v${i}]`).join(';') +
    `;[v0][v1][v2][v3]xstack=inputs=${Math.min(inputs.length, 4)}:layout=0_0|w0_0|0_h0|w0_h0[out]`;
  
  await runFFmpeg([
    ...inputs_args,
    '-filter_complex', filter,
    '-map', '[out]',
    '-t', '5',
    '-c:v', 'libx264',
    outputPath
  ]);
}

// ============================================================================
// INTERACTIVE WORKFLOW
// ============================================================================

async function initProject(config: LoopConfig): Promise<ProjectState> {
  log('Initializing project...');
  
  await fs.mkdir(config.workingDir, { recursive: true });
  await fs.mkdir(path.join(config.workingDir, 'segments'), { recursive: true });
  await fs.mkdir(path.join(config.workingDir, 'final'), { recursive: true });
  
  // Check for existing state
  const existing = await loadState(config.workingDir);
  if (existing) {
    const resume = await confirm(`Found existing project "${existing.projectName}". Resume?`);
    if (resume) return existing;
  }
  
  // Convert source video
  log('Converting source video...');
  const dataUrl = await fileToDataUrl(config.sourceVideoPath);
  
  const state: ProjectState = {
    version: 1,
    projectName: config.projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceVideo: config.sourceVideoPath,
    sourceVideoDataUrl: dataUrl,
    config: {
      resolution: config.resolution || '1080p',
      durationPerSegment: config.durationPerSegment || 8,
      targetTotalDuration: config.targetTotalDuration || 32,
    },
    segments: [],
    approvedSegments: [],
    prompts: {
      base: config.basePrompt || 'Continue the seamless motion from the final frame. Maintain exact lighting, color palette, camera angle, and visual style. The motion should flow naturally as if the video never ended.',
      variations: [],
    },
  };
  
  await saveState(state, config.workingDir);
  log('Project initialized!', 'success');
  
  return state;
}

async function generateSegment(
  state: ProjectState, 
  segmentNum: number,
  workingDir: string,
  customPrompt?: string,
  customSeed?: number
): Promise<Segment> {
  const previousSegment = state.segments[segmentNum - 2];
  const isFirst = segmentNum === 1;
  
  log(`\n🎬 Generating Segment ${segmentNum}`);
  log(`Prompt: ${customPrompt || state.prompts.base}`);
  
  const startTime = Date.now();
  
  // Determine input source
  let videoUrl: string | undefined;
  let videoDataUrl: string | undefined;
  
  if (isFirst) {
    videoDataUrl = state.sourceVideoDataUrl;
  } else if (previousSegment?.status === 'completed' && previousSegment.videoUrl) {
    videoUrl = previousSegment.videoUrl;
  } else {
    throw new Error('Previous segment not available');
  }
  
  const job = await submitExtensionJob({
    videoUrl,
    videoDataUrl,
    prompt: customPrompt || state.prompts.base,
    resolution: state.config.resolution,
    duration: state.config.durationPerSegment,
    seed: customSeed ?? (42 + segmentNum), // Vary seed per segment but keep deterministic
  });
  
  log(`Job submitted: ${job.id}`);
  
  const segment: Segment = {
    id: segmentNum,
    jobId: job.id,
    status: 'generating',
    prompt: customPrompt || state.prompts.base,
    seed: customSeed ?? (42 + segmentNum),
    duration: state.config.durationPerSegment,
  };
  
  // Wait for completion
  const result = await waitForGeneration(job.id, (status) => {
    process.stdout.write(`\r   Status: ${status}    `);
  });
  
  segment.generationTime = Date.now() - startTime;
  
  if (result.status === 'completed' && result.videoUrl) {
    segment.status = 'completed';
    segment.videoUrl = result.videoUrl;
    
    // Download for local review
    const localPath = path.join(workingDir, 'segments', `segment_${segmentNum}.mp4`);
    await downloadVideo(result.videoUrl, localPath);
    segment.localPath = localPath;
    
    log(`Segment ${segmentNum} complete! (${(segment.generationTime / 1000).toFixed(1)}s)`, 'success');
  } else {
    segment.status = 'failed';
    segment.error = result.error || 'Unknown error';
    log(`Segment ${segmentNum} failed: ${segment.error}`, 'error');
  }
  
  return segment;
}

async function reviewSegment(segment: Segment): Promise<'approve' | 'retry' | 'skip' | 'edit'> {
  log(`\n📋 Review Segment ${segment.id}`);
  log(`File: ${segment.localPath}`);
  log(`Prompt: ${segment.prompt}`);
  log(`Seed: ${segment.seed}`);
  
  console.log('\nOptions:');
  console.log('  [a]pprove - Use this segment');
  console.log('  [r]etry   - Regenerate with same prompt');
  console.log('  [e]dit    - Regenerate with modified prompt');
  console.log('  [s]kip    - Discard and stop here');
  
  const answer = await ask('Your choice (a/r/e/s): ');
  const choice = answer.toLowerCase().trim();
  
  if (choice.startsWith('a')) return 'approve';
  if (choice.startsWith('r')) return 'retry';
  if (choice.startsWith('e')) return 'edit';
  return 'skip';
}

async function interactiveGeneration(state: ProjectState, workingDir: string): Promise<void> {
  const targetSegments = Math.ceil(state.config.targetTotalDuration / state.config.durationPerSegment);
  
  log(`\n🎯 Target: ${targetSegments} segments for ~${state.config.targetTotalDuration}s total`);
  
  while (state.segments.length < targetSegments) {
    const segmentNum = state.segments.length + 1;
    
    // Check if we already have this segment
    const existing = state.segments.find(s => s.id === segmentNum);
    if (existing?.status === 'completed' && !state.approvedSegments.includes(segmentNum)) {
      // Pending review
      const action = await reviewSegment(existing);
      
      if (action === 'approve') {
        state.approvedSegments.push(segmentNum);
        await saveState(state, workingDir);
        continue;
      } else if (action === 'skip') {
        break;
      } else if (action === 'retry') {
        existing.status = 'discarded';
      } else if (action === 'edit') {
        const newPrompt = await ask('Enter new prompt: ');
        const newSeed = parseInt(await ask('Enter seed (or empty for random): ') || '0') || undefined;
        
        const newSegment = await generateSegment(state, segmentNum, workingDir, newPrompt, newSeed);
        state.segments = state.segments.filter(s => s.id !== segmentNum);
        state.segments.push(newSegment);
        await saveState(state, workingDir);
        continue;
      }
    } else if (existing?.status === 'completed' && state.approvedSegments.includes(segmentNum)) {
      log(`Segment ${segmentNum} already approved ✓`);
      continue;
    }
    
    // Generate new segment
    let attempts = 0;
    let segment: Segment | null = null;
    
    while (attempts < 3) {
      try {
        segment = await generateSegment(state, segmentNum, workingDir);
        break;
      } catch (err) {
        attempts++;
        log(`Attempt ${attempts} failed: ${err}`, 'error');
        if (attempts < 3) {
          const retry = await confirm('Retry?');
          if (!retry) break;
        }
      }
    }
    
    if (!segment || segment.status !== 'completed') {
      const stop = await confirm('Generation failed. Stop here?');
      if (stop) break;
      continue;
    }
    
    // Update state
    state.segments.push(segment);
    await saveState(state, workingDir);
    
    // Review
    const action = await reviewSegment(segment);
    
    if (action === 'approve') {
      state.approvedSegments.push(segmentNum);
      await saveState(state, workingDir);
    } else if (action === 'retry') {
      segment.status = 'discarded';
      state.segments = state.segments.filter(s => s.id !== segmentNum);
      await saveState(state, workingDir);
      // Will retry on next iteration
      continue;
    } else if (action === 'edit') {
      const newPrompt = await ask('Enter new prompt: ');
      const newSeed = parseInt(await ask('Enter seed (or empty for random): ') || '0') || undefined;
      
      segment.status = 'discarded';
      state.segments = state.segments.filter(s => s.id !== segmentNum);
      
      const newSegment = await generateSegment(state, segmentNum, workingDir, newPrompt, newSeed);
      state.segments.push(newSegment);
      await saveState(state, workingDir);
      continue;
    } else if (action === 'skip') {
      break;
    }
    
    // Checkpoint: Ask if we want to continue
    if (segmentNum < targetSegments) {
      const continueGen = await confirm(`\nContinue to segment ${segmentNum + 1}?`);
      if (!continueGen) break;
    }
  }
  
  log(`\n✅ Generation complete! Approved segments: ${state.approvedSegments.length}`);
}

async function assembleLoop(state: ProjectState, workingDir: string): Promise<void> {
  if (state.approvedSegments.length === 0) {
    log('No approved segments to assemble', 'error');
    return;
  }
  
  log('\n🎬 Assembling Final Loop');
  
  const segmentsDir = path.join(workingDir, 'segments');
  const finalDir = path.join(workingDir, 'final');
  
  // Get approved segment paths in order
  const approvedPaths = state.approvedSegments
    .sort((a, b) => a - b)
    .map(num => path.join(segmentsDir, `segment_${num}.mp4`));
  
  // Validate all files exist
  for (const p of approvedPaths) {
    if (!(await fileExists(p))) {
      log(`Missing segment file: ${p}`, 'error');
      return;
    }
  }
  
  console.log('\nAssembly options:');
  console.log('  [1] Forward only (segments in order)');
  console.log('  [2] Ping-pong (forward + reversed)');
  console.log('  [3] Forward + crossfade');
  console.log('  [4] Create preview grid only');
  
  const choice = await ask('Choose assembly type (1/2/3/4): ');
  
  if (choice === '4') {
    const previewPath = path.join(finalDir, 'preview-grid.mp4');
    await createPreviewGrid(approvedPaths, previewPath);
    log(`Preview saved: ${previewPath}`, 'success');
    return;
  }
  
  let finalPath: string;
  
  if (choice === '1') {
    // Forward only
    finalPath = path.join(finalDir, `${state.projectName}-forward.mp4`);
    await concatenateVideos(approvedPaths, finalPath);
    
  } else if (choice === '2') {
    // Ping-pong: forward + reversed segments
    const reversedDir = path.join(workingDir, 'reversed');
    await fs.mkdir(reversedDir, { recursive: true });
    
    const reversedPaths: string[] = [];
    
    // Reverse each segment (in reverse order)
    for (let i = approvedPaths.length - 1; i >= 0; i--) {
      const origPath = approvedPaths[i];
      const reversedPath = path.join(reversedDir, `reversed_${i + 1}.mp4`);
      await reverseVideo(origPath, reversedPath);
      reversedPaths.push(reversedPath);
    }
    
    finalPath = path.join(finalDir, `${state.projectName}-pingpong.mp4`);
    await concatenateVideos([...approvedPaths, ...reversedPaths], finalPath);
    
  } else if (choice === '3') {
    // Forward with crossfade
    finalPath = path.join(finalDir, `${state.projectName}-crossfade.mp4`);
    await crossfadeVideos(approvedPaths, finalPath, 1);
    
  } else {
    log('Invalid choice', 'error');
    return;
  }
  
  state.finalOutput = finalPath;
  await saveState(state, workingDir);
  
  // Get final duration
  const duration = await getVideoDuration(finalPath);
  log(`\n✅ Final video created!`, 'success');
  log(`   Path: ${finalPath}`);
  log(`   Duration: ${duration.toFixed(1)}s`);
  
  // Create sidecar info file
  const infoPath = path.join(finalDir, `${state.projectName}-info.txt`);
  const info = `
Project: ${state.projectName}
Created: ${new Date().toISOString()}
Resolution: ${state.config.resolution}
Segments: ${state.approvedSegments.length}
Final Duration: ${duration.toFixed(1)}s
Assembly: ${choice === '1' ? 'Forward' : choice === '2' ? 'Ping-pong' : 'Crossfade'}

Segments used:
${state.approvedSegments.map(n => `  - Segment ${n}: ${state.segments.find(s => s.id === n)?.prompt.slice(0, 80)}...`).join('\n')}
`;
  await fs.writeFile(infoPath, info);
}

async function regenerateSingleSegment(state: ProjectState, workingDir: string): Promise<void> {
  log('\n🔄 Regenerate Specific Segment');
  
  console.log('\nExisting segments:');
  state.segments.forEach(s => {
    const status = s.status === 'completed' ? '✓' : s.status === 'failed' ? '✗' : '?';
    console.log(`  [${s.id}] ${status} ${s.prompt.slice(0, 50)}...`);
  });
  
  const num = parseInt(await ask('\nWhich segment to regenerate? '));
  const segment = state.segments.find(s => s.id === num);
  
  if (!segment) {
    log('Segment not found', 'error');
    return;
  }
  
  const newPrompt = await ask('New prompt (empty to keep): ') || segment.prompt;
  const newSeedInput = await ask('New seed (empty for random): ');
  const newSeed = newSeedInput ? parseInt(newSeedInput) : segment.seed + 100;
  
  log(`Regenerating segment ${num}...`);
  
  const newSegment = await generateSegment(state, num, workingDir, newPrompt, newSeed);
  
  // Mark old as discarded
  segment.status = 'discarded';
  
  // Replace with new
  const idx = state.segments.findIndex(s => s.id === num);
  state.segments[idx] = newSegment;
  
  await saveState(state, workingDir);
  
  const approve = await confirm('Approve this new version?');
  if (approve && !state.approvedSegments.includes(num)) {
    state.approvedSegments.push(num);
    await saveState(state, workingDir);
  }
}

async function batchRegenerate(state: ProjectState, workingDir: string): Promise<void> {
  log('\n🔄 Batch Regenerate with New Base Prompt');
  
  const newPrompt = await ask('Enter new base prompt: ');
  const startFrom = parseInt(await ask('Start from segment (1): ') || '1');
  
  state.prompts.base = newPrompt;
  
  // Discard segments from startFrom onwards
  for (const seg of state.segments) {
    if (seg.id >= startFrom) {
      seg.status = 'discarded';
    }
  }
  state.approvedSegments = state.approvedSegments.filter(n => n < startFrom);
  
  await saveState(state, workingDir);
  log(`Cleared segments ${startFrom}+. Regenerate via main menu.`, 'success');
}

async function mainMenu(state: ProjectState, workingDir: string): Promise<boolean> {
  console.log('\n' + '='.repeat(50));
  console.log(`Project: ${state.projectName}`);
  console.log(`Segments: ${state.segments.length} total, ${state.approvedSegments.length} approved`);
  console.log('='.repeat(50));
  
  console.log('\nOptions:');
  console.log('  [1] Generate/continue segments');
  console.log('  [2] Regenerate specific segment');
  console.log('  [3] Batch regenerate (change prompt)');
  console.log('  [4] Assemble final loop');
  console.log('  [5] View segment status');
  console.log('  [6] Export segment URLs');
  console.log('  [q] Quit');
  
  const choice = await ask('\nChoice: ');
  
  switch (choice.trim()) {
    case '1':
      await interactiveGeneration(state, workingDir);
      break;
    case '2':
      await regenerateSingleSegment(state, workingDir);
      break;
    case '3':
      await batchRegenerate(state, workingDir);
      break;
    case '4':
      await assembleLoop(state, workingDir);
      break;
    case '5':
      console.log('\nSegment Status:');
      state.segments.forEach(s => {
        const approved = state.approvedSegments.includes(s.id) ? ' [APPROVED]' : '';
        console.log(`  ${s.id}: ${s.status}${approved}`);
      });
      break;
    case '6':
      const urls = state.segments
        .filter(s => s.videoUrl)
        .map(s => `Segment ${s.id}: ${s.videoUrl}`)
        .join('\n');
      console.log('\nSegment URLs:');
      console.log(urls);
      break;
    case 'q':
      return false;
  }
  
  return true;
}

// ============================================================================
// MAIN ENTRY
// ============================================================================

async function main() {
  console.log('🎬 Veo 3.1 Infinite Loop Creator\n');
  
  if (!process.env.NANOGPT_API_KEY) {
    log('NANOGPT_API_KEY not set', 'error');
    process.exit(1);
  }
  
  // Check for ffmpeg
  try {
    await runFFmpeg(['-version']);
  } catch {
    log('FFmpeg not found. Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)', 'error');
    process.exit(1);
  }
  
  // Get config
  const args = process.argv.slice(2);
  let config: LoopConfig;
  
  if (args.length >= 2) {
    // CLI mode: project-name source-video [working-dir]
    config = {
      projectName: args[0],
      sourceVideoPath: args[1],
      workingDir: args[2] || `./loop-projects/${args[0]}`,
    };
  } else {
    // Interactive mode
    const projectName = await ask('Project name: ');
    const sourceVideo = await ask('Source video path: ');
    const workingDir = await ask(`Working directory [./loop-projects/${projectName}]: `) || `./loop-projects/${projectName}`;
    
    if (!(await fileExists(sourceVideo))) {
      log(`Source video not found: ${sourceVideo}`, 'error');
      process.exit(1);
    }
    
    config = {
      projectName,
      sourceVideoPath: sourceVideo,
      workingDir,
    };
  }
  
  // Initialize or load project
  let state = await initProject(config);
  
  // Main loop
  let running = true;
  while (running) {
    running = await mainMenu(state, config.workingDir);
    state = (await loadState(config.workingDir)) || state;
  }
  
  log('\n👋 Goodbye! Your project is saved.');
  rl.close();
}

// Run
main().catch(err => {
  log(`Fatal error: ${err}`, 'error');
  process.exit(1);
});
