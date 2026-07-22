import React from 'react';

function Dashboard({ students = [] }) {
  const safeStudents = Array.isArray(students) ? students : [];

  const total = safeStudents.length;
  const graduated = safeStudents.filter(s => s && s.actualDiscussDate).length;
  const active = total - graduated;

  const loads = {};
  safeStudents.forEach(s => {
    if (s && !s.actualDiscussDate && s.supervisor) {
      const name = String(s.supervisor).trim();
      if (name && name !== 'غير محدد') {
        loads[name] = (loads[name] || 0) + 1;
      }
    }
  });

  const alertSupervisorsCount = Object.keys(loads).filter(name => loads[name] > 5).length;

  const today = new Date();
  const overdueStudents = safeStudents.filter(s => {
    if (s && !s.actualDiscussDate && s.expectedDate) {
      const expDate = new Date(s.expectedDate);
      return !isNaN(expDate.getTime()) && expDate < today;
    }
    return false;
  });

  return (
    <div dir="rtl">
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="stat-card primary p-3 rounded-3 shadow-sm bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="fw-bold mb-1 text-primary">{total}</h3>
                <p className="text-muted small mb-0">إجمالي الطلاب المسجلين</p>
              </div>
              <div className="icon-box text-primary fs-2">
                <i className="fa-solid fa-user-graduate"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card warning p-3 rounded-3 shadow-sm bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="fw-bold mb-1 text-warning">{active}</h3>
                <p className="text-muted small mb-0">طلاب قيد الدراسة (نشط)</p>
              </div>
              <div className="icon-box text-warning fs-2">
                <i className="fa-solid fa-hourglass-half"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card success p-3 rounded-3 shadow-sm bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="fw-bold mb-1 text-success">{graduated}</h3>
                <p className="text-muted small mb-0">طلاب أتموا وناقشوا</p>
              </div>
              <div className="icon-box text-success fs-2">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card danger p-3 rounded-3 shadow-sm bg-white border-start border-danger border-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="fw-bold mb-1 text-danger">{alertSupervisorsCount}</h3>
                <p className="text-muted small mb-0">مشرفون تخطوا الحد (5+)</p>
              </div>
              <div className="icon-box text-danger fs-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="bg-white p-4 rounded-3 shadow-sm border h-100">
            <h5 className="fw-bold mb-3 text-dark border-bottom pb-2">
              <i className="fa-solid fa-circle-exclamation text-danger me-2"></i> 
              طلاب تأخروا عن الموعد المتوقع لمناقشتهم
            </h5>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle custom-table">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>اسم الطالب</th>
                    <th>المشرف</th>
                    <th>مدة التأخير</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueStudents.length > 0 ? (
                    overdueStudents.map((s, idx) => {
                      const expDate = new Date(s.expectedDate);
                      const diffDays = Math.ceil((today - expDate) / (1000 * 3600 * 24));
                      const months = Math.floor(diffDays / 30);
                      return (
                        <tr key={idx}>
                          <td className="fw-bold text-dark">{s.name}</td>
                          <td className="small text-secondary">{s.supervisor || 'غير محدد'}</td>
                          <td>
                            <span className="badge bg-danger">
                              تأخر بـ {months > 0 ? `${months} أشهر` : `${diffDays} يوم`} ⚠️
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        <i className="fa-solid fa-circle-check text-success me-1"></i> ممتاز! لا يوجد أي طالب متأخر عن تاريخ مناقشته.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="bg-white p-4 rounded-3 shadow-sm border h-100">
            <h5 className="fw-bold mb-3 text-dark border-bottom pb-2">
              <i className="fa-solid fa-star text-warning me-2"></i> 
              المشرفون الأكثر إشرافاً (عبء عمل نشط)
            </h5>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle custom-table">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>اسم الأستاذ / المشرف</th>
                    <th>الطلاب النشطين</th>
                    <th>مستوى العبء</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(loads).length > 0 ? (
                    Object.keys(loads)
                      .map(name => ({ name, count: loads[name] }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map((sup, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-dark">{sup.name}</td>
                          <td>
                            <span className="badge bg-primary rounded-pill px-3">{sup.count} طلاب</span>
                          </td>
                          <td>
                            {sup.count > 5 ? (
                              <span className="badge bg-danger">حِمل زائد ⚠️</span>
                            ) : (
                              <span className="badge bg-success">آمن ✅</span>
                            )}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">
                        لا تتوفر إحصائيات للمشرفين حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;