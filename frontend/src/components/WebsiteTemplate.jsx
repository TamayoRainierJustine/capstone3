import React from 'react';

const WebsiteTemplate = ({ template, selected, onSelect }) => {
  return (
    <div 
      className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onSelect(template.id)}
    >
      <div className="aspect-video mb-4 overflow-hidden rounded-md">
        <img 
          src={template.preview} 
          alt={template.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="mb-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {template.category}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
      <p className="text-gray-600 text-sm mb-3">{template.description}</p>
      <div className="flex flex-wrap gap-2">
        {template.features.map((feature, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WebsiteTemplate; 