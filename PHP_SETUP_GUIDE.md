# VFS Project - PHP Backend Setup Guide

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run this in your MySQL/MariaDB
mysql -u root -p < database/schema.sql
```

### 2. PHP Configuration
- Make sure PHP 7.4+ is installed
- Enable PDO MySQL extension
- Set up a local web server (XAMPP/WAMP/LAMP)

### 3. Project Structure
```
vfs-project/
├── api/
│   ├── config.php          # Database configuration
│   ├── create_user.php     # Create new application
│   ├── get_all_users.php   # Get all applications
│   ├── check_status.php    # Check application status
│   └── delete_user.php     # Delete application
├── database/
│   └── schema.sql          # Database schema
├── src/                    # React frontend (existing)
└── PHP_SETUP_GUIDE.md      # This file
```

### 4. Database Configuration
Edit `api/config.php` and update:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'vfs_tracking');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
```

### 5. Features Implemented

#### ✅ Admin Page Features
- **Date-based Tracking ID Generation**: जब admin application date fill करता है, तो automatically tracking ID generate होता है
- **Format**: YYYYMMDD + 5 random characters
- **Example**: 20250115ABC12 (for date 2025-01-15)

#### ✅ All Records Display
- सभी applications नीचे table में show होती हैं
- Search और pagination functionality
- Real-time data from PHP API

#### ✅ CRUD Operations
- **Create**: New application with auto-generated tracking ID
- **Read**: View all applications with search/filter
- **Update**: Status changes
- **Delete**: Remove applications

### 6. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create_user.php` | POST | Create new application |
| `/api/get_all_users.php` | GET | Get all applications |
| `/api/check_status.php` | GET | Check application status |
| `/api/delete_user.php/{id}` | DELETE | Delete application |

### 7. How Tracking ID Generation Works

```php
function generateTrackingId($date) {
    $dateObj = new DateTime($date);
    $year = $dateObj->format('Y');      // 2025
    $month = $dateObj->format('m');     // 01
    $day = $dateObj->format('d');       // 15
    
    // Generate 5 random characters
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $random = '';
    for ($i = 0; $i < 5; $i++) {
        $random .= $chars[rand(0, strlen($chars) - 1)];
    }
    
    return $year . $month . $day . $random; // 20250115ABC12
}
```

### 8. Testing

1. **Start your web server** (XAMPP/WAMP)
2. **Import database** using schema.sql
3. **Run React app**: `npm start`
4. **Test admin page**: Go to `/admin` and enter PIN: 7788
5. **Fill form** with application date to see auto-generated tracking ID
6. **Check tracking page**: Use generated tracking ID to check status

### 9. React Frontend Integration

The React frontend has been updated to use PHP API endpoints:
- All API calls now point to `http://localhost/vfs-project/api/`
- Same UI/UX as before
- Real-time data from PHP backend
- Automatic tracking ID generation based on date

### 10. Troubleshooting

**Database Connection Issues:**
- Check MySQL service is running
- Verify database credentials in config.php
- Ensure database exists

**API Not Working:**
- Check PHP error logs
- Verify file permissions
- Test endpoints directly in browser

**CORS Issues:**
- CORS headers are already set in config.php
- If still having issues, check web server configuration

## 🎯 Key Benefits

1. **Automatic Tracking ID**: No manual entry needed
2. **Date-based Generation**: Easy to identify application date
3. **Real-time Updates**: All changes reflect immediately
4. **Professional UI**: Same beautiful React interface
5. **Scalable**: Easy to add more features

## 📞 Support

If you face any issues, check:
1. Database connection
2. PHP error logs
3. Browser console for JavaScript errors
4. Network tab for API call failures

