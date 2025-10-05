import React from 'react';

function EVList({ evs, onDelete }) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h2>Available Electric Vehicles</h2>
      {evs.length === 0 ? (
        <p>No electric vehicles available.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {evs.map((ev) => (
            <div 
              key={ev.id} 
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: ev.available ? '#f9f9f9' : '#ffe6e6'
              }}
            >
              <h3 style={{ marginTop: 0 }}>{ev.model}</h3>
              <p><strong>Type:</strong> {ev.type}</p>
              <p><strong>Battery:</strong> {ev.batteryCapacity}</p>
              <p><strong>Range:</strong> {ev.range}</p>
              <p><strong>Cost per Day:</strong> ${ev.costPerDay}</p>
              <p><strong>Status:</strong> {ev.available ? '✅ Available' : '❌ Not Available'}</p>
              <p><strong>Owners:</strong> {ev.owners.join(', ')}</p>
              <button 
                onClick={() => onDelete(ev.id)}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EVList;
