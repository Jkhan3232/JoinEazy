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
