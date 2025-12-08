import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

const colorConfig = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    iconBg: 'bg-blue-500',
    border: 'border-blue-200',
  },
  green: {
    text: 'text-green-600',
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    iconBg: 'bg-green-500',
    border: 'border-green-200',
  },
  red: {
    text: 'text-red-600',
    bg: 'bg-gradient-to-br from-red-50 to-red-100',
    iconBg: 'bg-red-500',
    border: 'border-red-200',
  },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    iconBg: 'bg-purple-500',
    border: 'border-purple-200',
  },
  orange: {
    text: 'text-orange-600',
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    iconBg: 'bg-orange-500',
    border: 'border-orange-200',
  },
};

export default function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const config = colorConfig[color];
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 border ${config.border} hover:shadow-md transition-all duration-200 group`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${config.text} break-words`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${config.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2`}>
          <span className="text-lg sm:text-xl lg:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

