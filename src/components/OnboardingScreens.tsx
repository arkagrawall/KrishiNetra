import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Sprout, TrendingUp, Shield, Bot, ChevronRight } from "lucide-react";

const screens = [
  {
    id: 1,
    title: "Real-Time Crop Monitoring",
    description:
      "Monitor soil moisture, temperature, and crop health in real-time with IoT sensors.",
    icon: Sprout,
    color: "from-green-500 to-green-600",
    gradient: "from-green-500/20 to-green-600/20",
  },
  {
    id: 2,
    title: "Live Market Prices",
    description:
      "Get up-to-date market rates and price forecasts for your crops across multiple mandis.",
    icon: TrendingUp,
    color: "from-blue-500 to-blue-600",
    gradient: "from-blue-500/20 to-blue-600/20",
  },
  {
    id: 3,
    title: "Insurance Made Easy",
    description:
      "File claims instantly with IoT-verified data. Fast, transparent, and hassle-free.",
    icon: Shield,
    color: "from-purple-500 to-purple-600",
    gradient: "from-purple-500/20 to-purple-600/20",
  },
  {
    id: 4,
    title: "AI-Powered Assistant",
    description:
      "Get instant advice on irrigation, pest control, and farming best practices in your language.",
    icon: Bot,
    color: "from-orange-500 to-orange-600",
    gradient: "from-orange-500/20 to-orange-600/20",
  },
];

export function OnboardingScreens({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setDirection(1);
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotClick = (index) => {
    setDirection(index > currentScreen ? 1 : -1);
    setCurrentScreen(index);
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-hidden">
      {/* Skip button */}
      <div className="p-4 flex justify-end z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background decoration */}
        <motion.div
          key={currentScreen}
          className={`absolute inset-0 bg-gradient-to-br ${screen.gradient} blur-3xl`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScreen}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
            }}
            className="text-center z-10"
          >
            {/* Icon */}
            <motion.div
              className={`w-36 h-36 bg-gradient-to-br ${screen.color} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl relative`}
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon className="w-20 h-20 text-white" />
              </motion.div>

              {/* Floating particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/40 rounded-full"
                  style={{
                    top: `${20 + i * 25}%`,
                    right: `${-10 + i * 5}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-foreground mb-4 px-4"
            >
              {screen.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-center max-w-sm leading-relaxed"
            >
              {screen.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mb-8">
        {screens.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => handleDotClick(index)}
            className="relative"
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className={`rounded-full transition-all ${
                index === currentScreen ? "bg-primary" : "bg-gray-300"
              }`}
              animate={{
                width: index === currentScreen ? 32 : 8,
                height: 8,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </motion.button>
        ))}
      </div>

      {/* Next button */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={handleNext} className="w-full" size="lg">
            {currentScreen === screens.length - 1 ? "Get Started" : "Next"}
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ChevronRight className="w-5 h-5 ml-2" />
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
