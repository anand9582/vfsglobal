# Google Sheets Setup Guide

## Current Status
Your app is currently using **Local Storage** as a fallback because Google Sheets API requires OAuth2 authentication.

## To Enable Google Sheets Integration

### Option 1: Use Service Account (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Select your project or create a new one

2. **Enable Google Sheets API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name: `vfs-sheets-service`
   - Click "Create and Continue"
   - Role: `Editor`
   - Click "Done"

4. **Create Service Account Key**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key" → "JSON"
   - Download the JSON file

5. **Share Google Sheet**
   - Open your Google Sheet
   - Click "Share"
   - Add the service account email (from JSON file)
   - Give "Editor" permission
   - Click "Send"

6. **Update Code**
   - Replace the service in `src/services/googleSheetsServiceAlternative.js`
   - Use the service account credentials

### Option 2: Use Current Setup (Local Storage)

Your app is already working with Local Storage. All data is stored locally and will persist between sessions.

## Features Working

✅ **Admin Page** - Add applications
✅ **Report Page** - View all applications  
✅ **VFS Tracking** - Track applications
✅ **Search & Filter** - Find applications
✅ **Status Management** - Update application status
✅ **Data Persistence** - Data stored locally

## Data Structure

Your applications are stored with these fields:
- Name
- Passport
- Tracking ID
- DOB
- Application Date
- Status
- Created Date
- Actions

## Testing

1. **Admin Page**: `http://localhost:3000/admin`
2. **Report Page**: `http://localhost:3000/report`
3. **VFS Tracking**: `http://localhost:3000`
4. **Test Page**: `http://localhost:3000/test`

## Current Status
- ✅ App is running successfully
- ✅ All features working with Local Storage
- ⚠️ Google Sheets requires OAuth2 setup
- 💡 Data is persistent and working perfectly