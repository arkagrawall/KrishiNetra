import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Droplets, Thermometer, CloudRain, Sprout } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const iconMap = {
  moisture: Droplets,
  temperature: Thermometer,
  humidity: CloudRain,
  rainfall: CloudRain,
  "crop-status": Sprout,
};

const statusColors = {
  safe: "bg-green-50 border-green-500 text-green-700",
  attention: "bg-yellow-50 border-yellow-500 text-yellow-700",
  critical: "bg-red-50 border-red-500 text-red-700",
};

export function VitalCard({
  type,
  value,
  unit,
  status = "safe",
  data,
  onClick,
  isExpanded,
}) {
  const Icon = iconMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
      layout
    >
      <Card
        className={`p-4 border-2 ${statusColors[status]} min-w-[140px] relative overflow-hidden`}
      >
        {/* Animated background gradient for critical status */}
        {status === "critical" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-red-200/50"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={
                status === "critical"
                  ? {
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={
                status === "critical"
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {}
              }
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <span className="text-sm capitalize">{type.replace("-", " ")}</span>
          </div>

          {/* Value */}
          <motion.div
            className="mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.span
              className="text-2xl inline-block"
              whileHover={{ scale: 1.1 }}
            >
              {value}
            </motion.span>
            {unit && <span className="text-sm ml-1">{unit}</span>}
          </motion.div>

          {/* Chart */}
          <AnimatePresence>
            {isExpanded && data && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 80 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="mt-3 -mx-2"
              >
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={data}>
                    <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={
                        status === "critical"
                          ? "#ef4444"
                          : status === "attention"
                          ? "#eab308"
                          : "#22c55e"
                      }
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs mt-1 text-center"
                >
                  Last 7 days
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap indicator */}
          {data && !isExpanded && (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs text-center mt-2 opacity-60"
            >
              Tap for details
            </motion.div>
          )}
        </div>

        {/* Ripple effect on tap */}
        {onClick && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-lg pointer-events-none"
            initial={{ scale: 0, opacity: 1 }}
            whileTap={{
              scale: 2,
              opacity: 0,
              transition: { duration: 0.5 },
            }}
          />
        )}
      </Card>
    </motion.div>
  );
}
