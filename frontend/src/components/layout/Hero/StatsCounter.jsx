import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
// Import ALL icons used in the file
import { 
  TrendingUp, 
  People as Users,
  EmojiEvents as Award,
  Schedule as Clock,
  Help as FallbackIcon // Add a fallback icon
} from '@mui/icons-material';

const StatsCounter = ({ end, duration = 2000, label, icon, color = 'primary' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const colors = {
    primary: 'from-primary-500 to-accent-500',
    success: 'from-green-500 to-emerald-500',
    warning: 'from-yellow-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500'
  };

  // SAFETY FIX: Use fallback icon if icon prop is undefined
  const Icon = icon || FallbackIcon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounter();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated]);

  const animateCounter = () => {
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Ease out function
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      const currentCount = Math.floor(easeOut * end);
      
      setCount(currentCount);
      
      if (percentage < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  };

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="inline-flex items-center justify-center mb-4"
      >
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[color] || colors.primary} flex items-center justify-center`}>
          {/* SAFETY FIX: Icon will never be undefined now */}
          <Icon className="w-8 h-8 text-white" />
        </div>
      </motion.div>
      
      <div className="text-4xl md:text-5xl font-bold mb-2">
        <span className="bg-gradient-to-r bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-accent-500">
          {count.toLocaleString()}
        </span>
        {/* FIX: Added optional chaining to prevent crash if label is undefined */}
        {label?.includes('%') && '%'}
      </div>
      
      <div className="text-dark-600 dark:text-light-400">
        {label || 'No label provided'}
      </div>
    </div>
  );
};

const StatsGrid = () => {
  const stats = [
    {
      end: 1500,
      label: 'Issues Resolved',
      icon: TrendingUp,
      color: 'primary'
    },
    {
      end: 10000,
      label: 'Active Users',
      icon: Users,
      color: 'success'
    },
    {
      end: 98,
      label: 'Satisfaction Rate',
      icon: Award,
      color: 'warning'
    },
    {
      end: 24,
      label: 'Avg. Resolution Time (Hours)',
      icon: Clock,
      color: 'info'
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-b from-white to-dark-50 dark:from-dark-900 dark:to-dark-800">
      <div className="section-padding">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Making a Real Impact
          </h2>
          <p className="text-xl text-dark-600 dark:text-light-400 max-w-3xl mx-auto">
            Join thousands of citizens who are actively improving their communities through our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatsCounter key={index} {...stat} />
          ))}
        </div>
        
        {/* Animated progress bars */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Pothole Repairs</span>
                <span className="text-primary-600 dark:text-primary-400 font-semibold">85%</span>
              </div>
              <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '85%' }}
                  transition={{ duration: 1, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Drainage Cleaning</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">92%</span>
              </div>
              <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '92%' }}
                  transition={{ duration: 1, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Street Light Repairs</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">78%</span>
              </div>
              <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '78%' }}
                  transition={{ duration: 1, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Garbage Clearance</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">95%</span>
              </div>
              <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '95%' }}
                  transition={{ duration: 1, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StatsCounter, StatsGrid };