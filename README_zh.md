# VEX MCP 服务器

[![NPM Version](https://img.shields.io/npm/v/vex-mcp-server.svg)](https://www.npmjs.com/package/vex-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dm/vex-mcp-server.svg)](https://www.npmjs.com/package/vex-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![VEX Robotics](https://img.shields.io/badge/VEX-Robotics-orange)](https://www.vexrobotics.com/)

基于 RobotEvents API 的 VEX 机器人竞赛数据模型上下文协议（MCP）服务器。该服务器使 Claude Desktop（以及其他 MCP 客户端）能够访问全面的 VEX 竞赛数据，包括团队、赛事、排名和技能分数。

## 功能特性

- **search-teams**: 根据队伍号、名称、组织或地点搜索 VEX 队伍
- **get-team-info**: 获取特定队伍的详细信息
- **search-events**: 根据名称、日期、赛季或项目等级搜索 VEX 赛事
- **get-event-details**: 获取特定赛事的详细信息
- **get-event-awards**: 获取 VEX 赛事的奖项信息，包括获奖者和详情
- **get-team-rankings**: 获取队伍在赛事中的排名和表现
- **get-skills-scores**: 获取队伍的机器人技能分数

## 🚀 快速开始（1分钟安装！）

### 前置条件
- Node.js 18.0.0 或更高版本
- RobotEvents API 令牌（免费注册即可）

### ⚡ 方法一：NPM 安装（推荐）

**一行命令安装：**
```bash
npm install -g vex-mcp-server
```

**获取您的 RobotEvents API 令牌：**
1. 访问 https://www.robotevents.com/api/v2
2. 点击"Request API Access"并填写表单
3. 获得批准后，复制您的 JWT 令牌

**就是这样！** 🎉 您现在可以直接在 Claude Desktop 中使用 `vex-mcp-server`。

### 🛠️ 方法二：开发安装

适用于想要修改代码的开发者：

1. **克隆仓库：**
   ```bash
   git clone https://github.com/yangjack8192/vex-mcp-server.git
   cd vex-mcp-server
   ```

2. **安装和构建：**
   ```bash
   npm install
   npm run build
   ```

## 在 Claude Desktop 中使用

### 🎯 超简单配置（NPM 安装版本）

**配置文件位置：**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**配置（NPM 版本）：**
```json
{
  "mcpServers": {
    "vex-robotics": {
      "command": "vex-mcp-server",
      "env": {
        "ROBOTEVENTS_TOKEN": "your-actual-jwt-token-here"
      }
    }
  }
}
```

### 🛠️ 开发配置

**配置（开发版本）：**
```json
{
  "mcpServers": {
    "vex-robotics": {
      "command": "node",
      "args": ["/absolute/path/to/vex-mcp-server/build/index.js"],
      "env": {
        "ROBOTEVENTS_TOKEN": "your-actual-jwt-token-here"
      }
    }
  }
}
```

**📝 设置说明：**
- 将 `your-actual-jwt-token-here` 替换为您的真实 RobotEvents API 令牌
- 修改配置后需要重启 Claude Desktop
- NPM 安装 = 无需配置路径！🎉

### 使用服务器

配置完成后，您可以向 Claude 提问，例如：
- *"找到加利福尼亚的 VEX 队伍"*
- *"搜索德克萨斯州本赛季的机器人赛事"*
- *"获取 12345 队在他们最后一场比赛的排名"*
- *"显示世锦赛上各队伍的技能分数"*

## 支持的项目

- **VRC**: VEX 机器人竞赛（高中）
- **VIQC**: VEX IQ 挑战赛（小学/初中）
- **VEXU**: VEX U（大学）

## ⚠️ v2.0.0 版本的破坏性变更

**重要提示**: 如果您从 v1.x 版本升级，请注意以下破坏性变更：

- **移除了 `region` 参数** - 从 `search-events` 工具中移除（由于格式不一致）
- **移除了 `program` 参数** - 从 `search-events` 工具中移除（API 不支持）

**迁移指南**: 请使用其他参数如 `name`、`level` 或 `season` 来进行赛事筛选。

## API 工具参考

| 工具 | 描述 | 参数 |
|------|-------------|------------|
| `search-teams` | 根据队伍号、名称或组织查找队伍 | `number`, `name`, `organization`, `program`, `grade`, `country` |
| `get-team-info` | 获取特定队伍的详细信息 | `team_id`（必需） |
| `search-events` | 根据名称、日期或等级查找赛事 | `name`, `start`, `end`, `season`, `level`, `eventTypes` |
| `get-event-details` | 获取特定赛事的详细信息 | `event_id`（必需） |
| `get-event-awards` | 获取赛事奖项信息 | `event_id`（必需）, `team`, `winner` |
| `get-team-rankings` | 获取队伍在赛事中的排名 | `team_id`, `event_id`, `season` |
| `get-skills-scores` | 获取机器人技能分数 | `team_id`, `event_id`, `season` |

## 故障排除

### 常见问题

**"错误：找不到模块"或"命令失败"**
- 确保在安装后运行了 `npm run build`
- 检查 Claude Desktop 配置中的路径是否指向正确的 `build/index.js` 文件

**"身份验证失败"或"无效令牌"**
- 验证您的 RobotEvents API 令牌是否正确且有效
- 确保令牌已正确设置在环境变量或 .env 文件中
- 检查您的 API 访问权限是否已被 RobotEvents 批准

**"未找到赛事"或"搜索失败"**
- 服务器使用混合搜索方法（网络搜索 + API）
- 某些搜索可能需要几秒钟才能完成
- 尝试使用不同的搜索词或更具体的条件

**Claude Desktop 无法识别服务器**
- 配置更改后重启 Claude Desktop
- 检查配置文件中的 JSON 语法
- 确保文件路径使用正斜杠，即使在 Windows 上也是如此

### 调试模式

要查看详细的调试日志：
```bash
node build/index.js 2>&1 | grep DEBUG
```

### 支持

- **NPM 包**: https://www.npmjs.com/package/vex-mcp-server
- **问题反馈**: 在 [GitHub Issues](https://github.com/yangjack8192/vex-mcp-server/issues) 报告错误
- **VEX 社区**: 在 [VEX 论坛](https://www.vexforum.com/) 讨论
- **RobotEvents API**: 文档请访问 https://www.robotevents.com/api/v2

### 更新

**NPM 用户**（推荐）：
```bash
npm update -g vex-mcp-server
```

**开发用户**：
```bash
git pull origin main
npm run build
```

## 贡献

欢迎贡献！请：
1. Fork 仓库
2. 创建功能分支
3. 彻底测试您的更改
4. 提交 Pull Request

## 许可证

该项目使用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 中文社区

该项目特别欢迎中文 VEX 社区的参与：

- **学校和教练**: 简化的安装流程让您专注于指导学生
- **学生团队**: 一键安装，专注于数据分析和竞赛准备  
- **家长**: 轻松设置，支持孩子的 STEAM 学习
- **中文支持**: 如果您在使用过程中遇到问题，欢迎用中文提交 Issue

**快速中文安装指南：**
```bash
# 1. 安装（仅需运行一次）
npm install -g vex-mcp-server

# 2. 在 Claude Desktop 配置中添加：
# "command": "vex-mcp-server"

# 3. 开始使用！向 Claude 提问 VEX 相关问题
```

🎉 享受 Claude + VEX 数据的强大组合吧！