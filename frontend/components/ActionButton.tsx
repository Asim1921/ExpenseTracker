import React from 'react';

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'orange';
  onClick: () => void;
}

const colorClasses = {
  purple: {
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-gray-800',
    border: 'border border-gray-300 hover:border-purple-400',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  blue: {
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-gray-800',
    border: 'border border-gray-300 hover:border-blue-400',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  orange: {
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-gray-800',
    border: 'border border-gray-300 hover:border-orange-400',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
};

export default function ActionButton({ label, icon, color, onClick }: ActionButtonProps) {
  const config = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={`${config.bg} ${config.text} ${config.border} p-5 sm:p-6 rounded-lg transition-all duration-200 hover:shadow-md group`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconColor}`}>
          {icon}
        </div>
        <span className="font-semibold text-sm sm:text-base text-left">{label}</span>
      </div>
    </button>
  );
}

