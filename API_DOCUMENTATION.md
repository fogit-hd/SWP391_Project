# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### Health Check

#### GET /health
Check if the backend server is running.

**Response:**
```json
{
  "status": "OK",
  "message": "Backend server is running"
}
```

---

### Electric Vehicles (EVs)

#### GET /evs
Get all electric vehicles.

**Response:**
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

#### GET /evs/:id
Get a specific electric vehicle by ID.

**Parameters:**
- `id` (path) - The ID of the EV

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "model": "Tesla Model 3",
    "type": "Sedan",
    "batteryCapacity": "75 kWh",
    "range": "358 miles",
    "owners": ["John Doe", "Jane Smith"],
    "costPerDay": 50,
    "available": true
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "EV not found"
}
```

#### POST /evs
Create a new electric vehicle.

**Request Body:**
```json
{
  "model": "Tesla Model S",
  "type": "Sedan",
  "batteryCapacity": "100 kWh",
  "range": "405 miles",
  "owners": ["Alice Smith"],
  "costPerDay": 75,
  "available": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "model": "Tesla Model S",
    "type": "Sedan",
    "batteryCapacity": "100 kWh",
    "range": "405 miles",
    "owners": ["Alice Smith"],
    "costPerDay": 75,
    "available": true
  }
}
```

#### PUT /evs/:id
Update an existing electric vehicle.

**Parameters:**
- `id` (path) - The ID of the EV to update

**Request Body:**
```json
{
  "costPerDay": 80,
  "available": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "model": "Tesla Model 3",
    "type": "Sedan",
    "batteryCapacity": "75 kWh",
    "range": "358 miles",
    "owners": ["John Doe", "Jane Smith"],
    "costPerDay": 80,
    "available": false
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "EV not found"
}
```

#### DELETE /evs/:id
Delete an electric vehicle.

**Parameters:**
- `id` (path) - The ID of the EV to delete

**Response:**
```json
{
  "success": true,
  "message": "EV deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "EV not found"
}
```

## Error Responses

All endpoints may return a 500 error in case of server issues:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## CORS

CORS is enabled for all origins in development. The backend accepts requests from any origin.

## Testing with cURL

### Get all EVs:
```bash
curl http://localhost:5000/api/evs
```

### Get specific EV:
```bash
curl http://localhost:5000/api/evs/1
```

### Create new EV:
```bash
curl -X POST http://localhost:5000/api/evs \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Tesla Model S",
    "type": "Sedan",
    "batteryCapacity": "100 kWh",
    "range": "405 miles",
    "owners": ["Alice Smith"],
    "costPerDay": 75,
    "available": true
  }'
```

### Update EV:
```bash
curl -X PUT http://localhost:5000/api/evs/1 \
  -H "Content-Type: application/json" \
  -d '{
    "costPerDay": 80,
    "available": false
  }'
```

### Delete EV:
```bash
curl -X DELETE http://localhost:5000/api/evs/1
```
