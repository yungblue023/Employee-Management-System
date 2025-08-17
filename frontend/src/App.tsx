import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import { Employee } from './types/Employee';

type View = 'dashboard' | 'employees';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEmployeeChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="container">
        {currentView === 'dashboard' && (
          <Dashboard key={refreshTrigger} />
        )}
        
        {currentView === 'employees' && (
          <EmployeeList 
            key={refreshTrigger} 
            onEmployeeChange={handleEmployeeChange}
          />
        )}
      </main>
    </div>
  );
}

export default App;
