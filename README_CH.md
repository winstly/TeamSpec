# TeamSpec

面向多智能体软件项目的 AI 团队协作框架。

## 什么是 TeamSpec？

TeamSpec 是一个 CLI 工具，为 AI 智能体团队提供结构化工作流：收集上下文、组建团队、制定计划、审批、执行、验证、回顾。支持 Claude Code、Cursor、Windsurf 和 Gemini。

## 快速开始

```bash
npm install -g @winstly-ai/teamspec
teamspec init
```

初始化后进入引导式工作流，按提示描述项目背景、选择智能体团队，即可生成执行计划。

## 核心命令

| 命令 | 说明 |
|---|---|
| `teamspec init` | 在当前项目初始化 teamspec 工作空间 |
| `teamspec update` | 刷新已安装的 skills 和 commands |
| `teamspec status` | 查看工作空间状态和已安装的工具 |
| `teamspec config` | 管理全局配置（查看、设置、重置） |

## 工作流

TeamSpec 提供七个结构化工作流：

| 工作流 | 说明 |
|---|---|
| context | 从用户描述和现有文档中收集项目背景 |
| recruit | 读取智能体清单并推荐团队配置 |
| plan | 将工作分解为具体任务并确定执行策略 |
| approve | 生成详细任务计划供审批后再执行 |
| monitor | 协调智能体执行并跟踪进度 |
| qa | 验证已完成的工作并生成质量报告 |
| retro | 在任务或阶段完成后记录经验教训 |

## 配置

全局配置存储于 `~/.config/teamspec/config.json`（Unix）或 `%APPDATA%/teamspec/config.json`（Windows）。

```bash
teamspec config get
teamspec config set delivery skills
teamspec config reset --all
```

## 许可证

MIT
