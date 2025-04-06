'use client';

import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function ExampleComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Bir tablodan veri çekme örneği
        const { data, error } = await supabase
          .from('your_table_name')
          .select('*');
        
        if (error) throw error;
        setData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div>
      <h2>Data from Supabase</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {data.map((item) => (
            <li key={item.id}>{item.name || item.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
