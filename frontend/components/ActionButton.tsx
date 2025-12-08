import React from 'react';

interface ActionButtonProps {
  label: string;
  icon: string;
  color: 'purple' | 'blue' | 'orange';
  onClick: () => void;
}

const colorClasses = {
  purple: {
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    text: 'text-white',
    shadow: 'shadow-lg shadow-purple-500/25',
    iconBg: 'bg-white/20',
  },
  blue: {
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    text: 'text-white',
    shadow: 'shadow-lg shadow-blue-500/25',
    iconBg: 'bg-white/20',
  },
  orange: {
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    text: 'text-white',
    shadow: 'shadow-lg shadow-orange-500/25',
    iconBg: 'bg-white/20',
  },
};

export default function ActionButton({ label, icon, color, onClick }: ActionButtonProps) {
  const config = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={`${config.gradient} ${config.text} ${config.shadow} p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-[1.02] group relative overflow-hidden`}
    >
      <div className="relative z-10 flex items-center gap-2 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${config.iconBg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl sm:text-2xl lg:text-3xl">{icon}</span>
        </div>
        <span className="font-bold text-sm sm:text-base lg:text-lg text-left">{label}</span>
      </div>
    </button>
  );
}

