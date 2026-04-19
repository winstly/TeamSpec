import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  KNOWLEDGE_README,
  AGENT_RETRO_TEMPLATE,
  PROJECT_RETRO_TEMPLATE,
} from './templates.js';

export interface KnowledgeBaseOptions {
  projectPath: string;
  projectName: string;
  manifestPath: string;
}

/**
 * 初始化知识库目录结构
 *
 * 在 projectPath 下创建 teamspec/ 目录结构：
 *   teamspec/
 *     knowledge/
 *       README.md
 *       agents/
 *       projects/
 *         {projectName}/
 *           retro/
 *       templates/
 *         agent-retro.md
 *         project-retro.md
 *     agents/
 *       manifest.json
 *     config.yaml
 */
export function initKnowledgeBase(options: KnowledgeBaseOptions): void {
  const { projectPath, projectName, manifestPath } = options;
  const teamspecRoot = join(projectPath, 'teamspec');

  // 创建目录结构
  mkdirSync(join(teamspecRoot, 'knowledge', 'agents'), { recursive: true });
  mkdirSync(join(teamspecRoot, 'knowledge', 'projects'), { recursive: true });
  mkdirSync(join(teamspecRoot, 'knowledge', 'projects', projectName), { recursive: true });
  mkdirSync(join(teamspecRoot, 'knowledge', 'projects', projectName, 'retro'), { recursive: true });
  mkdirSync(join(teamspecRoot, 'knowledge', 'projects', projectName, 'decisions'), { recursive: true });
  mkdirSync(join(teamspecRoot, 'knowledge', 'templates'), { recursive: true });
  mkdirSync(join(teamspecRoot, 'agents'), { recursive: true });

  // 写入知识库索引
  writeFileSync(join(teamspecRoot, 'knowledge', 'README.md'), KNOWLEDGE_README, 'utf-8');

  // 写入沉淀模板
  writeFileSync(
    join(teamspecRoot, 'knowledge', 'templates', 'agent-retro.md'),
    AGENT_RETRO_TEMPLATE,
    'utf-8',
  );
  writeFileSync(
    join(teamspecRoot, 'knowledge', 'templates', 'project-retro.md'),
    PROJECT_RETRO_TEMPLATE,
    'utf-8',
  );

  // 写入项目配置
  writeFileSync(
    join(teamspecRoot, 'config.yaml'),
    `schema: teamspec
version: "1.0"
project:
  name: ${projectName}
  createdAt: ${new Date().toISOString()}
`,
    'utf-8',
  );

  // 写入 agent 清单
  writeFileSync(
    manifestPath,
    JSON.stringify({ agents: [], projectName }, null, 2),
    'utf-8',
  );
}
