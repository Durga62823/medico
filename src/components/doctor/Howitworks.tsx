import { motion } from "framer-motion";
import { Heart, ShieldCheck, Cloud, Smartphone } from "lucide-react";
// Example Lucide icons. Substitute or add as needed.

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.2
    }
  }
};

const features = [
  {
    icon: <Heart className="w-8 h-8 text-primary mb-4" />,
    title: "AI-Powered Vitals",
    description: "Automated, real-time monitoring and analysis of patient vitals for instant health insights.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary mb-4" />,
    title: "Secure Data",
    description: "Your medical records and chat data remain encrypted and private at every step.",
  },
  {
    icon: <Cloud className="w-8 h-8 text-primary mb-4" />,
    title: "Cloud Accessible",
    description: "Access MedAIron anywhere, anytime — your dashboard is always in sync across devices.",
  },
  {
    icon: <Smartphone className="w-8 h-8 text-primary mb-4" />,
    title: "Instant Alerts",
    description: "Get real-time critical alerts and AI predictions, keeping you ahead on every patient.",
  }
];

// Small card for each step
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white shadow rounded-2xl px-6 py-8 flex flex-col items-center text-center h-full">
      {icon}
      <h4 className="mb-2 text-lg font-semibold">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <motion.section
      className="py-16 bg-gray-50"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          variants={fadeInUpVariant}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">
            Simple steps to make a difference in intelligent healthcare
          </p>
        </motion.div>
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={fadeInUpVariant}>
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
