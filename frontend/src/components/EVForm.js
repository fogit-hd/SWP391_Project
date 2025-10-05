import React, { useState } from 'react';

function EVForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    model: '',
    type: '',
    batteryCapacity: '',
    range: '',
    costPerDay: '',
    owners: '',
    available: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert owners from comma-separated string to array
    const evData = {
      ...formData,
      costPerDay: parseFloat(formData.costPerDay),
      owners: formData.owners.split(',').map(owner => owner.trim())
    };
    
    onSubmit(evData);
    
    // Reset form
    setFormData({
      model: '',
      type: '',
      batteryCapacity: '',
      range: '',
      costPerDay: '',
      owners: '',
      available: true
    });
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>Add New Electric Vehicle</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Model:</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Type:</label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Battery Capacity:</label>
          <input
            type="text"
            name="batteryCapacity"
            value={formData.batteryCapacity}
            onChange={handleChange}
            required
            placeholder="e.g., 75 kWh"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Range:</label>
          <input
            type="text"
            name="range"
            value={formData.range}
            onChange={handleChange}
            required
            placeholder="e.g., 358 miles"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Cost per Day ($):</label>
          <input
            type="number"
            name="costPerDay"
            value={formData.costPerDay}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Owners (comma-separated):</label>
          <input
            type="text"
            name="owners"
            value={formData.owners}
            onChange={handleChange}
            required
            placeholder="e.g., John Doe, Jane Smith"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="available"
              checked={formData.available}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Available
          </label>
        </div>

        <button 
          type="submit"
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '16px'
          }}
        >
          Add EV
        </button>
      </form>
    </div>
  );
}

export default EVForm;
