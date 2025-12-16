# ASP.NET Web Forms Plugin - Overview

## 📦 Plugin Structure

```
aspnet-webforms-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata
├── agents/
│   └── aspnet-webforms-expert.md  # Expert agent definition
├── skills/
│   ├── aspnet-webforms-senior/
│   │   └── SKILL.md             # ⚠️ Cần thêm nội dung
│   └── ultra-think/
│       └── SKILL.md             # ⚠️ Cần thêm nội dung
├── .mcp.json                    # MCP server config
├── .gitignore
├── README.md                    # Main documentation
├── SETUP.md                     # Installation guide
├── CHANGELOG.md                 # Version history
└── marketplace-example.json     # Marketplace config
```

## ✅ Đã hoàn thành

- ✅ Plugin structure chuẩn Claude Code
- ✅ Agent definition với frontmatter đúng format
- ✅ MCP server configuration
- ✅ Documentation đầy đủ
- ✅ Setup guides cho Windows/Linux/Mac
- ✅ Example configurations

## ⚠️ Cần bổ sung

### 1. Skills Content (QUAN TRỌNG)

Bạn cần thêm nội dung cho 2 skills:

#### `skills/aspnet-webforms-senior/SKILL.md`
- Copy từ file skill gốc `/mnt/skills/user/aspnet-webforms-senior/SKILL.md`
- Hoặc tạo mới với nội dung về:
  - WebForms architecture patterns
  - Oracle/SQL Server best practices
  - ViewState & performance optimization
  - Security patterns
  - Legacy code modernization

#### `skills/ultra-think/SKILL.md`
- Copy từ file skill gốc ultra-think
- Hoặc implement 10-step analysis framework:
  1. Parse Problem
  2. Multi-Dimensional Analysis
  3. Generate Solutions
  4. Deep Dive
  5. Cross-Domain Thinking
  6. Challenge & Refine
  7. Synthesize
  8. Recommendations
  9. Alternatives
  10. Meta-Analysis

### 2. MCP Server Path

Kiểm tra và update path trong `.mcp.json` nếu cần:
```json
{
  "mcpServers": {
    "aspnet-webforms-tools": {
      "command": "node",
      "args": ["C:\\tools\\index.js"]  // ← Update path này
    }
  }
}
```

### 3. Author Information

Update trong `plugin.json` và `README.md`:
- Email address
- GitHub username
- Repository URL

## 🚀 Quick Start

### 1. Hoàn thiện nội dung

```bash
# 1. Thêm skills content
# Edit: skills/aspnet-webforms-senior/SKILL.md
# Edit: skills/ultra-think/SKILL.md

# 2. Update MCP server path
# Edit: .mcp.json

# 3. Update author info
# Edit: .claude-plugin/plugin.json
# Edit: README.md
```

### 2. Test local

```bash
# Windows
xcopy /E /I aspnet-webforms-plugin %USERPROFILE%\.claude\plugins\aspnet-webforms-plugin

# Linux/Mac
cp -r aspnet-webforms-plugin ~/.claude/plugins/

# Test
claude
/plugin list
```

### 3. Publish (optional)

```bash
# Init git
git init
git add .
git commit -m "Initial release"

# Push to GitHub
git remote add origin https://github.com/yourusername/aspnet-webforms-plugin
git push -u origin main

# Install from marketplace
/plugin marketplace add yourusername/aspnet-webforms-plugin
/plugin install aspnet-webforms-plugin
```

## 💡 Usage Examples

### Example 1: Create New Feature
```
User: "I need to create a new WebForms page for employee management"

Agent: [automatically activates]
- Loads aspnet-webforms-senior skill
- Reads CLAUDE.md for project context
- Proposes solution following project patterns
```

### Example 2: Code Review
```
User: "Review this Login.aspx.cs file"

Agent: [activates with security focus]
- Checks SQL injection prevention
- Validates input handling
- Reviews ViewState usage
- Suggests improvements
```

### Example 3: Deep Analysis
```
User: "Deep Analysis: How to modernize this legacy app?"

Agent: [activates ultra-think]
- 10-step analysis process
- Multiple solution paths
- Trade-off analysis
- Migration strategy
```

## 🔧 Advanced Configuration

### Team Setup

Create `.claude/settings.json` trong project:
```json
{
  "marketplaces": [
    "yourusername/aspnet-webforms-plugin"
  ],
  "plugins": [
    "aspnet-webforms-plugin"
  ]
}
```

Team members sẽ auto-install plugin khi clone project.

### Custom MCP Tools

Thêm tools trong `C:\tools\index.js`:
```javascript
// Example: Custom WebForms analyzer
export const analyzeViewState = async (filePath) => {
  // Implementation
};
```

### Hooks (Advanced)

Thêm hooks cho automation:
```json
{
  "PreToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "bash ./hooks/validate.sh"
    }]
  }]
}
```

## 📚 Resources

- [Claude Code Documentation](https://code.claude.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Plugin Examples](https://github.com/anthropics/claude-code/tree/main/plugins)
- [Community Marketplace](https://github.com/jeremylongshore/claude-code-plugins-plus)

## 🤝 Support

- Issues: Tạo issue trên GitHub
- Questions: GitHub Discussions
- Updates: Watch repository

## 📄 License

[Choose your license]
- MIT (recommended cho open source)
- Apache 2.0
- Custom

---

**Status**: Ready for development testing
**Next**: Add skills content → Test locally → Share with team
