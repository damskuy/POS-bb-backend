# 🚗 POS Bengkel Backend

Backend REST API for a modern Workshop Management System (POS Bengkel) built with **Next.js, Prisma, PostgreSQL, and TypeScript**.

This project provides complete business logic for managing workshop operations, including Work Orders, Inventory, Payments, Invoices, Customer Management, Authentication, Role-Based Authorization, Reporting, and Audit Logging.

---

# ✨ Features

## Authentication

- JWT Authentication
- Login API
- Password Hashing (bcrypt)
- Role-Based Authorization (RBAC)

## Customer Management

- Customer CRUD
- Search
- Filter
- Pagination
- Sorting

## Vehicle Management

- Vehicle CRUD
- Customer Relation

## Mechanic Management

- Mechanic CRUD

## Service Management

- Service CRUD

## Spare Part Management

- Spare Part CRUD
- Stock Management

## Work Order

- Auto Generate Work Order Code
- Add Service
- Add Spare Part
- Automatic Total Calculation
- Status Workflow
- Inventory Integration

## Payment

- Multiple Payment Methods
- Payment Status

## Invoice

- Invoice Generation
- Invoice Number

## Dashboard

- Revenue Summary
- Work Order Summary
- Customer Statistics
- Inventory Statistics

## Reports

- Revenue Report
- Service Report
- Inventory Report

## Audit Log

- Activity Logging

## API

- Swagger Documentation
- Validation (Zod)
- Standard API Response

---

# 🛠 Tech Stack

- Next.js 15
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Zod
- Swagger
- Docker
- Vitest

---

# 📂 Project Structure

```
app/
lib/
prisma/
tests/

Dockerfile
docker-compose.yml
```

---

# 🚀 Installation

Clone repository

```bash
git clone https://github.com/damskuy/POS-bb-backend.git

cd POS-bb-backend
```

Install dependency

```bash
npm install
```

Create environment

```env
DATABASE_URL=

JWT_SECRET=
```

Run migration

```bash
npx prisma migrate dev
```

Seed database

```bash
npx prisma db seed
```

Run development server

```bash
npm run dev
```

---

# 🐳 Docker

Build

```bash
docker compose up --build
```

Stop

```bash
docker compose down
```

---

# 📖 API Documentation

Swagger

```
http://localhost:3000/api/docs
```

---

# 🧪 Testing

Run test

```bash
npm test
```

---

# 🔐 Authentication

Authentication uses JWT.

Protected endpoints require:

```
Authorization: Bearer <token>
```

---

# 📊 Main Modules

- Authentication
- Users
- Customers
- Vehicles
- Mechanics
- Services
- Spare Parts
- Work Orders
- Payments
- Invoices
- Reports
- Dashboard
- Audit Logs

---

# 🔄 Business Flow

```
Customer

↓

Vehicle

↓

Work Order

↓

Add Service

↓

Add Spare Part

↓

Auto Calculate Total

↓

Payment

↓

Invoice
```

---

# 📌 API Features

- CRUD
- Pagination
- Search
- Filter
- Sorting
- Soft Delete
- Validation
- RBAC
- Audit Log

---

# 👨‍💻 Author

Developed by **Baruns**

GitHub

https://github.com/damskuy