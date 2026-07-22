import React from 'react';

function Sidebar({ activePage, setPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم والإحصاء', icon: 'fa-chart-pie' },
    { id: 'students', label: 'إدارة شؤون الطلاب', icon: 'fa-user-graduate' },
    { id: 'supervisors', label: 'مراقبة المشرفين وعبء العمل', icon: 'fa-users' },
    { id: 'import-export', label: 'استيراد وتصدير (Excel)', icon: 'fa-file-excel' },
  ];

  return (
    <>
      <style>{`
        /* تثبيت القائمة الجانبية بالجانب الأيمن */
        .sticky-sidebar-container {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 280px;
          min-width: 280px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.15);
          user-select: none;
        }

        /* تأثير الحركة للزر */
        .sidebar-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 12px 18px;
          margin-bottom: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(-5px);
        }

        .sidebar-btn.active {
          color: #ffffff;
          background: #0d6efd;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
        }

        .sidebar-btn i {
          width: 20px;
          text-align: center;
          font-size: 1.1rem;
          transition: transform 0.3s ease;
        }

        .sidebar-btn:hover i {
          transform: scale(1.2);
        }

        /* حركة أنيميشن خفيفة للشعار */
        .logo-wrapper {
          display: inline-block;
          transition: transform 0.4s ease;
        }

        .logo-wrapper:hover {
          transform: translateY(-4px) rotate(-3deg);
        }
      `}</style>

      <div className="sticky-sidebar-container p-3" dir="rtl">
        <div>
          {/* 🔹 الترويسة والشعار العالي الدقة */}
          <div className="text-center py-4 mb-2 border-bottom border-secondary border-opacity-25">
            <div className="logo-wrapper mb-2">
              {/* شعار ألوان جذاب متوافق مع كافة المتصفحات */}
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="#ffc107"/>
                <path d="M5 13.18V17.18C5 19.4 8.13 21.2 12 21.2C15.87 21.2 19 19.4 19 17.18V13.18L12 17L5 13.18Z" fill="#0d6efd"/>
              </svg>
            </div>
            <h5 className="fw-bold text-white mb-1">
              نظام الدراسات العليا
            </h5>
            <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1 small">
              المتابعة والإشراف الأكاديمي
            </span>
          </div>

          {/* 🔹 أزرار التنقل */}
          <nav className="mt-3">
            {menuItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setPage(item.id)}
                >
                  <i className={`fa-solid ${item.icon} ${isActive ? 'text-white' : 'text-primary'}`}></i>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 🔹 التذييل السكني الفاخر */}
        <div className="text-center py-3 border-top border-secondary border-opacity-25">
          <p className="text-muted small m-0 fw-semibold">
            <i className="fa-solid fa-circle-check text-success me-1"></i>
            نظام المتابعة الذكي v2.0
          </p>
        </div>
      </div>
    </>
  );
}

export default Sidebar;