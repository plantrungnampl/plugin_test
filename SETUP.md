# 🚀 Setup Guide - ASP.NET Web Forms Plugin

Hướng dẫn chi tiết để setup plugin cho Claude Code.

## 📋 Prerequisites

1. **Claude Code** đã được cài đặt:
   ```bash
   npm install -g @anthropic/claude-code
   # hoặc
   curl -fsSL https://code.anthropic.com/install.sh | bash
   ```

2. **Node.js** cho MCP server (nếu dùng)

3. **Skills content** từ hệ thống cũ của bạn

## 🔧 Setup Steps

### Bước 1: Hoàn thiện Skills Content

#### 1.1. ASP.NET WebForms Senior Skill

```bash
# Copy nội dung từ skill gốc
# File: skills/aspnet-webforms-senior/SKILL.md

# Format chuẩn:
---
name: aspnet-webforms-senior
description: Comprehensive ASP.NET Web Forms expertise...
version: 1.0.0
---

[Nội dung skill ở đây]
```

#### 1.2. Ultra-Think Skill

```bash
# Copy nội dung từ skill gốc
# File: skills/ultra-think/SKILL.md

# Format chuẩn:
---
name: ultra-think
description: 10-step deep analysis framework...
version: 1.0.0
---

[Nội dung skill ở đây]
```

### Bước 2: Cấu hình MCP Server

#### 2.1. Update path trong `.mcp.json`:

```json
{
  "mcpServers": {
    "aspnet-webforms-tools": {
      "command": "node",
      "args": ["C:\\tools\\index.js"],
      "env": {}
    }
  }
}
```

#### 2.2. Test MCP server:

```bash
node C:\tools\index.js
```

### Bước 3: Install Plugin

#### Option A: Local Development (Windows)

```bash
# Create plugins directory
mkdir %USERPROFILE%\.claude\plugins

# Copy plugin
xcopy /E /I aspnet-webforms-plugin %USERPROFILE%\.claude\plugins\aspnet-webforms-plugin
```

#### Option B: Local Development (Linux/Mac)

```bash
# Create plugins directory
mkdir -p ~/.claude/plugins

# Copy plugin
cp -r aspnet-webforms-plugin ~/.claude/plugins/

# Hoặc symbolic link
ln -s $(pwd)/aspnet-webforms-plugin ~/.claude/plugins/aspnet-webforms-plugin
```

#### Option C: Từ GitHub

```bash
# Push lên GitHub trước
git init
git add .
git commit -m "Initial release"
git remote add origin https://github.com/yourusername/aspnet-webforms-plugin
git push -u origin main

# Trong Claude Code
/plugin marketplace add yourusername/aspnet-webforms-plugin
/plugin install aspnet-webforms-plugin
```

### Bước 4: Verify Installation

```bash
claude

# Check plugins
/plugin list

# Check agents
/agents list

# Check MCP
/mcp list
```

## 🧪 Testing

### Test Agent:
```
I need to create a new WebForms page with validation
```

### Test Ultra-Think:
```
Deep Analysis: How to migrate legacy app?
```

## 🐛 Troubleshooting

### Plugin not found:
```bash
# Windows
dir %USERPROFILE%\.claude\plugins\aspnet-webforms-plugin

# Linux/Mac
ls ~/.claude/plugins/aspnet-webforms-plugin
```

### MCP Server issues:
```bash
# Test server
node C:\tools\index.js

# Check logs
claude --verbose
```

## 📝 Next Steps

1. ✅ Thêm nội dung skills
2. ✅ Test MCP server
3. ✅ Verify agent activation
4. ✅ Test với real project
5. ✅ Share với team (nếu cần)
