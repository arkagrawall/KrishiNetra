import { useState, useRef } from "react";
import { motion } from "motion/react";
import { VitalCard } from "./VitalCard";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Settings, Droplet, Leaf, Bug, AlertCircle, RefreshCw } from "lucide-react";
import { FloatingButton } from "./FloatingButton";

const vitalData = {
  moisture: Array.from({ length: 7 }, (_, i) => ({
    value: 45 + Math.random() * 10,
  })),
  temperature: Array.from({ length: 7 }, (_, i) => ({
    value: 28 + Math.random() * 4,
  })),
  humidity: Array.from({ length: 7 }, (_, i) => ({
    value: 65 + Math.random() * 10,
  })),
  rainfall: Array.from({ length: 7 }, (_, i) => ({
    value: 5 + Math.random() * 15,
  })),
};

const alerts = [
  {
    id: 1,
    type: "critical",
    title: "Frost Warning",
    message: "Temperature expected to drop below 5°C tonight. Protect crops.",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "attention",
    title: "Claim Update",
    message: "Your flood damage claim is under verification.",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "safe",
    title: "Harvest Ready",
    message: "Wheat crop in Field A is ready for harvest.",
    time: "1 day ago",
  },
];

export function Dashboard({ onChatOpen, onProfileOpen }) {
  const [expandedVital, setExpandedVital] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY && containerRef.current?.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-50 pb-20 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <motion.div
          className="flex justify-center py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullDistance * 3.6 }}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw className={`w-6 h-6 ${pullDistance > 60 ? "text-primary" : "text-gray-400"}`} />
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-foreground">Rajesh Kumar</h1>
            <p className="text-sm text-muted-foreground">Green Valley Farm</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button variant="ghost" size="icon" onClick={onProfileOpen}>
              <Settings className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* Live Vitals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-3 text-foreground">Live Crop Vitals</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { type: "moisture", value: 48, unit: "%", status: "safe", data: vitalData.moisture },
              { type: "temperature", value: 30, unit: "°C", status: "attention", data: vitalData.temperature },
              { type: "humidity", value: 72, unit: "%", status: "safe", data: vitalData.humidity },
              { type: "rainfall", value: 12, unit: "mm", status: "safe", data: vitalData.rainfall },
              { type: "crop-status", value: "Healthy", status: "safe" },
            ].map((vital, index) => (
              <motion.div
                key={vital.type}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <VitalCard
                  type={vital.type}
                  value={vital.value}
                  unit={vital.unit}
                  status={vital.status}
                  data={vital.data}
                  isExpanded={expandedVital === vital.type}
                  onClick={() =>
                    setExpandedVital(expandedVital === vital.type ? null : vital.type)
                  }
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-3 text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Droplet, label: "Irrigation Advice", color: "text-blue-500" },
              { icon: Leaf, label: "Fertilizer Tips", color: "text-green-500" },
              { icon: Bug, label: "Pest Alerts", color: "text-orange-500" },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 gap-2 w-full"
                  onClick={onChatOpen}
                >
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                  <span className="text-xs">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Important Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="mb-3 text-foreground">Important Notifications</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{ x: 5 }}
              >
                <Card
                  className={`p-4 border-l-4 ${
                    alert.type === "critical"
                      ? "border-l-red-500 bg-red-50"
                      : alert.type === "attention"
                      ? "border-l-yellow-500 bg-yellow-50"
                      : "border-l-green-500 bg-green-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <motion.div
                      animate={
                        alert.type === "critical"
                          ? {
                              scale: [1, 1.2, 1],
                              opacity: [1, 0.7, 1],
                            }
                          : {}
                      }
                      transition={
                        alert.type === "critical"
                          ? {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : {}
                      }
                    >
                      <AlertCircle
                        className={`w-5 h-5 flex-shrink-0 ${
                          alert.type === "critical"
                            ? "text-red-500"
                            : alert.type === "attention"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-foreground mb-1">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <FloatingButton onClick={onChatOpen} />
    </div>
  );
}
