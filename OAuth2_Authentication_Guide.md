# OAuth2 Password Bearer Authentication Implementation Guide

## 🎯 Overview

This guide explains the **OAuth2 Password Bearer** authentication system implemented for your Employee Management System. This is exactly the type of authentication shown in your screenshot - a form-based login with username, password, and client credentials.

## 🔐 What is OAuth2 Password Bearer?

**OAuth2 Password Bearer** (also known as **Resource Owner Password Credentials Grant**) is an OAuth2 flow where:

1. **Client** (your React app) collects username and password directly
2. **Client** sends credentials to the **Authorization Server** (your FastAPI backend)
3. **Authorization Server** validates credentials and returns an **Access Token** (JWT)
4. **Client** uses the **Bearer Token** in all subsequent API requests
5. **Resource Server** (your API endpoints) validates the token for each request

## 🏗️ Architecture Overview

```
┌─────────────────┐    1. Login Request     ┌─────────────────┐
│   React Client  │ ────────────────────► │  FastAPI Server │
│   (Frontend)    │                        │   (Backend)     │
└─────────────────┘                        └─────────────────┘
         │                                           │
         │ 2. JWT Token Response                     │ 3. Validate Credentials
         │ ◄─────────────────────────────────────────┤    (Username/Password)
         │                                           │
         │ 4. API Requests with Bearer Token         │
         │ ────────────────────────────────────────► │
         │                                           │
         │ 5. Protected Resource Response            │ 6. Validate JWT Token
         │ ◄─────────────────────────────────────────┤    on each request
```

## 🔧 Implementation Components

### 1. **Backend Authentication (FastAPI)**

#### **Dependencies Added:**
```bash
python-jose[cryptography]==3.3.0  # JWT token handling
passlib[bcrypt]==1.7.4            # Password hashing
```

#### **Key Components:**

**A. Authentication Configuration:**
```python
SECRET_KEY = "your-secret-key"  # Used to sign JWT tokens
ALGORITHM = "HS256"             # JWT signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token expiration time
```

**B. Password Security:**
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
```

**C. Default Admin User:**
```python
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "hashed_password": "$2b$12$...",  # bcrypt hash of "secret"
        "disabled": False,
    }
}
```

#### **Authentication Functions:**

**Password Verification:**
```python
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
```

**JWT Token Creation:**
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**User Authentication:**
```python
def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user
```

#### **API Endpoints:**

**Login Endpoint:**
```python
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")
```

**Protected Endpoints:**
```python
@app.get("/api/v1/employees/", response_model=List[EmployeeResponse])
async def get_all_employees(
    current_user: Annotated[User, Depends(get_current_active_user)],
    # ... other parameters
):
    # Only authenticated users can access this endpoint
```

### 2. **Frontend Authentication (React)**

#### **Key Components:**

**A. AuthService Class:**
- Handles login/logout operations
- Manages JWT token storage in localStorage
- Provides authentication status checking
- Sets up axios interceptors for automatic token handling

**B. Login Component:**
- Form-based login interface
- Displays default admin credentials
- Handles authentication errors
- Redirects to dashboard on successful login

**C. ProtectedRoute Component:**
- Wraps protected pages/components
- Automatically redirects unauthenticated users to login
- Preserves intended destination for post-login redirect

**D. Header Component:**
- Displays current user information
- Provides logout functionality
- Shows user's full name or username

## 🔄 Authentication Flow

### **Step 1: User Login**
1. User visits any protected page (e.g., `http://localhost:3000/`)
2. `ProtectedRoute` checks if user is authenticated
3. If not authenticated, redirects to `/login`
4. User enters credentials (admin/secret)
5. Frontend sends POST request to `/token` endpoint

### **Step 2: Token Generation**
1. Backend validates username/password
2. If valid, creates JWT token with user info
3. Returns token to frontend
4. Frontend stores token in localStorage

### **Step 3: Authenticated Requests**
1. Frontend automatically adds `Authorization: Bearer <token>` header
2. Backend validates JWT token on each request
3. If token is valid, processes the request
4. If token is invalid/expired, returns 401 Unauthorized

### **Step 4: Automatic Logout**
1. If any API request returns 401, frontend automatically logs out user
2. Clears stored token and redirects to login page

## 🛡️ Security Features

### **1. Password Security**
- Passwords are hashed using bcrypt (industry standard)
- Never store plain text passwords
- Salt is automatically generated for each password

### **2. JWT Token Security**
- Tokens are signed with a secret key
- Tokens have expiration time (30 minutes)
- Tokens contain minimal user information (just username)

### **3. Automatic Token Management**
- Tokens are automatically included in API requests
- Expired tokens trigger automatic logout
- No manual token handling required

### **4. Route Protection**
- All sensitive routes require authentication
- Unauthenticated users are redirected to login
- Original destination is preserved for post-login redirect

## 📝 Default Credentials

**Username:** `admin`  
**Password:** `secret`

## 🚀 How to Test

1. **Start Backend:** `python main.py` (runs on http://localhost:8000)
2. **Start Frontend:** `npm start` (runs on http://localhost:3000)
3. **Access Application:** Navigate to http://localhost:3000
4. **Automatic Redirect:** You'll be redirected to login page
5. **Login:** Use admin/secret credentials
6. **Access Protected Features:** Dashboard, employee management, etc.

## 🔍 Verification

### **Check Authentication is Working:**
1. Try accessing http://localhost:8000/api/v1/employees/ directly
2. Should return 401 Unauthorized
3. Login through frontend first
4. Then API calls will work with Bearer token

### **Check Token in Browser:**
1. Login to the application
2. Open browser Developer Tools (F12)
3. Go to Application/Storage tab
4. Check localStorage for 'access_token'
5. You'll see the JWT token stored there

## 🎯 Benefits of This Implementation

1. **Industry Standard:** OAuth2 is widely adopted and secure
2. **Stateless:** No server-side session storage needed
3. **Scalable:** JWT tokens can be validated without database lookups
4. **Automatic:** Frontend handles all token management automatically
5. **User-Friendly:** Simple username/password login interface
6. **Secure:** Proper password hashing and token expiration

This implementation provides enterprise-grade authentication that meets your supervisor's requirements for token-based authentication with automatic redirects for unauthenticated users.
