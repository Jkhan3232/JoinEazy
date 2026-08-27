# Joineazy - Student, Group & Assignment Management System

A role-based full-stack web application designed to help students collaborate in groups, manage assignments, and confirm submissions, while admins track progress, assign work, and monitor performance analytics.

## Project Overview

Joineazy is a full-stack internship assignment that implements a student and admin workflow for collaborative learning and assignment management.

### Core goals

- Students can create groups and manage group members
- Students can view assignments and access OneDrive submission links
- Students can confirm assignment submission after uploading work externally
- Admins can create and manage assignments
- Admins can assign tasks to all groups or selected groups
- Admins can monitor completion and group performance through dashboards

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs

### Tools

- Docker
- Docker Compose
- Nodemon
- Vitest

## Features

## Round 2 Enhancements

This iteration enhances the submitted Task 1 prototype without replacing its working flows.

- Assignment editor now captures `GROUP` or `INDIVIDUAL` submission type.
- Group submission acknowledgment is restricted to the group creator on the backend.
- Assignment allocation creates mapping and pending submission records in one transaction.
- Student assignment views expose submission type and progress feedback.
- Backend emits structured JSON logs for requests, startup, database failures, and authorization failures.
- Production startup rejects a missing `JWT_SECRET`.

Round 2 now includes Course, StudentCourse enrollment, course-linked assignments, and optional
per-student submission ownership. Legacy group assignments and `CONFIRMED` records remain readable
for backward compatibility. New submission progress uses `PENDING`, `SUBMITTED`, and
`ACKNOWLEDGED` states.

### Student Features

- Register account
- Login with JWT
- Create group
- Add or remove group members
- View assignments
- Open submission links
- Confirm assignment submission
- Track personal/group progress

### Admin Features

- Login with admin role
- Create assignments
- Update assignments
- View assignments
- Assign assignment to all groups or selected groups
- Track submission completion
- View analytics and dashboard metrics

## Architecture

### Frontend

The frontend is built with React and Tailwind CSS. It provides:

- login/signup pages
- student dashboard
- admin dashboard
- group management views
- assignment viewing and submission confirmation

### Backend

The backend is built with Express.js and Prisma. It provides:

- authentication APIs
- group APIs
- assignment APIs
- dashboard analytics APIs
- protected JWT-based routes

### Database

The database is PostgreSQL with Prisma ORM. It contains:

- Users
- Courses
- Student course enrollments
- Groups
- Group members
- Assignments
- Assignment group mappings
- Submissions

## Database Schema

### Entities

- User
- Group
- GroupMember
- Assignment
- AssignmentGroup
- Submission

### Relationship Summary

- A user can create many groups
- A group can have many members
- An admin can create many assignments
- An assignment can be assigned to many groups
- Each group can submit multiple assignments
- A submission can be pending or confirmed
- Individual assignments have one submission record per student
- Group assignments have one submission record per group

## Logging

Backend logs are JSON objects containing a timestamp, level, message, and safe request metadata.
Authorization failures and unexpected errors are logged centrally. Passwords, JWTs, authorization
headers, and database credentials are never logged.

## Round 2 Migration

Run the migration from the backend directory without resetting the database:

```bash
npm run prisma:generate
npm run prisma:deploy
```

The migration adds `AssignmentType` and defaults existing assignments to `GROUP`.

## Demo Seed Data

The development seed creates an admin account shown as the professor (`admin@joineazy.test` /
`Admin@123`), four students (`student1@joineazy.test` through `student4@joineazy.test` /
`Student@123`), two courses, multi-course enrollments, a group assignment, and an individual
assignment. Run `npm run seed` only against a disposable development database because the current
seed intentionally clears existing development records before recreating the demo dataset.

## Project Structure

```bash
JoinEazy/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env
│   ├── app.js
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
├── README.md
└── .gitignore
```
