import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dashboard } from "./components/Dashboard";
import { MarketRates } from "./components/MarketRates";
import { Chatbot } from "./components/Chatbot";
import { Claims } from "./components/Claims";
import { Profile } from "./components/Profile";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingScreens } from "./components/OnboardingScreens";
import { AuthScreen } from "./components/AuthScreen";
import { ConnectHardware } from "./components/ConnectHardware";
import {
  Home,
  TrendingUp,
  MessageCircle,
  FileText,
  User,
} from "lucide-react";

export default function App() {
  const [appState, setAppState] = useState("splash");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      // Check if user has completed onboarding
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (!hasSeenOnboarding) {
        setAppState("onboarding");
      } else if (!isLoggedIn) {
        setAppState("auth");
      } else {
        setAppState("main");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setAppState("auth");
  };

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setAppState("hardware");
  };

  const handleHardwareComplete = () => {
    setAppState("main");
  };

  const handleHardwareSkip = () => {
    setAppState("main");
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setAppState("auth");
    setActiveTab("dashboard");
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            onChatOpen={() => setActiveTab("chat")}
            onProfileOpen={() => setActiveTab("profile")}
          />
        );
      case "market":
        return <MarketRates />;
      case "chat":
        return <Chatbot />;
      case "claims":
        return <Claims />;
      case "profile":
        return <Profile onLogout={handleLogout} />;
      default:
        return (
          <Dashboard
            onChatOpen={() => setActiveTab("chat")}
            onProfileOpen={() => setActiveTab("profile")}
          />
        );
    }
  };

  // Show different screens based on app state
  if (appState === "splash") {
    return <SplashScreen />;
  }

  if (appState === "onboarding") {
    return <OnboardingScreens onComplete={handleOnboardingComplete} />;
  }

  if (appState === "auth") {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (appState === "hardware") {
    return (
      <ConnectHardware
        onComplete={handleHardwareComplete}
        onSkip={handleHardwareSkip}
      />
    );
  }

  // Tab configuration
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "market", label: "Market", icon: TrendingUp },
    { id: "chat", label: "AI Chat", icon: MessageCircle },
    { id: "claims", label: "Claims", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Main app
  return (
    <div className="size-full max-w-md mx-auto bg-white relative overflow-hidden">
      {/* Main Content with AnimatePresence for smooth transitions */}
      <div className="h-full overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 relative">
          {/* Active indicator */}
          <motion.div
            className="absolute top-0 h-0.5 bg-primary"
            initial={false}
            animate={{
              left: `${tabs.findIndex((t) => t.id === activeTab) * 20}%`,
              width: "20%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </motion.div>
                <motion.span
                  className="text-xs"
                  animate={{
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {tab.label}
                </motion.span>

                {/* Notification badge for specific tabs */}
                {tab.id === "chat" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
