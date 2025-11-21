import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable gradient back button for Staff pages.
 * Props:
 *  - to: target path (default '/staff/dashboard')
 *  - label: text shown (default 'Về Staff Dashboard')
 *  - inline: if true render inline style variant instead of fixed floating.
 */
export function StaffBackButton({ to = '/staff/dashboard', label = 'Về Staff Dashboard', inline = false }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={inline ? 'back-dashboard-btn back-dashboard-btn--inline' : 'back-dashboard-btn'}
      onClick={() => navigate(to)}
    >
      <span className="back-icon" aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}

export default StaffBackButton;
