import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/api';
import { DashboardStats } from '../types/Employee';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button className="btn btn-primary" onClick={fetchDashboardStats} style={{ marginLeft: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return <div className="error">No data available</div>;
  }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total_employees}</div>
          <div className="stat-label">Total Employees</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.recent_employees}</div>
          <div className="stat-label">Added Last 3 Months</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{Object.keys(stats.department_distribution).length}</div>
          <div className="stat-label">Departments</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">
            {stats.monthly_additions.reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="stat-label">Added This Year</div>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="card">
        <h3>Department Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {Object.entries(stats.department_distribution).map(([department, count]) => (
            <div key={department} style={{
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px solid #667eea'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{count}</div>
              <div style={{ color: '#6c757d' }}>{department}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Additions */}
      <div className="card">
        <h3>Recent Monthly Additions</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '20px' }}>
          {stats.monthly_additions.slice(-6).map((item) => (
            <div key={`${item.year}-${item.month}`} style={{
              padding: '12px 16px',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.count}</div>
              <div style={{ fontSize: '0.9rem' }}>{item.year}-{item.month.toString().padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
