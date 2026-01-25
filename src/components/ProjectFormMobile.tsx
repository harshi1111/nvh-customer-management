// src/components/ProjectFormMobile.tsx
import React from 'react';

interface ProjectFormMobileProps {
  projectData: any;
  onChange: (field: string, value: any) => void;
}

const ProjectFormMobile: React.FC<ProjectFormMobileProps> = ({ projectData, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Project Name - Full width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name *
        </label>
        <input
          type="text"
          value={projectData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
          placeholder="Enter project name"
        />
      </div>

      {/* Location Fields - Stack vertically on mobile */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Location Details</h3>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Country</label>
          <select
            value={projectData.location?.country || 'India'}
            onChange={(e) => onChange('location', { ...projectData.location, country: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
          >
            <option value="India">India</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">State</label>
          <select
            value={projectData.location?.state || 'Tamil Nadu'}
            onChange={(e) => onChange('location', { ...projectData.location, state: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
          >
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">City/District</label>
          <input
            type="text"
            value={projectData.location?.city || ''}
            onChange={(e) => onChange('location', { ...projectData.location, city: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Village/Area</label>
          <input
            type="text"
            value={projectData.location?.village || ''}
            onChange={(e) => onChange('location', { ...projectData.location, village: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
            placeholder="Enter village"
          />
        </div>
      </div>

      {/* Area and Bags - Side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={projectData.area?.value || ''}
              onChange={(e) => onChange('area', { ...projectData.area, value: parseFloat(e.target.value) || 0 })}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
              placeholder="0.00"
              step="0.01"
            />
            <select
              value={projectData.area?.unit || 'acres'}
              onChange={(e) => onChange('area', { ...projectData.area, unit: e.target.value })}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base bg-white w-24"
            >
              <option value="acres">acres</option>
              <option value="hectares">hectares</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Bags
          </label>
          <input
            type="number"
            value={projectData.numberOfBags || ''}
            onChange={(e) => onChange('numberOfBags', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-base"
            placeholder="0"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectFormMobile;