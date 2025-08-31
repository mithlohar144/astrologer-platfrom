# Astrologer Consultation Platform - Backend

A complete Node.js backend for an astrologer consultation web platform with JWT authentication, wallet system, session management, and admin dashboard.

## 🚀 Features

### User Features
- **Authentication**: JWT-based registration and login
- **Wallet System**: Razorpay integration + mock topup for development
- **Free Sessions**: First 5-minute call and chat free for new users
- **Billing**: ₹15/min for calls, ₹10/min for chats after free time
- **Appointments**: Book, view, cancel, and rate appointments
- **Session History**: Track all call and chat sessions
- **Transaction History**: Complete wallet transaction logs

### Admin Features
- **Dashboard Analytics**: Revenue, user stats, session metrics
- **User Management**: View, activate/deactivate users
- **Appointment Management**: View and manage all appointments
- **Astrologer Management**: Manage astrologer profiles and availability

### Technical Features
- **Security**: Helmet, CORS, rate limiting, input validation
- **Database**: MongoDB with Mongoose ODM
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Express-validator for input validation
- **Documentation**: Complete API documentation

## 📦 Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=9000
   MONGODB_URI=mongodb://localhost:27017/astrologer-platform
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Razorpay (optional for development)
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   
   # Session Rates
   CALL_RATE=15
   CHAT_RATE=10
   FREE_MINUTES=5
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed Sample Data (Optional)**
   ```bash
   node seeders/sampleData.js
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🛠 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info
- `PUT /profile` - Update user profile

### Wallet Routes (`/api/wallet`)
- `POST /topup` - Add money to wallet (mock/razorpay)
- `POST /create-order` - Create Razorpay order
- `POST /verify-payment` - Verify Razorpay payment
- `GET /balance` - Get wallet balance
- `GET /history/:userId?` - Get transaction history

### Session Routes (`/api/session`)
- `POST /start-call` - Start call session
- `POST /start-chat` - Start chat session
- `POST /end/:sessionId` - End active session
- `GET /active` - Get active sessions
- `GET /history` - Get session history

### Appointment Routes (`/api/appointment`)
- `POST /book` - Book new appointment
- `GET /user/:id?` - Get user appointments
- `GET /astrologer/:id` - Get astrologer appointments (admin)
- `PATCH /update-status` - Update appointment status (admin)
- `DELETE /cancel/:id` - Cancel appointment
- `POST /rate/:id` - Rate completed appointment

### Astrologer Routes (`/api/astrologers`)
- `GET /` - Get all available astrologers
- `GET /:id` - Get astrologer by ID

### Admin Routes (`/api/admin`)
- `GET /summary` - Dashboard summary with analytics
- `GET /users` - Get all users with stats
- `GET /appointments` - Get all appointments
- `GET /astrologers` - Get all astrologers
- `PATCH /users/:id/toggle-status` - Activate/deactivate user
- `GET /analytics/revenue` - Revenue analytics

## 🔐 Authentication

All protected routes require JWT token in header:
```javascript
Authorization: Bearer <token>
// OR
x-auth-token: <token>
```

## 💳 Wallet System

### Free Sessions
- First call: 5 minutes free (one-time per user)
- First chat: 5 minutes free (one-time per user)
- After free time, standard rates apply

### Billing Rates
- **Call**: ₹15 per minute
- **Chat**: ₹10 per minute
- Minimum wallet balance required: 2 minutes worth

### Payment Integration
- **Development**: Mock topup available
- **Production**: Razorpay integration ready

## 📊 Database Models

### User Model
- Personal info, wallet balance, free session flags
- Password hashing with bcrypt
- Admin flag for elevated permissions

### Astrologer Model
- Profile, expertise, languages, availability
- Ratings, earnings, session counts
- Online status and verification

### Appointment Model
- User-astrologer bookings with status tracking
- Duration, mode (call/chat), payment info
- Rating and feedback system

### Session Model
- Active session tracking with billing
- Free vs paid minutes calculation
- Duration and amount tracking

### WalletHistory Model
- Complete transaction log
- Credit/debit with reasons
- Payment gateway integration

## 🚦 Getting Started

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **Test the API**
   ```bash
   curl http://localhost:9000/api/health
   ```

3. **Register a new user**
   ```bash
   curl -X POST http://localhost:9000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123",
       "contact": "9876543210"
     }'
   ```

4. **Login and get token**
   ```bash
   curl -X POST http://localhost:9000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## 🔧 Development

### Sample Login Credentials (after seeding)
- **Admin**: admin@astrologer.com / admin123
- **User**: john@example.com / user123
- **User**: jane@example.com / user123

### Project Structure
```
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   ├── walletController.js
│   ├── sessionController.js
│   ├── appointmentController.js
│   └── adminController.js
├── middlewares/
│   ├── authMiddleware.js
│   └── adminMiddleware.js
├── models/
│   ├── User.js
│   ├── Astrologer.js
│   ├── Appointment.js
│   ├── Session.js
│   └── WalletHistory.js
├── routes/
│   ├── authRoutes.js
│   ├── walletRoutes.js
│   ├── sessionRoutes.js
│   ├── appointmentRoutes.js
│   ├── adminRoutes.js
│   └── astrologerRoutes.js
├── seeders/
│   └── sampleData.js
├── server.js
├── package.json
└── README.md
```

## 🌟 Key Features Implemented

✅ **Complete Authentication System**
✅ **Wallet & Payment Integration**
✅ **Session Management with Billing**
✅ **Appointment Booking System**
✅ **Admin Dashboard & Analytics**
✅ **Free Session Logic**
✅ **Rate Limiting & Security**
✅ **Input Validation**
✅ **Error Handling**
✅ **Sample Data Seeding**

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secret
4. Configure Razorpay keys
5. Set up proper CORS origins
6. Enable SSL/HTTPS
7. Set up monitoring and logging

## 📞 Support

For any issues or questions, please contact the development team or check the API health endpoint at `/api/health`.

---

**Built with ❤️ for Astro Dr. Kanhaiya's Consultation Platform**
