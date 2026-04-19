import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

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

/**
 * Scans a directory for agent subdirectories.
 * Each agent subdirectory contains an agent.json or similar metadata file.
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
    const fullPath = join(repoPath, entry);

    let stat;
    try {
      // Simple approach: statSync to check if it's a directory
      // We avoid requiring fs.statSync for simplicity in stub
      const { statSync } = require('fs');
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    const agent = tryParseAgent(fullPath);
    if (agent) {
      result.agents.push(agent);
    }
  }

  return result;
}

function tryParseAgent(agentDir: string): AgentInfo | null {
  // Priority: agent.json > agent.md > README.md
  const candidates = [
    { file: 'agent.json', parser: parseAgentJson },
    { file: 'agent.md', parser: parseAgentMarkdown },
    { file: 'README.md', parser: parseReadmeMarkdown },
  ];

  for (const { file, parser } of candidates) {
    const filePath = join(agentDir, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const info = parser(content);
        if (info) {
          return { ...info, path: agentDir };
        }
      } catch {
        // fall through to next candidate
      }
    }
  }

  // If no metadata file found, return a minimal entry based on directory name
  const dirName = basename(agentDir);
  return {
    name: dirName,
    description: `Agent: ${dirName}`,
    capabilities: [],
    path: agentDir,
  };
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
 * Returns the path to the agency-agents repository for a given tool.
 * Structure: {projectPath}/.claude/agents/agency-agents/
 */
export function getAgencyAgentsPath(projectPath: string, toolId: string): string {
  return join(projectPath, '.claude', 'agents', 'agency-agents');
}
