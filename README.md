# Earnings Management Application

A full-stack web application for managing projects, expenses, and profit distribution built with React, Next.js, Node.js, and MongoDB.

## Features

- **User Authentication**: Registration and login system
- **Dashboard**: Overview of earnings, expenses, and key metrics
- **Project Management**: Create and manage projects with gross income tracking
- **Expense Tracking**: Three types of expenses:
  - **Payroll Expenses**: Track employee payments, days worked, and advances
  - **Operating Expenses**: Track utilities, rent, insurance, and other operational costs
  - **Material Expenses**: Track material costs with return/refund tracking
- **Detailed Views**: Separate pages for Roster, Operating Expenses, and Materials with filtering capabilities
- **Real-time Calculations**: Automatic calculation of net profit, profit margin, and expense totals

## Tech Stack

### Frontend
- React 18
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install all dependencies (frontend and backend):**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense-tracking
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

   Create a `.env.local` file in the `frontend` directory (optional):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB:**
   ```bash
   # On Windows (if MongoDB is installed as a service)
   net start MongoDB
   
   # On Linux/Mac
   sudo systemctl start mongod
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

   This will start both the frontend (Next.js) on `http://localhost:3000` and the backend (Express) on `http://localhost:5000`.

### Alternative: Run separately

**Frontend only:**
```bash
cd frontend
npm run dev
```

**Backend only:**
```bash
cd backend
npm run dev
```

## Project Structure

```
Expense-TrackingApplication/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── register/
│   │   ├── roster/
│   │   ├── operating-expenses/
│   │   ├── materials/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ActionButton.tsx
│   │   ├── ProjectModal.tsx
│   │   ├── PayrollModal.tsx
│   │   ├── OperatingModal.tsx
│   │   └── MaterialModal.tsx
│   └── lib/
│       └── api.ts
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Expense.js
│   │   └── Employee.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── expenses.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   └── server.js
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects (authenticated)
- `POST /api/projects` - Create a new project (authenticated)
- `PUT /api/projects/:id` - Update a project (authenticated)
- `DELETE /api/projects/:id` - Delete a project (authenticated)

### Expenses
- `GET /api/expenses` - Get all expenses (authenticated, supports query params: type, projectId)
- `POST /api/expenses` - Create a new expense (authenticated)
- `PUT /api/expenses/:id` - Update an expense (authenticated)
- `DELETE /api/expenses/:id` - Delete an expense (authenticated)

### Users
- `GET /api/users/employees` - Get all employees (authenticated)
- `POST /api/users/employees` - Create a new employee (authenticated)

## Usage

1. **Register/Login**: Start by creating an account or logging in
2. **Create Projects**: Add projects with their gross income
3. **Add Expenses**: Use the dashboard buttons to add different types of expenses
4. **View Details**: Navigate to detailed views for Roster, Operating Expenses, or Materials
5. **Filter & Search**: Use filters and search to find specific expenses

## License

MIT

