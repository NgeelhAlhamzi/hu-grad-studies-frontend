import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Supervisors from './components/Supervisors';
import ImportExport from './components/ImportExport';
import Auth from './components/Auth';

const API_URL = 'https://hu-backend-nltw.onrender.com/api/students';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  // 🔹 1. تحميل البيانات المخبأة فوراً لمنع اختفاء البيانات عند التحديث (Refresh)
  const [students, setStudents] = useState(() => {
    const cachedStudents = localStorage.getItem('cached_students');
    return cachedStudents ? JSON.parse(cachedStudents) : [];
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchStudents();
    }
  }, []);

  // 🔹 2. دالة جلب البيانات من السيرفر وتحديث الكاش
  const fetchStudents = async () => {
    // إذا لم تكن هناك بيانات مخزنة سابقاً، أظهر مؤشر التحميل
    if (students.length === 0) setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedData = response.data || [];
      setStudents(fetchedData);
      
      // حفظ النسخة الجديدة في ذاكرة المتصفح
      localStorage.setItem('cached_students', JSON.stringify(fetchedData));
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchStudents();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('cached_students'); // مسح الكاش عند الخروج
    setIsAuthenticated(false);
    setStudents([]);
  };

  // 🔹 دالة تصفير البيانات
  const handleDataClear = () => {
    localStorage.removeItem('cached_students');
    setStudents([]);
  };

  // 🔹 دالة معالجة البيانات المستوردة
  const handleDataImported = async (newData) => {
    if (Array.isArray(newData) && newData.length > 0) {
      setStudents(newData);
      localStorage.setItem('cached_students', JSON.stringify(newData));
    } else {
      await fetchStudents();
    }
    setActivePage('students');
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
      dir="rtl" 
      className="d-flex flex-column flex-md-row min-vh-100" 
      style={{ 
        backgroundColor: '#f8fafc', 
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
      }}
    >
      {/* القائمة الجانبية المتجاوبة */}
      <Sidebar activePage={activePage} setPage={setActivePage} />

      {/* المحتوى الرئيسي المتجاوب لللابتوب والموبايل */}
      <div className="flex-grow-1 p-2 p-md-4" style={{ overflowX: 'hidden', width: '100%' }}>
        <TopNavbar title="نظام إدارة ومتابعة الدراسات العليا" onLogout={handleLogout} />

        {loading && students.length === 0 && activePage !== 'import-export' ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted fw-bold">جاري الاتصال بالسيرفر وتحديث البيانات...</p>
          </div>
        ) : (
          <>
            {activePage === 'dashboard' && <Dashboard students={students} />}
            
            {activePage === 'students' && (
              <Students students={students} onDataChange={fetchStudents} />
            )}
            
            {activePage === 'supervisors' && <Supervisors students={students} />}
            
            {activePage === 'import-export' && (
              <ImportExport 
                students={students} 
                onDataImported={handleDataImported} 
                onDataClear={handleDataClear}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;