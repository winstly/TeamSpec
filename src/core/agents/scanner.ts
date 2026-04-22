import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

export interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  path: string;
}

export interface ScanResult {
  agents: AgentInfo[];
  scannedPaths: string[];
  errors: Array<{ path: string; error: string }>;
}

const SKIP_DIRS = new Set(['.git', '.github', 'scripts', 'examples']);

/**
 * Scans a directory for agent subdirectories or category directories.
 *
 * Supports two repo layouts:
 * 1. Flat: each subdirectory is an agent containing agent.json / agent.md / README.md
 * 2. Nested: agents are .md files with YAML frontmatter inside category subdirectories
 *            (e.g. engineering/engineering-frontend-developer.md)
 */
export function scanAgencyAgents(repoPath: string): ScanResult {
  const result: ScanResult = {
    agents: [],
    scannedPaths: [],
    errors: [],
  };

  result.scannedPaths.push(repoPath);

  if (!existsSync(repoPath)) {
    result.errors.push({ path: repoPath, error: 'Directory does not exist' });
    return result;
  }

  let entries: string[];
  try {
    entries = readdirSync(repoPath);
  } catch (err) {
    result.errors.push({ path: repoPath, error: String(err) });
    return result;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;

    const fullPath = join(repoPath, entry);

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    // Try agent-directory layout first (agent.json / agent.md / README.md)
    const agent = tryParseAgent(fullPath);
    if (agent) {
      result.agents.push(agent);
      continue;
    }

    // Fallback: treat as a category directory containing .md agent files
    const categoryAgents = scanCategoryDir(fullPath);
    result.agents.push(...categoryAgents);
  }

  return result;
}

/**
 * Non-agent md filenames that should be skipped when scanning directories.
 */
const SKIP_MD_FILES = new Set([
  'README.md',
  'CONTRIBUTING.md',
  'CONTRIBUTING_zh-CN.md',
  'QUICKSTART.md',
  'EXECUTIVE-BRIEF.md',
  'SECURITY.md',
  'LICENSE.md',
  'CHANGELOG.md',
]);

function tryParseAgent(agentDir: string): AgentInfo | null {
  // Priority: agent.json > agent.md
  const jsonPath = join(agentDir, 'agent.json');
  if (existsSync(jsonPath)) {
    try {
      const content = readFileSync(jsonPath, 'utf-8');
      const info = parseAgentJson(content);
      if (info) return { ...info, path: agentDir };
    } catch { /* fall through */ }
  }

  const mdPath = join(agentDir, 'agent.md');
  if (existsSync(mdPath)) {
    try {
      const content = readFileSync(mdPath, 'utf-8');
      const info = parseAgentMarkdown(content);
      if (info) return { ...info, path: agentDir };
    } catch { /* fall through */ }
  }

  // README.md: only treat as agent if the directory is NOT a category directory
  const readmePath = join(agentDir, 'README.md');
  if (existsSync(readmePath)) {
    if (isCategoryDirectory(agentDir)) return null;
    try {
      const content = readFileSync(readmePath, 'utf-8');
      const info = parseReadmeMarkdown(content);
      if (info) return { ...info, path: agentDir };
    } catch { /* fall through */ }
  }

  // No agent metadata file found — this might be a category directory
  return null;
}

/**
 * Returns true if a directory looks like a category container
 * (has subdirectories or non-README .md files), rather than an agent directory.
 */
function isCategoryDirectory(dir: string): boolean {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return false;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    try {
      const st = statSync(fullPath);
      // Any subdirectory → category
      if (st.isDirectory()) return true;
      // Non-README .md file → agent file → category
      if (extname(entry).toLowerCase() === '.md' && !SKIP_MD_FILES.has(entry)) return true;
    } catch { /* skip */ }
  }
  return false;
}

function parseAgentJson(content: string): AgentInfo | null {
  try {
    const json = JSON.parse(content);
    return {
      name: typeof json.name === 'string' ? json.name : basename(json.path || ''),
      description: typeof json.description === 'string' ? json.description : '',
      capabilities: Array.isArray(json.capabilities) ? json.capabilities : [],
      path: '',
    };
  } catch {
    return null;
  }
}

function parseAgentMarkdown(content: string): AgentInfo | null {
  // Only treat as YAML frontmatter if it starts with ---
  if (!content.trimStart().startsWith('---')) {
    return parseReadmeMarkdown(content);
  }

  const parts = content.slice(3).split(/^---/m);
  if (parts.length < 3) {
    return parseReadmeMarkdown(content);
  }

  const yaml = parts[1];
  const body = parts.slice(2).join('---');
  const fields = parseYamlFrontmatter(yaml);

  return {
    name: fields['name'] || basename(fields['path'] || ''),
    description: fields['description'] || body.slice(0, 200).trim(),
    capabilities: parseCapabilitiesField(fields['capabilities'] || ''),
    path: fields['path'] || '',
  };
}

function parseReadmeMarkdown(content: string): AgentInfo | null {
  const lines = content.split(/\r?\n/);
  const nameLine = lines.find((l) => l.startsWith('# '));
  const name = nameLine ? nameLine.slice(2).trim() : basename('');

  // Collect first paragraph of non-heading, non-blank lines after the title.
  // Skip blank lines immediately after the heading, then collect until the
  // next blank line or heading.
  const bodyLines: string[] = [];
  let afterTitle = false;
  let collectingBody = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      afterTitle = true;
      collectingBody = false;
      continue;
    }
    if (afterTitle) {
      if (line.trim() === '') {
        if (collectingBody) break; // End of paragraph
        continue; // skip leading blank lines after title
      }
      collectingBody = true;
      bodyLines.push(line.trim());
    }
  }

  return {
    name,
    description: bodyLines.join(' ').slice(0, 300),
    capabilities: [],
    path: '',
  };
}

function parseYamlFrontmatter(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = yaml.split(/\r?\n/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

function parseCapabilitiesField(raw: string): string[] {
  if (!raw) return [];
  // Handle both inline array "[a, b]" and multi-line YAML list
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
  }
  return raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter((l) => l.length > 0);
}

/**
 * Parses a standalone agent .md file with YAML frontmatter.
 * Used for the nested repo layout where agents are individual .md files
 * inside category directories (e.g. engineering/engineering-frontend-developer.md).
 */
function parseAgentMdFile(content: string, filePath: string): AgentInfo | null {
  if (!content.trimStart().startsWith('---')) {
    // No frontmatter — parse as plain markdown (fallback)
    const info = parseReadmeMarkdown(content);
    if (!info) return null;
    return { ...info, path: filePath.replace(/\.md$/, '') };
  }

  const afterFirst = content.slice(3);
  const endIdx = afterFirst.indexOf('\n---');
  if (endIdx === -1) {
    return parseAgentMdFileWithStyleDelimiter(content, filePath);
  }

  const yaml = afterFirst.slice(0, endIdx);
  const fields = parseYamlFrontmatter(yaml);
  const name = fields['name'] || basename(filePath, '.md');

  return {
    name,
    description: fields['description'] || '',
    capabilities: parseCapabilitiesField(fields['capabilities'] || ''),
    path: filePath.replace(/\.md$/, ''),
  };
}

/**
 * Handles YAML frontmatter closed by `---` that may not have a leading newline.
 */
function parseAgentMdFileWithStyleDelimiter(content: string, filePath: string): AgentInfo | null {
  const parts = content.slice(3).split(/^---/m);
  if (parts.length < 3) {
    const info = parseReadmeMarkdown(content);
    if (!info) return null;
    return { ...info, path: filePath.replace(/\.md$/, '') };
  }
  const fields = parseYamlFrontmatter(parts[1]);
  return {
    name: fields['name'] || basename(filePath, '.md'),
    description: fields['description'] || '',
    capabilities: parseCapabilitiesField(fields['capabilities'] || ''),
    path: filePath.replace(/\.md$/, ''),
  };
}

/**
 * Scans a category directory for agent .md files.
 * Each .md file is expected to contain YAML frontmatter with agent metadata.
 */
function scanCategoryDir(categoryDir: string): AgentInfo[] {
  const agents: AgentInfo[] = [];

  let entries: string[];
  try {
    entries = readdirSync(categoryDir);
  } catch {
    return agents;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(categoryDir, entry);

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    // Support nested category subdirectories
    if (stat.isDirectory()) {
      agents.push(...scanCategoryDir(fullPath));
      continue;
    }

    if (extname(entry).toLowerCase() !== '.md') continue;
    if (SKIP_MD_FILES.has(entry)) continue;

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const agent = parseAgentMdFile(content, fullPath);
      if (agent) {
        agents.push(agent);
      }
    } catch {
      // skip unreadable files
    }
  }

  return agents;
}

/**
 * Returns the path to the agency-agents repository for a given tool.
 * Structure: {projectPath}/.claude/agents/agency-agents/
 */
export function getAgencyAgentsPath(projectPath: string, toolId: string): string {
  return join(projectPath, '.claude', 'agents', 'agency-agents');
}
