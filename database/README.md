# VFS Database Setup

## 📁 Files in this folder:

1. **`vfs_tracking.sql`** - Complete database schema with sample data
2. **`setup_database.php`** - Automatic database setup script
3. **`README.md`** - This file

## 🚀 Quick Setup (3 Methods):

### Method 1: Automatic Setup (Easiest)
```bash
# Browser में जाकर:
http://localhost/vfs-project/database/setup_database.php
```

### Method 2: phpMyAdmin
```bash
1. Go to: http://localhost/phpmyadmin
2. Click "Import"
3. Select: vfs_tracking.sql
4. Click "Go"
```

### Method 3: Command Line
```bash
# MySQL command line में:
mysql -u root -p < vfs_tracking.sql
```

## 📊 Database Structure:

### Table: `applications`
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary Key (Auto Increment) |
| name | VARCHAR(255) | Applicant Name |
| passport_no | VARCHAR(50) | Passport Number |
| tracking_id | VARCHAR(20) | Unique Tracking ID |
| dob | DATE | Date of Birth |
| expected_date | DATE | Application Date |
| status | ENUM('UP','DP') | UP=Under Process, DP=Dispatch |
| created_at | TIMESTAMP | Record Creation Time |
| updated_at | TIMESTAMP | Last Update Time |

### Features:
- ✅ **10 Sample Records** included
- ✅ **Indexes** for better performance
- ✅ **Stored Procedure** for tracking ID generation
- ✅ **Trigger** for automatic timestamp updates
- ✅ **View** for easy querying

## 🔧 Configuration:

### Update Database Settings in `api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'vfs_tracking');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
```

## 🧪 Testing:

### Test Database Connection:
```bash
# Browser में:
http://localhost/vfs-project/api/get_all_users.php
```

### Test Sample Data:
```bash
# Browser में:
http://localhost/vfs-project/api/check_status.php?trackId=20250115ABC12&dob=1990-05-15
```

## 📈 Sample Data Included:

| Name | Passport | Tracking ID | Status |
|------|----------|-------------|--------|
| John Doe | A1234567 | 20250115ABC12 | Under Process |
| Jane Smith | B2345678 | 20250116XYZ34 | Dispatch |
| Mike Johnson | C3456789 | 20250117DEF56 | Under Process |
| ... | ... | ... | ... |

## 🚨 Troubleshooting:

### Database Connection Error:
- Check MySQL service is running
- Verify credentials in config.php
- Ensure database exists

### Permission Denied:
- Check MySQL user permissions
- Run as administrator if needed

### Import Failed:
- Check SQL file syntax
- Ensure MySQL version compatibility
- Check file permissions

## 🎯 Next Steps:

1. **Setup Database** using any method above
2. **Start Web Server** (XAMPP/WAMP)
3. **Run React App** (`npm start`)
4. **Test Admin Page** (PIN: 7788)
5. **Create New Applications** and see auto-generated tracking IDs

## 📞 Support:

If you face any issues:
1. Check MySQL error logs
2. Verify database connection
3. Test API endpoints directly
4. Check browser console for errors

