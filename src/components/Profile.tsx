import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Bell,
  Wifi,
  Shield,
  LogOut,
  ChevronRight,
  Star,
} from "lucide-react";
import { Badge } from "./ui/badge";

export function Profile({ onLogout }) {
  const menuItems = [
    {
      section: "Farm Management",
      items: [
        {
          icon: MapPin,
          label: "My Farms",
          sublabel: "3 registered farms",
          color: "text-green-500",
        },
        {
          icon: Wifi,
          label: "IoT Sensors",
          sublabel: "5 devices connected",
          sublabelColor: "text-green-600",
          color: "text-blue-500",
        },
      ],
    },
    {
      section: "Language & Region",
      items: [
        {
          icon: Globe,
          label: "Language",
          sublabel: "English",
          color: "text-purple-500",
        },
      ],
    },
    {
      section: "Account",
      items: [
        {
          icon: Shield,
          label: "Privacy & Security",
          color: "text-orange-500",
        },
        {
          icon: User,
          label: "Insurance Policy",
          color: "text-indigo-500",
        },
      ],
    },
  ];

  const notifications = [
    { label: "Push Notifications", sublabel: "Get alerts and updates" },
    { label: "Weather Alerts", sublabel: "Critical weather warnings" },
    { label: "Market Price Updates", sublabel: "Daily price changes" },
    { label: "Claim Status", sublabel: "Insurance claim updates" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4"
      >
        <h1 className="text-foreground">Profile & Settings</h1>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          whileHover={{ y: -5 }}
        >
          <Card className="p-6 relative overflow-hidden">
            {/* Background decoration */}
            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    RK
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex-1">
                <h2 className="text-foreground mb-1">Rajesh Kumar</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Farmer ID: AGR2024-1543
                </p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    Premium Member
                  </Badge>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3 text-sm relative z-10"
            >
              {[
                { icon: MapPin, text: "Green Valley Farm, Kota, Rajasthan" },
                { icon: Phone, text: "+91 98765 43210" },
                { icon: Mail, text: "rajesh.kumar@email.com" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="outline" className="w-full mt-4">
                Edit Profile
              </Button>
            </motion.div>
          </Card>
        </motion.div>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <motion.div
            key={section.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + sectionIndex * 0.1 }}
          >
            <h3 className="mb-3 text-foreground">{section.section}</h3>
            <Card className="divide-y overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <motion.button
                  key={item.label}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className={`w-5 h-5 ${item.color || 'text-muted-foreground'}`} />
                    </motion.div>
                    <div className="text-left">
                      <p className="text-sm">{item.label}</p>
                      <p className={`text-xs ${item.sublabelColor || 'text-muted-foreground'}`}>
                        {item.sublabel}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </motion.button>
              ))}
            </Card>
          </motion.div>
        ))}

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="mb-3 text-foreground">Notifications</h3>
          <Card className="divide-y">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                  <div>
                    <p className="text-sm">{notification.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.sublabel}
                    </p>
                  </div>
                </div>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Switch defaultChecked />
                </motion.div>
              </motion.div>
            ))}
          </Card>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="destructive"
            className="w-full relative overflow-hidden"
            onClick={onLogout}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <LogOut className="w-5 h-5 mr-2 relative z-10" />
            <span className="relative z-10">Logout</span>
          </Button>
        </motion.div>

        {/* Version Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-muted-foreground"
        >
          AgriSure+ v1.0.0
        </motion.p>
      </div>
    </div>
  );
}
