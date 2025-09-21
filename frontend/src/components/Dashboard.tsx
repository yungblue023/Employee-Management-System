/**
 * Dashboard component with interactive charts and analytics
 * Features: Department distribution, salary analysis, age demographics
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import EmployeeAPI from '../services/api';
import { Employee, DepartmentStats, AgeDemographic } from '../types/Employee';

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [ageStats, setAgeStats] = useState<AgeDemographic[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vibrant Chart colors
  const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#a55eea'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch summary stats from backend
      const stats = await EmployeeAPI.getDashboardStats();
      setSummaryStats(stats);
      // Fetch all employees for charts/lists (optional, or use stats for charts)
      const employeesData = await EmployeeAPI.getAllEmployees(0, 100);
      setEmployees(employeesData);
      // If you want to use backend stats for charts, setDepartmentStats(stats.department_distribution ? Object.entries(stats.department_distribution).map(([dept, count]) => ({ _id: dept, count })) : []);
      // For now, keep local processing for charts
      const deptStats = processeDepartmentStats(employeesData);
      setDepartmentStats(deptStats);
      const ageData = processAgeStats(employeesData);
      setAgeStats(ageData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processeDepartmentStats = (employees: Employee[]): DepartmentStats[] => {
    const deptMap = new Map<string, { count: number; totalSalary: number; totalAge: number }>();
    
    employees.forEach(emp => {
      const dept = emp.department;
      const current = deptMap.get(dept) || { count: 0, totalSalary: 0, totalAge: 0 };
      
      deptMap.set(dept, {
        count: current.count + 1,
        totalSalary: current.totalSalary + (emp.salary || 0),
        totalAge: current.totalAge + emp.age
      });
    });
    
    return Array.from(deptMap.entries()).map(([dept, stats]) => ({
      _id: dept,
      count: stats.count,
      avg_salary: stats.totalSalary / stats.count,
      avg_age: stats.totalAge / stats.count
    })).sort((a, b) => b.count - a.count);
  };

  const processAgeStats = (employees: Employee[]): AgeDemographic[] => {
    const ageGroups = [
      { range: '20-25', min: 20, max: 25 },
      { range: '26-30', min: 26, max: 30 },
      { range: '31-35', min: 31, max: 35 },
      { range: '36-40', min: 36, max: 40 },
      { range: '41+', min: 41, max: 100 }
    ];
    
    return ageGroups.map(group => {
      const groupEmployees = employees.filter(emp => emp.age >= group.min && emp.age <= group.max);
      const avgSalary = groupEmployees.length > 0 
        ? groupEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / groupEmployees.length 
        : 0;
      
      return {
        _id: group.range,
        count: groupEmployees.length,
        avg_salary: avgSalary
      };
    }).filter(group => group.count > 0);
  };

  // Use backend summaryStats directly

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Employee Analytics Dashboard</h2>
        <p>Comprehensive insights and data visualization</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3>{summaryStats?.total_employees ?? 0}</h3>
            <p>Total Employees</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>${(summaryStats?.salary_stats?.avg_salary ?? 0).toLocaleString()}</h3>
            <p>Average Salary</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <h3>{summaryStats?.recent_employees ?? 0}</h3>
            <p>Recent Hires (6 months)</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Department Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Department Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, count, percent }) => `${_id}: ${count} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#1e293b'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Demographics */}
        <div className="chart-card">
          <h3>Age Demographics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ageStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#1e293b'
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Large Average Salary Chart */}
      <div className="chart-card large-chart">
        <h3>Average Salary by Department</h3>
        <ResponsiveContainer width="100%" height={550}>
          <BarChart data={departmentStats} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="_id"
              angle={-45}
              textAnchor="end"
              height={120}
              fontSize={12}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" />
            <Tooltip
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Avg Salary']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b'
              }}
            />
            <Bar dataKey="avg_salary" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <div className="stat-section">
          <h3>Department Breakdown</h3>
          <div className="dept-list">
            {departmentStats.map((dept, index) => (
              <div key={dept._id} className="dept-item">
                <div className="dept-info">
                  <span className="dept-name" style={{ color: COLORS[index % COLORS.length] }}>
                    {dept._id}
                  </span>
                  <span className="dept-stats">
                    {dept.count} employees • Avg: ${dept.avg_salary.toLocaleString()} • Age: {dept.avg_age.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
