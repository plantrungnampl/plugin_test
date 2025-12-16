# Common Pitfalls and How to Avoid Them

## ViewState Issues

### Pitfall: Excessive ViewState Size
**Problem:**
```csharp
// Storing large objects in ViewState
ViewState["DataTable"] = GetLargeDataTable(); // Can be 100KB+
```

**Solution:**
```csharp
// Use Session or Cache for large data
Session["DataTable"] = GetLargeDataTable();

// Or disable ViewState and reload data on postback
protected override void OnInit(EventArgs e)
{
    EnableViewState = false;
}

protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack || _dataTable == null)
    {
        _dataTable = GetLargeDataTable();
    }
}
```

### Pitfall: ViewState Tampering
**Problem:**
```csharp
// Trusting ViewState data without validation
int productId = (int)ViewState["ProductId"];
DeleteProduct(productId); // Attacker could modify this
```

**Solution:**
```csharp
// Enable ViewState MAC and encryption
<pages enableViewStateMac="true" viewStateEncryptionMode="Always" />

// Additional validation
protected void btnDelete_Click(object sender, EventArgs e)
{
    int productId = (int)ViewState["ProductId"];
    
    // Verify user has permission to delete this product
    if (!UserCanDeleteProduct(productId))
    {
        throw new UnauthorizedAccessException();
    }
    
    DeleteProduct(productId);
}
```

## Session Management Issues

### Pitfall: Session State Loss
**Problem:**
```csharp
// Session lost due to application pool recycle
var cart = Session["Cart"] as ShoppingCart;
if (cart == null)
{
    // User loses cart!
}
```

**Solution:**
```csharp
// Use SQL Server or StateServer session mode
<sessionState mode="StateServer" 
              stateConnectionString="tcpip=127.0.0.1:42424" 
              timeout="30" />

// Or implement session recovery
var cart = Session["Cart"] as ShoppingCart;
if (cart == null)
{
    // Try to recover from database
    cart = RecoverCartFromDatabase(userId);
    Session["Cart"] = cart;
}
```

### Pitfall: Session Timeout Not Handled
**Problem:**
```csharp
// No handling for session timeout
var user = Session["User"] as User;
string username = user.Username; // NullReferenceException if session expired
```

**Solution:**
```csharp
// Global session timeout handling
void Session_End(object sender, EventArgs e)
{
    // Cleanup
}

// Check session in base page
public class BasePage : Page
{
    protected override void OnPreInit(EventArgs e)
    {
        if (Session["User"] == null && !IsLoginPage())
        {
            Response.Redirect("~/Login.aspx?timeout=1");
        }
        base.OnPreInit(e);
    }
}
```

## Data Access Pitfalls

### Pitfall: SQL Injection
**Problem:**
```csharp
// String concatenation in SQL
var sql = "SELECT * FROM Users WHERE Username = '" + username + "'";
// VULNERABLE to: ' OR '1'='1
```

**Solution:**
```csharp
// Always use parameters
using (var cmd = new SqlCommand(
    "SELECT * FROM Users WHERE Username = @Username", conn))
{
    cmd.Parameters.AddWithValue("@Username", username);
    // Execute safely
}
```

### Pitfall: Not Disposing Resources
**Problem:**
```csharp
// Connections not properly disposed
var conn = new SqlConnection(_connectionString);
conn.Open();
var cmd = new SqlCommand("SELECT * FROM Products", conn);
var reader = cmd.ExecuteReader();
// If exception occurs, connection never closes!
```

**Solution:**
```csharp
// Use using statements
using (var conn = new SqlConnection(_connectionString))
using (var cmd = new SqlCommand("SELECT * FROM Products", conn))
{
    conn.Open();
    using (var reader = cmd.ExecuteReader())
    {
        // Process data
    }
} // Automatically disposed even if exception occurs
```

### Pitfall: N+1 Query Problem
**Problem:**
```csharp
// Loading categories, then products for each category (N+1 queries)
var categories = _context.Categories.ToList();
foreach (var category in categories)
{
    category.Products = _context.Products
        .Where(p => p.CategoryId == category.CategoryId)
        .ToList(); // Separate query for each category!
}
```

**Solution:**
```csharp
// Use eager loading
var categories = _context.Categories
    .Include(c => c.Products)
    .ToList(); // Single query with JOIN
```

## Performance Pitfalls

### Pitfall: Loading All Data
**Problem:**
```csharp
// Loading entire table
var products = _context.Products.ToList(); // Could be millions of records!
```

**Solution:**
```csharp
// Use paging
var products = _context.Products
    .OrderBy(p => p.Name)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToList();

// Or use projection for list views
var productList = _context.Products
    .Select(p => new { p.ProductId, p.Name, p.Price })
    .ToList();
```

### Pitfall: Unnecessary Postbacks
**Problem:**
```aspx
<!-- Every dropdown change causes full page reload -->
<asp:DropDownList ID="ddlCategory" runat="server" 
                  AutoPostBack="true" 
                  OnSelectedIndexChanged="ddlCategory_Changed" />
```

**Solution:**
```aspx
<!-- Use UpdatePanel for partial updates -->
<asp:UpdatePanel ID="upProducts" runat="server">
    <ContentTemplate>
        <asp:DropDownList ID="ddlCategory" runat="server" 
                          AutoPostBack="true" 
                          OnSelectedIndexChanged="ddlCategory_Changed" />
        <asp:GridView ID="gvProducts" runat="server" />
    </ContentTemplate>
</asp:UpdatePanel>

<!-- Or use client-side JavaScript -->
<select id="categoryFilter" onchange="filterProducts()">
    <!-- Options -->
</select>
<script>
function filterProducts() {
    // Client-side filtering or AJAX call
}
</script>
```

## Security Pitfalls

### Pitfall: XSS Vulnerability
**Problem:**
```aspx
<!-- Directly outputting user input -->
<asp:Label ID="lblName" runat="server" />

// Code-behind
lblName.Text = Request.QueryString["name"]; // VULNERABLE!
```

**Solution:**
```csharp
// Always encode output
lblName.Text = Server.HtmlEncode(Request.QueryString["name"]);

// Or use Literal with Mode="Encode"
<asp:Literal ID="litName" runat="server" Mode="Encode" />
litName.Text = Request.QueryString["name"];
```

### Pitfall: Missing Authorization Checks
**Problem:**
```csharp
// Trusting that only admins can access the page
protected void btnDelete_Click(object sender, EventArgs e)
{
    DeleteUser(userId); // No authorization check!
}
```

**Solution:**
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    if (!User.IsInRole("Admin"))
    {
        Response.Redirect("~/Unauthorized.aspx");
    }
}

protected void btnDelete_Click(object sender, EventArgs e)
{
    // Double-check authorization
    if (!User.IsInRole("Admin"))
    {
        throw new UnauthorizedAccessException();
    }
    
    DeleteUser(userId);
}
```

### Pitfall: Sensitive Data in ViewState
**Problem:**
```csharp
// Storing sensitive data in ViewState
ViewState["CreditCard"] = creditCardNumber; // Visible in page source!
```

**Solution:**
```csharp
// Never store sensitive data in ViewState
// Use Session for user-specific sensitive data
Session["CreditCard"] = EncryptData(creditCardNumber);

// Or use server-side storage
string token = GenerateToken();
StoreCreditCard(token, creditCardNumber); // Store in database
ViewState["Token"] = token; // Only store token
```

## Event Handling Pitfalls

### Pitfall: Event Handler Wired Multiple Times
**Problem:**
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    btnSubmit.Click += btnSubmit_Click; // Wired on every postback!
}
```

**Solution:**
```csharp
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    // Wire events in OnInit, not Page_Load
    btnSubmit.Click += btnSubmit_Click;
}

// Or use AutoEventWireup="true" and naming convention
protected void btnSubmit_Click(object sender, EventArgs e)
{
    // Automatically wired
}
```

### Pitfall: Page Lifecycle Misunderstanding
**Problem:**
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        LoadData();
    }
}

protected void btnFilter_Click(object sender, EventArgs e)
{
    // This won't work - LoadData already called in Page_Load!
    ApplyFilter();
}
```

**Solution:**
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        LoadData();
    }
}

protected void btnFilter_Click(object sender, EventArgs e)
{
    ApplyFilter();
    LoadData(); // Reload with filter applied
}
```

## UpdatePanel Pitfalls

### Pitfall: Entire Page in UpdatePanel
**Problem:**
```aspx
<!-- Wrapping entire page defeats the purpose -->
<asp:UpdatePanel ID="upPage" runat="server">
    <ContentTemplate>
        <!-- All page content -->
    </ContentTemplate>
</asp:UpdatePanel>
```

**Solution:**
```aspx
<!-- Only wrap dynamic sections -->
<div class="static-header">
    <h1>My Page</h1>
</div>

<asp:UpdatePanel ID="upDynamic" runat="server">
    <ContentTemplate>
        <!-- Only content that changes -->
        <asp:GridView ID="gvResults" runat="server" />
    </ContentTemplate>
</asp:UpdatePanel>
```

### Pitfall: File Upload in UpdatePanel
**Problem:**
```aspx
<asp:UpdatePanel ID="upUpload" runat="server">
    <ContentTemplate>
        <asp:FileUpload ID="fuFile" runat="server" />
        <asp:Button ID="btnUpload" runat="server" OnClick="Upload" />
    </ContentTemplate>
</asp:UpdatePanel>
<!-- File upload doesn't work in UpdatePanel! -->
```

**Solution:**
```aspx
<!-- Use PostBackTrigger -->
<asp:UpdatePanel ID="upUpload" runat="server">
    <ContentTemplate>
        <asp:FileUpload ID="fuFile" runat="server" />
        <asp:Button ID="btnUpload" runat="server" OnClick="Upload" />
    </ContentTemplate>
    <Triggers>
        <asp:PostBackTrigger ControlID="btnUpload" />
    </Triggers>
</asp:UpdatePanel>

<!-- Or use AsyncFileUpload from AJAX Control Toolkit -->
<ajaxToolkit:AsyncFileUpload ID="afuFile" runat="server" />
```

## Memory Leak Pitfalls

### Pitfall: Event Handler Not Unregistered
**Problem:**
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    Application["GlobalEvent"] += OnGlobalEvent; // Never unregistered!
}
```

**Solution:**
```csharp
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    Application["GlobalEvent"] += OnGlobalEvent;
}

protected override void OnUnload(EventArgs e)
{
    Application["GlobalEvent"] -= OnGlobalEvent;
    base.OnUnload(e);
}
```

### Pitfall: Static Collections Growing
**Problem:**
```csharp
public class CacheManager
{
    private static Dictionary<string, object> _cache = new Dictionary<string, object>();
    
    public static void Add(string key, object value)
    {
        _cache[key] = value; // Never cleaned up!
    }
}
```

**Solution:**
```csharp
public class CacheManager
{
    private static Dictionary<string, CacheItem> _cache = new Dictionary<string, CacheItem>();
    
    public static void Add(string key, object value, TimeSpan expiration)
    {
        _cache[key] = new CacheItem 
        { 
            Value = value, 
            ExpiresAt = DateTime.UtcNow.Add(expiration) 
        };
        
        CleanupExpiredItems();
    }
    
    private static void CleanupExpiredItems()
    {
        var now = DateTime.UtcNow;
        var expiredKeys = _cache
            .Where(kvp => kvp.Value.ExpiresAt < now)
            .Select(kvp => kvp.Key)
            .ToList();
            
        foreach (var key in expiredKeys)
        {
            _cache.Remove(key);
        }
    }
}
```

## Validation Pitfalls

### Pitfall: Client-Side Validation Only
**Problem:**
```aspx
<asp:RequiredFieldValidator ID="rfvName" runat="server" 
    ControlToValidate="txtName" />

<!-- Attacker can bypass client-side validation! -->
```

**Solution:**
```csharp
protected void btnSubmit_Click(object sender, EventArgs e)
{
    // Always validate on server
    if (!Page.IsValid)
    {
        return;
    }
    
    // Additional server-side validation
    if (string.IsNullOrWhiteSpace(txtName.Text))
    {
        // Show error
        return;
    }
    
    ProcessForm();
}
```

### Pitfall: ValidationGroup Not Used
**Problem:**
```aspx
<!-- Multiple forms on same page - all validators fire together -->
<asp:TextBox ID="txtSearch" runat="server" />
<asp:RequiredFieldValidator ID="rfvSearch" runat="server" 
    ControlToValidate="txtSearch" />
<asp:Button ID="btnSearch" runat="server" />

<asp:TextBox ID="txtEmail" runat="server" />
<asp:RequiredFieldValidator ID="rfvEmail" runat="server" 
    ControlToValidate="txtEmail" />
<asp:Button ID="btnSubscribe" runat="server" />
<!-- Both validators fire regardless of which button clicked! -->
```

**Solution:**
```aspx
<!-- Use ValidationGroup -->
<asp:TextBox ID="txtSearch" runat="server" />
<asp:RequiredFieldValidator ID="rfvSearch" runat="server" 
    ControlToValidate="txtSearch" 
    ValidationGroup="SearchGroup" />
<asp:Button ID="btnSearch" runat="server" 
    ValidationGroup="SearchGroup" />

<asp:TextBox ID="txtEmail" runat="server" />
<asp:RequiredFieldValidator ID="rfvEmail" runat="server" 
    ControlToValidate="txtEmail" 
    ValidationGroup="SubscribeGroup" />
<asp:Button ID="btnSubscribe" runat="server" 
    ValidationGroup="SubscribeGroup" />
```

## Best Practices Summary

✓ **Always use parameterized queries**
✓ **Dispose resources with using statements**
✓ **Validate on both client and server**
✓ **Encode all user input before output**
✓ **Use UpdatePanel judiciously**
✓ **Implement proper error handling**
✓ **Monitor ViewState size**
✓ **Use paging for large datasets**
✓ **Implement authorization checks**
✓ **Handle session timeout gracefully**
✓ **Use ValidationGroups for multiple forms**
✓ **Clean up event handlers**
✓ **Test with security in mind**
