import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";

export function FloatingButton({ onClick }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Pulsing ring effect */}
      <motion.div
        className="absolute inset-0 bg-primary rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Icon with subtle animation */}
      <motion.div
        animate={{
          rotate: [0, -10, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.div>

      {/* Notification badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-full blur-md -z-10"
        whileHover={{
          scale: 1.5,
          opacity: 0.5,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
