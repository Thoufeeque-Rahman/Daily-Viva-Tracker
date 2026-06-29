# Student Portal - Integration API Documentation

This document describes the student-facing HTTP REST APIs for the **Daily Viva Tracker** application. It serves as an integration guide for external developers building client applications (e.g., student portal frontend, mobile apps) that interact with the student dashboard.

---

## Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication Flow](#authentication-flow)
3. [Error Handling & Status Codes](#error-handling--status-codes)
4. [API Endpoints Summary](#api-endpoints-summary)
5. [Detailed Endpoints Specification](#detailed-endpoints-specification)
   - [Get Colleges List](#get-colleges-list)
   - [Student Login](#student-login)
   - [Student Logout](#student-logout)
   - [Get Student Profile](#get-student-profile)
   - [Get Marks History](#get-marks-history)
   - [Get Subject-wise Metrics](#get-subject-wise-metrics)
   - [Get Unique Subjects List](#get-unique-subjects-list)
   - [Get Class Assignments](#get-class-assignments)
   - [Get Improvements Tasks](#get-improvements-tasks)

---

## Base Configuration

- **Base URL**:
  - **Local Development**: `http://localhost:5000/api/student-portal`
  - **Production Vercel URLs**:
    - `https://daily-viva-tracker-3p9w.vercel.app/api/student-portal`
    - `https://api.dailyviva.darulirfan.co/api/student-portal`
- **Headers**:
  - `Content-Type: application/json`
  - `Cookie: token=<JWT_TOKEN>` (for cookie-based authentication)
  - OR `Authorization: Bearer <JWT_TOKEN>` (for header-based authentication)

---

## Authentication Flow

1. **Credentials**: Students authenticate using their Admission Number (`adNumber`) as **both** the username and the password.
2. **College Scoping**: To log in, the student must also specify their `collegeId` (retrieved using the public `/colleges` endpoint). Since admission numbers are unique only within their respective colleges, this college ID acts as the namespace resolver.
3. **Session Management**: Upon successful login, the server:
   - Sets a secure, HTTP-only cookie named `token` containing a JWT.
   - Returns the JWT as a `token` string in the JSON response body.
   - Developers can use either cookie-based automatic sessions (if configured with CORS `credentials: true`) or include the token in the `Authorization: Bearer <token>` header for subsequent requests.

---

## Error Handling & Status Codes

All error responses return a JSON object with the following shape:
```json
{
  "success": false,
  "error": "Error description message"
}
```

Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (e.g. login session).
- `400 Bad Request`: Missing required fields, invalid types, or credentials mismatch.
- `401 Unauthorized`: Authentication token is missing, invalid, or expired.
- `403 Forbidden`: User has valid token but does not possess the `student` role.
- `404 Not Found`: Student profile or resource not found.
- `500 Internal Server Error`: Server-side errors.

---

## API Endpoints Summary

| Endpoint | Method | Authentication | Purpose |
|---|---|---|---|
| `/colleges` | `GET` | Public | List all active colleges (IDs, names, details) |
| `/login` | `POST` | Public | Authenticate a student and retrieve session token |
| `/logout` | `POST` | Public | Terminate session and clear authentication cookie |
| `/profile` | `GET` | Student JWT | Fetch student's profile and college metadata |
| `/marks` | `GET` | Student JWT | Retrieve daily viva marks (with filters, pagination, and summary statistics) |
| `/marks/subject-wise` | `GET` | Student JWT | Get subject-wise aggregated averages and distribution of grades |
| `/subjects` | `GET` | Student JWT | List unique subjects the student has been evaluated in |
| `/assignments` | `GET` | Student JWT | Get class assignments list populated with the student's marks |
| `/improvements` | `GET` | Student JWT | List improvement tasks assigned to the student |

---

## Detailed Endpoints Specification

### Get Colleges List

Returns names, addresses, and details of all active colleges. Used to display a college selector on the login portal.

- **URL**: `/api/student-portal/colleges`
- **Method**: `GET`
- **Authentication**: None (Public)
- **Response Shape**:
  ```json
  {
    "success": true,
    "count": 1,
    "colleges": [
      {
        "_id": "60f7823abf1d43288c3a105f",
        "name": "Darul Irfan College",
        "address": "Malappuram, Kerala",
        "establishedYear": 2012,
        "website": "https://darulirfan.co"
      }
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/student-portal/colleges
  ```

---

### Student Login

Authenticates the student. Both `username` and `password` must match the student's `adNumber`.

- **URL**: `/api/student-portal/login`
- **Method**: `POST`
- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "username": "1001",
    "password": "1001",
    "collegeId": "60f7823abf1d43288c3a105f"
  }
  ```
- **Response Shape**:
  ```json
  {
    "success": true,
    "message": "Student logged in successfully",
    "student": {
      "_id": "60f782c5bf1d43288c3a1078",
      "name": "Rahul Sharma",
      "fullName": "Rahul Sharma Gupta",
      "rollNumber": 4,
      "adNumber": 1001,
      "class": 10,
      "college": {
        "_id": "60f7823abf1d43288c3a105f",
        "name": "Darul Irfan College",
        "address": "Malappuram, Kerala",
        "website": "https://darulirfan.co"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/student-portal/login \
    -H "Content-Type: application/json" \
    -d '{"username": "1001", "password": "1001", "collegeId": "60f7823abf1d43288c3a105f"}'
  ```

---

### Student Logout

Clears the token cookie and terminates the session context.

- **URL**: `/api/student-portal/logout`
- **Method**: `POST`
- **Authentication**: None (Public)
- **Response Shape**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/student-portal/logout
  ```

---

### Get Student Profile

Retrieves the authenticated student's profile details.

- **URL**: `/api/student-portal/profile`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Response Shape**:
  ```json
  {
    "success": true,
    "student": {
      "_id": "60f782c5bf1d43288c3a1078",
      "name": "Rahul Sharma",
      "fullName": "Rahul Sharma Gupta",
      "rollNumber": 4,
      "adNumber": 1001,
      "class": 10,
      "college": {
        "_id": "60f7823abf1d43288c3a105f",
        "name": "Darul Irfan College",
        "address": "Malappuram, Kerala",
        "phone": "+919876543210",
        "email": "info@darulirfan.co",
        "website": "https://darulirfan.co"
      }
    }
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/student-portal/profile \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Get Marks History

Fetches the student's daily viva records (`DvtMarks`) with filtering, pagination, and overall statistics.

- **URL**: `/api/student-portal/marks`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Query Parameters**:
  - `subject` (string, optional): Filter by subject name (case-insensitive, partial matching, e.g. `subject=Math`).
  - `mark` (number, optional): Filter by mark value (`0` = Poor, `1` = Good, `2` = Great).
  - `startDate` (string, optional): Filter records on or after `YYYY-MM-DD`.
  - `endDate` (string, optional): Filter records on or before `YYYY-MM-DD`.
  - `page` (number, optional): Page number (defaults to `1`).
  - `limit` (number, optional): Records per page (defaults to `20`).
  - `sortBy` (string, optional): Field to sort by (`date` or `mark`. Defaults to `date`).
  - `sortOrder` (string, optional): Sort direction (`asc` or `desc`. Defaults to `desc`).
- **Response Shape**:
  ```json
  {
    "success": true,
    "pagination": {
      "totalRecords": 35,
      "currentPage": 1,
      "totalPages": 2,
      "limit": 20
    },
    "summary": {
      "averageMark": 1.45,
      "totalVivas": 35,
      "distribution": {
        "poor": 3,
        "good": 13,
        "great": 19
      },
      "punishmentsCount": 1
    },
    "marks": [
      {
        "_id": "60f7831abf1d43288c3a10ba",
        "subject": "Mathematics",
        "mark": 2,
        "date": "2026-06-28T04:30:00.000Z",
        "punishment": null,
        "teacherId": "60f781dfbf1d43288c3a102a",
        "createdAt": "2026-06-28T04:30:15.000Z"
      },
      {
        "_id": "60f782f9bf1d43288c3a10b1",
        "subject": "Science",
        "mark": 0,
        "date": "2026-06-27T05:00:00.000Z",
        "punishment": "Write textbook chapter 3 times",
        "teacherId": "60f781dfbf1d43288c3a102b",
        "createdAt": "2026-06-27T05:00:10.000Z"
      }
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET "http://localhost:5000/api/student-portal/marks?subject=Math&mark=2&limit=5" \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Get Subject-wise Metrics

Aggregates evaluations grouped by subjects.

- **URL**: `/api/student-portal/marks/subject-wise`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Query Parameters**:
  - `startDate` (string, optional): Aggregation start date (`YYYY-MM-DD`).
  - `endDate` (string, optional): Aggregation end date (`YYYY-MM-DD`).
- **Response Shape**:
  ```json
  {
    "success": true,
    "count": 2,
    "subjects": [
      {
        "subject": "Mathematics",
        "totalVivas": 18,
        "averageMark": 1.72,
        "distribution": {
          "poor": 0,
          "good": 5,
          "great": 13
        },
        "punishmentsCount": 0,
        "lastEvaluated": "2026-06-28T04:30:00.000Z"
      },
      {
        "subject": "Science",
        "totalVivas": 17,
        "averageMark": 1.18,
        "distribution": {
          "poor": 3,
          "good": 8,
          "great": 6
        },
        "punishmentsCount": 1,
        "lastEvaluated": "2026-06-27T05:00:00.000Z"
      }
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/student-portal/marks/subject-wise \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Get Unique Subjects List

Retrieves the alphabetically sorted names of all subjects in which the student has been evaluated.

- **URL**: `/api/student-portal/subjects`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Response Shape**:
  ```json
  {
    "success": true,
    "count": 2,
    "subjects": [
      "Mathematics",
      "Science"
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/student-portal/subjects \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Get Class Assignments

Retrieves all academic assignments assigned to the student's class, along with the student's grade/score (if evaluated).

- **URL**: `/api/student-portal/assignments`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Response Shape**:
  ```json
  {
    "success": true,
    "count": 2,
    "assignments": [
      {
        "_id": "60f7842cbf1d43288c3a10f0",
        "name": "Linear Equations Assignment",
        "detail": "Solve equations on page 42-45 in notebook",
        "subject": "Mathematics",
        "class": 10,
        "maxMarks": 100,
        "grade": {
          "markObtained": 85,
          "percentage": 85.00,
          "gradedAt": "2026-06-25T11:45:00.000Z"
        },
        "createdAt": "2026-06-22T08:00:00.000Z"
      },
      {
        "_id": "60f7845fbf1d43288c3a1101",
        "name": "Chemistry Lab Report",
        "detail": "Submit findings of acid-base titration",
        "subject": "Science",
        "class": 10,
        "maxMarks": 50,
        "grade": null,
        "createdAt": "2026-06-24T09:15:00.000Z"
      }
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/student-portal/assignments \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Get Improvements Tasks

Fetches tasks assigned to the student to improve their viva scores.

- **URL**: `/api/student-portal/improvements`
- **Method**: `GET`
- **Authentication**: Required (Student JWT)
- **Query Parameters**:
  - `status` (string, optional): Filter by completion status (`given` or `done`).
  - `subject` (string, optional): Filter by subject name (case-insensitive, partial matching).
- **Response Shape**:
  ```json
  {
    "success": true,
    "count": 1,
    "improvements": [
      {
        "_id": "60f785b9bf1d43288c3a112f",
        "subject": "Science",
        "class": 10,
        "description": "Memorize periodic table group 1-4 and re-viva with teacher",
        "dueDate": "2026-07-02T18:30:00.000Z",
        "status": "given",
        "assignedAt": "2026-06-27T05:05:00.000Z",
        "completedAt": null,
        "teacher": {
          "name": "Thomas Alva",
          "email": "thomas@darulirfan.co",
          "phone": "+919988776655"
        }
      }
    ]
  }
  ```
- **Curl Example**:
  ```bash
  curl -X GET "http://localhost:5000/api/student-portal/improvements?status=given" \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

## Testing with Postman

To simplify API exploration and testing, a pre-configured **Postman Collection** is included in the project root:
[Daily_Viva_Tracker_Student_Portal.postman_collection.json](file:///run/media/thoufeeque/Shared%202/Works/Daily-Viva-Tracker/Daily_Viva_Tracker_Student_Portal.postman_collection.json)

### Import & Setup Instructions:
1. **Import the Collection**:
   - Open Postman.
   - Click the **Import** button in the top-left sidebar.
   - Choose or drag-and-drop the `Daily_Viva_Tracker_Student_Portal.postman_collection.json` file.
2. **Explore Folder Tree**:
   - This creates a collection folder named `Daily Viva Tracker - Student Portal`.
   - The requests are organized into logically isolated subfolders: **Colleges**, **Authentication**, **Student Profile**, **Marks & Performance**, and **Assignments & Tasks**.
3. **Configure Environment Variables**:
   - The collection uses a `baseUrl` variable, pre-configured to point to your production Vercel backend (`https://daily-viva-tracker-3p9w.vercel.app/api/student-portal`).
   - If running locally, edit the `baseUrl` variable in the collection configuration to `http://localhost:5000/api/student-portal`.
4. **Run Login first (Automatic Authorization Flow)**:
   - Execute the **Student Login** request first.
   - A Postman Test script inside this request will extract the resulting authentication token and automatically save it as a collection variable (`studentToken`).
   - All subsequent requests are pre-configured to inject this token automatically into their Authorization Headers. You do not need to manually copy-paste authorization tokens.
