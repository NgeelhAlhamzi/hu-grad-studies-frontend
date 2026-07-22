import React from 'react';

function TopNavbar({ title, onLogout }) {
  const userName = localStorage.getItem('userName') || 'المستخدم';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      window.location.reload();
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm mb-4 border" dir="rtl">
      <div className="d-flex align-items-center">
        <h4 className="fw-bold m-0 text-primary fs-5">{title}</h4>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill small d-none d-md-inline-flex align-items-center">
          <i className="fa-solid fa-cloud-arrow-up me-2"></i>
          متصل بالسيرفر السحابي (Render)
        </span>

        <div className="d-flex align-items-center bg-light px-3 py-1.5 rounded-pill border">
          <i className="fa-solid fa-circle-user text-primary fs-5 ms-2"></i>
          <span className="fw-bold small text-dark me-2">{userName}</span>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold d-flex align-items-center"
          title="تسجيل الخروج"
        >
          <i className="fa-solid fa-right-from-bracket me-1"></i>
          <span className="d-none d-sm-inline">خروج</span>
        </button>
      </div>
    </div>
  );
}

export default TopNavbar;