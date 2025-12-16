# Quick Reference Card

## 📝 Checklist Trước Khi Sử Dụng

- [x] Đã thêm nội dung vào `skills/aspnet-webforms-senior/SKILL.md`
- [x] Đã thêm nội dung vào `skills/ultra-think/SKILL.md`
- [ ] Đã kiểm tra path MCP server trong `.mcp.json`
- [ ] Đã test MCP server: `node C:\tools\index.js`
- [ ] Đã update author info trong `plugin.json`
- [ ] Đã update repository URL trong `README.md`

## 🚀 Installation Commands

### Windows
```cmd
xcopy /E /I aspnet-webforms-plugin %USERPROFILE%\.claude\plugins\aspnet-webforms-plugin
```

### Linux/Mac
```bash
cp -r aspnet-webforms-plugin ~/.claude/plugins/
```

### From GitHub
```bash
/plugin marketplace add yourusername/aspnet-webforms-plugin
/plugin install aspnet-webforms-plugin
```

## 🎯 Usage Patterns

### Trigger Agent Automatically
- Làm việc với `.aspx`, `.ascx` files
- Đề cập "WebForms", "ViewState", "postback"
- Request review/refactor ASP.NET code

### Manual Agent Call
```
@aspnet-webforms-expert analyze this code-behind
```

### Ultra-Think Mode
```
Deep Analysis: [your complex question]
System Design: [architecture question]
Migration Strategy: [modernization question]
```

## 🔍 Verification Commands

```bash
# Start Claude Code
claude

# List plugins
/plugin list

# List agents
/agents list

# List MCP servers
/mcp list

# Enable verbose logging
claude --verbose
```

## 🐛 Common Issues

### Issue: Plugin not found
```bash
# Check installation
ls ~/.claude/plugins/aspnet-webforms-plugin  # Mac/Linux
dir %USERPROFILE%\.claude\plugins\aspnet-webforms-plugin  # Windows
```

### Issue: Agent not activating
```bash
# Verify agent file
cat ~/.claude/plugins/aspnet-webforms-plugin/agents/aspnet-webforms-expert.md
```

### Issue: Skills not loading
```bash
# Check skills directories
ls ~/.claude/plugins/aspnet-webforms-plugin/skills/
```

### Issue: MCP server fails
```bash
# Test server standalone
node C:\tools\index.js

# Check Claude logs
claude --verbose
```

## 📊 Plugin Structure Quick View

```
aspnet-webforms-plugin/
├── .claude-plugin/plugin.json   ← Metadata
├── agents/                      ← Agent definitions
├── skills/                      ← Skills (NEED CONTENT!)
├── .mcp.json                   ← MCP config
└── README.md                   ← Documentation
```

## 🔥 Quick Test Prompts

```
Test 1: "Create a new WebForms page with validation"
Test 2: "Review this code for security issues"
Test 3: "Deep Analysis: Migrate to modern architecture"
Test 4: "Optimize ViewState in this page"
Test 5: "What's the best data access pattern for this?"
```

## 📞 Need Help?

1. Check SETUP.md for detailed instructions
2. Read OVERVIEW.md for complete information
3. See README.md for usage examples
4. Create GitHub issue for bugs

## 🎓 Learning Path

1. **Day 1**: Install plugin locally, test basic features
2. **Day 2**: Add real skills content, test with project
3. **Day 3**: Configure MCP server, test custom tools
4. **Day 4**: Push to GitHub, share with team
5. **Day 5**: Collect feedback, iterate

## 💡 Pro Tips

- Use `@aspnet-webforms-expert` for explicit agent calls
- Prefix "Deep Analysis:" for ultra-think mode
- Check CLAUDE.md in project for auto context-loading
- Use verbose mode for debugging: `claude --verbose`
- Skills auto-activate based on context - no command needed!

---
**Version**: 1.0.0
**Last Updated**: 2025-12-16
**Status**: Ready for testing (after adding skills content)
