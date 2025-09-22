# OAuth Implementation Guide - Employee Management System

## 📋 Table of Contents
1. [Overview](#overview)
2. [OAuth Flow Type](#oauth-flow-type)
3. [Architecture](#architecture)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Authentication Flow](#authentication-flow)
7. [Security Features](#security-features)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This Employee Management System implements **OAuth2 Password Bearer** authentication (also known as **Resource Owner Password Credentials Grant**). This is a token-based authentication system where users provide username/password credentials to receive a JWT (JSON Web Token) that authorizes subsequent API requests.

### Key Components:
- **Frontend**: React TypeScript application with login form
- **Backend**: FastAPI server with JWT token generation and validation
- **Authentication**: OAuth2 Password Bearer flow with JWT tokens
- **Storage**: Tokens stored in browser localStorage
- **Security**: bcrypt password hashing, token expiration, automatic logout

## 🔄 OAuth Flow Type

**OAuth2 Password Bearer Flow** is used because:
- ✅ Simple username/password login interface
- ✅ Direct credential collection by the client application
- ✅ Suitable for trusted first-party applications
- ✅ No need for external OAuth providers (Google, Facebook, etc.)
- ✅ Full control over user authentication

### Flow Diagram:
```
┌─────────────────┐    1. Login Request     ┌─────────────────┐
│   React Client  │ ────────────────────► │  FastAPI Server │
│   (Frontend)    │   (username/password)   │   (Backend)     │
└─────────────────┘                        └─────────────────┘
         │                                           │
         │ 2. JWT Token Response                     │ 3. Validate Credentials
         │ ◄─────────────────────────────────────────┤    & Generate Token
         │                                           │
         │ 4. API Requests with Bearer Token         │
         │ ────────────────────────────────────────► │
         │   Authorization: Bearer <jwt-token>       │
         │                                           │ 5. Validate Token
         │ 6. Protected Resource Response            │    on Each Request
         │ ◄─────────────────────────────────────────┤
```

## 🏗️ Architecture

### System Components:

1. **Authentication Server** (FastAPI Backend)
   - Issues JWT tokens
   - Validates user credentials
   - Protects API endpoints

2. **Resource Server** (Same FastAPI Backend)
   - Serves protected employee data
   - Validates JWT tokens on each request

3. **Client Application** (React Frontend)
   - Collects user credentials
   - Stores and manages JWT tokens
   - Includes tokens in API requests

## 🔧 Backend Implementation

### Dependencies
```bash
pip install python-jose[cryptography]==3.3.0  # JWT handling
pip install passlib[bcrypt]==1.7.4            # Password hashing
pip install python-multipart                  # Form data parsing
```

### Configuration
```python
# Authentication settings
SECRET_KEY = "your-secret-key-here"  # Used to sign JWT tokens
ALGORITHM = "HS256"                  # JWT signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 30     # Token expiration time

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
```

### User Database
```python
# In-memory user database (replace with real database in production)
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
    }
}
```

### Core Authentication Functions

#### Password Verification
```python
def verify_password(plain_password, hashed_password):
    """Verify a plaintext password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password for storing"""
    return pwd_context.hash(password)
```

#### User Authentication
```python
def authenticate_user(fake_db, username: str, password: str):
    """Authenticate user with username and password"""
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
```

#### JWT Token Management
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user
```

### API Endpoints

#### Login Endpoint
```python
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """Login endpoint - returns JWT token for valid credentials"""
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
```

#### Protected Endpoint Example
```python
@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    """Get current user information"""
    return current_user

@app.get("/api/v1/employees/")
async def get_employees(
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Get employees - requires authentication"""
    # Employee retrieval logic here
    pass
```

## 💻 Frontend Implementation

### AuthService Class
```typescript
export class AuthService {
  private static readonly TOKEN_KEY = 'access_token';
  private static readonly USER_KEY = 'current_user';

  /**
   * Login with username and password
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, token_type } = response.data;

      // Store token in localStorage
      localStorage.setItem(this.TOKEN_KEY, access_token);

      // Fetch and store user information
      await this.fetchAndStoreUserInfo();

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/login';
  }

  /**
   * Setup axios interceptors for automatic token handling
   */
  static setupAxiosInterceptors(): void {
    // Request interceptor to add token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Login Component
```typescript
const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await AuthService.login(formData.username, formData.password);
      navigate('/'); // Redirect to dashboard after successful login
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <form onSubmit={handleSubmit} className="login-form">
          {/* Login form fields */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !formData.username || !formData.password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <div className="default-credentials">
            <h3>Default Admin Credentials:</h3>
            <p><strong>Username:</strong> admin</p>
            <p><strong>Password:</strong> secret</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### ProtectedRoute Component
```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### Automatic Token Handling
```typescript
// In api.ts - Axios instance with automatic token inclusion
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    // Add authentication token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

## 🔄 Authentication Flow

### Step-by-Step Process

#### 1. Initial Access Attempt
```
User visits: http://localhost:3000/
↓
ProtectedRoute checks: AuthService.isAuthenticated()
↓
No token found or token expired
↓
Redirect to: http://localhost:3000/login
```

#### 2. Login Process
```
User enters credentials: admin / secret
↓
Frontend sends POST to: http://localhost:8000/token
Content-Type: application/x-www-form-urlencoded
Body: username=admin&password=secret
↓
Backend validates credentials
↓
Backend generates JWT token
↓
Backend responds: { "access_token": "eyJ...", "token_type": "bearer" }
↓
Frontend stores token in localStorage
↓
Frontend redirects to: http://localhost:3000/dashboard
```

#### 3. Authenticated API Requests
```
Frontend makes API call: GET /api/v1/employees
↓
Axios interceptor adds header: Authorization: Bearer eyJ...
↓
Backend receives request with token
↓
Backend validates JWT token using get_current_user()
↓
If valid: Process request and return data
If invalid: Return 401 Unauthorized
↓
Frontend receives response
If 401: Automatic logout and redirect to login
```

#### 4. Token Expiration Handling
```
Token expires after 30 minutes
↓
Next API request returns 401 Unauthorized
↓
Axios response interceptor detects 401
↓
Automatic logout: Clear localStorage
↓
Redirect to login page
```

## 🛡️ Security Features

### 1. Password Security
- **bcrypt Hashing**: Industry-standard password hashing
- **Salt Generation**: Automatic salt generation for each password
- **No Plain Text**: Passwords never stored in plain text
- **Hash Verification**: Secure password comparison

```python
# Password hashing example
password = "secret"
hashed = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
is_valid = pwd_context.verify(password, hashed)  # True
```

### 2. JWT Token Security
- **Digital Signature**: Tokens signed with secret key
- **Expiration Time**: 30-minute token lifetime
- **Minimal Payload**: Only username stored in token
- **Tamper Detection**: Invalid tokens rejected

```json
// JWT Token Structure
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "admin",
    "exp": 1703123456
  },
  "signature": "..."
}
```

### 3. Automatic Security Measures
- **Token Validation**: Every API request validates token
- **Automatic Logout**: Expired/invalid tokens trigger logout
- **CORS Protection**: Configured allowed origins
- **HTTPS Ready**: Secure for production deployment

### 4. Frontend Security
- **Token Storage**: localStorage (consider httpOnly cookies for production)
- **Automatic Cleanup**: Tokens cleared on logout
- **Route Protection**: Unauthenticated users redirected
- **Error Handling**: Graceful handling of auth failures

## 🧪 Testing & Verification

### 1. Manual Testing

#### Test Login Flow:
```bash
# 1. Test login endpoint directly
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=secret"

# Expected response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Test Protected Endpoint:
```bash
# 2. Test protected endpoint without token (should fail)
curl -X GET "http://localhost:8000/api/v1/employees"

# Expected response: 401 Unauthorized

# 3. Test protected endpoint with token (should work)
curl -X GET "http://localhost:8000/api/v1/employees" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected response: Employee data
```

### 2. Browser Testing

#### Check Token Storage:
1. Login to application
2. Open Developer Tools (F12)
3. Go to Application/Storage tab
4. Check localStorage for 'access_token'
5. Verify JWT token is stored

#### Check Network Requests:
1. Open Developer Tools → Network tab
2. Perform actions (view employees, etc.)
3. Check API requests include `Authorization: Bearer <token>` header
4. Verify responses are 200 OK (not 401)

#### Test Token Expiration:
1. Login to application
2. Wait 30+ minutes (or modify token expiration for testing)
3. Try to perform an action
4. Should automatically redirect to login

### 3. Automated Testing

#### Backend Tests:
```python
def test_login_success():
    response = client.post("/token", data={"username": "admin", "password": "secret"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_failure():
    response = client.post("/token", data={"username": "admin", "password": "wrong"})
    assert response.status_code == 401

def test_protected_endpoint_with_token():
    # Get token first
    login_response = client.post("/token", data={"username": "admin", "password": "secret"})
    token = login_response.json()["access_token"]

    # Use token to access protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/employees", headers=headers)
    assert response.status_code == 200

def test_protected_endpoint_without_token():
    response = client.get("/api/v1/employees")
    assert response.status_code == 401
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "401 Unauthorized" on API Requests
**Symptoms**: All API requests return 401 even after login
**Causes**:
- Token not being sent in requests
- Token expired
- Token malformed
- Backend not validating token correctly

**Solutions**:
```javascript
// Check if token exists
const token = localStorage.getItem('access_token');
console.log('Token:', token);

// Check if token is being sent
// Look in Network tab → Request Headers → Authorization

// Check token expiration
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const currentTime = Date.now() / 1000;
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Current time:', new Date());
  console.log('Token valid:', payload.exp > currentTime);
}
```

#### 2. Login Form Not Working
**Symptoms**: Login button doesn't work or returns errors
**Causes**:
- Backend not running
- CORS issues
- Wrong endpoint URL
- Form data format issues

**Solutions**:
```javascript
// Check if backend is running
fetch('http://localhost:8000/docs')
  .then(response => console.log('Backend status:', response.status))
  .catch(error => console.log('Backend not running:', error));

// Check CORS configuration in backend
// Ensure frontend URL is in allow_origins list

// Verify form data format
const formData = new FormData();
formData.append('username', 'admin');
formData.append('password', 'secret');
console.log('Form data:', Object.fromEntries(formData));
```

#### 3. Automatic Logout Issues
**Symptoms**: Users logged out unexpectedly
**Causes**:
- Token expiration too short
- System clock issues
- Token validation errors

**Solutions**:
```python
# Increase token expiration time
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour instead of 30 minutes

# Check system time synchronization
# Ensure frontend and backend have synchronized clocks

# Add logging to token validation
async def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token payload: {payload}")
        print(f"Current time: {datetime.now(timezone.utc).timestamp()}")
        print(f"Token expires: {payload.get('exp')}")
        # ... rest of validation
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise credentials_exception
```

#### 4. File Preview 401 Errors
**Symptoms**: File previews fail with 401 errors
**Cause**: Direct URL requests (img src, iframe src) don't include auth headers
**Solution**: Use blob URLs with authenticated requests (already implemented)

### Debug Checklist

- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:3000
- [ ] Can access http://localhost:8000/docs (FastAPI docs)
- [ ] Login endpoint returns token: POST /token
- [ ] Token stored in localStorage after login
- [ ] API requests include Authorization header
- [ ] Protected endpoints return 200 with valid token
- [ ] Protected endpoints return 401 without token
- [ ] Automatic logout works on token expiration

## 📚 Additional Resources

### JWT Token Structure
- **Header**: Algorithm and token type
- **Payload**: User claims and expiration
- **Signature**: Verification signature

### OAuth2 Specifications
- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 6750 - OAuth 2.0 Bearer Token Usage](https://tools.ietf.org/html/rfc6750)

### Security Best Practices
- Use HTTPS in production
- Consider httpOnly cookies instead of localStorage
- Implement refresh tokens for longer sessions
- Add rate limiting to login endpoint
- Log authentication events for monitoring

### Production Considerations
- Replace in-memory user database with real database
- Use environment variables for secrets
- Implement user registration and password reset
- Add multi-factor authentication
- Monitor and log security events

---

This OAuth implementation provides enterprise-grade authentication suitable for production use with proper security measures and automatic token management.
