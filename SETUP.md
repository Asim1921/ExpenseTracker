# Quick Setup Guide

## Step 1: Install Dependencies

From the root directory, run:
```bash
npm run install:all
```

This will install dependencies for:
- Root project (concurrently for running both servers)
- Frontend (Next.js, React, TypeScript, Tailwind CSS)
- Backend (Express, MongoDB, etc.)

## Step 2: Set Up MongoDB

Make sure MongoDB is running on your system.

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
```

Or use MongoDB Atlas (cloud) and update the connection string in `.env`

## Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracking
JWT_SECRET=your-secret-key-change-this-in-production
```

(Optional) Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 4: Run the Application

From the root directory:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Step 5: Access the Application

1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Create a new account or login
4. Start managing your earnings!

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors in your IDE, they should resolve after installing dependencies. Run:
```bash
cd frontend
npm install
```

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check your `MONGODB_URI` in the `.env` file
- For MongoDB Atlas, use the connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Port Already in Use
If port 3000 or 5000 is already in use:
- Change the port in `frontend/package.json` scripts (for Next.js)
- Change the `PORT` in `backend/.env` (for Express)

