import React, { useState, useEffect } from 'react';

const ChartDataTest = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/charts');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Chart Data Test</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {chartData && (
        <div>
          <h3>Chart Data Received:</h3>
          <p><strong>Faculty Distribution:</strong> {chartData.faculty_distribution?.length || 0} items</p>
          <p><strong>Alert Types:</strong> {chartData.alert_types?.length || 0} items</p>
          <p><strong>Timeline Data:</strong> {chartData.timeline_data?.length || 0} items</p>
          
          <h4>Sample Alert Types:</h4>
          <ul>
            {chartData.alert_types?.slice(0, 3).map((item, index) => (
              <li key={index}>{item.name}: {item.value}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChartDataTest;
