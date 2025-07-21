# Product Sync Application

A full-stack product synchronization application with proper login authentication, dashboard, and line-by-line log history built with React and Node.js.

## Features

### 🔐 Authentication
- **Secure Login & Registration**: JWT-based authentication with bcrypt password hashing
- **Role-based Access**: Admin and user roles with appropriate permissions
- **Session Management**: Automatic token validation and refresh

### 📊 Dashboard
- **Real-time Statistics**: Product counts, sync activity, and performance metrics
- **Visual Analytics**: Charts and graphs showing sync trends and success rates
- **Activity Monitoring**: Live feed of recent system activities

### 📦 Product Management
- **CRUD Operations**: Create, read, update, and delete products
- **Advanced Filtering**: Search by name, SKU, category, status, and vendor
- **Bulk Sync**: Import multiple products from various sources (API, CSV, XML)
- **Data Grid**: Paginated table with sorting and filtering capabilities

### 📝 Log History
- **Line-by-Line Tracking**: Detailed logs of every operation and sync activity
- **Advanced Filtering**: Filter by timestamp, level, operation, entity type, and user
- **Export Functionality**: Download logs in CSV format
- **Detailed View**: Drill down into individual log entries with metadata

### 🎨 Modern UI/UX
- **Material-UI Design**: Beautiful and responsive user interface
- **Gradient Themes**: Modern gradient backgrounds and button styles
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live data updates without page refresh

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate Limiting** for API protection

### Frontend
- **React** with TypeScript
- **Material-UI (MUI)** for UI components
- **MUI X Data Grid** for advanced table functionality
- **Axios** for HTTP requests
- **React Context** for state management
- **Date-fns** for date formatting

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product-sync-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   **Backend (`backend/.env`)**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/product_sync
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

   **Frontend (`frontend/.env`)**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   GENERATE_SOURCEMAP=false
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   # From the root directory, start both backend and frontend
   npm run dev

   # Or start them separately:
   # Backend
   npm run server

   # Frontend (in another terminal)
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get products with pagination and filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/sync` - Bulk sync products
- `GET /api/products/categories/list` - Get all categories
- `GET /api/products/vendors/list` - Get all vendors

### Logs
- `GET /api/logs` - Get logs with pagination and filtering
- `GET /api/logs/:id` - Get single log entry
- `GET /api/logs/stats/overview` - Get log statistics
- `GET /api/logs/stats/timeline` - Get timeline data
- `GET /api/logs/user/:userId` - Get user-specific logs
- `GET /api/logs/export/csv` - Export logs as CSV
- `DELETE /api/logs/cleanup` - Clean old logs (admin only)

## Usage Examples

### Creating a Product
```javascript
const productData = {
  name: "Sample Product",
  sku: "SKU-001",
  description: "A sample product for testing",
  price: 99.99,
  category: "Electronics",
  stock: 100,
  status: "active",
  vendor: "Sample Vendor"
};
```

### Bulk Product Sync
```javascript
const products = [
  {
    name: "Product 1",
    sku: "SKU-001",
    price: 29.99,
    category: "Category A",
    stock: 50
  },
  // ... more products
];

// Sync products
await apiService.syncProducts(products, 'api');
```

### Filtering Logs
```javascript
const filters = {
  level: 'error',
  operation: 'sync',
  startDate: '2023-01-01',
  endDate: '2023-12-31'
};
```

## Development

### Project Structure
```
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── public/          # Public assets
└── package.json         # Root package.json
```

### Database Schema

#### User Schema
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String (admin|user),
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

#### Product Schema
```javascript
{
  name: String,
  sku: String (unique),
  description: String,
  price: Number,
  category: String,
  stock: Number,
  status: String (active|inactive|discontinued),
  images: [{ url: String, alt: String }],
  tags: [String],
  vendor: String,
  lastSyncedAt: Date,
  syncSource: String (manual|api|csv|xml),
  syncStatus: String (pending|synced|error),
  syncErrors: [{ field: String, message: String, timestamp: Date }],
  timestamps: true
}
```

#### SyncLog Schema
```javascript
{
  operation: String,
  entityType: String,
  entityId: ObjectId,
  message: String,
  details: Mixed,
  userId: ObjectId,
  username: String,
  level: String (info|warning|error|success),
  source: String (api|web|system|sync),
  ipAddress: String,
  userAgent: String,
  duration: Number,
  status: String (success|failed|pending),
  metadata: Mixed,
  timestamps: true
}
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Proper cross-origin request handling
- **Helmet Security**: Security headers for Express
- **Environment Variables**: Sensitive data protection

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Server-side pagination for large datasets
- **Lazy Loading**: Components loaded on demand
- **Caching**: Local storage for user session data
- **Code Splitting**: Optimized bundle sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.