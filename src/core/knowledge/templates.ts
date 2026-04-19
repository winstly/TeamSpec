export const KNOWLEDGE_README = `# TeamSpec Knowledge Base

团队知识库索引。

## 目录

- [agents/](agents/) — 各 agent 的沉淀记录
- [projects/](projects/) — 各项目的经验总结
- [templates/](templates/) — 沉淀模板

## 沉淀模板

- [templates/agent-retro.md](templates/agent-retro.md) — Agent 个人复盘
- [templates/project-retro.md](templates/project-retro.md) — 项目级复盘
`;

export const AGENT_RETRO_TEMPLATE = `---
agent: {agent-name}
project: {project-name}
timestamp: {timestamp}
type: agent-retro
---

## 角色反思

{agent 角色的思考}

## 执行总结

{本次执行的关键点}

## 可复用经验

{可沉淀到知识库的内容}

---

*此文档由 teamspec-retro 自动生成*
`;

export const PROJECT_RETRO_TEMPLATE = `---
project: {project-name}
timestamp: {timestamp}
type: project-retro
participants: [{participants}]
---

## 项目总结

{项目整体总结}

## 成功因素

{做得好的地方}

## 改进空间

{可改进的地方}

## 团队协作反思

{团队协作方面的思考}

---

*此文档由 teamspec-retro 自动生成*
`;

export const WORKFLOW_STATE_TEMPLATE = `{
  "currentPhase": "{phase}",
  "completedPhases": [],
  "lastUpdated": "{timestamp}"
}
`;
