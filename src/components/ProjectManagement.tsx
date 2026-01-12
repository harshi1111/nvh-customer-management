import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { storage } from '../utils/storage';
import { MapPin, Plus, Edit2, Trash2, Save, X, Grid, Package, Ruler } from 'lucide-react';

interface ProjectManagementProps {
  customerId: string;
  customerName: string;
  onProjectSelect: (projectId: string) => void;
  selectedProjectId?: string;
}

// COMPLETE location data
const countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];

const stateData: Record<string, string[]> = {
  'India': ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Delhi', 'Gujarat', 'Rajasthan', 'Punjab', 'Uttar Pradesh', 'Madhya Pradesh'],
  'USA': ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania'],
  'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
  'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
};

const cityData: Record<string, Record<string, string[]>> = {
  'India': {
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Malappuram', 'Kannur', 'Kollam', 'Alappuzha', 'Kottayam'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahabubnagar', 'Adilabad', 'Siddipet'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Thane'],
    'Delhi': ['New Delhi', 'Delhi Cantonment', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Pathankot'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna']
  },
  'USA': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Long Beach'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee', 'St. Petersburg', 'Hialeah'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle'],
    'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria'],
    'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem']
  },
  'UK': {
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Perth', 'Stirling'],
    'Wales': ['Cardiff', 'Swansea', 'Newport', 'Bangor', 'St Davids', 'Wrexham', 'Barry'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry', 'Armagh', 'Bangor', 'Carrickfergus']
  }
};

const getStatesForCountry = (country: string) => {
  return stateData[country] || [];
};

const getCitiesForState = (country: string, state: string) => {
  return cityData[country]?.[state] || ['Select City'];
};

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  customerId,
  customerName,
  onProjectSelect,
  selectedProjectId
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // New project form
  const [newProject, setNewProject] = useState({
    name: '',
    location: {
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      village: ''
    },
    numberOfBags: 0,
    area: {
      value: 0,
      unit: 'acres' as 'acres' | 'cent'
    }
  });

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [customerId]);

  const loadProjects = () => {
    const loadedProjects = storage.getCustomerProjects(customerId);
    
    // If no projects, create a default one
    if (loadedProjects.length === 0) {
      const defaultProject: Project = {
        id: 'default-project-' + Date.now(),
        customerId,
        name: 'Project 1',
        location: {
          country: 'India',
          state: 'Tamil Nadu',
          city: 'Chennai',
          village: 'Enter village name'
        },
        numberOfBags: 0,
        area: {
          value: 0,
          unit: 'acres'
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      storage.addProject(defaultProject);
      const updatedProjects = storage.getCustomerProjects(customerId);
      setProjects(updatedProjects);
      onProjectSelect(defaultProject.id);
    } else {
      setProjects(loadedProjects);
      if (!selectedProjectId && loadedProjects.length > 0) {
        onProjectSelect(loadedProjects[0].id);
      }
    }
    
    setLoading(false);
  };

  // Create new project
  const handleCreateProject = () => {
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!newProject.location.village.trim()) {
      alert('Please enter village name');
      return;
    }

    const project: Project = {
      id: 'project-' + Date.now(),
      customerId,
      name: newProject.name,
      location: newProject.location,
      numberOfBags: newProject.numberOfBags,
      area: newProject.area,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.addProject(project);
    loadProjects();
    setIsAdding(false);
    onProjectSelect(project.id);
    
    // Reset form
    setNewProject({
      name: `Project ${projects.length + 2}`,
      location: {
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        village: ''
      },
      numberOfBags: 0,
      area: {
        value: 0,
        unit: 'acres'
      }
    });
  };

  // Save edited project
  const handleSaveEdit = () => {
    if (!editingProject) return;
    
    if (!editingProject.name.trim()) {
      alert('Project name cannot be empty');
      return;
    }

    if (!editingProject.location.village.trim()) {
      alert('Village name cannot be empty');
      return;
    }

    const updatedProject = {
      ...editingProject,
      updatedAt: new Date().toISOString()
    };

    storage.updateProject(updatedProject);
    loadProjects();
    setEditingProject(null);
  };

  // Delete project
  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      alert('Cannot delete the last project. Each customer must have at least one project.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this project? All associated transactions will also be deleted.')) {
      storage.deleteProject(projectId);
      loadProjects();
      
      // Select another project if current one was deleted
      if (selectedProjectId === projectId && projects.length > 1) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        onProjectSelect(remainingProjects[0].id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const currentCities = editingProject 
    ? getCitiesForState(editingProject.location.country, editingProject.location.state)
    : selectedProject 
      ? getCitiesForState(selectedProject.location.country, selectedProject.location.state)
      : getCitiesForState('India', 'Tamil Nadu');

  const newProjectCities = getCitiesForState(newProject.location.country, newProject.location.state);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Project Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Projects
          </h3>
          
          {/* Project Tabs */}
          <div className="flex flex-wrap gap-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedProjectId === project.id
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {project.name}
              </button>
            ))}
            
            {/* Add Project Button */}
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 border border-dashed border-green-400 text-green-600 rounded-lg hover:bg-green-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>
        </div>
      </div>

      {/* Selected Project Details - FULLY EDITABLE */}
      {selectedProject && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {/* Project Name - EDITABLE */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                {editingProject?.id === selectedProject.id ? (
                  <input
                    type="text"
                    value={editingProject.name}
                    onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <div className="font-medium text-gray-800">{selectedProject.name}</div>
                )}
              </div>
              
              {/* Location Details - EDITABLE */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </h4>
                
                {editingProject?.id === selectedProject.id ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Country</label>
                      <select
                        value={editingProject.location.country}
                        onChange={(e) => {
                          const newCountry = e.target.value;
                          const states = getStatesForCountry(newCountry);
                          setEditingProject({
                            ...editingProject,
                            location: {
                              ...editingProject.location, 
                              country: newCountry,
                              state: states.length > 0 ? states[0] : '',
                              city: '',
                              village: ''
                            }
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">State</label>
                      <select
                        value={editingProject.location.state}
                        onChange={(e) => {
                          const newState = e.target.value;
                          setEditingProject({
                            ...editingProject,
                            location: {
                              ...editingProject.location, 
                              state: newState,
                              city: '',
                              village: ''
                            }
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select State</option>
                        {getStatesForCountry(editingProject.location.country).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">City</label>
                      <select
                        value={editingProject.location.city}
                        onChange={(e) => setEditingProject({
                          ...editingProject,
                          location: {...editingProject.location, city: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select City</option>
                        {getCitiesForState(editingProject.location.country, editingProject.location.state).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Village *</label>
                      <input
                        type="text"
                        value={editingProject.location.village}
                        onChange={(e) => setEditingProject({
                          ...editingProject,
                          location: {...editingProject.location, village: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Village name"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 space-y-1">
                    <p><span className="font-medium">Country:</span> {selectedProject.location.country}</p>
                    <p><span className="font-medium">State:</span> {selectedProject.location.state}</p>
                    <p><span className="font-medium">City:</span> {selectedProject.location.city}</p>
                    <p><span className="font-medium">Village:</span> {selectedProject.location.village}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Edit/Save/Cancel Buttons */}
            <div className="flex gap-2 ml-4">
              {editingProject?.id === selectedProject.id ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingProject(selectedProject)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Project
                </button>
              )}
            </div>
          </div>
          
          {/* Bags and Area - EDITABLE */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-500 flex items-center gap-2 mb-2">
                <Package className="w-5 h-5" />
                <span className="font-medium">Number of Bags</span>
              </div>
              {editingProject?.id === selectedProject.id ? (
                <input
                  type="number"
                  value={editingProject.numberOfBags}
                  onChange={(e) => setEditingProject({
                    ...editingProject,
                    numberOfBags: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-800">
                  {selectedProject.numberOfBags} bags
                </div>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-500 flex items-center gap-2 mb-2">
                <Ruler className="w-5 h-5" />
                <span className="font-medium">Area</span>
              </div>
              {editingProject?.id === selectedProject.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingProject.area.value}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      area: {...editingProject.area, value: parseFloat(e.target.value) || 0}
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={editingProject.area.unit}
                    onChange={(e) => setEditingProject({
                      ...editingProject,
                      area: {...editingProject.area, unit: e.target.value as 'acres' | 'cent'}
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="acres">Acres</option>
                    <option value="cent">Cent</option>
                  </select>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-800">
                  {selectedProject.area.value} {selectedProject.area.unit}
                </div>
              )}
            </div>
          </div>
          
          {/* Delete Button */}
          {!editingProject && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Add New Project</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Land 1, Farm A"
                />
              </div>
              
              {/* Location Selection */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Country</label>
                    <select
                      value={newProject.location.country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        const states = getStatesForCountry(newCountry);
                        setNewProject({
                          ...newProject,
                          location: {
                            ...newProject.location, 
                            country: newCountry,
                            state: states.length > 0 ? states[0] : '',
                            city: '',
                            village: ''
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">State</label>
                    <select
                      value={newProject.location.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setNewProject({
                          ...newProject,
                          location: {
                            ...newProject.location, 
                            state: newState,
                            city: '',
                            village: ''
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select State</option>
                      {getStatesForCountry(newProject.location.country).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <select
                      value={newProject.location.city}
                      onChange={(e) => setNewProject({
                        ...newProject,
                        location: {...newProject.location, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select City</option>
                      {newProjectCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Village *</label>
                    <input
                      type="text"
                      value={newProject.location.village}
                      onChange={(e) => setNewProject({
                        ...newProject, 
                        location: {...newProject.location, village: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Village name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      Number of Bags
                    </span>
                  </label>
                  <input
                    type="number"
                    value={newProject.numberOfBags}
                    onChange={(e) => setNewProject({
                      ...newProject, 
                      numberOfBags: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      Area
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newProject.area.value}
                      onChange={(e) => setNewProject({
                        ...newProject, 
                        area: {...newProject.area, value: parseFloat(e.target.value) || 0}
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                    <select
                      value={newProject.area.unit}
                      onChange={(e) => setNewProject({
                        ...newProject, 
                        area: {...newProject.area, unit: e.target.value as 'acres' | 'cent'}
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="acres">Acres</option>
                      <option value="cent">Cent</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex-1"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;