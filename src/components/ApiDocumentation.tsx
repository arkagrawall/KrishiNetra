import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function ApiDocumentation() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">AgriSure+ API Documentation</h1>
        <p className="text-muted-foreground">
          Complete API reference for the AgriSure+ platform
        </p>
      </div>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>

        {/* AUTH ENDPOINTS */}
        <TabsContent value="auth" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge>POST</Badge>
              <code className="text-sm">/auth/signup</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Register a new farmer user
            </p>
            <div className="space-y-2">
              <p className="text-sm">Request Body:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "name": "Rajesh Kumar",
  "phone": "+919876543210",
  "email": "rajesh@email.com",
  "password": "securepassword"
}`}
              </pre>
              <p className="text-sm mt-4">Response:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "success": true,
  "user": {
    "id": "user_123456",
    "name": "Rajesh Kumar",
    "phone": "+919876543210",
    "farmerId": "AGR2024-1543"
  }
}`}
              </pre>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge>POST</Badge>
              <code className="text-sm">/auth/login</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Login existing user
            </p>
            <div className="space-y-2">
              <p className="text-sm">Request Body:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "phone": "+919876543210",
  "password": "securepassword"
}`}
              </pre>
            </div>
          </Card>
        </TabsContent>

        {/* SENSORS ENDPOINTS */}
        <TabsContent value="sensors" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm">/sensors/:userId</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get all IoT sensors for a user
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge>POST</Badge>
              <code className="text-sm">/sensors</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Add a new IoT sensor
            </p>
            <div className="space-y-2">
              <p className="text-sm">Request Body:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "userId": "user_123456",
  "name": "Soil Moisture Sensor A",
  "type": "moisture",
  "location": "Field A"
}`}
              </pre>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="destructive">DELETE</Badge>
              <code className="text-sm">/sensors/:userId/:sensorId</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Remove an IoT sensor
            </p>
          </Card>
        </TabsContent>

        {/* MARKET ENDPOINTS */}
        <TabsContent value="market" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm">/market/prices</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get commodity market prices with filters
            </p>
            <div className="space-y-2">
              <p className="text-sm">Query Parameters:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• state (optional): Filter by state name</li>
                <li>• district (optional): Filter by district</li>
                <li>• market (optional): Filter by market/mandi</li>
                <li>• commodity (optional): Filter by commodity name</li>
                <li>• date (optional): Filter by arrival date (DD/MM/YYYY)</li>
              </ul>
              <p className="text-sm mt-4">Example:</p>
              <code className="text-xs bg-gray-100 p-2 rounded block overflow-auto">
                /market/prices?state=Andhra Pradesh&commodity=Tomato
              </code>
              <p className="text-sm mt-4">Response:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
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
  "total": 1
}`}
              </pre>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm">/market/states</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Get list of all available states
            </p>
          </Card>
        </TabsContent>

        {/* CLAIMS ENDPOINTS */}
        <TabsContent value="claims" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">GET</Badge>
              <code className="text-sm">/claims/:userId</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Get all insurance claims for a user
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge>POST</Badge>
              <code className="text-sm">/claims</code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              File a new insurance claim
            </p>
            <div className="space-y-2">
              <p className="text-sm">Request Body:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "userId": "user_123456",
  "crop": "Wheat - Field A",
  "event": "Frost Damage",
  "amount": 45000,
  "description": "Severe frost damage to wheat crop"
}`}
              </pre>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-orange-500">PUT</Badge>
              <code className="text-sm">/claims/:userId/:claimId</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Update claim status
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Endpoints */}
      <Card className="p-6">
        <h2 className="mb-4">Other Endpoints</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/vitals/:userId</code>
            <span className="text-sm text-muted-foreground">- Get crop vitals</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge>POST</Badge>
            <code className="text-sm">/vitals/:userId</code>
            <span className="text-sm text-muted-foreground">- Update vitals</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/alerts/:userId</code>
            <span className="text-sm text-muted-foreground">- Get alerts</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge>POST</Badge>
            <code className="text-sm">/chat</code>
            <span className="text-sm text-muted-foreground">- Send chat message</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/weather/:location</code>
            <span className="text-sm text-muted-foreground">- Get weather forecast</span>
          </div>
        </div>
      </Card>

      {/* Base URL */}
      <Card className="p-6 bg-blue-50">
        <h3 className="mb-2">Base URL</h3>
        <code className="text-sm bg-white p-2 rounded block">
          https://[projectId].supabase.co/functions/v1/make-server-37861144
        </code>
        <p className="text-sm text-muted-foreground mt-3">
          All requests must include the Authorization header with Bearer token
        </p>
      </Card>
    </div>
  );
}
