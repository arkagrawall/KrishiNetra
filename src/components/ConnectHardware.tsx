import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Wifi,
  WifiOff,
  CheckCircle,
  Loader2,
  Plus,
  MapPin,
  Thermometer,
  Droplets,
  X,
  Radio,
} from "lucide-react";

export function ConnectHardware({ onComplete, onSkip }) {
  const [isScanning, setIsScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sensors, setSensors] = useState([
    {
      id: "SNS-001",
      name: "Soil Moisture Sensor A",
      type: "Moisture",
      status: "connected",
      location: "Field A",
    },
    {
      id: "SNS-002",
      name: "Temperature Sensor B",
      type: "Temperature",
      status: "connected",
      location: "Field B",
    },
  ]);

  const [newSensor, setNewSensor] = useState({
    name: "",
    type: "moisture",
    location: "",
  });

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const handleAddSensor = () => {
    if (newSensor.name && newSensor.location) {
      const sensor = {
        id: `SNS-${String(sensors.length + 1).padStart(3, "0")}`,
        name: newSensor.name,
        type: newSensor.type.charAt(0).toUpperCase() + newSensor.type.slice(1),
        status: "connected",
        location: newSensor.location,
      };
      setSensors([...sensors, sensor]);
      setNewSensor({ name: "", type: "moisture", location: "" });
      setShowAddForm(false);
    }
  };

  const handleRemoveSensor = (id) => {
    setSensors(sensors.filter((s) => s.id !== id));
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground">Connect IoT Sensors</h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground"
            >
              {sensors.length} devices connected
            </motion.p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" onClick={onSkip}>
              Skip
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Scan Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
        >
          <Card className="p-6 text-center relative overflow-hidden">
            {/* Animated radar effect when scanning */}
            {isScanning && (
              <motion.div
                className="absolute inset-0 border-4 border-primary/30 rounded-lg"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}

            <motion.div
              animate={isScanning ? {
                rotate: 360,
              } : {}}
              transition={isScanning ? {
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              } : {}}
            >
              <Wifi className={`w-12 h-12 mx-auto mb-4 ${isScanning ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            
            <h3 className="text-foreground mb-2">Scan for Devices</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make sure your IoT sensors are powered on and in pairing mode
            </p>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </motion.div>
          </Card>
        </motion.div>

        {/* Connected Sensors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground">Connected Sensors</h3>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual
              </Button>
            </motion.div>
          </div>

          {/* Add Sensor Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 mb-3">
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="sensorName">Sensor Name</Label>
                      <Input
                        id="sensorName"
                        placeholder="e.g., Soil Sensor A"
                        value={newSensor.name}
                        onChange={(e) =>
                          setNewSensor({ ...newSensor, name: e.target.value })
                        }
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="sensorType">Type</Label>
                      <select
                        id="sensorType"
                        className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                        value={newSensor.type}
                        onChange={(e) =>
                          setNewSensor({ ...newSensor, type: e.target.value })
                        }
                      >
                        <option value="moisture">Soil Moisture</option>
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="rainfall">Rainfall</option>
                      </select>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="sensorLocation">Location</Label>
                      <Input
                        id="sensorLocation"
                        placeholder="e.g., Field A"
                        value={newSensor.location}
                        onChange={(e) =>
                          setNewSensor({
                            ...newSensor,
                            location: e.target.value,
                          })
                        }
                      />
                    </motion.div>
                    <div className="flex gap-2">
                      <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={handleAddSensor}
                          className="w-full"
                          size="sm"
                        >
                          Add Sensor
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddForm(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sensor List */}
          <div className="space-y-3">
            {sensors.map((sensor, index) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      {/* Sensor Icon */}
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          sensor.status === "connected"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                        animate={sensor.status === "connected" ? {
                          boxShadow: [
                            "0 0 0 0 rgba(34, 197, 94, 0.4)",
                            "0 0 0 10px rgba(34, 197, 94, 0)",
                          ],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        {sensor.type === "Moisture" ? (
                          <Droplets
                            className={`w-5 h-5 ${
                              sensor.status === "connected"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <Thermometer
                            className={`w-5 h-5 ${
                              sensor.status === "connected"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </motion.div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-foreground">{sensor.name}</h4>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                          >
                            <Badge
                              variant={
                                sensor.status === "connected"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {sensor.status === "connected" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <WifiOff className="w-3 h-3 mr-1" />
                              )}
                              {sensor.status}
                            </Badge>
                          </motion.div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>ID: {sensor.id}</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {sensor.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1"
                        onClick={() => handleRemoveSensor(sensor.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {sensors.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-8 text-center">
                <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sensors connected yet</p>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 bg-white border-t border-gray-200"
      >
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onComplete}
            className="w-full relative overflow-hidden"
            size="lg"
            disabled={sensors.length === 0}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span className="relative z-10">Continue to Dashboard</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
