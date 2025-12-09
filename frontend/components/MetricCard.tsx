import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

const colorConfig = {
  blue: {
    text: 'text-blue-700',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    border: 'border-l-blue-500',
    hoverGlow: 'hover:shadow-blue-500/20',
  },
  green: {
    text: 'text-green-700',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    border: 'border-l-green-500',
    hoverGlow: 'hover:shadow-green-500/20',
  },
  red: {
    text: 'text-red-700',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    border: 'border-l-red-500',
    hoverGlow: 'hover:shadow-red-500/20',
  },
  purple: {
    text: 'text-purple-700',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    border: 'border-l-purple-500',
    hoverGlow: 'hover:shadow-purple-500/20',
  },
  orange: {
    text: 'text-orange-700',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    border: 'border-l-orange-500',
    hoverGlow: 'hover:shadow-orange-500/20',
  },
};

export default function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const config = colorConfig[color];
  
  return (
    <div className={`bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border-l-4 ${config.border} border-t border-r border-b border-gray-200 p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 group ${config.hoverGlow}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <p className={`text-2xl sm:text-3xl font-semibold ${config.text} break-words`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${config.iconColor} shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

