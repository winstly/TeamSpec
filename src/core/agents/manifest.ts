import { writeFileSync, readFileSync, existsSync } from 'fs';
import { scanAgencyAgents, type AgentInfo } from './scanner.js';

export interface ManifestData {
  version: string;
  updatedAt: string;
  agents: AgentInfo[];
}

/**
 * Generates manifest.json from a scanned agency-agents repository.
 */
export async function generateManifest(
  repoPath: string,
  outputPath: string,
  teamspecVersion: string
): Promise<void> {
  const result = scanAgencyAgents(repoPath);
  const manifest: ManifestData = {
    version: teamspecVersion,
    updatedAt: new Date().toISOString(),
    agents: result.agents,
  };
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

/**
 * Reads and parses a manifest.json file.
 * Returns null if the file does not exist or cannot be parsed.
 */
export function readManifest(manifestPath: string): ManifestData | null {
  if (!existsSync(manifestPath)) {
    return null;
  }
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    const data = JSON.parse(content) as ManifestData;
    if (
      typeof data.version !== 'string' ||
      typeof data.updatedAt !== 'string' ||
      !Array.isArray(data.agents)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
