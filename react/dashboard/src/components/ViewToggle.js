import React from 'react';
import { UserCheck, Shield, Eye } from 'lucide-react';

const ViewToggle = ({ currentView, onViewChange }) => {
  const views = [
    {
      id: 'administrator',
      label: 'Administrator',
      icon: Shield,
      description: 'High-level metrics and strategic insights',
      color: 'bg-purple-600'
    },
    {
      id: 'advisor',
      label: 'Advisor/Staff',
      icon: UserCheck,
      description: 'Detailed student information and actionable data',
      color: 'bg-blue-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Dashboard View</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {views.map((view) => {
          const IconComponent = view.icon;
          const isActive = currentView === view.id;
          
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isActive
                  ? 'border-[#E31837] bg-red-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#E31837]' : view.color} text-white`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isActive ? 'text-[#E31837]' : 'text-gray-900'}`}>
                    {view.label}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{view.description}</p>
                  {isActive && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#E31837] text-white">
                        Active View
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ViewToggle;
