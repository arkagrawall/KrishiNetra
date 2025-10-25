# AgriSure+ API Architecture

## Overview
The AgriSure+ platform uses a three-tier architecture with a Supabase backend, Hono web server, and React frontend.

```
Frontend (React) → Server (Hono/Deno) → Database (Supabase KV Store) → External APIs
```

## Base URL
```
https://[projectId].supabase.co/functions/v1/make-server-37861144
```

## Authentication
All API requests require an Authorization header:
```
Authorization: Bearer [publicAnonKey]
```

---

## API Endpoints

### 🔐 Authentication

#### POST `/auth/signup`
Register a new farmer user

**Request:**
```json
{
  "name": "Rajesh Kumar",
  "phone": "+919876543210",
  "email": "rajesh@email.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890",
    "name": "Rajesh Kumar",
    "phone": "+919876543210",
    "email": "rajesh@email.com",
    "farmerId": "AGR2024-1543",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "User registered successfully"
}
```

#### POST `/auth/login`
Login existing user

**Request:**
```json
{
  "phone": "+919876543210",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "token": "token_1234567890_+919876543210",
  "message": "Login successful"
}
```

---

### 🌾 IoT Sensors

#### GET `/sensors/:userId`
Get all IoT sensors for a user

**Response:**
```json
{
  "success": true,
  "sensors": [
    {
      "id": "SNS-001",
      "name": "Soil Moisture Sensor A",
      "type": "Moisture",
      "location": "Field A",
      "status": "connected",
      "addedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/sensors`
Add a new IoT sensor

**Request:**
```json
{
  "userId": "user_123456",
  "name": "Temperature Sensor B",
  "type": "temperature",
  "location": "Field B"
}
```

#### DELETE `/sensors/:userId/:sensorId`
Remove an IoT sensor

---

### 📊 Crop Vitals

#### GET `/vitals/:userId`
Get real-time crop vitals and historical data

**Response:**
```json
{
  "success": true,
  "vitals": {
    "moisture": 48,
    "temperature": 30,
    "humidity": 72,
    "rainfall": 12,
    "cropStatus": "Healthy",
    "lastUpdated": "2025-01-01T00:00:00.000Z",
    "history": {
      "moisture": [
        { "day": 1, "value": 45.2 },
        { "day": 2, "value": 47.8 }
      ]
    }
  }
}
```

#### POST `/vitals/:userId`
Update vitals (typically called by IoT sensors)

---

### 💰 Market Prices (Government API Integration)

#### GET `/market/prices`
Get commodity market prices with optional filters

**Query Parameters:**
- `state` (optional): State name (e.g., "Andhra Pradesh")
- `district` (optional): District name (e.g., "Chittor")
- `market` (optional): Market/Mandi name (e.g., "Madanapalli")
- `commodity` (optional): Commodity name (e.g., "Tomato", "Wheat")
- `date` (optional): Arrival date in DD/MM/YYYY format

**Example:**
```
GET /market/prices?state=Andhra Pradesh&commodity=Tomato
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "state": "Andhra Pradesh",
      "district": "Chittor",
      "market": "Madanapalli",
      "commodity": "Tomato",
      "variety": "Local",
      "grade": "FAQ",
      "arrival_date": "21/10/2025",
      "min_price": "2300",
      "max_price": "3000",
      "modal_price": "2700"
    }
  ],
  "total": 50,
  "message": "Market prices fetched successfully"
}
```

**Data Source:** Government of India Open Data API
- API Endpoint: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
- API Key: Configured in server

#### GET `/market/states`
Get list of all available states with market data

**Response:**
```json
{
  "success": true,
  "states": [
    "Andhra Pradesh",
    "Karnataka",
    "Maharashtra",
    ...
  ]
}
```

---

### 🚨 Alerts & Recommendations

#### GET `/alerts/:userId`
Get all active alerts for a user

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "alert_123456",
      "type": "weather",
      "severity": "critical",
      "title": "Frost Warning Tonight",
      "description": "Temperature will drop to 3°C...",
      "action": "Take immediate action",
      "time": "2025-01-01T00:00:00.000Z",
      "dismissed": false
    }
  ]
}
```

#### POST `/alerts`
Create a new alert

**Request:**
```json
{
  "userId": "user_123456",
  "type": "irrigation",
  "severity": "attention",
  "title": "Irrigation Recommended",
  "description": "Soil moisture at 42%...",
  "action": "Schedule irrigation"
}
```

#### DELETE `/alerts/:userId/:alertId`
Dismiss an alert

---

### 🛡️ Insurance Claims

#### GET `/claims/:userId`
Get all insurance claims for a user

**Response:**
```json
{
  "success": true,
  "claims": [
    {
      "id": "CLM2024-001",
      "crop": "Wheat - Field A",
      "event": "Frost Damage",
      "status": "completed",
      "amount": 45000,
      "date": "2025-01-15T00:00:00.000Z",
      "progress": 100,
      "hasProof": true
    }
  ]
}
```

#### POST `/claims`
File a new insurance claim

**Request:**
```json
{
  "userId": "user_123456",
  "crop": "Cotton - Field B",
  "event": "Pest Infestation",
  "amount": 32000,
  "description": "Severe aphid damage affecting 60% of crop"
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "id": "CLM2024-002",
    "crop": "Cotton - Field B",
    "event": "Pest Infestation",
    "status": "verified",
    "amount": 32000,
    "progress": 30,
    "hasProof": true
  },
  "message": "Claim filed successfully"
}
```

#### PUT `/claims/:userId/:claimId`
Update claim status (for admin/system updates)

**Request:**
```json
{
  "status": "in-progress",
  "progress": 65
}
```

---

### 💬 AI Chatbot

#### POST `/chat`
Send a message to the AI assistant

**Request:**
```json
{
  "userId": "user_123456",
  "message": "Should I irrigate today?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on current soil moisture at 48%, you don't need to irrigate today..."
}
```

**Supported Topics:**
- Irrigation advice
- Market prices and forecasts
- Pest control recommendations
- Weather updates
- Fertilizer guidance
- Insurance claims

#### GET `/chat/:userId`
Get chat history for a user

---

### 🌤️ Weather Forecast

#### GET `/weather/:location`
Get weather forecast for a location

**Example:**
```
GET /weather/Kota
```

**Response:**
```json
{
  "success": true,
  "weather": {
    "location": "Kota",
    "current": {
      "temp": 30,
      "humidity": 72,
      "condition": "Partly Cloudy"
    },
    "forecast": [
      {
        "day": "Today",
        "temp": 30,
        "condition": "Partly Cloudy",
        "rain": 10
      }
    ],
    "alerts": [
      {
        "type": "frost",
        "severity": "critical",
        "message": "Frost warning for tonight..."
      }
    ]
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "details": "Additional error context"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

---

## Data Storage

The platform uses Supabase's Key-Value store with the following prefixes:

- `user:{phone}` - User profile data
- `userId:{userId}` - Phone lookup by user ID
- `sensor:{userId}:{sensorId}` - IoT sensor information
- `vitals:{userId}` - Current crop vitals and history
- `alert:{userId}:{alertId}` - User alerts
- `claim:{userId}:{claimId}` - Insurance claims
- `chat:{userId}:{chatId}` - Chat history

---

## External API Integration

### Government of India Market Data API

**Endpoint:** `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`

**Features:**
- Real-time commodity prices from mandis across India
- Historical price data
- Support for filtering by state, district, market, commodity
- Updated daily

**Data Fields:**
- State, District, Market
- Commodity, Variety, Grade
- Arrival Date
- Min Price, Max Price, Modal Price

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Implement rate limiting based on user ID
- Cache market data for 1 hour
- Implement request throttling for external API calls

---

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live vitals
2. **Batch Operations**: Bulk sensor management
3. **Advanced Analytics**: Crop yield predictions
4. **Image Upload**: Support for claim proof images
5. **Multi-language**: i18n support for responses
6. **Notifications**: Push notification integration
7. **Payment Gateway**: For insurance premium payments

---

## Frontend API Client

All API calls are handled through utility functions in `/utils/api.ts`:

```typescript
import { marketApi, authApi, claimsApi } from '../utils/api';

// Example usage:
const response = await marketApi.getPrices({
  state: 'Andhra Pradesh',
  commodity: 'Tomato'
});

if (response.success) {
  console.log(response.data);
}
```

---

## Testing

### Health Check
```bash
curl https://[projectId].supabase.co/functions/v1/make-server-37861144/health
```

### Test Market API
```bash
curl -H "Authorization: Bearer [token]" \
  "https://[projectId].supabase.co/functions/v1/make-server-37861144/market/prices?commodity=Tomato"
```

---

## Support

For API issues or questions:
1. Check the error response message
2. Verify Authorization header is included
3. Review API documentation
4. Check server logs in Supabase dashboard
