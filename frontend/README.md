# Frontend - EV Co-ownership System

This is the frontend application for the EV Co-ownership and Cost-sharing System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Features

- View all available electric vehicles
- Add new electric vehicles
- Delete electric vehicles
- Real-time connection status to backend API
- Responsive card-based layout

## Environment Variables

Create a `.env` file in the root directory with:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Requirements

- Backend server must be running on `http://localhost:5000`
- Node.js 14+ installed
