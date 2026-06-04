# Account Creation System - Configuration Guide

## 🎯 Current Status
**Registration is currently: DISABLED** 🚫

## 📋 Account Creation System Overview

### 🏗️ System Architecture
```
Account Creation Flow:
1. Check if registration is enabled
2. Two-step registration form:
   - Step 1: College Information
   - Step 2: Admin Account Information  
3. Create college + admin account simultaneously
4. Auto-login after successful registration
```

### 🔐 Security Features
- ✅ Registration can be enabled/disabled
- ✅ College name uniqueness validation
- ✅ Email uniqueness validation
- ✅ Password strength requirements (min 6 characters)
- ✅ Automatic college ID assignment
- ✅ JWT token generation for immediate login

## 🛠️ How to Enable Account Creation

### Method 1: Environment Variable (Permanent)
Add to `.env` file:
```properties
REGISTRATION_ENABLED=true
```

### Method 2: Super Admin API Toggle (Dynamic)
```javascript
// Enable registration
POST /api/registration/toggle-registration
Headers: Authorization: Bearer <super_admin_token>
Body: { "enabled": true }

// Disable registration  
POST /api/registration/toggle-registration
Headers: Authorization: Bearer <super_admin_token>
Body: { "enabled": false }
```

### Method 3: Direct Database Management
Access your MongoDB and create accounts manually through super admin interface.

## 📚 API Endpoints

### 1. College + Admin Registration
```
POST /api/registration/register-college
Content-Type: application/json

Body:
{
  // College Information
  "collegeName": "Sample College",
  "collegeAddress": "123 Education Street, City, State",
  "collegePhone": "+1234567890",
  "collegeEmail": "info@samplecollege.edu",
  "establishedYear": "2020",
  "principalName": "Dr. John Doe", 
  "website": "www.samplecollege.edu",
  
  // Admin Account Information
  "adminName": "Jane Admin",
  "adminEmail": "admin@samplecollege.edu",
  "adminPhone": "+1234567891",
  "adminPassword": "securepassword123",
  "adminQualification": "M.Ed",
  "adminDateOfBirth": "1985-05-15"
}
```

**Response:**
```json
{
  "message": "College and admin account created successfully",
  "college": {
    "_id": "college_id",
    "name": "Sample College", 
    "address": "123 Education Street, City, State"
  },
  "admin": {
    "_id": "admin_id",
    "name": "Jane Admin",
    "email": "admin@samplecollege.edu",
    "role": "teacher",
    "collegeId": "college_id"
  },
  "token": "jwt_token_here"
}
```

### 2. Check Registration Status
```
GET /api/registration/registration-status

Response:
{
  "enabled": false,
  "message": "Registration is currently disabled. Contact support for access."
}
```

### 3. Toggle Registration (Super Admin Only)
```
POST /api/registration/toggle-registration
Authorization: Bearer <super_admin_token>
Body: { "enabled": true }

Response:
{
  "success": true,
  "message": "Registration enabled successfully",
  "registrationEnabled": true
}
```

## 🎨 Frontend Registration Page

### Location
`client/src/pages/CollegeRegistration.tsx`

### Features
- ✅ Two-step wizard interface
- ✅ Real-time form validation
- ✅ Registration status checking
- ✅ Responsive design with icons
- ✅ Error handling and success messages
- ✅ Automatic redirect after registration

### Form Fields

#### Step 1: College Information
- College Name (required)
- Address (required) 
- Phone Number
- Email Address
- Established Year
- Principal Name
- Website

#### Step 2: Admin Account
- Full Name (required)
- Email Address (required)
- Phone Number
- Password (required, min 6 chars)
- Confirm Password (required)
- Qualification
- Date of Birth

## 🔄 Current Registration Flow

### When Registration is Disabled:
1. User visits registration page
2. System shows "Registration is currently closed"
3. User sees contact information for support

### When Registration is Enabled:
1. User fills college information
2. User fills admin account information
3. System validates all data
4. Creates college + admin account
5. User is automatically logged in
6. Redirects to dashboard

## ⚠️ Important Notes

### Security Considerations
- College names must be unique
- Email addresses must be unique across all users
- Passwords are automatically hashed
- JWT tokens expire after 7 days
- College admin gets 'teacher' role (not super_admin)

### Data Integrity
- If admin creation fails, college is automatically deleted (rollback)
- All new data gets proper college ID assignment
- College-based data isolation is maintained

### Production Deployment
- Set `REGISTRATION_ENABLED=false` for production initially
- Use super admin toggle to control registration access
- Monitor registration attempts and college creation
- Implement additional security measures as needed

## 🚀 Quick Start Guide

### To Enable Registration Right Now:

#### Option A: Environment Variable
1. Open `.env` file
2. Add: `REGISTRATION_ENABLED=true`
3. Restart server
4. Registration page will be accessible

#### Option B: Super Admin Toggle  
1. Login as super admin
2. Make API call to toggle registration
3. Registration becomes immediately available

### Default Super Admin
If you need to create the first super admin account, you'll need to:
1. Manually insert into database, or
2. Create via direct teacher registration with role modification, or  
3. Use the existing super admin account if available

## 📊 Current System State
- ✅ Registration system is built and ready
- ✅ Frontend forms are complete
- ✅ Backend validation is implemented
- ✅ College-based isolation is working
- 🚫 Registration is currently disabled
- ✅ Super admin toggle system is available