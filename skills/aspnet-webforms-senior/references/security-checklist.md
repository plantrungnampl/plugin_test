# Security Checklist for ASP.NET Web Forms

## Authentication & Authorization

### ✓ Forms Authentication Configuration
- [ ] SSL/TLS required for login (`requireSSL="true"`)
- [ ] Strong encryption (`protection="All"`)
- [ ] Appropriate timeout values (30 minutes maximum)
- [ ] Sliding expiration enabled
- [ ] Secure cookie flags set

```xml
<authentication mode="Forms">
    <forms loginUrl="~/Login.aspx" 
           timeout="30" 
           slidingExpiration="true"
           protection="All"
           requireSSL="true"
           cookieless="UseCookies"
           enableCrossAppRedirects="false" />
</authentication>
```

### ✓ Password Security
- [ ] Minimum 8 characters required
- [ ] Complexity requirements enforced
- [ ] Passwords hashed using strong algorithm (BCrypt, PBKDF2)
- [ ] Salt added before hashing
- [ ] No password hints or recovery questions

```csharp
public class PasswordHasher
{
    private const int WorkFactor = 12;
    
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }
    
    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

### ✓ Session Management
- [ ] Session timeout configured (20-30 minutes)
- [ ] Session ID regenerated after login
- [ ] Secure session cookie flags
- [ ] HttpOnly flag set
- [ ] SameSite attribute configured

```xml
<system.web>
    <sessionState timeout="20" 
                  cookieless="UseCookies" 
                  cookieName="ASP.NET_SessionId"
                  mode="StateServer" />
    <httpCookies httpOnlyCookies="true" 
                 requireSSL="true" 
                 sameSite="Strict" />
</system.web>
```

### ✓ Role-Based Access Control
- [ ] Authorize attribute on protected pages
- [ ] Role checks in code-behind
- [ ] Principle-based authorization
- [ ] Deny anonymous access to sensitive pages

```csharp
// Page-level authorization
protected void Page_Load(object sender, EventArgs e)
{
    if (!User.IsInRole("Admin"))
    {
        Response.Redirect("~/Unauthorized.aspx");
    }
}

// Web.config authorization
<location path="Admin">
    <system.web>
        <authorization>
            <allow roles="Admin" />
            <deny users="*" />
        </authorization>
    </system.web>
</location>
```

## Input Validation

### ✓ Client-Side Validation
- [ ] Required field validators
- [ ] Regular expression validators
- [ ] Range validators
- [ ] Custom validators
- [ ] Validation summary display

```aspx
<asp:TextBox ID="txtEmail" runat="server" />
<asp:RequiredFieldValidator ID="rfvEmail" runat="server" 
    ControlToValidate="txtEmail" 
    ErrorMessage="Email is required" />
<asp:RegularExpressionValidator ID="revEmail" runat="server" 
    ControlToValidate="txtEmail" 
    ValidationExpression="^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$" 
    ErrorMessage="Invalid email format" />
```

### ✓ Server-Side Validation
- [ ] All input validated on server
- [ ] Type checking implemented
- [ ] Length restrictions enforced
- [ ] Whitelist validation used
- [ ] Never trust client-side validation alone

```csharp
protected void btnSubmit_Click(object sender, EventArgs e)
{
    // Always validate on server
    if (!Page.IsValid)
        return;
    
    // Additional business logic validation
    if (!IsValidBusinessRule(txtInput.Text))
    {
        lblError.Text = "Invalid input";
        return;
    }
    
    // Proceed with processing
    ProcessInput(txtInput.Text);
}

private bool IsValidBusinessRule(string input)
{
    // Whitelist validation
    var allowedPattern = new Regex(@"^[a-zA-Z0-9\s]+$");
    return allowedPattern.IsMatch(input) && input.Length <= 100;
}
```

## XSS Prevention

### ✓ Output Encoding
- [ ] HTML encode all user input
- [ ] JavaScript encode for JS contexts
- [ ] URL encode for URLs
- [ ] Attribute encode for HTML attributes
- [ ] Use AntiXssEncoder library

```csharp
// HTML encoding
lblOutput.Text = Server.HtmlEncode(userInput);

// In markup
<asp:Label ID="lblName" runat="server" 
           Text='<%# Server.HtmlEncode(Eval("Name").ToString()) %>' />

// Using AntiXssEncoder
string safe = AntiXssEncoder.HtmlEncode(userInput, true);
string jsEncoded = AntiXssEncoder.JavaScriptStringEncode(userInput);
string urlEncoded = AntiXssEncoder.UrlEncode(userInput);
```

### ✓ Content Security Policy
- [ ] CSP header configured
- [ ] Inline scripts avoided
- [ ] External scripts whitelisted
- [ ] Unsafe-eval blocked

```csharp
// Global.asax or HttpModule
protected void Application_BeginRequest(object sender, EventArgs e)
{
    Response.Headers.Add("Content-Security-Policy", 
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'");
}
```

## SQL Injection Prevention

### ✓ Parameterized Queries
- [ ] Parameters used for all user input
- [ ] No string concatenation in SQL
- [ ] Stored procedures with parameters
- [ ] ORM parameterization verified

```csharp
// ✓ CORRECT - Parameterized query
using (var cmd = new SqlCommand("SELECT * FROM Users WHERE UserId = @UserId", conn))
{
    cmd.Parameters.AddWithValue("@UserId", userId);
    // Execute query
}

// ✗ WRONG - String concatenation
var sql = "SELECT * FROM Users WHERE UserId = " + userId; // VULNERABLE!
```

### ✓ Input Sanitization
- [ ] Numeric input validated as numbers
- [ ] String length limited
- [ ] Special characters escaped
- [ ] Blacklist characters rejected

```csharp
public static class InputSanitizer
{
    public static int SanitizeInt(string input)
    {
        if (!int.TryParse(input, out int result))
            throw new ArgumentException("Invalid integer");
        return result;
    }
    
    public static string SanitizeString(string input, int maxLength)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;
            
        input = input.Trim();
        
        if (input.Length > maxLength)
            input = input.Substring(0, maxLength);
            
        // Remove potentially dangerous characters
        var dangerous = new[] { '<', '>', '"', '\'', '&', ';', '--' };
        foreach (var ch in dangerous)
        {
            input = input.Replace(ch.ToString(), "");
        }
        
        return input;
    }
}
```

## CSRF Protection

### ✓ Anti-Forgery Tokens
- [ ] ViewState MAC enabled
- [ ] ViewState encrypted
- [ ] Custom CSRF tokens implemented
- [ ] Tokens validated on POST

```xml
<pages enableViewStateMac="true" 
       viewStateEncryptionMode="Always" 
       enableEventValidation="true" />
```

```csharp
// Page with CSRF protection
public partial class SecurePage : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ViewState["AntiForgeryToken"] = Guid.NewGuid().ToString();
            hfToken.Value = ViewState["AntiForgeryToken"].ToString();
        }
        else
        {
            if (ViewState["AntiForgeryToken"].ToString() != hfToken.Value)
            {
                throw new InvalidOperationException("CSRF token mismatch");
            }
        }
    }
}
```

### ✓ SameSite Cookies
- [ ] SameSite attribute set to Strict or Lax
- [ ] Secure flag enabled
- [ ] HttpOnly flag enabled

```xml
<httpCookies httpOnlyCookies="true" 
             requireSSL="true" 
             sameSite="Strict" />
```

## Security Headers

### ✓ HTTP Security Headers
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy
- [ ] Referrer-Policy

```csharp
public class SecurityHeadersModule : IHttpModule
{
    public void Init(HttpApplication context)
    {
        context.PreSendRequestHeaders += OnPreSendRequestHeaders;
    }
    
    private void OnPreSendRequestHeaders(object sender, EventArgs e)
    {
        var response = HttpContext.Current.Response;
        
        response.Headers.Remove("X-Powered-By");
        response.Headers.Remove("Server");
        
        response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
        response.Headers.Add("X-Content-Type-Options", "nosniff");
        response.Headers.Add("X-XSS-Protection", "1; mode=block");
        response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
        
        if (HttpContext.Current.Request.IsSecureConnection)
        {
            response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }
    }
    
    public void Dispose() { }
}
```

## File Upload Security

### ✓ File Upload Validation
- [ ] File type whitelist enforced
- [ ] File size limits set
- [ ] File content verified
- [ ] Uploaded files stored outside webroot
- [ ] Unique filenames generated

```csharp
public class SecureFileUpload
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
    private const int MaxFileSize = 5 * 1024 * 1024; // 5MB
    
    public static bool ValidateFile(HttpPostedFile file, out string error)
    {
        error = null;
        
        // Check if file exists
        if (file == null || file.ContentLength == 0)
        {
            error = "No file uploaded";
            return false;
        }
        
        // Check file size
        if (file.ContentLength > MaxFileSize)
        {
            error = "File too large";
            return false;
        }
        
        // Check extension
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (!AllowedExtensions.Contains(extension))
        {
            error = "File type not allowed";
            return false;
        }
        
        // Verify file content matches extension
        if (!VerifyFileContent(file, extension))
        {
            error = "File content does not match extension";
            return false;
        }
        
        return true;
    }
    
    private static bool VerifyFileContent(HttpPostedFile file, string extension)
    {
        var buffer = new byte[512];
        file.InputStream.Read(buffer, 0, 512);
        file.InputStream.Position = 0;
        
        // Check magic numbers
        switch (extension)
        {
            case ".jpg":
            case ".jpeg":
                return buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF;
            case ".png":
                return buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47;
            case ".pdf":
                return buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46;
            default:
                return false;
        }
    }
    
    public static string SaveFile(HttpPostedFile file, string uploadPath)
    {
        // Generate unique filename
        var filename = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var fullPath = Path.Combine(uploadPath, filename);
        
        // Ensure directory exists and is outside webroot
        Directory.CreateDirectory(uploadPath);
        
        file.SaveAs(fullPath);
        
        return filename;
    }
}
```

## Error Handling & Information Disclosure

### ✓ Custom Error Pages
- [ ] Custom errors enabled in production
- [ ] Generic error messages shown
- [ ] Detailed errors logged server-side
- [ ] Stack traces not exposed

```xml
<customErrors mode="RemoteOnly" defaultRedirect="~/Error.aspx">
    <error statusCode="404" redirect="~/Errors/NotFound.aspx" />
    <error statusCode="500" redirect="~/Errors/ServerError.aspx" />
</customErrors>

<compilation debug="false" targetFramework="4.7.2" />
```

### ✓ Logging Security
- [ ] Sensitive data not logged
- [ ] Passwords not logged
- [ ] Credit card numbers masked
- [ ] Logs stored securely
- [ ] Log access restricted

```csharp
public static class SecureLogger
{
    private static readonly log4net.ILog log = log4net.LogManager.GetLogger(typeof(SecureLogger));
    
    public static void LogError(Exception ex, HttpContext context)
    {
        var errorInfo = new
        {
            Message = ex.Message,
            Url = context?.Request.Url.AbsolutePath, // Don't log query strings
            IPAddress = GetClientIP(context),
            User = context?.User?.Identity?.Name,
            Timestamp = DateTime.UtcNow
            // NEVER log passwords, tokens, credit cards
        };
        
        log.Error(JsonConvert.SerializeObject(errorInfo, Formatting.Indented), ex);
    }
    
    private static string GetClientIP(HttpContext context)
    {
        var ip = context?.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];
        if (string.IsNullOrEmpty(ip))
            ip = context?.Request.UserHostAddress;
        return ip;
    }
}
```

## Encryption & Data Protection

### ✓ Connection Strings
- [ ] Connection strings encrypted
- [ ] Credentials not in source code
- [ ] Integrated security used when possible

```bash
# Encrypt connection strings
aspnet_regiis -pef "connectionStrings" "C:\inetpub\wwwroot\MyApp" -prov "RsaProtectedConfigurationProvider"
```

### ✓ ViewState Protection
- [ ] ViewState MAC enabled
- [ ] ViewState encrypted for sensitive data
- [ ] ViewState validation key not auto-generated

```xml
<pages enableViewStateMac="true" 
       viewStateEncryptionMode="Always">
    <machineKey validationKey="[64 hex chars]" 
                decryptionKey="[48 hex chars]" 
                validation="HMACSHA256" 
                decryption="AES" />
</pages>
```

### ✓ Sensitive Data Encryption
- [ ] PII encrypted at rest
- [ ] Credit card data not stored
- [ ] Strong encryption algorithms used
- [ ] Keys managed securely

```csharp
public class DataEncryptor
{
    private static readonly byte[] Key = Convert.FromBase64String(ConfigurationManager.AppSettings["EncryptionKey"]);
    private static readonly byte[] IV = Convert.FromBase64String(ConfigurationManager.AppSettings["EncryptionIV"]);
    
    public static string Encrypt(string plainText)
    {
        using (var aes = Aes.Create())
        {
            aes.Key = Key;
            aes.IV = IV;
            
            var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            
            using (var msEncrypt = new MemoryStream())
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            {
                using (var swEncrypt = new StreamWriter(csEncrypt))
                {
                    swEncrypt.Write(plainText);
                }
                
                return Convert.ToBase64String(msEncrypt.ToArray());
            }
        }
    }
    
    public static string Decrypt(string cipherText)
    {
        using (var aes = Aes.Create())
        {
            aes.Key = Key;
            aes.IV = IV;
            
            var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            
            using (var msDecrypt = new MemoryStream(Convert.FromBase64String(cipherText)))
            using (var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
            using (var srDecrypt = new StreamReader(csDecrypt))
            {
                return srDecrypt.ReadToEnd();
            }
        }
    }
}
```

## Third-Party Dependencies

### ✓ Dependency Management
- [ ] All packages up to date
- [ ] Known vulnerabilities patched
- [ ] NuGet packages from trusted sources
- [ ] Regular security audits

## Deployment Security

### ✓ Production Configuration
- [ ] Debug mode disabled
- [ ] Trace disabled
- [ ] Custom errors enabled
- [ ] Machine key explicitly set
- [ ] Unnecessary HTTP handlers removed

```xml
<configuration>
    <system.web>
        <compilation debug="false" />
        <trace enabled="false" />
        <customErrors mode="On" />
    </system.web>
</configuration>
```
