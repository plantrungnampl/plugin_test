# ASP.NET Web Forms Plugin

Elite ASP.NET Web Forms development plugin với Oracle/SQL Server integration, system design expertise, và ultra-think capabilities.

## 🎯 Features

- **Expert Agent**: `aspnet-webforms-expert` - Elite architect với 15+ năm kinh nghiệm
- **Skills**: 
  - `aspnet-webforms-senior` - Deep WebForms expertise với Oracle/SQL Server
  - `ultra-think` - 10-step deep analysis cho complex scenarios
- **MCP Server**: Custom tools cho ASP.NET Web Forms development

## 📦 Installation

### Từ Local

```bash
# Clone hoặc copy plugin folder vào ~/.claude/plugins/
cp -r aspnet-webforms-plugin ~/.claude/plugins/

# Hoặc dùng symbolic link
ln -s /path/to/aspnet-webforms-plugin ~/.claude/plugins/aspnet-webforms-plugin
```

### Từ Git Repository (sau khi push lên GitHub)

```bash
# Add marketplace
/plugin marketplace add yourusername/aspnet-webforms-plugin

# Install plugin
/plugin install aspnet-webforms-plugin
```

## 🚀 Usage

### Agent Usage

Agent sẽ tự động activate khi bạn:
- Làm việc với `.aspx`, `.ascx`, `.aspx.cs` files
- Đề cập đến WebForms, ViewState, postback
- Yêu cầu review/refactor ASP.NET code

Hoặc gọi trực tiếp:
```
@aspnet-webforms-expert review this code-behind file
```

### Ultra-Think Mode

Cho complex scenarios:
```
Deep Analysis: How should I migrate this legacy WebForms app to modern patterns?
```

### MCP Tools

Custom tools sẽ tự động available khi plugin enabled.

## ⚙️ Configuration

### MCP Server Path

Nếu MCP server của bạn không ở `C:\tools\index.js`, update file `.mcp.json`:

```json
{
  "mcpServers": {
    "aspnet-webforms-tools": {
      "command": "node",
      "args": ["path/to/your/index.js"]
    }
  }
}
```

### Skills Content

Bạn cần thêm nội dung cho skills:

1. **aspnet-webforms-senior skill**:
   - Copy nội dung từ `/mnt/skills/user/aspnet-webforms-senior/SKILL.md`
   - Paste vào `skills/aspnet-webforms-senior/SKILL.md`

2. **ultra-think skill**:
   - Copy nội dung từ skill gốc
   - Paste vào `skills/ultra-think/SKILL.md`

## 📚 Documentation

### Agent Responsibilities

1. **Maintain Legacy Code**: Preserve existing patterns while improving quality
2. **Create New Functionality**: Seamlessly integrate with existing codebase
3. **Refactor Strategically**: Incremental improvements
4. **Optimize Performance**: ViewState, postback, data binding
5. **Bridge Old and New**: Migration paths for modernization

### Startup Sequence

Agent sẽ tự động:
1. Load `aspnet-webforms-senior` skill
2. Read `CLAUDE.md` hoặc `README.md` để hiểu project context
3. Adapt approach theo project patterns

### Ultra-Think Activation

Tự động kích hoạt khi:
- User requests: "Deep Analysis", "System Design", "Migration Strategy"
- Major architectural changes
- Complex refactoring
- System-wide impacts

## 🔧 Development

### Testing Locally

```bash
# Test plugin structure
/plugin marketplace add ./aspnet-webforms-plugin

# Verify components
/plugin list
```

### Publishing to GitHub

```bash
git init
git add .
git commit -m "Initial plugin release"
git remote add origin https://github.com/yourusername/aspnet-webforms-plugin
git push -u origin main
```

Plugin sẽ tự động discovered trong 30 phút.

## 📝 Examples

### Creating New Feature
```
I need to create a new page for managing employee records with validation and AJAX submission
```

### Code Review
```
I've updated Login.aspx.cs to add remember-me functionality. Can you review it?
```

### Performance Analysis
```
The page is loading really slowly and I think it's ViewState related
```

### Legacy Modernization
```
We have a lot of inline SQL in code-behind files. How can we improve this?
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Test changes locally
4. Submit pull request

## 📄 License

[Your License Here]

## 👤 Author

**antrungnam**
- Vietnamese developer
- 4 months experience with ASP.NET Web Forms & Oracle
- Working on warehouse management systems

## 🆘 Support

- Issues: [GitHub Issues](https://github.com/yourusername/aspnet-webforms-plugin/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/aspnet-webforms-plugin/discussions)
