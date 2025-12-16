---
name: aspnet-webforms-senior
description: Comprehensive ASP.NET Web Forms (.NET Framework 3.x/4.x) expertise covering architecture patterns, state management, security, performance optimization, legacy modernization, and enterprise-scale development. Use when working with Web Forms projects including legacy maintenance, performance tuning, security hardening, data access optimization, Ajax implementation, custom controls, deployment strategies, or migrating to modern patterns.
---

# ASP.NET Web Forms Senior Developer Skill

Comprehensive guide for senior-level ASP.NET Web Forms development with .NET Framework 3.x/4.x, covering enterprise patterns, performance optimization, security hardening, and legacy modernization.

## Core Architecture Patterns

### Model-View-Presenter (MVP) Pattern
Implement MVP to achieve testable, maintainable code in Web Forms:

**Presenter Example:**
```csharp
public interface IProductView
{
    string ProductId { get; set; }
    string ProductName { get; set; }
    decimal Price { get; set; }
    void ShowError(string message);
    void ShowSuccess(string message);
}

public class ProductPresenter
{
    private readonly IProductView _view;
    private readonly IProductService _service;
    
    public ProductPresenter(IProductView view, IProductService service)
    {
        _view = view;
        _service = service;
    }
    
    public void LoadProduct(int id)
    {
        try
        {
            var product = _service.GetProduct(id);
            _view.ProductName = product.Name;
            _view.Price = product.Price;
        }
        catch (Exception ex)
        {
            _view.ShowError($"Error loading product: {ex.Message}");
        }
    }
}
```

### Repository Pattern for Data Access
```csharp
public interface IRepository<T> where T : class
{
    T GetById(int id);
    IEnumerable<T> GetAll();
    void Add(T entity);
    void Update(T entity);
    void Delete(int id);
    void SaveChanges();
}

public class ProductRepository : IRepository<Product>
{
    private readonly DbContext _context;
    
    public Product GetById(int id)
    {
        return _context.Products.Find(id);
    }
    
    // Implementation with proper disposal, error handling, logging
}
```

## State Management Best Practices

### ViewState Optimization
```csharp
// Disable ViewState when not needed
<%@ Page EnableViewState="false" %>

// Per-control ViewState management
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    // Disable for read-only controls
    lblMessage.EnableViewState = false;
    // Enable only for interactive controls
    ddlCategories.EnableViewState = true;
}

// ViewState compression for large data
protected override object SaveViewState()
{
    var state = base.SaveViewState();
    return CompressViewState(state);
}

protected override void LoadViewState(object savedState)
{
    var state = DecompressViewState(savedState);
    base.LoadViewState(state);
}
```

### Session Management
```csharp
// Session wrapper for type safety
public class SessionManager
{
    private const string USER_KEY = "CurrentUser";
    private const string CART_KEY = "ShoppingCart";
    
    public static User CurrentUser
    {
        get => HttpContext.Current.Session[USER_KEY] as User;
        set => HttpContext.Current.Session[USER_KEY] = value;
    }
    
    public static ShoppingCart Cart
    {
        get => HttpContext.Current.Session[CART_KEY] as ShoppingCart 
               ?? new ShoppingCart();
        set => HttpContext.Current.Session[CART_KEY] = value;
    }
}

// Session timeout handling
void Session_Start(object sender, EventArgs e)
{
    Session.Timeout = 30; // minutes
}

void Session_End(object sender, EventArgs e)
{
    // Cleanup logic
    var user = Session["CurrentUser"] as User;
    if (user != null)
    {
        LogUserLogout(user.Id);
    }
}
```

### Caching Strategies
```csharp
// Output caching
<%@ OutputCache Duration="60" VaryByParam="categoryId" %>

// Data caching with dependencies
public List<Product> GetProducts()
{
    string cacheKey = "ProductList";
    var products = Cache[cacheKey] as List<Product>;
    
    if (products == null)
    {
        products = _repository.GetAll().ToList();
        
        // Cache with SQL dependency
        var dependency = new SqlCacheDependency("AppDB", "Products");
        Cache.Insert(cacheKey, products, dependency, 
                    DateTime.Now.AddHours(1), 
                    Cache.NoSlidingExpiration);
    }
    
    return products;
}
```

## Security Implementation

### Authentication & Authorization
```csharp
// Forms Authentication setup in Web.config
<authentication mode="Forms">
    <forms loginUrl="~/Login.aspx" 
           timeout="30" 
           slidingExpiration="true"
           protection="All"
           requireSSL="true" />
</authentication>

// Login implementation
protected void btnLogin_Click(object sender, EventArgs e)
{
    if (ValidateUser(txtUsername.Text, txtPassword.Text))
    {
        var user = GetUserInfo(txtUsername.Text);
        
        // Create authentication ticket
        var ticket = new FormsAuthenticationTicket(
            1, // version
            user.Username,
            DateTime.Now,
            DateTime.Now.AddMinutes(30),
            chkRememberMe.Checked,
            user.Roles, // User data
            FormsAuthentication.FormsCookiePath
        );
        
        var encryptedTicket = FormsAuthentication.Encrypt(ticket);
        var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);
        
        if (chkRememberMe.Checked)
            cookie.Expires = DateTime.Now.AddDays(30);
            
        Response.Cookies.Add(cookie);
        
        FormsAuthentication.RedirectFromLoginPage(user.Username, chkRememberMe.Checked);
    }
}
```

### CSRF Protection
```csharp
// ViewState MAC protection
<pages enableViewStateMac="true" viewStateEncryptionMode="Always" />

// Anti-CSRF token
public class AntiForgeryHelper
{
    public static string GenerateToken()
    {
        var token = Guid.NewGuid().ToString();
        HttpContext.Current.Session["AntiForgeryToken"] = token;
        return token;
    }
    
    public static bool ValidateToken(string token)
    {
        var sessionToken = HttpContext.Current.Session["AntiForgeryToken"] as string;
        return sessionToken != null && sessionToken == token;
    }
}

// Usage in page
protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        hfToken.Value = AntiForgeryHelper.GenerateToken();
    }
    else
    {
        if (!AntiForgeryHelper.ValidateToken(hfToken.Value))
        {
            throw new InvalidOperationException("CSRF attack detected");
        }
    }
}
```

### XSS Prevention
```csharp
// Input validation
public static string SanitizeInput(string input)
{
    if (string.IsNullOrEmpty(input)) return input;
    
    // HTML encode
    return HttpUtility.HtmlEncode(input);
}

// Output encoding
<asp:Label ID="lblUserName" runat="server" 
           Text='<%# Server.HtmlEncode(Eval("UserName").ToString()) %>' />

// Use AntiXssEncoder for additional protection
string safe = AntiXssEncoder.HtmlEncode(userInput, true);
```

### SQL Injection Prevention
```csharp
// Parameterized queries
public Product GetProduct(int productId, string category)
{
    using (var conn = new SqlConnection(connectionString))
    using (var cmd = new SqlCommand(@"
        SELECT * FROM Products 
        WHERE ProductId = @ProductId AND Category = @Category", conn))
    {
        cmd.Parameters.AddWithValue("@ProductId", productId);
        cmd.Parameters.AddWithValue("@Category", category);
        
        conn.Open();
        using (var reader = cmd.ExecuteReader())
        {
            // Map to object
        }
    }
}

// Using stored procedures
cmd.CommandType = CommandType.StoredProcedure;
cmd.CommandText = "sp_GetProduct";
cmd.Parameters.Add(new SqlParameter("@ProductId", SqlDbType.Int) { Value = productId });
```

## Performance Optimization

### Page Lifecycle Optimization
```csharp
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    // Disable ViewState for entire page if not needed
    EnableViewState = false;
    
    // Set control IDs explicitly to reduce ViewState size
    gvProducts.ClientIDMode = ClientIDMode.Static;
}

protected override void OnPreRender(EventArgs e)
{
    base.OnPreRender(e);
    // Last-minute data binding before rendering
    // Minimize round trips by batching operations here
}
```

### Database Access Optimization
```csharp
// Use async/await for I/O operations (.NET 4.5+)
protected async void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        await LoadDataAsync();
    }
}

private async Task LoadDataAsync()
{
    var products = await _repository.GetProductsAsync();
    gvProducts.DataSource = products;
    gvProducts.DataBind();
}

// Connection pooling configuration
<connectionStrings>
    <add name="AppDB" 
         connectionString="Server=.;Database=MyDB;Integrated Security=true;
                          Min Pool Size=5;Max Pool Size=100;Pooling=true;" />
</connectionStrings>

// Batch operations
public void SaveProductsBatch(List<Product> products)
{
    using (var conn = new SqlConnection(connectionString))
    using (var transaction = conn.BeginTransaction())
    {
        try
        {
            foreach (var product in products)
            {
                // Execute commands within transaction
            }
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
```

### AJAX and UpdatePanel
```aspx
<asp:ScriptManager ID="ScriptManager1" runat="server" 
                   EnablePartialRendering="true"
                   EnableCdn="true" />

<asp:UpdatePanel ID="upProducts" runat="server" UpdateMode="Conditional">
    <ContentTemplate>
        <asp:GridView ID="gvProducts" runat="server" ... />
    </ContentTemplate>
    <Triggers>
        <asp:AsyncPostBackTrigger ControlID="btnSearch" EventName="Click" />
    </Triggers>
</asp:UpdatePanel>
```

```csharp
// Manual UpdatePanel triggers
protected void btnRefresh_Click(object sender, EventArgs e)
{
    // Update only specific panels
    upProducts.Update();
}

// PageRequestManager for client-side control
ScriptManager.RegisterStartupScript(this, GetType(), "PageRequestManager",
    @"Sys.WebForms.PageRequestManager.getInstance().add_beginRequest(onBeginRequest);
      function onBeginRequest(sender, args) {
          var elem = args.get_postBackElement();
          // Show loading indicator
      }", true);
```

## Advanced Techniques

### Custom HttpModule for Request Processing
```csharp
public class SecurityModule : IHttpModule
{
    public void Init(HttpApplication context)
    {
        context.BeginRequest += OnBeginRequest;
        context.EndRequest += OnEndRequest;
    }
    
    private void OnBeginRequest(object sender, EventArgs e)
    {
        var app = (HttpApplication)sender;
        
        // Add security headers
        app.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
        app.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
        app.Response.Headers.Add("X-Content-Type-Options", "nosniff");
        
        // Log request
        LogRequest(app.Request);
    }
    
    public void Dispose() { }
}

// Register in Web.config
<system.webServer>
    <modules>
        <add name="SecurityModule" type="MyApp.SecurityModule" />
    </modules>
</system.webServer>
```

### Custom HttpHandler
```csharp
public class ImageHandler : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        var imageId = context.Request.QueryString["id"];
        var image = GetImageFromDatabase(imageId);
        
        context.Response.ContentType = "image/jpeg";
        context.Response.Cache.SetCacheability(HttpCacheability.Public);
        context.Response.Cache.SetExpires(DateTime.Now.AddDays(7));
        
        context.Response.BinaryWrite(image);
    }
    
    public bool IsReusable => true;
}

// Register in Web.config
<system.webServer>
    <handlers>
        <add name="ImageHandler" path="image.axd" verb="GET" 
             type="MyApp.ImageHandler" />
    </handlers>
</system.webServer>
```

### Custom Web Controls
```csharp
[ToolboxData("<{0}:PagingControl runat=server></{0}:PagingControl>")]
public class PagingControl : WebControl
{
    [Bindable(true), Category("Data")]
    public int TotalRecords { get; set; }
    
    [Bindable(true), Category("Data")]
    public int PageSize { get; set; } = 10;
    
    [Bindable(true), Category("Data")]
    public int CurrentPage { get; set; } = 1;
    
    public event EventHandler<PageChangedEventArgs> PageChanged;
    
    protected override void RenderContents(HtmlTextWriter output)
    {
        int totalPages = (int)Math.Ceiling((double)TotalRecords / PageSize);
        
        for (int i = 1; i <= totalPages; i++)
        {
            if (i == CurrentPage)
            {
                output.Write($"<span class='current'>{i}</span> ");
            }
            else
            {
                output.Write($"<a href='javascript:void(0)' onclick='changePage({i})'>{i}</a> ");
            }
        }
    }
}
```

## Error Handling & Logging

### Global Error Handling
```csharp
// Global.asax
void Application_Error(object sender, EventArgs e)
{
    Exception ex = Server.GetLastError();
    
    // Log exception
    Logger.LogError(ex, HttpContext.Current);
    
    // Custom error page based on exception type
    if (ex is HttpException httpEx)
    {
        if (httpEx.GetHttpCode() == 404)
            Server.Transfer("~/Errors/NotFound.aspx");
        else if (httpEx.GetHttpCode() == 500)
            Server.Transfer("~/Errors/ServerError.aspx");
    }
    
    Server.ClearError();
}

// Web.config
<customErrors mode="RemoteOnly" defaultRedirect="~/Error.aspx">
    <error statusCode="404" redirect="~/Errors/NotFound.aspx" />
    <error statusCode="500" redirect="~/Errors/ServerError.aspx" />
</customErrors>
```

### Structured Logging
```csharp
public class Logger
{
    private static readonly log4net.ILog log = 
        log4net.LogManager.GetLogger(typeof(Logger));
    
    public static void LogError(Exception ex, HttpContext context)
    {
        var errorInfo = new
        {
            Message = ex.Message,
            StackTrace = ex.StackTrace,
            Source = ex.Source,
            Url = context?.Request.Url.ToString(),
            UserAgent = context?.Request.UserAgent,
            IPAddress = context?.Request.UserHostAddress,
            User = context?.User?.Identity?.Name,
            Timestamp = DateTime.UtcNow
        };
        
        log.Error(JsonConvert.SerializeObject(errorInfo, Formatting.Indented), ex);
    }
}
```

## Deployment & Configuration

### Web.config Transformation
```xml
<!-- Web.Debug.config -->
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
    <connectionStrings>
        <add name="AppDB" 
             connectionString="Server=localhost;Database=DevDB;Integrated Security=true;"
             xdt:Transform="SetAttributes" xdt:Locator="Match(name)" />
    </connectionStrings>
    <system.web>
        <compilation xdt:Transform="RemoveAttributes(debug)" />
    </system.web>
</configuration>

<!-- Web.Release.config -->
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
    <connectionStrings>
        <add name="AppDB" 
             connectionString="Server=prod-server;Database=ProdDB;Integrated Security=true;"
             xdt:Transform="SetAttributes" xdt:Locator="Match(name)" />
    </connectionStrings>
    <system.web>
        <customErrors mode="On" xdt:Transform="Replace" />
    </system.web>
</configuration>
```

## Reference Documentation

For detailed information on specific topics, see:

- **[Architecture Patterns](references/architecture-patterns.md)** - Comprehensive patterns including Repository, Unit of Work, Service Layer, Dependency Injection
- **[Data Access Strategies](references/data-access.md)** - ADO.NET, Entity Framework, Dapper, Oracle integration, transaction management
- **[Validation Guide](references/validation-guide.md)** - Complete guide to all ASP.NET validators, patterns, regex library, custom validation
- **[Security Checklist](references/security-checklist.md)** - Complete security audit checklist and remediation strategies
- **[Performance Tuning Guide](references/performance-tuning.md)** - Profiling, optimization techniques, memory management
- **[Legacy Modernization](references/legacy-modernization.md)** - Strategies for modernizing old Web Forms applications
- **[Common Pitfalls](references/common-pitfalls.md)** - Common mistakes and how to avoid them

## Utilities

The skill includes helper scripts in `scripts/`:

- **analyze_viewstate.py** - Analyze ViewState size and contents
- **security_audit.py** - Automated security vulnerability scanning
- **performance_profiler.py** - Page load performance analysis

## Templates

Pre-configured templates in `assets/`:

- **web-config-templates/** - Security-hardened Web.config samples for production deployment
