# Backend API - EV Co-ownership System

This is the backend API server for the EV Co-ownership and Cost-sharing System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Start the production server:
```bash
npm start
```

## API Endpoints

The server runs on `http://localhost:5000` by default.

### Health Check
- **GET** `/api/health` - Check if server is running

### EV Management
- **GET** `/api/evs` - Get all electric vehicles
- **GET** `/api/evs/:id` - Get a specific EV by ID
- **POST** `/api/evs` - Create a new EV
- **PUT** `/api/evs/:id` - Update an EV
- **DELETE** `/api/evs/:id` - Delete an EV

## Example API Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "model": "Tesla Model 3",
      "type": "Sedan",
      "batteryCapacity": "75 kWh",
      "range": "358 miles",
      "owners": ["John Doe", "Jane Smith"],
      "costPerDay": 50,
      "available": true
    }
  ]
}
```
