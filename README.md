# SWP391_Project
This is SWP391 Project as topic 6: EV Co-ownership and Cost-sharing System

## Project Structure

This project consists of two main parts:

```
SWP391_Project/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── server.js       # Main server file
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   └── models/         # Data models
│   └── package.json
├── frontend/         # React web application
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   ├── components/     # React components
│   │   └── services/       # API service layer
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 14+ and npm installed
- Git installed

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hdphong2k5/SWP391_Project.git
cd SWP391_Project
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

You need to run both the backend and frontend servers simultaneously.

#### Terminal 1 - Start Backend Server:
```bash
cd backend
npm start
# Or for development with auto-reload:
npm run dev
```

The backend API will be available at `http://localhost:5000`

#### Terminal 2 - Start Frontend Server:
```bash
cd frontend
npm start
```

The frontend application will open automatically at `http://localhost:3000`

## Features

### Backend API Endpoints

- `GET /api/health` - Check server status
- `GET /api/evs` - Get all electric vehicles
- `GET /api/evs/:id` - Get a specific EV
- `POST /api/evs` - Create a new EV
- `PUT /api/evs/:id` - Update an EV
- `DELETE /api/evs/:id` - Delete an EV

### Frontend Features

- View all available electric vehicles
- Add new electric vehicles with details
- Delete existing vehicles
- Real-time backend connection status
- Responsive design with card-based layout

## API Communication

The frontend communicates with the backend via RESTful API calls:
- Frontend uses Axios to make HTTP requests
- Backend uses CORS to allow cross-origin requests from the frontend
- API base URL is configurable via environment variables

## Technology Stack

### Backend
- Node.js
- Express.js
- CORS middleware
- Body-parser
- dotenv

### Frontend
- React
- Axios
- JavaScript ES6+

## Development

For development, both servers support hot-reloading:
- Backend: Uses nodemon to restart on file changes
- Frontend: Uses React's built-in development server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
