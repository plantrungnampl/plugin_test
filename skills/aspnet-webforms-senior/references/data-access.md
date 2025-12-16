# Data Access Strategies for ASP.NET Web Forms

## ADO.NET Best Practices

### Connection Management
```csharp
public class DataAccessLayer
{
    private readonly string _connectionString;
    
    public DataAccessLayer()
    {
        _connectionString = ConfigurationManager.ConnectionStrings["AppDB"].ConnectionString;
    }
    
    // Using statement ensures proper disposal
    public Product GetProduct(int productId)
    {
        using (var connection = new SqlConnection(_connectionString))
        using (var command = new SqlCommand("sp_GetProduct", connection))
        {
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@ProductId", productId);
            
            connection.Open();
            
            using (var reader = command.ExecuteReader())
            {
                if (reader.Read())
                {
                    return MapProduct(reader);
                }
            }
        }
        
        return null;
    }
    
    private Product MapProduct(SqlDataReader reader)
    {
        return new Product
        {
            ProductId = (int)reader["ProductId"],
            Name = reader["Name"].ToString(),
            Description = reader["Description"].ToString(),
            Price = (decimal)reader["Price"],
            CategoryId = (int)reader["CategoryId"]
        };
    }
}
```

### Async Data Access (.NET 4.5+)
```csharp
public async Task<Product> GetProductAsync(int productId)
{
    using (var connection = new SqlConnection(_connectionString))
    using (var command = new SqlCommand("sp_GetProduct", connection))
    {
        command.CommandType = CommandType.StoredProcedure;
        command.Parameters.AddWithValue("@ProductId", productId);
        
        await connection.OpenAsync();
        
        using (var reader = await command.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                return MapProduct(reader);
            }
        }
    }
    
    return null;
}

public async Task<IEnumerable<Product>> GetAllProductsAsync()
{
    var products = new List<Product>();
    
    using (var connection = new SqlConnection(_connectionString))
    using (var command = new SqlCommand("SELECT * FROM Products", connection))
    {
        await connection.OpenAsync();
        
        using (var reader = await command.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                products.Add(MapProduct(reader));
            }
        }
    }
    
    return products;
}
```

### Transaction Management
```csharp
public void TransferFunds(int fromAccountId, int toAccountId, decimal amount)
{
    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        
        using (var transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted))
        {
            try
            {
                // Debit from account
                using (var debitCmd = new SqlCommand(
                    "UPDATE Accounts SET Balance = Balance - @Amount WHERE AccountId = @AccountId", 
                    connection, transaction))
                {
                    debitCmd.Parameters.AddWithValue("@Amount", amount);
                    debitCmd.Parameters.AddWithValue("@AccountId", fromAccountId);
                    debitCmd.ExecuteNonQuery();
                }
                
                // Credit to account
                using (var creditCmd = new SqlCommand(
                    "UPDATE Accounts SET Balance = Balance + @Amount WHERE AccountId = @AccountId", 
                    connection, transaction))
                {
                    creditCmd.Parameters.AddWithValue("@Amount", amount);
                    creditCmd.Parameters.AddWithValue("@AccountId", toAccountId);
                    creditCmd.ExecuteNonQuery();
                }
                
                // Log transaction
                using (var logCmd = new SqlCommand(
                    "INSERT INTO TransactionLog (FromAccount, ToAccount, Amount, TransactionDate) VALUES (@From, @To, @Amount, @Date)", 
                    connection, transaction))
                {
                    logCmd.Parameters.AddWithValue("@From", fromAccountId);
                    logCmd.Parameters.AddWithValue("@To", toAccountId);
                    logCmd.Parameters.AddWithValue("@Amount", amount);
                    logCmd.Parameters.AddWithValue("@Date", DateTime.UtcNow);
                    logCmd.ExecuteNonQuery();
                }
                
                transaction.Commit();
            }
            catch (Exception)
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}
```

### Bulk Operations
```csharp
public void BulkInsertProducts(List<Product> products)
{
    using (var connection = new SqlConnection(_connectionString))
    {
        connection.Open();
        
        using (var bulkCopy = new SqlBulkCopy(connection))
        {
            bulkCopy.DestinationTableName = "Products";
            bulkCopy.BatchSize = 1000;
            bulkCopy.BulkCopyTimeout = 300; // 5 minutes
            
            // Map columns
            bulkCopy.ColumnMappings.Add("Name", "Name");
            bulkCopy.ColumnMappings.Add("Description", "Description");
            bulkCopy.ColumnMappings.Add("Price", "Price");
            bulkCopy.ColumnMappings.Add("CategoryId", "CategoryId");
            
            // Convert to DataTable
            var dataTable = ConvertToDataTable(products);
            
            bulkCopy.WriteToServer(dataTable);
        }
    }
}

private DataTable ConvertToDataTable(List<Product> products)
{
    var table = new DataTable();
    table.Columns.Add("Name", typeof(string));
    table.Columns.Add("Description", typeof(string));
    table.Columns.Add("Price", typeof(decimal));
    table.Columns.Add("CategoryId", typeof(int));
    
    foreach (var product in products)
    {
        table.Rows.Add(product.Name, product.Description, product.Price, product.CategoryId);
    }
    
    return table;
}
```

## Entity Framework Integration

### DbContext Configuration
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext() : base("name=AppDB")
    {
        // Disable lazy loading for better control
        Configuration.LazyLoadingEnabled = false;
        
        // Disable proxy creation for serialization
        Configuration.ProxyCreationEnabled = false;
        
        // Track changes only when needed
        Configuration.AutoDetectChangesEnabled = true;
    }
    
    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Customer> Customers { get; set; }
    
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        // Fluent API configurations
        modelBuilder.Entity<Product>()
            .ToTable("Products")
            .HasKey(p => p.ProductId);
            
        modelBuilder.Entity<Product>()
            .Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);
            
        // Relationships
        modelBuilder.Entity<Product>()
            .HasRequired(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId);
            
        base.OnModelCreating(modelBuilder);
    }
}
```

### Eager Loading vs Lazy Loading
```csharp
// Eager Loading - Load related data upfront
public Product GetProductWithDetails(int productId)
{
    using (var context = new ApplicationDbContext())
    {
        return context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.Reviews)
            .FirstOrDefault(p => p.ProductId == productId);
    }
}

// Explicit Loading - Load related data on demand
public Product GetProductWithSelectiveLoading(int productId, bool loadReviews)
{
    using (var context = new ApplicationDbContext())
    {
        var product = context.Products.Find(productId);
        
        if (product != null)
        {
            // Always load category
            context.Entry(product).Reference(p => p.Category).Load();
            
            // Conditionally load reviews
            if (loadReviews)
            {
                context.Entry(product).Collection(p => p.Reviews).Load();
            }
        }
        
        return product;
    }
}

// Projection - Load only needed fields
public IEnumerable<ProductListDto> GetProductList()
{
    using (var context = new ApplicationDbContext())
    {
        return context.Products
            .Select(p => new ProductListDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Price = p.Price,
                CategoryName = p.Category.Name
            })
            .ToList();
    }
}
```

### Change Tracking Optimization
```csharp
// AsNoTracking for read-only queries
public IEnumerable<Product> GetProductsReadOnly()
{
    using (var context = new ApplicationDbContext())
    {
        return context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .ToList();
    }
}

// Batch updates
public void UpdateMultipleProducts(List<Product> products)
{
    using (var context = new ApplicationDbContext())
    {
        foreach (var product in products)
        {
            context.Entry(product).State = EntityState.Modified;
        }
        
        context.SaveChanges();
    }
}

// Detached entity update
public void UpdateDetachedProduct(Product product)
{
    using (var context = new ApplicationDbContext())
    {
        context.Products.Attach(product);
        context.Entry(product).State = EntityState.Modified;
        context.SaveChanges();
    }
}
```

## Oracle Database Integration

### Oracle Connection
```csharp
public class OracleDataAccess
{
    private readonly string _connectionString;
    
    public OracleDataAccess()
    {
        _connectionString = ConfigurationManager.ConnectionStrings["OracleDB"].ConnectionString;
        // Example: "Data Source=ORCL;User Id=myUser;Password=myPass;"
    }
    
    public Product GetProduct(int productId)
    {
        using (var connection = new OracleConnection(_connectionString))
        using (var command = new OracleCommand("GetProduct", connection))
        {
            command.CommandType = CommandType.StoredProcedure;
            
            // Oracle parameters
            command.Parameters.Add("p_product_id", OracleDbType.Int32).Value = productId;
            command.Parameters.Add("p_cursor", OracleDbType.RefCursor).Direction = ParameterDirection.Output;
            
            connection.Open();
            
            using (var reader = command.ExecuteReader())
            {
                if (reader.Read())
                {
                    return new Product
                    {
                        ProductId = Convert.ToInt32(reader["PRODUCT_ID"]),
                        Name = reader["NAME"].ToString(),
                        Price = Convert.ToDecimal(reader["PRICE"])
                    };
                }
            }
        }
        
        return null;
    }
    
    public void InsertProduct(Product product)
    {
        using (var connection = new OracleConnection(_connectionString))
        using (var command = new OracleCommand("InsertProduct", connection))
        {
            command.CommandType = CommandType.StoredProcedure;
            
            command.Parameters.Add("p_name", OracleDbType.Varchar2).Value = product.Name;
            command.Parameters.Add("p_description", OracleDbType.Varchar2).Value = product.Description;
            command.Parameters.Add("p_price", OracleDbType.Decimal).Value = product.Price;
            command.Parameters.Add("p_category_id", OracleDbType.Int32).Value = product.CategoryId;
            
            // Output parameter for generated ID
            var outputParam = new OracleParameter("p_product_id", OracleDbType.Int32);
            outputParam.Direction = ParameterDirection.Output;
            command.Parameters.Add(outputParam);
            
            connection.Open();
            command.ExecuteNonQuery();
            
            product.ProductId = Convert.ToInt32(outputParam.Value.ToString());
        }
    }
}
```

### Oracle Array Binding
```csharp
public void BulkInsertOracle(List<Product> products)
{
    using (var connection = new OracleConnection(_connectionString))
    {
        connection.Open();
        
        using (var command = new OracleCommand("INSERT INTO Products (Name, Price, CategoryId) VALUES (:Name, :Price, :CategoryId)", connection))
        {
            command.ArrayBindCount = products.Count;
            
            var names = products.Select(p => p.Name).ToArray();
            var prices = products.Select(p => p.Price).ToArray();
            var categoryIds = products.Select(p => p.CategoryId).ToArray();
            
            command.Parameters.Add(":Name", OracleDbType.Varchar2, names, ParameterDirection.Input);
            command.Parameters.Add(":Price", OracleDbType.Decimal, prices, ParameterDirection.Input);
            command.Parameters.Add(":CategoryId", OracleDbType.Int32, categoryIds, ParameterDirection.Input);
            
            command.ExecuteNonQuery();
        }
    }
}
```

## Dapper Micro-ORM

### Basic Queries
```csharp
public class DapperRepository
{
    private readonly string _connectionString;
    
    public DapperRepository()
    {
        _connectionString = ConfigurationManager.ConnectionStrings["AppDB"].ConnectionString;
    }
    
    public Product GetProduct(int productId)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            return connection.QueryFirstOrDefault<Product>(
                "SELECT * FROM Products WHERE ProductId = @ProductId",
                new { ProductId = productId });
        }
    }
    
    public IEnumerable<Product> GetProducts()
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            return connection.Query<Product>("SELECT * FROM Products");
        }
    }
    
    public void InsertProduct(Product product)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            var sql = @"INSERT INTO Products (Name, Description, Price, CategoryId) 
                       VALUES (@Name, @Description, @Price, @CategoryId);
                       SELECT CAST(SCOPE_IDENTITY() as int)";
            
            product.ProductId = connection.QuerySingle<int>(sql, product);
        }
    }
}
```

### Multi-Mapping
```csharp
public IEnumerable<Product> GetProductsWithCategory()
{
    using (var connection = new SqlConnection(_connectionString))
    {
        var sql = @"SELECT p.*, c.* 
                   FROM Products p
                   INNER JOIN Categories c ON p.CategoryId = c.CategoryId";
        
        return connection.Query<Product, Category, Product>(
            sql,
            (product, category) =>
            {
                product.Category = category;
                return product;
            },
            splitOn: "CategoryId");
    }
}

public IEnumerable<Order> GetOrdersWithDetails()
{
    using (var connection = new SqlConnection(_connectionString))
    {
        var orderDict = new Dictionary<int, Order>();
        
        var sql = @"SELECT o.*, c.*, oi.*, p.*
                   FROM Orders o
                   INNER JOIN Customers c ON o.CustomerId = c.CustomerId
                   INNER JOIN OrderItems oi ON o.OrderId = oi.OrderId
                   INNER JOIN Products p ON oi.ProductId = p.ProductId";
        
        connection.Query<Order, Customer, OrderItem, Product, Order>(
            sql,
            (order, customer, orderItem, product) =>
            {
                Order orderEntry;
                
                if (!orderDict.TryGetValue(order.OrderId, out orderEntry))
                {
                    orderEntry = order;
                    orderEntry.Customer = customer;
                    orderEntry.OrderItems = new List<OrderItem>();
                    orderDict.Add(order.OrderId, orderEntry);
                }
                
                orderItem.Product = product;
                orderEntry.OrderItems.Add(orderItem);
                
                return orderEntry;
            },
            splitOn: "CustomerId,OrderItemId,ProductId");
        
        return orderDict.Values;
    }
}
```

### Stored Procedures with Dapper
```csharp
public IEnumerable<Product> SearchProducts(string searchTerm, int? categoryId, decimal? minPrice, decimal? maxPrice)
{
    using (var connection = new SqlConnection(_connectionString))
    {
        var parameters = new DynamicParameters();
        parameters.Add("@SearchTerm", searchTerm);
        parameters.Add("@CategoryId", categoryId);
        parameters.Add("@MinPrice", minPrice);
        parameters.Add("@MaxPrice", maxPrice);
        
        return connection.Query<Product>(
            "sp_SearchProducts",
            parameters,
            commandType: CommandType.StoredProcedure);
    }
}
```

## Caching Strategies

### SQL Cache Dependency
```csharp
// Web.config
<caching>
    <sqlCacheDependency enabled="true" pollTime="1000">
        <databases>
            <add name="AppDB" connectionStringName="AppDB" />
        </databases>
    </sqlCacheDependency>
</caching>

// Enable on SQL Server table
// ALTER DATABASE MyDatabase SET ENABLE_BROKER
// exec sp_tableoption 'Products', 'table lock on insert', 'on'
// exec sp_tableoption 'Products', 'table lock on bulk load', 'on'

// Usage
public List<Product> GetProductsCached()
{
    string cacheKey = "ProductList";
    var products = Cache[cacheKey] as List<Product>;
    
    if (products == null)
    {
        products = GetProductsFromDatabase();
        
        var dependency = new SqlCacheDependency("AppDB", "Products");
        Cache.Insert(cacheKey, products, dependency);
    }
    
    return products;
}
```

### Custom Cache Invalidation
```csharp
public class CacheManager
{
    public static void InvalidateProductCache()
    {
        var keysToRemove = new List<string>();
        
        foreach (DictionaryEntry entry in HttpContext.Current.Cache)
        {
            if (entry.Key.ToString().StartsWith("Product_"))
            {
                keysToRemove.Add(entry.Key.ToString());
            }
        }
        
        foreach (var key in keysToRemove)
        {
            HttpContext.Current.Cache.Remove(key);
        }
    }
    
    public static void SetWithDependency<T>(string key, T value, params string[] dependentKeys)
    {
        var dependency = new CacheDependency(null, dependentKeys);
        HttpContext.Current.Cache.Insert(
            key, 
            value, 
            dependency, 
            DateTime.Now.AddHours(1), 
            Cache.NoSlidingExpiration);
    }
}
```

## Connection Resilience

### Retry Logic
```csharp
public class ResilientDataAccess
{
    private const int MaxRetries = 3;
    private const int DelayMilliseconds = 100;
    
    public T ExecuteWithRetry<T>(Func<T> operation)
    {
        int retryCount = 0;
        
        while (true)
        {
            try
            {
                return operation();
            }
            catch (SqlException ex) when (IsTransient(ex) && retryCount < MaxRetries)
            {
                retryCount++;
                Thread.Sleep(DelayMilliseconds * retryCount);
            }
        }
    }
    
    private bool IsTransient(SqlException ex)
    {
        // Common transient error codes
        int[] transientErrors = { -2, -1, 2, 53, 64, 233, 10053, 10054, 10060, 40197, 40501, 40613 };
        return transientErrors.Contains(ex.Number);
    }
    
    // Usage
    public Product GetProduct(int productId)
    {
        return ExecuteWithRetry(() =>
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("SELECT * FROM Products WHERE ProductId = @Id", connection))
            {
                command.Parameters.AddWithValue("@Id", productId);
                connection.Open();
                
                using (var reader = command.ExecuteReader())
                {
                    if (reader.Read())
                        return MapProduct(reader);
                }
            }
            
            return null;
        });
    }
}
```
