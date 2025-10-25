import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-37861144/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ENDPOINTS ====================

// User registration
app.post("/make-server-37861144/auth/signup", async (c) => {
  try {
    const { name, phone, email, password } = await c.req.json();
    
    if (!name || !phone || !password) {
      return c.json({ error: "Name, phone, and password are required" }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:${phone}`);
    if (existingUser) {
      return c.json({ error: "User already exists with this phone number" }, 409);
    }

    // Create user
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      name,
      phone,
      email: email || "",
      createdAt: new Date().toISOString(),
      farmerId: `AGR2024-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    await kv.set(`user:${phone}`, user);
    await kv.set(`userId:${userId}`, phone);

    return c.json({ 
      success: true, 
      user: { ...user, password: undefined },
      message: "User registered successfully" 
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Failed to register user" }, 500);
  }
});

// User login
app.post("/make-server-37861144/auth/login", async (c) => {
  try {
    const { phone, password } = await c.req.json();
    
    if (!phone || !password) {
      return c.json({ error: "Phone and password are required" }, 400);
    }

    const user = await kv.get(`user:${phone}`);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    return c.json({ 
      success: true, 
      user,
      token: `token_${Date.now()}_${phone}`,
      message: "Login successful" 
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Failed to login" }, 500);
  }
});

// ==================== IOT SENSOR ENDPOINTS ====================

// Get all sensors for a user
app.get("/make-server-37861144/sensors/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const sensors = await kv.getByPrefix(`sensor:${userId}:`);
    
    return c.json({ 
      success: true, 
      sensors: sensors || [] 
    });
  } catch (error) {
    console.error("Get sensors error:", error);
    return c.json({ error: "Failed to fetch sensors" }, 500);
  }
});

// Add a new sensor
app.post("/make-server-37861144/sensors", async (c) => {
  try {
    const { userId, name, type, location } = await c.req.json();
    
    const sensorId = `SNS-${String(Date.now()).slice(-6)}`;
    const sensor = {
      id: sensorId,
      name,
      type,
      location,
      status: "connected",
      addedAt: new Date().toISOString(),
    };

    await kv.set(`sensor:${userId}:${sensorId}`, sensor);
    
    return c.json({ success: true, sensor });
  } catch (error) {
    console.error("Add sensor error:", error);
    return c.json({ error: "Failed to add sensor" }, 500);
  }
});

// Remove a sensor
app.delete("/make-server-37861144/sensors/:userId/:sensorId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const sensorId = c.req.param("sensorId");
    
    await kv.del(`sensor:${userId}:${sensorId}`);
    
    return c.json({ success: true, message: "Sensor removed" });
  } catch (error) {
    console.error("Remove sensor error:", error);
    return c.json({ error: "Failed to remove sensor" }, 500);
  }
});

// ==================== CROP VITALS ENDPOINTS ====================

// Get live vitals for a user
app.get("/make-server-37861144/vitals/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const vitals = await kv.get(`vitals:${userId}`);
    
    // If no vitals exist, return mock data
    if (!vitals) {
      const mockVitals = {
        moisture: 48,
        temperature: 30,
        humidity: 72,
        rainfall: 12,
        cropStatus: "Healthy",
        lastUpdated: new Date().toISOString(),
        history: {
          moisture: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            value: 45 + Math.random() * 10,
          })),
          temperature: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            value: 28 + Math.random() * 4,
          })),
          humidity: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            value: 65 + Math.random() * 10,
          })),
          rainfall: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            value: 5 + Math.random() * 15,
          })),
        },
      };
      
      return c.json({ success: true, vitals: mockVitals });
    }
    
    return c.json({ success: true, vitals });
  } catch (error) {
    console.error("Get vitals error:", error);
    return c.json({ error: "Failed to fetch vitals" }, 500);
  }
});

// Update vitals (from IoT sensors)
app.post("/make-server-37861144/vitals/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const vitals = await c.req.json();
    
    await kv.set(`vitals:${userId}`, {
      ...vitals,
      lastUpdated: new Date().toISOString(),
    });
    
    return c.json({ success: true, message: "Vitals updated" });
  } catch (error) {
    console.error("Update vitals error:", error);
    return c.json({ error: "Failed to update vitals" }, 500);
  }
});

// ==================== MARKET PRICES ENDPOINTS ====================

// Proxy to Government API for commodity prices
app.get("/make-server-37861144/market/prices", async (c) => {
  try {
    const url = new URL(c.req.url);
    const state = url.searchParams.get("state");
    const district = url.searchParams.get("district");
    const market = url.searchParams.get("market");
    const commodity = url.searchParams.get("commodity");
    const date = url.searchParams.get("date");
    
    // Build API URL for data.gov.in
    const apiUrl = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    apiUrl.searchParams.append("api-key", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b");
    apiUrl.searchParams.append("format", "json");
    apiUrl.searchParams.append("limit", "50");
    
    if (state) apiUrl.searchParams.append("filters[state]", state);
    if (district) apiUrl.searchParams.append("filters[district]", district);
    if (market) apiUrl.searchParams.append("filters[market]", market);
    if (commodity) apiUrl.searchParams.append("filters[commodity]", commodity);
    if (date) apiUrl.searchParams.append("filters[arrival_date]", date);
    
    console.log("Fetching from API:", apiUrl.toString());
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return c.json({ 
      success: true, 
      data: data.records || [],
      total: data.total || 0,
      message: "Market prices fetched successfully" 
    });
  } catch (error) {
    console.error("Market prices error:", error);
    return c.json({ 
      error: "Failed to fetch market prices",
      details: error.message 
    }, 500);
  }
});

// Get unique states from market data
app.get("/make-server-37861144/market/states", async (c) => {
  try {
    const apiUrl = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    apiUrl.searchParams.append("api-key", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b");
    apiUrl.searchParams.append("format", "json");
    apiUrl.searchParams.append("limit", "1000");
    
    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    
    const states = [...new Set((data.records || []).map((r: any) => r.state))].filter(Boolean);
    
    return c.json({ success: true, states: states.sort() });
  } catch (error) {
    console.error("Get states error:", error);
    return c.json({ error: "Failed to fetch states" }, 500);
  }
});

// ==================== ALERTS ENDPOINTS ====================

// Get alerts for a user
app.get("/make-server-37861144/alerts/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const alerts = await kv.getByPrefix(`alert:${userId}:`);
    
    return c.json({ 
      success: true, 
      alerts: alerts || [] 
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    return c.json({ error: "Failed to fetch alerts" }, 500);
  }
});

// Create a new alert
app.post("/make-server-37861144/alerts", async (c) => {
  try {
    const { userId, type, severity, title, description, action } = await c.req.json();
    
    const alertId = `alert_${Date.now()}`;
    const alert = {
      id: alertId,
      type,
      severity,
      title,
      description,
      action,
      time: new Date().toISOString(),
      dismissed: false,
    };

    await kv.set(`alert:${userId}:${alertId}`, alert);
    
    return c.json({ success: true, alert });
  } catch (error) {
    console.error("Create alert error:", error);
    return c.json({ error: "Failed to create alert" }, 500);
  }
});

// Dismiss an alert
app.delete("/make-server-37861144/alerts/:userId/:alertId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const alertId = c.req.param("alertId");
    
    await kv.del(`alert:${userId}:${alertId}`);
    
    return c.json({ success: true, message: "Alert dismissed" });
  } catch (error) {
    console.error("Dismiss alert error:", error);
    return c.json({ error: "Failed to dismiss alert" }, 500);
  }
});

// ==================== CLAIMS ENDPOINTS ====================

// Get claims for a user
app.get("/make-server-37861144/claims/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const claims = await kv.getByPrefix(`claim:${userId}:`);
    
    return c.json({ 
      success: true, 
      claims: claims || [] 
    });
  } catch (error) {
    console.error("Get claims error:", error);
    return c.json({ error: "Failed to fetch claims" }, 500);
  }
});

// File a new claim
app.post("/make-server-37861144/claims", async (c) => {
  try {
    const { userId, crop, event, amount, description } = await c.req.json();
    
    const claimId = `CLM${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const claim = {
      id: claimId,
      crop,
      event,
      status: "verified",
      amount,
      description,
      date: new Date().toISOString(),
      progress: 30,
      hasProof: true,
    };

    await kv.set(`claim:${userId}:${claimId}`, claim);
    
    return c.json({ success: true, claim, message: "Claim filed successfully" });
  } catch (error) {
    console.error("File claim error:", error);
    return c.json({ error: "Failed to file claim" }, 500);
  }
});

// Update claim status
app.put("/make-server-37861144/claims/:userId/:claimId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const claimId = c.req.param("claimId");
    const updates = await c.req.json();
    
    const claim = await kv.get(`claim:${userId}:${claimId}`);
    if (!claim) {
      return c.json({ error: "Claim not found" }, 404);
    }
    
    const updatedClaim = { ...claim, ...updates };
    await kv.set(`claim:${userId}:${claimId}`, updatedClaim);
    
    return c.json({ success: true, claim: updatedClaim });
  } catch (error) {
    console.error("Update claim error:", error);
    return c.json({ error: "Failed to update claim" }, 500);
  }
});

// ==================== CHATBOT ENDPOINTS ====================

// Send message to chatbot
app.post("/make-server-37861144/chat", async (c) => {
  try {
    const { userId, message } = await c.req.json();
    
    // Simple rule-based responses
    const lowerMessage = message.toLowerCase();
    let response = "";
    
    if (lowerMessage.includes("irrigate") || lowerMessage.includes("water")) {
      response = "Based on current soil moisture at 48%, you don't need to irrigate today. However, if it doesn't rain in the next 2 days, consider irrigating Field B. Current forecast shows no rain expected.";
    } else if (lowerMessage.includes("price") || lowerMessage.includes("wheat") || lowerMessage.includes("market")) {
      response = "Wheat prices are currently ₹2,450/quintal at Kota Mandi, up 5.2% from last week. The 3-day forecast shows stable prices with a slight upward trend. Good time to sell if you're ready!";
    } else if (lowerMessage.includes("aphid") || lowerMessage.includes("pest")) {
      response = "For aphid infestation: 1) Mix 5ml neem oil per liter of water, 2) Spray early morning or evening, 3) Repeat after 7 days. Monitor daily and avoid chemical pesticides during flowering.";
    } else if (lowerMessage.includes("weather") || lowerMessage.includes("forecast")) {
      response = "Weather forecast for this week: Mon-Wed: Partly cloudy, 28-32°C. Thu-Fri: 60% chance of rain, 45mm expected. Weekend: Clear skies. Frost warning for Friday night - protect sensitive crops!";
    } else if (lowerMessage.includes("fertilizer") || lowerMessage.includes("npk")) {
      response = "For optimal growth, apply NPK fertilizer (19:19:19) at 50kg per acre. Best time is early morning. Ensure soil moisture is adequate. Space applications 15 days apart for best results.";
    } else if (lowerMessage.includes("claim") || lowerMessage.includes("insurance")) {
      response = "To file an insurance claim: 1) Go to Claims tab, 2) Click 'File New Claim', 3) Upload IoT sensor data as proof, 4) Submit for verification. Average processing time is 7-10 days.";
    } else {
      response = "I understand you're asking about farming. Could you be more specific? I can help with irrigation advice, pest control, market prices, weather updates, fertilizer recommendations, and insurance claims.";
    }
    
    // Save conversation
    const chatId = `chat_${Date.now()}`;
    await kv.set(`chat:${userId}:${chatId}`, {
      userMessage: message,
      botResponse: response,
      timestamp: new Date().toISOString(),
    });
    
    return c.json({ success: true, response });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Failed to process message" }, 500);
  }
});

// Get chat history
app.get("/make-server-37861144/chat/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const chats = await kv.getByPrefix(`chat:${userId}:`);
    
    return c.json({ success: true, chats: chats || [] });
  } catch (error) {
    console.error("Get chat history error:", error);
    return c.json({ error: "Failed to fetch chat history" }, 500);
  }
});

// ==================== WEATHER ENDPOINTS ====================

// Get weather forecast
app.get("/make-server-37861144/weather/:location", async (c) => {
  try {
    const location = c.req.param("location");
    
    // Mock weather data (in production, integrate with weather API)
    const weather = {
      location,
      current: {
        temp: 30,
        humidity: 72,
        condition: "Partly Cloudy",
      },
      forecast: [
        { day: "Today", temp: 30, condition: "Partly Cloudy", rain: 10 },
        { day: "Tomorrow", temp: 28, condition: "Cloudy", rain: 40 },
        { day: "Day 3", temp: 26, condition: "Rainy", rain: 80 },
        { day: "Day 4", temp: 29, condition: "Clear", rain: 5 },
        { day: "Day 5", temp: 31, condition: "Sunny", rain: 0 },
      ],
      alerts: [
        {
          type: "frost",
          severity: "critical",
          message: "Frost warning for tonight. Temperature may drop to 3°C.",
        },
      ],
    };
    
    return c.json({ success: true, weather });
  } catch (error) {
    console.error("Weather error:", error);
    return c.json({ error: "Failed to fetch weather" }, 500);
  }
});

Deno.serve(app.fetch);
