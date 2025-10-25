import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Droplet,
  Bug,
  CloudRain,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";

const alerts = [
  {
    id: 1,
    type: "weather",
    severity: "critical",
    title: "Frost Warning Tonight",
    description:
      "Temperature will drop to 3°C. Cover sensitive crops and protect irrigation systems.",
    action: "Take immediate action",
    time: "1 hour ago",
  },
  {
    id: 2,
    type: "irrigation",
    severity: "attention",
    title: "Irrigation Recommended",
    description:
      "Soil moisture at 42%. Consider irrigating Field B within next 24 hours.",
    action: "Schedule irrigation",
    time: "3 hours ago",
  },
  {
    id: 3,
    type: "pest",
    severity: "critical",
    title: "Pest Alert: Aphids Detected",
    description:
      "High aphid activity detected in cotton field. Spray organic neem oil solution.",
    action: "Apply treatment",
    time: "5 hours ago",
  },
  {
    id: 4,
    type: "weather",
    severity: "attention",
    title: "Heavy Rain Expected",
    description: "45mm rainfall predicted in next 48 hours. Ensure proper drainage.",
    action: "Check drainage",
    time: "1 day ago",
  },
  {
    id: 5,
    type: "general",
    severity: "safe",
    title: "Fertilizer Application Due",
    description: "Apply NPK fertilizer to wheat field as per schedule.",
    action: "Apply fertilizer",
    time: "2 days ago",
  },
];

const iconMap = {
  irrigation: Droplet,
  pest: Bug,
  weather: CloudRain,
  general: AlertTriangle,
};

const severityConfig = {
  safe: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    icon: "text-green-500",
  },
  attention: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    icon: "text-yellow-500",
  },
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    icon: "text-red-500",
  },
};

export function Alerts() {
  const [alertList, setAlertList] = useState(alerts);
  const [expandedAlert, setExpandedAlert] = useState(null);

  const handleDismiss = (id) => {
    setAlertList(alertList.filter((alert) => alert.id !== id));
  };

  const handleDragEnd = (event, info, id) => {
    if (Math.abs(info.offset.x) > 100) {
      handleDismiss(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10"
      >
        <h1 className="text-foreground">Alerts & Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          {alertList.length} active alerts
        </p>
      </motion.div>

      <div className="p-4 space-y-3">
        {alertList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            </motion.div>
            <p className="text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-2">
              No active alerts at this time
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {alertList.map((alert, index) => {
              const Icon = iconMap[alert.type];
              const config = severityConfig[alert.severity];

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100, scale: 0.8 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100,
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, info) => handleDragEnd(e, info, alert.id)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="relative"
                >
                  <Card
                    className={`border-l-4 ${config.border} ${config.bg} overflow-hidden relative`}
                  >
                    {/* Pulsing effect for critical alerts */}
                    {alert.severity === "critical" && (
                      <motion.div
                        className="absolute inset-0 bg-red-200/20"
                        animate={{
                          opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    <div className="p-4 relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <motion.div
                            animate={
                              alert.severity === "critical"
                                ? {
                                    rotate: [0, -10, 10, 0],
                                    scale: [1, 1.1, 1],
                                  }
                                : {}
                            }
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          >
                            <Icon
                              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.icon}`}
                            />
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-foreground">{alert.title}</h3>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                              >
                                <Badge
                                  variant={
                                    alert.severity === "critical"
                                      ? "destructive"
                                      : alert.severity === "attention"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {alert.severity}
                                </Badge>
                              </motion.div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {alert.time}
                            </p>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1 -mr-2"
                            onClick={() => handleDismiss(alert.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {expandedAlert === alert.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 pt-3 border-t"
                          >
                            <p className="text-sm mb-3">Recommended Actions:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                              <motion.li
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                Check soil moisture levels
                              </motion.li>
                              <motion.li
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                Inspect affected areas
                              </motion.li>
                              <motion.li
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                              >
                                Follow up within 24 hours
                              </motion.li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2 mt-3">
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            variant={
                              alert.severity === "critical" ? "default" : "outline"
                            }
                            onClick={() =>
                              setExpandedAlert(
                                expandedAlert === alert.id ? null : alert.id
                              )
                            }
                          >
                            {expandedAlert === alert.id ? "Hide" : "View"} Details
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(alert.id)}
                          >
                            Mark as Done
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </Card>

                  {/* Swipe indicator */}
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground opacity-50"
                    animate={{
                      x: [0, 10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    ← Swipe
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
