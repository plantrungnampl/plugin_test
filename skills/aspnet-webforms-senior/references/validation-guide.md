# ASP.NET Web Forms Validation Guide

## Overview of Validation Controls

ASP.NET provides 6 built-in validation controls and support for custom validation.

| Validator | Purpose | .NET 3.5 | .NET 4.x |
|-----------|---------|----------|----------|
| RequiredFieldValidator | Ensures field not empty | ✅ | ✅ |
| RangeValidator | Value within range | ✅ | ✅ |
| CompareValidator | Compare two values | ✅ | ✅ |
| RegularExpressionValidator | Pattern matching | ✅ | ✅ |
| CustomValidator | Custom logic | ✅ | ✅ |
| ValidationSummary | Display all errors | ✅ | ✅ |

## RequiredFieldValidator

### Basic Usage
```aspx
<asp:TextBox ID="txtName" runat="server" />
<asp:RequiredFieldValidator ID="rfvName" runat="server"
    ControlToValidate="txtName"
    ErrorMessage="Name is required"
    Display="Dynamic"
    CssClass="error-message" />
```

### With Initial Value
```aspx
<!-- Don't allow default option -->
<asp:DropDownList ID="ddlCountry" runat="server">
    <asp:ListItem Value="">-- Select Country --</asp:ListItem>
    <asp:ListItem Value="VN">Vietnam</asp:ListItem>
    <asp:ListItem Value="US">United States</asp:ListItem>
</asp:DropDownList>

<asp:RequiredFieldValidator ID="rfvCountry" runat="server"
    ControlToValidate="ddlCountry"
    InitialValue=""
    ErrorMessage="Please select a country" />
```

## RangeValidator

### Numeric Range
```aspx
<asp:TextBox ID="txtAge" runat="server" />
<asp:RangeValidator ID="rvAge" runat="server"
    ControlToValidate="txtAge"
    Type="Integer"
    MinimumValue="18"
    MaximumValue="120"
    ErrorMessage="Age must be between 18 and 120" />
```

### Date Range
```aspx
<asp:TextBox ID="txtStartDate" runat="server" TextMode="Date" />
<asp:RangeValidator ID="rvStartDate" runat="server"
    ControlToValidate="txtStartDate"
    Type="Date"
    MinimumValue="2024-01-01"
    MaximumValue="2025-12-31"
    ErrorMessage="Date must be in 2024-2025" />
```

### Currency Range
```aspx
<asp:TextBox ID="txtPrice" runat="server" />
<asp:RangeValidator ID="rvPrice" runat="server"
    ControlToValidate="txtPrice"
    Type="Currency"
    MinimumValue="0"
    MaximumValue="10000"
    ErrorMessage="Price must be between $0 and $10,000" />
```

### Dynamic Range (Server-Side)
```csharp
protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        // Set dynamic range based on business rules
        DateTime minDate = DateTime.Today;
        DateTime maxDate = DateTime.Today.AddMonths(6);
        
        rvStartDate.MinimumValue = minDate.ToString("yyyy-MM-dd");
        rvStartDate.MaximumValue = maxDate.ToString("yyyy-MM-dd");
    }
}
```

## CompareValidator

### Compare with Another Control
```aspx
<asp:TextBox ID="txtPassword" runat="server" TextMode="Password" />
<asp:TextBox ID="txtConfirmPassword" runat="server" TextMode="Password" />

<asp:CompareValidator ID="cvPassword" runat="server"
    ControlToValidate="txtConfirmPassword"
    ControlToCompare="txtPassword"
    Operator="Equal"
    ErrorMessage="Passwords do not match" />
```

### Compare with Fixed Value
```aspx
<asp:TextBox ID="txtQuantity" runat="server" />
<asp:CompareValidator ID="cvQuantity" runat="server"
    ControlToValidate="txtQuantity"
    Type="Integer"
    Operator="GreaterThan"
    ValueToCompare="0"
    ErrorMessage="Quantity must be greater than 0" />
```

### Data Type Validation
```aspx
<asp:TextBox ID="txtPrice" runat="server" />
<asp:CompareValidator ID="cvPrice" runat="server"
    ControlToValidate="txtPrice"
    Type="Double"
    Operator="DataTypeCheck"
    ErrorMessage="Must be a valid number" />
```

### All Comparison Operators
```csharp
// Available operators:
// - Equal
// - NotEqual
// - GreaterThan
// - GreaterThanEqual
// - LessThan
// - LessThanEqual
// - DataTypeCheck
```

## RegularExpressionValidator

### Common Patterns Library

```aspx
<!-- Email -->
<asp:RegularExpressionValidator ID="revEmail" runat="server"
    ControlToValidate="txtEmail"
    ValidationExpression="^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$"
    ErrorMessage="Invalid email format" />

<!-- Phone (Vietnam) -->
<asp:RegularExpressionValidator ID="revPhone" runat="server"
    ControlToValidate="txtPhone"
    ValidationExpression="^(0|\+84)[0-9]{9}$"
    ErrorMessage="Invalid phone number" />

<!-- URL -->
<asp:RegularExpressionValidator ID="revUrl" runat="server"
    ControlToValidate="txtWebsite"
    ValidationExpression="^(http|https)://[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?"
    ErrorMessage="Invalid URL" />

<!-- Postal Code (Vietnam) -->
<asp:RegularExpressionValidator ID="revPostalCode" runat="server"
    ControlToValidate="txtPostalCode"
    ValidationExpression="^\d{6}$"
    ErrorMessage="Invalid postal code (6 digits)" />

<!-- Credit Card -->
<asp:RegularExpressionValidator ID="revCreditCard" runat="server"
    ControlToValidate="txtCreditCard"
    ValidationExpression="^[0-9]{13,16}$"
    ErrorMessage="Invalid credit card number" />

<!-- Username (alphanumeric, 3-20 chars) -->
<asp:RegularExpressionValidator ID="revUsername" runat="server"
    ControlToValidate="txtUsername"
    ValidationExpression="^[a-zA-Z0-9_]{3,20}$"
    ErrorMessage="Username must be 3-20 alphanumeric characters" />

<!-- Strong Password -->
<asp:RegularExpressionValidator ID="revPassword" runat="server"
    ControlToValidate="txtPassword"
    ValidationExpression="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    ErrorMessage="Password must be 8+ chars with uppercase, lowercase, number, and special character" />

<!-- Date (yyyy-MM-dd) -->
<asp:RegularExpressionValidator ID="revDate" runat="server"
    ControlToValidate="txtDate"
    ValidationExpression="^\d{4}-\d{2}-\d{2}$"
    ErrorMessage="Date format must be yyyy-MM-dd" />

<!-- IPv4 Address -->
<asp:RegularExpressionValidator ID="revIP" runat="server"
    ControlToValidate="txtIPAddress"
    ValidationExpression="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    ErrorMessage="Invalid IP address" />
```

### Custom Business Patterns
```csharp
public static class ValidationPatterns
{
    // Vietnamese ID Card
    public const string VN_ID_CARD = @"^\d{9}$|^\d{12}$";
    
    // Vietnamese Tax Code
    public const string VN_TAX_CODE = @"^\d{10}(-\d{3})?$";
    
    // Product SKU
    public const string PRODUCT_SKU = @"^[A-Z]{3}-\d{4}-[A-Z]{2}$";
    
    // Invoice Number
    public const string INVOICE_NUMBER = @"^INV-\d{8}$";
    
    // Order Number
    public const string ORDER_NUMBER = @"^ORD-\d{10}$";
}

// Usage in code-behind
protected void Page_Load(object sender, EventArgs e)
{
    if (!IsPostBack)
    {
        revTaxCode.ValidationExpression = ValidationPatterns.VN_TAX_CODE;
    }
}
```

## CustomValidator

### Client-Side Custom Validation
```aspx
<asp:TextBox ID="txtUsername" runat="server" />
<asp:CustomValidator ID="cvUsername" runat="server"
    ControlToValidate="txtUsername"
    ClientValidationFunction="ValidateUsername"
    OnServerValidate="ValidateUsername_ServerValidate"
    ErrorMessage="Username already exists" />

<script type="text/javascript">
function ValidateUsername(sender, args) {
    var username = args.Value;
    
    // Client-side check
    if (username.length < 3) {
        args.IsValid = false;
        return;
    }
    
    // AJAX check for availability (optional)
    $.ajax({
        url: 'CheckUsername.aspx',
        data: { username: username },
        async: false,
        success: function(result) {
            args.IsValid = (result === 'true');
        }
    });
}
</script>
```

### Server-Side Custom Validation
```csharp
protected void ValidateUsername_ServerValidate(object source, ServerValidateEventArgs args)
{
    string username = args.Value;
    
    // Business logic validation
    if (string.IsNullOrWhiteSpace(username))
    {
        args.IsValid = false;
        return;
    }
    
    // Check database
    args.IsValid = !UsernameExists(username);
}

private bool UsernameExists(string username)
{
    using (var connection = new SqlConnection(_connectionString))
    using (var command = new SqlCommand(
        "SELECT COUNT(*) FROM Users WHERE Username = @Username", connection))
    {
        command.Parameters.AddWithValue("@Username", username);
        connection.Open();
        
        int count = (int)command.ExecuteScalar();
        return count > 0;
    }
}
```

### Cross-Field Validation
```aspx
<asp:TextBox ID="txtStartDate" runat="server" TextMode="Date" />
<asp:TextBox ID="txtEndDate" runat="server" TextMode="Date" />

<asp:CustomValidator ID="cvDateRange" runat="server"
    OnServerValidate="ValidateDateRange"
    ErrorMessage="End date must be after start date" />
```

```csharp
protected void ValidateDateRange(object source, ServerValidateEventArgs args)
{
    DateTime startDate, endDate;
    
    bool startValid = DateTime.TryParse(txtStartDate.Text, out startDate);
    bool endValid = DateTime.TryParse(txtEndDate.Text, out endDate);
    
    if (!startValid || !endValid)
    {
        args.IsValid = false;
        return;
    }
    
    args.IsValid = endDate > startDate;
}
```

### Complex Business Rules
```csharp
protected void ValidateOrder_ServerValidate(object source, ServerValidateEventArgs args)
{
    // Multiple conditions
    decimal totalAmount = decimal.Parse(txtTotalAmount.Text);
    int quantity = int.Parse(txtQuantity.Text);
    string customerType = ddlCustomerType.SelectedValue;
    
    // Business rule: VIP customers can order any amount
    if (customerType == "VIP")
    {
        args.IsValid = true;
        return;
    }
    
    // Regular customers: max 100 items or $10,000
    if (quantity > 100 || totalAmount > 10000)
    {
        cvOrder.ErrorMessage = "Regular customers limited to 100 items or $10,000";
        args.IsValid = false;
        return;
    }
    
    args.IsValid = true;
}
```

## ValidationSummary

### Basic Setup
```aspx
<asp:ValidationSummary ID="vsPage" runat="server"
    HeaderText="Please correct the following errors:"
    DisplayMode="BulletList"
    ShowSummary="true"
    ShowMessageBox="false"
    CssClass="validation-summary" />
```

### Display Modes
```aspx
<!-- Bullet List (default) -->
<asp:ValidationSummary ID="vs1" runat="server" DisplayMode="BulletList" />

<!-- List -->
<asp:ValidationSummary ID="vs2" runat="server" DisplayMode="List" />

<!-- Single Paragraph -->
<asp:ValidationSummary ID="vs3" runat="server" DisplayMode="SingleParagraph" />
```

### Message Box Style
```aspx
<asp:ValidationSummary ID="vsMessageBox" runat="server"
    ShowSummary="false"
    ShowMessageBox="true"
    HeaderText="Validation Errors" />
```

### Styled with CSS
```aspx
<asp:ValidationSummary ID="vsStyled" runat="server"
    CssClass="alert alert-danger"
    HeaderText="<strong>Validation Failed</strong>" />

<style>
.validation-summary {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 15px;
    margin: 10px 0;
    color: #721c24;
}

.validation-summary ul {
    margin: 10px 0 0 20px;
}

.error-message {
    color: #dc3545;
    font-size: 0.875rem;
    display: block;
    margin-top: 5px;
}
</style>
```

## ValidationGroups

### Multiple Forms on One Page
```aspx
<!-- Search Form -->
<div class="search-section">
    <asp:TextBox ID="txtSearch" runat="server" />
    <asp:RequiredFieldValidator ID="rfvSearch" runat="server"
        ControlToValidate="txtSearch"
        ValidationGroup="SearchGroup"
        ErrorMessage="Search term required" />
    
    <asp:Button ID="btnSearch" runat="server"
        Text="Search"
        ValidationGroup="SearchGroup"
        OnClick="btnSearch_Click" />
</div>

<!-- Registration Form -->
<div class="registration-section">
    <asp:TextBox ID="txtEmail" runat="server" />
    <asp:RequiredFieldValidator ID="rfvEmail" runat="server"
        ControlToValidate="txtEmail"
        ValidationGroup="RegistrationGroup"
        ErrorMessage="Email required" />
    
    <asp:RegularExpressionValidator ID="revEmail" runat="server"
        ControlToValidate="txtEmail"
        ValidationGroup="RegistrationGroup"
        ValidationExpression="^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$"
        ErrorMessage="Invalid email" />
    
    <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" />
    <asp:RequiredFieldValidator ID="rfvPassword" runat="server"
        ControlToValidate="txtPassword"
        ValidationGroup="RegistrationGroup"
        ErrorMessage="Password required" />
    
    <asp:Button ID="btnRegister" runat="server"
        Text="Register"
        ValidationGroup="RegistrationGroup"
        OnClick="btnRegister_Click" />
    
    <asp:ValidationSummary ID="vsRegistration" runat="server"
        ValidationGroup="RegistrationGroup"
        HeaderText="Registration Errors:" />
</div>
```

### Programmatic Validation
```csharp
protected void btnCustomSubmit_Click(object sender, EventArgs e)
{
    // Validate specific group
    Page.Validate("RegistrationGroup");
    
    if (!Page.IsValid)
    {
        return;
    }
    
    // Process registration
    ProcessRegistration();
}

// Validate all groups
protected void ValidateAllGroups()
{
    Page.Validate(); // Validates all validators without groups
    
    // Validate specific groups
    Page.Validate("SearchGroup");
    Page.Validate("RegistrationGroup");
    
    // Check overall validity
    if (Page.IsValid)
    {
        // All validations passed
    }
}
```

## Conditional Validation

### Enable/Disable Validators
```csharp
protected void chkRequirePhone_CheckedChanged(object sender, EventArgs e)
{
    // Enable phone validation only if checkbox checked
    rfvPhone.Enabled = chkRequirePhone.Checked;
    revPhone.Enabled = chkRequirePhone.Checked;
}
```

### Dynamic Validation Requirements
```csharp
protected void ddlCountry_SelectedIndexChanged(object sender, EventArgs e)
{
    if (ddlCountry.SelectedValue == "VN")
    {
        // Vietnam-specific validation
        revPhone.ValidationExpression = @"^(0|\+84)[0-9]{9}$";
        revPostalCode.ValidationExpression = @"^\d{6}$";
    }
    else if (ddlCountry.SelectedValue == "US")
    {
        // US-specific validation
        revPhone.ValidationExpression = @"^\d{10}$";
        revPostalCode.ValidationExpression = @"^\d{5}(-\d{4})?$";
    }
}
```

## Validation with AJAX UpdatePanel

### UpdatePanel Validation
```aspx
<asp:UpdatePanel ID="upForm" runat="server">
    <ContentTemplate>
        <asp:TextBox ID="txtName" runat="server" />
        <asp:RequiredFieldValidator ID="rfvName" runat="server"
            ControlToValidate="txtName"
            ErrorMessage="Name required" />
        
        <asp:Button ID="btnSubmit" runat="server"
            Text="Submit"
            OnClick="btnSubmit_Click" />
    </ContentTemplate>
</asp:UpdatePanel>

<!-- ValidationSummary outside UpdatePanel still works -->
<asp:ValidationSummary ID="vsPage" runat="server" />
```

### Prevent Full Postback for Validation Errors
```aspx
<asp:ScriptManager ID="ScriptManager1" runat="server" />

<asp:UpdatePanel ID="upForm" runat="server" UpdateMode="Conditional">
    <ContentTemplate>
        <!-- Validators and controls -->
    </ContentTemplate>
</asp:UpdatePanel>
```

## Best Practices

### 1. Always Validate on Both Client and Server
```csharp
protected void btnSubmit_Click(object sender, EventArgs e)
{
    // ALWAYS check Page.IsValid
    if (!Page.IsValid)
    {
        return; // Validation failed
    }
    
    // Additional server-side business logic validation
    if (!ValidateBusinessRules())
    {
        lblError.Text = "Business rule validation failed";
        return;
    }
    
    // Process the form
    SaveData();
}
```

### 2. Use Meaningful Error Messages
```aspx
<!-- ❌ Bad -->
<asp:RequiredFieldValidator 
    ErrorMessage="Required" />

<!-- ✅ Good -->
<asp:RequiredFieldValidator 
    ErrorMessage="Email address is required" />

<!-- ✅ Better - separate display and summary messages -->
<asp:RequiredFieldValidator 
    Text="*"
    ErrorMessage="Email address is required"
    Display="Dynamic" />
```

### 3. Group Related Validations
```aspx
<!-- All validators for registration -->
<asp:RequiredFieldValidator ValidationGroup="Registration" ... />
<asp:RegularExpressionValidator ValidationGroup="Registration" ... />
<asp:CompareValidator ValidationGroup="Registration" ... />

<asp:Button ValidationGroup="Registration" ... />
<asp:ValidationSummary ValidationGroup="Registration" ... />
```

### 4. Disable Validation When Appropriate
```aspx
<!-- Cancel button should not trigger validation -->
<asp:Button ID="btnCancel" runat="server"
    Text="Cancel"
    CausesValidation="false"
    OnClick="btnCancel_Click" />
```

### 5. Provide Visual Feedback
```css
/* Style for invalid inputs */
.aspNetDisabled {
    opacity: 0.5;
}

.error-message {
    color: #dc3545;
    font-size: 0.875rem;
    display: block;
}

/* Highlight invalid fields */
input.invalid {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}
```

```javascript
// Add 'invalid' class to controls with errors
function highlightInvalidControls() {
    $('span[style*="visibility: visible"]').each(function() {
        var controlId = $(this).attr('controltovalidate');
        $('#' + controlId).addClass('invalid');
    });
}
```

## Advanced Patterns

### Validation Factory Pattern
```csharp
public static class ValidatorFactory
{
    public static void AddRequiredValidator(WebControl control, string errorMessage)
    {
        var validator = new RequiredFieldValidator
        {
            ControlToValidate = control.ID,
            ErrorMessage = errorMessage,
            Display = ValidatorDisplay.Dynamic,
            CssClass = "error-message"
        };
        
        control.Parent.Controls.Add(validator);
    }
    
    public static void AddRangeValidator(WebControl control, int min, int max)
    {
        var validator = new RangeValidator
        {
            ControlToValidate = control.ID,
            Type = ValidationDataType.Integer,
            MinimumValue = min.ToString(),
            MaximumValue = max.ToString(),
            ErrorMessage = $"Value must be between {min} and {max}",
            Display = ValidatorDisplay.Dynamic
        };
        
        control.Parent.Controls.Add(validator);
    }
}

// Usage
protected void Page_Init(object sender, EventArgs e)
{
    ValidatorFactory.AddRequiredValidator(txtName, "Name is required");
    ValidatorFactory.AddRangeValidator(txtAge, 18, 120);
}
```

### Fluent Validation Helper
```csharp
public class ValidationBuilder
{
    private List<BaseValidator> _validators = new List<BaseValidator>();
    private string _controlId;
    
    public static ValidationBuilder For(string controlId)
    {
        return new ValidationBuilder { _controlId = controlId };
    }
    
    public ValidationBuilder Required(string message)
    {
        _validators.Add(new RequiredFieldValidator
        {
            ControlToValidate = _controlId,
            ErrorMessage = message,
            Display = ValidatorDisplay.Dynamic
        });
        return this;
    }
    
    public ValidationBuilder Range(int min, int max, string message = null)
    {
        _validators.Add(new RangeValidator
        {
            ControlToValidate = _controlId,
            Type = ValidationDataType.Integer,
            MinimumValue = min.ToString(),
            MaximumValue = max.ToString(),
            ErrorMessage = message ?? $"Value must be between {min} and {max}",
            Display = ValidatorDisplay.Dynamic
        });
        return this;
    }
    
    public ValidationBuilder Email(string message = "Invalid email format")
    {
        _validators.Add(new RegularExpressionValidator
        {
            ControlToValidate = _controlId,
            ValidationExpression = @"^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$",
            ErrorMessage = message,
            Display = ValidatorDisplay.Dynamic
        });
        return this;
    }
    
    public void AddToPage(Control container)
    {
        foreach (var validator in _validators)
        {
            container.Controls.Add(validator);
        }
    }
}

// Usage
protected void Page_Init(object sender, EventArgs e)
{
    ValidationBuilder.For(txtEmail.ID)
        .Required("Email is required")
        .Email()
        .AddToPage(form1);
        
    ValidationBuilder.For(txtAge.ID)
        .Required("Age is required")
        .Range(18, 120)
        .AddToPage(form1);
}
```

## Troubleshooting

### Validation Not Firing
- Check CausesValidation="true" on button
- Verify ControlToValidate matches control ID
- Ensure validators are in same naming container
- Check EnableClientScript setting

### Validation Fires on Wrong Button
- Use ValidationGroups
- Set CausesValidation="false" on buttons that shouldn't validate

### Client-Side Validation Not Working
- Check EnableClientScript="true"
- Verify JavaScript enabled in browser
- Check for JavaScript errors in console
- Ensure validator scripts loaded (check view source)

### UpdatePanel Issues
- Validators inside UpdatePanel should work automatically
- ValidationSummary can be outside UpdatePanel
- Check ScriptManager is on page
