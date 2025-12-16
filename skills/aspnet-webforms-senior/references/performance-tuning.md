# Performance Tuning Guide for ASP.NET Web Forms

## ViewState Optimization

### Disable Unnecessary ViewState
```csharp
// Page level
<%@ Page EnableViewState="false" %>

// Control level
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    lblReadOnly.EnableViewState = false;
    gvReadOnly.EnableViewState = false;
}
```

### ViewState Compression
```csharp
protected override object SaveViewState()
{
    var state = base.SaveViewState();
    return LZ4Compress(state);
}

protected override void LoadViewState(object savedState)
{
    var state = LZ4Decompress(savedState);
    base.LoadViewState(state);
}

private byte[] LZ4Compress(object data)
{
    var formatter = new LosFormatter();
    using (var ms = new MemoryStream())
    {
        formatter.Serialize(ms, data);
        return LZ4Codec.Wrap(ms.ToArray());
    }
}
```

### ControlState for Critical Data
```csharp
protected override void OnInit(EventArgs e)
{
    base.OnInit(e);
    Page.RegisterRequiresControlState(this);
    EnableViewState = false;
}

protected override object SaveControlState()
{
    var state = new object[] { base.SaveControlState(), _criticalData };
    return state;
}

protected override void LoadControlState(object savedState)
{
    if (savedState != null)
    {
        var state = (object[])savedState;
        base.LoadControlState(state[0]);
        _criticalData = (string)state[1];
    }
}
```

## Caching Strategies

### Output Caching
```aspx
<%@ OutputCache Duration="3600" VaryByParam="categoryId;page" 
                 VaryByCustom="browser" Location="Server" %>
```

```csharp
// Programmatic output caching
Response.Cache.SetExpires(DateTime.Now.AddMinutes(60));
Response.Cache.SetCacheability(HttpCacheability.Public);
Response.Cache.SetValidUntilExpires(true);
Response.Cache.VaryByParams["categoryId"] = true;
```

### Data Caching with Sliding Expiration
```csharp
public List<Product> GetProducts()
{
    string cacheKey = "Products_All";
    var products = Cache[cacheKey] as List<Product>;
    
    if (products == null)
    {
        products = _repository.GetAll().ToList();
        Cache.Insert(cacheKey, products, null, 
                    Cache.NoAbsoluteExpiration, 
                    TimeSpan.FromMinutes(30));
    }
    
    return products;
}
```

### Distributed Caching with Redis
```csharp
public class RedisCacheManager
{
    private static ConnectionMultiplexer _redis;
    private static IDatabase _db;
    
    static RedisCacheManager()
    {
        _redis = ConnectionMultiplexer.Connect("localhost:6379");
        _db = _redis.GetDatabase();
    }
    
    public static T Get<T>(string key)
    {
        var value = _db.StringGet(key);
        if (!value.IsNullOrEmpty)
        {
            return JsonConvert.DeserializeObject<T>(value);
        }
        return default(T);
    }
    
    public static void Set<T>(string key, T value, TimeSpan? expiry = null)
    {
        var json = JsonConvert.SerializeObject(value);
        _db.StringSet(key, json, expiry);
    }
}
```

## Database Optimization

### Connection Pooling
```xml
<connectionStrings>
    <add name="AppDB" 
         connectionString="Server=.;Database=MyDB;Integrated Security=true;
                          Min Pool Size=10;Max Pool Size=100;Pooling=true;
                          Connection Lifetime=300;Connection Timeout=30;" />
</connectionStrings>
```

### Async Database Operations
```csharp
protected async void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        await LoadDataAsync();
    }
}

private async Task LoadDataAsync()
{
    using (var conn = new SqlConnection(_connectionString))
    using (var cmd = new SqlCommand("SELECT * FROM Products", conn))
    {
        await conn.OpenAsync();
        
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            var products = new List<Product>();
            while (await reader.ReadAsync())
            {
                products.Add(MapProduct(reader));
            }
            
            gvProducts.DataSource = products;
            gvProducts.DataBind();
        }
    }
}
```

### Query Optimization
```csharp
// Use projections to select only needed columns
public IEnumerable<ProductListDto> GetProductList()
{
    using (var context = new ApplicationDbContext())
    {
        return context.Products
            .AsNoTracking()
            .Select(p => new ProductListDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Price = p.Price
            })
            .ToList();
    }
}

// Use paging for large datasets
public PagedResult<Product> GetProductsPaged(int page, int pageSize)
{
    using (var context = new ApplicationDbContext())
    {
        var total = context.Products.Count();
        var products = context.Products
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
            
        return new PagedResult<Product>
        {
            Data = products,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
```

## AJAX Optimization

### Minimize UpdatePanel Usage
```aspx
<!-- Only wrap content that changes -->
<asp:UpdatePanel ID="upPartial" runat="server" UpdateMode="Conditional">
    <ContentTemplate>
        <asp:Label ID="lblDynamic" runat="server" />
    </ContentTemplate>
    <Triggers>
        <asp:AsyncPostBackTrigger ControlID="btnUpdate" />
    </Triggers>
</asp:UpdatePanel>

<!-- Static content outside UpdatePanel -->
<h2>Static Header</h2>
```

### Response Compression
```xml
<system.webServer>
    <urlCompression doStaticCompression="true" 
                    doDynamicCompression="true" />
    <httpCompression>
        <dynamicTypes>
            <add mimeType="text/*" enabled="true" />
            <add mimeType="application/javascript" enabled="true" />
            <add mimeType="application/json" enabled="true" />
        </dynamicTypes>
        <staticTypes>
            <add mimeType="text/*" enabled="true" />
            <add mimeType="application/javascript" enabled="true" />
            <add mimeType="text/css" enabled="true" />
        </staticTypes>
    </httpCompression>
</system.webServer>
```

## Static Resource Optimization

### Bundling and Minification
```csharp
public class BundleConfig
{
    public static void RegisterBundles(BundleCollection bundles)
    {
        bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
            "~/Scripts/jquery-{version}.js"));
            
        bundles.Add(new ScriptBundle("~/bundles/app").Include(
            "~/Scripts/site.js",
            "~/Scripts/utils.js"));
            
        bundles.Add(new StyleBundle("~/Content/css").Include(
            "~/Content/site.css",
            "~/Content/bootstrap.css"));
            
        BundleTable.EnableOptimizations = true;
    }
}

// In Master Page
<%: Scripts.Render("~/bundles/jquery") %>
<%: Scripts.Render("~/bundles/app") %>
<%: Styles.Render("~/Content/css") %>
```

### CDN for Static Assets
```aspx
<asp:ScriptManager runat="server" EnableCdn="true">
    <Scripts>
        <asp:ScriptReference Name="jquery" />
    </Scripts>
</asp:ScriptManager>
```

### Image Optimization
- Use appropriate formats (JPEG for photos, PNG for graphics)
- Compress images before upload
- Use responsive images
- Lazy loading for below-fold images

```html
<img src="placeholder.jpg" 
     data-src="actual-image.jpg" 
     class="lazy-load" 
     loading="lazy" />
```

## Memory Management

### Proper Disposal
```csharp
public void ProcessData()
{
    using (var connection = new SqlConnection(_connectionString))
    using (var command = new SqlCommand("...", connection))
    using (var adapter = new SqlDataAdapter(command))
    {
        var dataTable = new DataTable();
        adapter.Fill(dataTable);
        
        // Process data
        
        dataTable.Dispose();
    }
}
```

### Object Pooling
```csharp
public class ObjectPool<T> where T : new()
{
    private readonly ConcurrentBag<T> _objects = new ConcurrentBag<T>();
    private readonly int _maxSize;
    
    public ObjectPool(int maxSize = 100)
    {
        _maxSize = maxSize;
    }
    
    public T Get()
    {
        T item;
        return _objects.TryTake(out item) ? item : new T();
    }
    
    public void Return(T item)
    {
        if (_objects.Count < _maxSize)
        {
            _objects.Add(item);
        }
    }
}
```

## Profiling and Monitoring

### MiniProfiler Integration
```csharp
// Global.asax
protected void Application_BeginRequest()
{
    if (Request.IsLocal)
    {
        MiniProfiler.Start();
    }
}

protected void Application_EndRequest()
{
    MiniProfiler.Stop();
}

// In Master Page
<%= MiniProfiler.RenderIncludes() %>
```

### Custom Performance Counters
```csharp
public class PerformanceMonitor
{
    private static PerformanceCounter _requestsPerSecond;
    private static PerformanceCounter _avgRequestDuration;
    
    static PerformanceMonitor()
    {
        _requestsPerSecond = new PerformanceCounter(
            "ASP.NET Applications", 
            "Requests/Sec", 
            "__Total__", 
            true);
            
        _avgRequestDuration = new PerformanceCounter(
            "ASP.NET Applications", 
            "Request Execution Time", 
            "__Total__", 
            true);
    }
    
    public static void LogMetrics()
    {
        var rps = _requestsPerSecond.NextValue();
        var duration = _avgRequestDuration.NextValue();
        
        Logger.Info($"RPS: {rps}, Avg Duration: {duration}ms");
    }
}
```

## Best Practices Checklist

- [ ] ViewState disabled where not needed
- [ ] Output caching enabled for static pages
- [ ] Data caching implemented for frequently accessed data
- [ ] Database queries optimized (indexes, proper joins)
- [ ] Async/await used for I/O operations
- [ ] Connection pooling configured
- [ ] Bundling and minification enabled
- [ ] Static resources served from CDN
- [ ] Images optimized
- [ ] Proper disposal of resources
- [ ] UpdatePanels used sparingly
- [ ] Response compression enabled
- [ ] Profiling tools integrated
