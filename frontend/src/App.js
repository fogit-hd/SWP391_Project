import React, { useState, useEffect } from 'react';
import { evAPI } from './services/api';
import EVList from './components/EVList';
import EVForm from './components/EVForm';

function App() {
  const [evs, setEvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');

  // Fetch EVs from backend
  const fetchEVs = async () => {
    try {
      setLoading(true);
      const response = await evAPI.getAllEVs();
      setEvs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch EVs: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Check backend connection
  const checkConnection = async () => {
    try {
      const response = await evAPI.healthCheck();
      setConnectionStatus('✅ Connected to Backend: ' + response.message);
    } catch (err) {
      setConnectionStatus('❌ Backend not connected. Please start the backend server.');
    }
  };

  useEffect(() => {
    checkConnection();
    fetchEVs();
  }, []);

  // Handle adding new EV
  const handleAddEV = async (evData) => {
    try {
      await evAPI.createEV(evData);
      fetchEVs(); // Refresh the list
      alert('EV added successfully!');
    } catch (err) {
      alert('Failed to add EV: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle deleting EV
  const handleDeleteEV = async (id) => {
    if (window.confirm('Are you sure you want to delete this EV?')) {
      try {
        await evAPI.deleteEV(id);
        fetchEVs(); // Refresh the list
        alert('EV deleted successfully!');
      } catch (err) {
        alert('Failed to delete EV: ' + (err.message || 'Unknown error'));
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>🚗 EV Co-ownership and Cost-sharing System</h1>
        <p style={{ color: connectionStatus.includes('✅') ? 'green' : 'red' }}>
          {connectionStatus}
        </p>
      </header>

      {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <EVForm onSubmit={handleAddEV} />
      <EVList evs={evs} onDelete={handleDeleteEV} />
    </div>
  );
}

export default App;
