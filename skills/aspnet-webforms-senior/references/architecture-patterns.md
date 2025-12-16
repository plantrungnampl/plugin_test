# Architecture Patterns for ASP.NET Web Forms

## Repository Pattern

### Generic Repository
```csharp
public interface IRepository<T> where T : class
{
    T GetById(object id);
    IEnumerable<T> GetAll();
    IEnumerable<T> Find(Expression<Func<T, bool>> predicate);
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly DbContext Context;
    protected readonly DbSet<T> DbSet;
    
    public Repository(DbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }
    
    public T GetById(object id)
    {
        return DbSet.Find(id);
    }
    
    public IEnumerable<T> GetAll()
    {
        return DbSet.ToList();
    }
    
    public IEnumerable<T> Find(Expression<Func<T, bool>> predicate)
    {
        return DbSet.Where(predicate).ToList();
    }
    
    public void Add(T entity)
    {
        DbSet.Add(entity);
    }
    
    public void AddRange(IEnumerable<T> entities)
    {
        DbSet.AddRange(entities);
    }
    
    public void Update(T entity)
    {
        DbSet.Attach(entity);
        Context.Entry(entity).State = EntityState.Modified;
    }
    
    public void Remove(T entity)
    {
        DbSet.Remove(entity);
    }
    
    public void RemoveRange(IEnumerable<T> entities)
    {
        DbSet.RemoveRange(entities);
    }
}
```

### Specific Repository
```csharp
public interface IProductRepository : IRepository<Product>
{
    IEnumerable<Product> GetProductsByCategory(int categoryId);
    IEnumerable<Product> GetTopSellingProducts(int count);
    Product GetProductWithDetails(int productId);
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(DbContext context) : base(context) { }
    
    public IEnumerable<Product> GetProductsByCategory(int categoryId)
    {
        return Context.Products
            .Where(p => p.CategoryId == categoryId && p.IsActive)
            .OrderBy(p => p.Name)
            .ToList();
    }
    
    public IEnumerable<Product> GetTopSellingProducts(int count)
    {
        return Context.Products
            .Include(p => p.Category)
            .OrderByDescending(p => p.SalesCount)
            .Take(count)
            .ToList();
    }
    
    public Product GetProductWithDetails(int productId)
    {
        return Context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.Reviews)
            .FirstOrDefault(p => p.ProductId == productId);
    }
}
```

## Unit of Work Pattern

```csharp
public interface IUnitOfWork : IDisposable
{
    IProductRepository Products { get; }
    ICategoryRepository Categories { get; }
    IOrderRepository Orders { get; }
    ICustomerRepository Customers { get; }
    
    int SaveChanges();
    Task<int> SaveChangesAsync();
    void BeginTransaction();
    void Commit();
    void Rollback();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly DbContext _context;
    private DbContextTransaction _transaction;
    
    public IProductRepository Products { get; private set; }
    public ICategoryRepository Categories { get; private set; }
    public IOrderRepository Orders { get; private set; }
    public ICustomerRepository Customers { get; private set; }
    
    public UnitOfWork(DbContext context)
    {
        _context = context;
        Products = new ProductRepository(_context);
        Categories = new CategoryRepository(_context);
        Orders = new OrderRepository(_context);
        Customers = new CustomerRepository(_context);
    }
    
    public int SaveChanges()
    {
        return _context.SaveChanges();
    }
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    
    public void BeginTransaction()
    {
        _transaction = _context.Database.BeginTransaction();
    }
    
    public void Commit()
    {
        try
        {
            _context.SaveChanges();
            _transaction?.Commit();
        }
        catch
        {
            _transaction?.Rollback();
            throw;
        }
        finally
        {
            _transaction?.Dispose();
        }
    }
    
    public void Rollback()
    {
        _transaction?.Rollback();
        _transaction?.Dispose();
    }
    
    public void Dispose()
    {
        _transaction?.Dispose();
        _context?.Dispose();
    }
}
```

## Service Layer Pattern

```csharp
public interface IProductService
{
    IEnumerable<ProductDto> GetAllProducts();
    ProductDto GetProduct(int id);
    void CreateProduct(ProductDto product);
    void UpdateProduct(ProductDto product);
    void DeleteProduct(int id);
    IEnumerable<ProductDto> SearchProducts(string searchTerm);
}

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger _logger;
    
    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, ILogger logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }
    
    public IEnumerable<ProductDto> GetAllProducts()
    {
        try
        {
            var products = _unitOfWork.Products.GetAll();
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all products");
            throw;
        }
    }
    
    public ProductDto GetProduct(int id)
    {
        try
        {
            var product = _unitOfWork.Products.GetProductWithDetails(id);
            if (product == null)
                throw new NotFoundException($"Product with ID {id} not found");
                
            return _mapper.Map<ProductDto>(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting product {id}");
            throw;
        }
    }
    
    public void CreateProduct(ProductDto productDto)
    {
        try
        {
            _unitOfWork.BeginTransaction();
            
            var product = _mapper.Map<Product>(productDto);
            _unitOfWork.Products.Add(product);
            _unitOfWork.SaveChanges();
            
            _unitOfWork.Commit();
            _logger.LogInfo($"Product {product.ProductId} created successfully");
        }
        catch (Exception ex)
        {
            _unitOfWork.Rollback();
            _logger.LogError(ex, "Error creating product");
            throw;
        }
    }
    
    public void UpdateProduct(ProductDto productDto)
    {
        try
        {
            var product = _unitOfWork.Products.GetById(productDto.ProductId);
            if (product == null)
                throw new NotFoundException($"Product {productDto.ProductId} not found");
                
            _mapper.Map(productDto, product);
            _unitOfWork.Products.Update(product);
            _unitOfWork.SaveChanges();
            
            _logger.LogInfo($"Product {product.ProductId} updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating product {productDto.ProductId}");
            throw;
        }
    }
    
    public void DeleteProduct(int id)
    {
        try
        {
            var product = _unitOfWork.Products.GetById(id);
            if (product == null)
                throw new NotFoundException($"Product {id} not found");
                
            _unitOfWork.Products.Remove(product);
            _unitOfWork.SaveChanges();
            
            _logger.LogInfo($"Product {id} deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting product {id}");
            throw;
        }
    }
    
    public IEnumerable<ProductDto> SearchProducts(string searchTerm)
    {
        try
        {
            var products = _unitOfWork.Products.Find(p => 
                p.Name.Contains(searchTerm) || 
                p.Description.Contains(searchTerm));
                
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error searching products with term: {searchTerm}");
            throw;
        }
    }
}
```

## Dependency Injection

### Poor Man's Dependency Injection
```csharp
public class ServiceLocator
{
    private static Dictionary<Type, object> _services = new Dictionary<Type, object>();
    
    public static void Register<TInterface, TImplementation>() 
        where TImplementation : TInterface, new()
    {
        _services[typeof(TInterface)] = new TImplementation();
    }
    
    public static TInterface Resolve<TInterface>()
    {
        return (TInterface)_services[typeof(TInterface)];
    }
}

// Global.asax
protected void Application_Start(object sender, EventArgs e)
{
    ServiceLocator.Register<IProductRepository, ProductRepository>();
    ServiceLocator.Register<IProductService, ProductService>();
}

// Page usage
public partial class ProductList : Page
{
    private readonly IProductService _productService;
    
    public ProductList()
    {
        _productService = ServiceLocator.Resolve<IProductService>();
    }
}
```

### Using Unity Container
```csharp
// Global.asax
protected void Application_Start(object sender, EventArgs e)
{
    var container = new UnityContainer();
    
    // Register types
    container.RegisterType<DbContext, ApplicationDbContext>(new HierarchicalLifetimeManager());
    container.RegisterType<IUnitOfWork, UnitOfWork>(new HierarchicalLifetimeManager());
    container.RegisterType<IProductRepository, ProductRepository>();
    container.RegisterType<IProductService, ProductService>();
    
    // Store in application state
    Application["UnityContainer"] = container;
}

// Base page class
public class BasePage : Page
{
    protected IUnityContainer Container
    {
        get { return (IUnityContainer)HttpContext.Current.Application["UnityContainer"]; }
    }
    
    protected T Resolve<T>()
    {
        return Container.Resolve<T>();
    }
}

// Page usage
public partial class ProductList : BasePage
{
    private IProductService _productService;
    
    protected void Page_Load(object sender, EventArgs e)
    {
        _productService = Resolve<IProductService>();
        
        if (!IsPostBack)
        {
            LoadProducts();
        }
    }
}
```

## Model-View-Presenter (MVP) Pattern

### Passive View Pattern
```csharp
// View Interface
public interface IProductEditView
{
    int ProductId { get; set; }
    string ProductName { get; set; }
    string Description { get; set; }
    decimal Price { get; set; }
    int CategoryId { get; set; }
    
    void BindCategories(IEnumerable<CategoryDto> categories);
    void ShowSuccess(string message);
    void ShowError(string message);
    void EnableSave(bool enable);
}

// Presenter
public class ProductEditPresenter
{
    private readonly IProductEditView _view;
    private readonly IProductService _productService;
    private readonly ICategoryService _categoryService;
    
    public ProductEditPresenter(IProductEditView view, 
                               IProductService productService,
                               ICategoryService categoryService)
    {
        _view = view;
        _productService = productService;
        _categoryService = categoryService;
    }
    
    public void Initialize()
    {
        var categories = _categoryService.GetAllCategories();
        _view.BindCategories(categories);
    }
    
    public void LoadProduct(int productId)
    {
        try
        {
            var product = _productService.GetProduct(productId);
            
            _view.ProductId = product.ProductId;
            _view.ProductName = product.Name;
            _view.Description = product.Description;
            _view.Price = product.Price;
            _view.CategoryId = product.CategoryId;
        }
        catch (Exception ex)
        {
            _view.ShowError($"Error loading product: {ex.Message}");
        }
    }
    
    public void SaveProduct()
    {
        try
        {
            var product = new ProductDto
            {
                ProductId = _view.ProductId,
                Name = _view.ProductName,
                Description = _view.Description,
                Price = _view.Price,
                CategoryId = _view.CategoryId
            };
            
            if (product.ProductId == 0)
                _productService.CreateProduct(product);
            else
                _productService.UpdateProduct(product);
                
            _view.ShowSuccess("Product saved successfully");
        }
        catch (Exception ex)
        {
            _view.ShowError($"Error saving product: {ex.Message}");
        }
    }
    
    public void ValidateProduct()
    {
        bool isValid = !string.IsNullOrWhiteSpace(_view.ProductName) &&
                      _view.Price > 0 &&
                      _view.CategoryId > 0;
                      
        _view.EnableSave(isValid);
    }
}

// ASPX Page Implementation
public partial class ProductEdit : Page, IProductEditView
{
    private ProductEditPresenter _presenter;
    
    protected void Page_Init(object sender, EventArgs e)
    {
        var productService = Resolve<IProductService>();
        var categoryService = Resolve<ICategoryService>();
        _presenter = new ProductEditPresenter(this, productService, categoryService);
    }
    
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            _presenter.Initialize();
            
            int productId;
            if (int.TryParse(Request.QueryString["id"], out productId))
            {
                _presenter.LoadProduct(productId);
            }
        }
    }
    
    // IProductEditView implementation
    public int ProductId
    {
        get { return int.Parse(hfProductId.Value); }
        set { hfProductId.Value = value.ToString(); }
    }
    
    public string ProductName
    {
        get { return txtName.Text; }
        set { txtName.Text = value; }
    }
    
    public string Description
    {
        get { return txtDescription.Text; }
        set { txtDescription.Text = value; }
    }
    
    public decimal Price
    {
        get { return decimal.Parse(txtPrice.Text); }
        set { txtPrice.Text = value.ToString("0.00"); }
    }
    
    public int CategoryId
    {
        get { return int.Parse(ddlCategory.SelectedValue); }
        set { ddlCategory.SelectedValue = value.ToString(); }
    }
    
    public void BindCategories(IEnumerable<CategoryDto> categories)
    {
        ddlCategory.DataSource = categories;
        ddlCategory.DataTextField = "Name";
        ddlCategory.DataValueField = "CategoryId";
        ddlCategory.DataBind();
        ddlCategory.Items.Insert(0, new ListItem("-- Select Category --", "0"));
    }
    
    public void ShowSuccess(string message)
    {
        lblMessage.CssClass = "alert alert-success";
        lblMessage.Text = message;
        lblMessage.Visible = true;
    }
    
    public void ShowError(string message)
    {
        lblMessage.CssClass = "alert alert-danger";
        lblMessage.Text = message;
        lblMessage.Visible = true;
    }
    
    public void EnableSave(bool enable)
    {
        btnSave.Enabled = enable;
    }
    
    protected void btnSave_Click(object sender, EventArgs e)
    {
        _presenter.SaveProduct();
    }
    
    protected void txtName_TextChanged(object sender, EventArgs e)
    {
        _presenter.ValidateProduct();
    }
}
```

## Specification Pattern

```csharp
public interface ISpecification<T>
{
    bool IsSatisfiedBy(T entity);
    Expression<Func<T, bool>> ToExpression();
}

public abstract class Specification<T> : ISpecification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();
    
    public bool IsSatisfiedBy(T entity)
    {
        Func<T, bool> predicate = ToExpression().Compile();
        return predicate(entity);
    }
    
    public Specification<T> And(Specification<T> specification)
    {
        return new AndSpecification<T>(this, specification);
    }
    
    public Specification<T> Or(Specification<T> specification)
    {
        return new OrSpecification<T>(this, specification);
    }
    
    public Specification<T> Not()
    {
        return new NotSpecification<T>(this);
    }
}

// Concrete specifications
public class ProductInCategorySpecification : Specification<Product>
{
    private readonly int _categoryId;
    
    public ProductInCategorySpecification(int categoryId)
    {
        _categoryId = categoryId;
    }
    
    public override Expression<Func<Product, bool>> ToExpression()
    {
        return product => product.CategoryId == _categoryId;
    }
}

public class ProductInPriceRangeSpecification : Specification<Product>
{
    private readonly decimal _minPrice;
    private readonly decimal _maxPrice;
    
    public ProductInPriceRangeSpecification(decimal minPrice, decimal maxPrice)
    {
        _minPrice = minPrice;
        _maxPrice = maxPrice;
    }
    
    public override Expression<Func<Product, bool>> ToExpression()
    {
        return product => product.Price >= _minPrice && product.Price <= _maxPrice;
    }
}

// Usage in repository
public class ProductRepository : Repository<Product>
{
    public IEnumerable<Product> Find(ISpecification<Product> specification)
    {
        return DbSet.Where(specification.ToExpression()).ToList();
    }
}

// Usage example
var categorySpec = new ProductInCategorySpecification(5);
var priceSpec = new ProductInPriceRangeSpecification(10, 100);
var combinedSpec = categorySpec.And(priceSpec);

var products = productRepository.Find(combinedSpec);
```
