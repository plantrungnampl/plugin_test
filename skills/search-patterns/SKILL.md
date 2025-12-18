---
name: search-patterns
description: Library of common search patterns for ASP.NET Web Forms codebase analysis. Includes patterns for security audits, performance analysis, architecture discovery, and legacy code detection.
---

# Search Patterns Library

A comprehensive collection of search patterns for analyzing ASP.NET Web Forms codebases. Use these patterns with `Grep` and `Glob` tools for efficient code discovery.

## 🔒 Security Patterns

### SQL Injection Detection
```
# Direct string concatenation in SQL (HIGH RISK)
Pattern: "SELECT.*\+|INSERT.*\+|UPDATE.*\+|DELETE.*\+"
Pattern: "\"SELECT.*\" \+ |'SELECT.*' \+ "
Pattern: "cmd\.CommandText = .*\+"

# Safe patterns (parameterized)
Pattern: "@\w+|SqlParameter|AddWithValue|Parameters\.Add"
```

### XSS Vulnerability Detection
```
# Unencoded output (RISK)
Pattern: "<%=.*Eval\(|<%=.*Request\[|<%=.*Session\["
Pattern: "Response\.Write\(.*Request|Response\.Write\(.*Session"
Pattern: "innerHTML.*=.*Request|innerText.*=.*Request"

# Safe patterns
Pattern: "<%:.*%>|Server\.HtmlEncode|HttpUtility\.HtmlEncode"
Pattern: "AntiXssEncoder|HtmlSanitizer"
```

### Hardcoded Credentials
```
# Potential secrets (CRITICAL)
Pattern: "password\s*=\s*[\"']|pwd\s*=\s*[\"']"
Pattern: "connectionString.*password|Data Source.*Password"
Pattern: "apikey|api_key|secret_key|private_key"
Pattern: "Bearer\s+[A-Za-z0-9]+"
```

### Authentication/Authorization
```
# Auth checks
Pattern: "FormsAuthentication|Membership\.|User\.Identity"
Pattern: "IsAuthenticated|IsInRole|Authorize"
Pattern: "Session\[.*(User|Login|Auth)"

# Missing auth (potential issue)
Pattern: "Page_Load(?!.*IsAuthenticated)"
```

### CSRF Protection
```
# Anti-forgery patterns
Pattern: "AntiForgeryToken|ValidateAntiForgeryToken"
Pattern: "__RequestVerificationToken"
Pattern: "ViewStateMac|EnableViewStateMac"
```

## ⚡ Performance Patterns

### ViewState Issues
```
# ViewState enabled (potential bloat)
Pattern: "EnableViewState\s*=\s*[\"']?true"
Pattern: "ViewState\[.*\]\s*="

# ViewState disabled (good practice)
Pattern: "EnableViewState\s*=\s*[\"']?false"
```

### Postback Optimization
```
# Missing IsPostBack check
Pattern: "Page_Load(?!.*IsPostBack)"
Pattern: "protected void Page_Load.*\{[^}]*DataBind[^}]*\}"

# Proper IsPostBack usage
Pattern: "if\s*\(\s*!?\s*IsPostBack\s*\)"
```

### Caching
```
# Output caching
Pattern: "<%@\s*OutputCache|Response\.Cache"
Pattern: "CacheProfile|VaryByParam|Duration"

# Data caching
Pattern: "Cache\[|HttpRuntime\.Cache|MemoryCache"
Pattern: "SqlCacheDependency|CacheDependency"
```

### N+1 Query Detection
```
# Potential N+1 (query in loop)
Pattern: "foreach.*\{[^}]*ExecuteReader|while.*\{[^}]*SqlCommand"
Pattern: "for\s*\([^)]*\).*SqlConnection|foreach.*SqlConnection"
```

### Async Patterns
```
# Async usage (.NET 4.5+)
Pattern: "async\s+void|async\s+Task|await\s+"
Pattern: "RegisterAsyncTask|PageAsyncTask"
```

## 🏗️ Architecture Patterns

### Layer Detection
```
# Data Access Layer
Pattern: "using System\.Data|SqlConnection|OracleConnection"
Pattern: "DbContext|IRepository|IUnitOfWork"

# Business Logic Layer
Pattern: "using.*\.BLL|using.*\.Business|using.*\.Services"
Pattern: "class.*Service|class.*Manager|class.*Handler"

# Presentation Layer
Pattern: "using System\.Web\.UI|Page_Load|CodeBehind"
Pattern: "\.aspx|\.ascx|\.master"
```

### Design Patterns
```
# Singleton
Pattern: "private static.*instance|static.*Instance.*\{.*get"

# Factory
Pattern: "Factory|Create.*\(\)|Build.*\(\)"

# Repository
Pattern: "IRepository|Repository<|GetById|GetAll"

# MVP/MVC
Pattern: "IView|Presenter|Controller"
```

### Dependency Injection
```
# DI containers
Pattern: "Autofac|Ninject|Unity|SimpleInjector"
Pattern: "\.Resolve<|\.GetInstance<|IServiceProvider"
Pattern: "DependencyResolver|ServiceLocator"
```

## 📁 File Type Patterns (Glob)

### WebForms Files
```
**/*.aspx        # Web Forms pages
**/*.aspx.cs     # Code-behind files
**/*.ascx        # User Controls
**/*.ascx.cs     # User Control code-behind
**/*.master      # Master Pages
**/*.master.cs   # Master Page code-behind
```

### Configuration
```
**/Web.config           # Main config
**/Web.*.config         # Transform configs
**/App.config           # App config
**/connectionStrings.config
**/appSettings.config
```

### Data Access
```
**/*.edmx        # Entity Framework models
**/*.dbml        # LINQ to SQL
**/DAL/**/*.cs   # DAL layer
**/Data/**/*.cs  # Data layer
**/Repository/**/*.cs
```

### JavaScript/CSS
```
**/Scripts/**/*.js
**/Content/**/*.css
**/js/**/*.js
**/css/**/*.css
```

## 🔍 Legacy Code Detection

### Deprecated Patterns
```
# Old ADO.NET patterns
Pattern: "SqlDataAdapter|DataSet\s+ds|Fill\(ds\)"

# Old AJAX patterns
Pattern: "UpdatePanel|ScriptManager|AsyncPostBackTrigger"

# Old validation
Pattern: "BaseValidator|CustomValidator|ValidationSummary"

# Old state management
Pattern: "Session\[\"[^\"]+\"\]\s*=|Application\[\"[^\"]+\"\]"
```

### Technical Debt Indicators
```
# TODO/FIXME comments
Pattern: "//\s*TODO|//\s*FIXME|//\s*HACK|//\s*XXX"

# Commented code blocks
Pattern: "//.*\{|//.*\}|//.*if\s*\(|//.*for\s*\("

# Magic numbers/strings
Pattern: "==\s*\d{3,}|==\s*\"[^\"]{20,}\""

# Large methods (lines with multiple statements)
Pattern: "\{[^}]{2000,}\}"
```

## 📊 Audit Queries

### Count by Type
```bash
# Count all .aspx files
find . -name "*.aspx" | wc -l

# Count lines of C# code
find . -name "*.cs" -exec cat {} \; | wc -l

# List largest files
find . -name "*.cs" -exec wc -l {} \; | sort -rn | head -20
```

### Dependency Mapping
```
# Find all using statements
Pattern: "^using\s+[A-Za-z0-9\.]+"

# Find all references to a namespace
Pattern: "using\s+MyApp\.DAL|MyApp\.DAL\."

# Find all class inheritance
Pattern: "class\s+\w+\s*:\s*\w+"
```

## 🎯 Quick Reference Table

| Category | Pattern Purpose | Risk Level |
|----------|-----------------|------------|
| `SELECT.*\+` | SQL Injection | 🔴 Critical |
| `<%=.*Request` | XSS | 🔴 Critical |
| `password\s*=` | Hardcoded creds | 🔴 Critical |
| `EnableViewState="true"` | ViewState bloat | 🟡 Warning |
| `Page_Load(?!.*IsPostBack)` | Missing IsPostBack | 🟡 Warning |
| `foreach.*SqlCommand` | N+1 Query | 🟡 Warning |
| `//\s*TODO` | Tech debt | 🟢 Info |
| `async\s+Task` | Modern pattern | ✅ Good |

## 💡 Usage Tips

1. **Start Broad, Then Narrow**: Use file type filters first, then content patterns
2. **Combine Patterns**: Chain multiple greps for precision
3. **Case Sensitivity**: Use case-insensitive for credentials, case-sensitive for code
4. **False Positives**: Always verify findings manually
5. **Context Matters**: A pattern in test code is different from production code
