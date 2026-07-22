import React, { useState } from 'react';

function Supervisors({ students = [] }) {
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔹 دالة معالجة التواريخ
  const formatDate = (dateVal) => {
    if (!dateVal || dateVal === 'NaT' || dateVal === 'null' || dateVal === 'undefined') return '';
    const str = String(dateVal).trim();
    if (!str) return '';

    let match = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }

    match = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  // 🔹 دالة لاستخراج تواريخ الطالب
  const getStudentDates = (student) => {
    const enrollDate = formatDate(
      student.enrollDate || 
      student['تاريخ قرار الاشراف في مجلس القسم'] || 
      student['تاريخ قرار الاشراف']
    );

    const actualDiscussDate = formatDate(
      student.actualDiscussDate || 
      student['تاريخ إصدار لجنة المناقشة'] || 
      student['تاريخ المناقشة']
    );

    const expectedDate = formatDate(
      student.expectedDate || 
      student['تاريخ متوقع المناقشة']
    );

    return { enrollDate, expectedDate, actualDiscussDate };
  };

  // 1. تجميع الطلاب حسب المشرف
  const supervisorsMap = {};

  students.forEach((student) => {
    const supName = student.supervisor || student['المشرف'] || 'غير محدد';
    if (!supervisorsMap[supName]) {
      supervisorsMap[supName] = [];
    }
    supervisorsMap[supName].push(student);
  });

  // 2. حساب إحصائيات كل مشرف (نشطين + خريجون + إجمالي)
  const supervisorList = Object.keys(supervisorsMap).map((supName) => {
    const supervisorStudents = supervisorsMap[supName];
    
    let activeCount = 0;
    let discussedCount = 0;

    supervisorStudents.forEach((s) => {
      const { actualDiscussDate } = getStudentDates(s);
      if (actualDiscussDate) {
        discussedCount += 1;
      } else {
        activeCount += 1;
      }
    });

    const totalCount = supervisorStudents.length;

    return {
      name: supName,
      students: supervisorStudents,
      activeCount,
      discussedCount,
      totalCount,
    };
  });

  // 3. تصفية المشرفين بناءً على البحث
  const filteredSupervisors = supervisorList.filter((sup) =>
    sup.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenReport = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="p-4 bg-light min-vh-100">
      {/* 🔹 CSS مخصص للطباعة */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-modal, #printable-modal * {
            visibility: visible;
          }
          #printable-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 🔹 Título Header (العنوان والشارات الفوقية) */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 fw-semibold small">
            <i className="fa-regular fa-clock me-1"></i> التحديث تلقائي ومحلي 100%
          </span>
          <span className="badge bg-teal-subtle text-teal border rounded-pill px-3 py-2 fw-semibold small style-user-badge">
            <i className="fa-solid fa-user-gear me-1"></i> الموظفة المختصة
          </span>
        </div>
        <h3 className="fw-bold text-primary m-0">مراقبة المشرفين وتوزيع الحمل الأكاديمي</h3>
      </div>

      {/* ⚠️ تنبيه قاعدة الحد الأقصى */}
      <div className="alert alert-warning border-0 rounded-4 p-3 mb-4 shadow-sm bg-warning-subtle text-dark">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h6 className="fw-bold mb-1 text-dark">
              قاعدة الحد الأقصى للإشراف الأكاديمي (جامعة حضرموت)
            </h6>
            <p className="mb-0 small text-muted">
              يُنبّه النظام تلقائياً باللون الأحمر الوامض عند وصول عبء إشراف عضو هيئة التدريس لأكثر من <strong className="text-dark">5 طلاب نشطين (لم يناقشوا بعد)</strong> لمساعدة نيابة الدراسات العليا على تنظيم الحمل الأكاديمي بشكل عادل.
            </p>
          </div>
          <div className="fs-2 text-warning ms-3">⚠️</div>
        </div>
      </div>

      {/* 🔍 شريط البحث */}
      <div className="d-flex justify-content-end mb-3">
        <div className="position-relative" style={{ width: '300px' }}>
          <input
            type="text"
            className="form-control rounded-pill bg-white border-0 shadow-sm ps-4 pe-5"
            placeholder="ابحث عن اسم المشرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fa-solid fa-magnifying-glass position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
        </div>
      </div>

      {/* 🔹 جدول المشرفين المطابق للواجهة */}
      <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0 text-center">
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr className="text-secondary small fw-bold py-3">
                <th className="text-start px-4 py-3">اسم المشرف الأكاديمي</th>
                <th className="py-3">إجمالي الطلاب المسجلين</th>
                <th className="py-3">طلاب لم يناقشوا بعد (نشطين)</th>
                <th className="py-3">طلاب ناقشوا (خريجون)</th>
                <th className="py-3">حالة عبء العمل الإجمالي ومستوى الحمل</th>
                <th className="py-3">استخراج كشف المشرف مع طلابه</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupervisors.length > 0 ? (
                filteredSupervisors.map((sup, index) => (
                  <tr key={index} className="border-bottom">
                    {/* اسم المشرف */}
                    <td className="fw-bold text-dark text-start px-4 py-3">
                      <i className="fa-solid fa-user-tie text-secondary me-2"></i>
                      {sup.name}
                    </td>

                    {/* إجمالي الطلاب */}
                    <td className="py-3">
                      <span className="badge bg-secondary rounded-2 px-3 py-2 fw-bold">
                        {sup.totalCount}
                      </span>
                    </td>

                    {/* نشطين */}
                    <td className="py-3">
                      <span className="badge bg-warning text-dark rounded-2 px-3 py-2 fw-bold">
                        {sup.activeCount}
                      </span>
                    </td>

                    {/* ناقشوا */}
                    <td className="py-3">
                      <span className="badge bg-success rounded-2 px-3 py-2 fw-bold">
                        {sup.discussedCount}
                      </span>
                    </td>

                    {/* حالة العبء */}
                    <td className="py-3">
                      {sup.activeCount >= 5 ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger px-3 py-2 rounded-pill fw-bold">
                          تجاوز النصاب ⚠️
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold">
                          طبيعي وآمن ✅
                        </span>
                      )}
                    </td>

                    {/* زر الطباعة */}
                    <td className="py-3">
                      <button
                        className="btn btn-dark btn-sm rounded-3 px-3 py-2 fw-bold shadow-sm"
                        style={{ backgroundColor: '#1e293b', borderColor: '#1e293b' }}
                        onClick={() => handleOpenReport(sup)}
                      >
                        <i className="fa-solid fa-print me-2"></i>
                        عرض وطباعة الكشف
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    لا يوجد مشرف بهذا الاسم حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 النافذة المنبثقة (التقرير وتفاصيل الطلاب) */}
      {showModal && selectedSupervisor && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" id="printable-modal">
              
              <div
                className="p-3 text-white d-flex justify-content-between align-items-center no-print"
                style={{ backgroundColor: '#1e293b' }}
              >
                <div className="d-flex align-items-center gap-2 fw-bold fs-6">
                  <i className="fa-solid fa-file-contract"></i>
                  <span>كشف تقرير الإشراف وتفاصيل طلاب المشرف</span>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-white">
                <div className="text-center mb-4">
                  <div className="text-primary mb-2" style={{ fontSize: '2.5rem' }}>
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <h4 className="fw-bold text-dark m-0" style={{ fontSize: '1.4rem' }}>
                    جامعة حضرموت - نيابة الدراسات العليا
                  </h4>
                  <p className="text-secondary small fw-semibold mt-1">
                    تقرير حمل الإشراف الأكاديمي والرسائل العلمية
                  </p>
                </div>

                <div
                  className="p-3 rounded-3 mb-4 border"
                  style={{ backgroundColor: '#f8fafc' }}
                >
                  <div className="row g-2 align-items-center">
                    <div className="col-md-7">
                      <div className="mb-2">
                        <span className="fw-bold text-dark">اسم المشرف: </span>
                        <span className="fw-bold text-primary fs-6">{selectedSupervisor.name}</span>
                      </div>
                      <div>
                        <span className="fw-bold text-dark">عدد الإشرافات الإجمالي: </span>
                        <span className="fw-semibold text-secondary">{selectedSupervisor.totalCount} طلاب</span>
                      </div>
                    </div>
                    <div className="col-md-5 text-md-end">
                      <div className="mb-2">
                        <span className="fw-bold text-dark">الطلاب النشطين (لم يناقشوا): </span>
                        <span className="fw-bold text-warning">{selectedSupervisor.activeCount} طلاب</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-md-end gap-2">
                        <span className="fw-bold text-dark small">الحالة العامة للعبء الأكاديمي: </span>
                        {selectedSupervisor.activeCount >= 5 ? (
                          <span className="badge bg-danger text-white px-2 py-1 rounded-1 small fw-bold">
                            تجاوز النصاب ⚠️
                          </span>
                        ) : (
                          <span className="badge bg-success text-white px-2 py-1 rounded-1 small fw-bold">
                            آمن وممتاز ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered align-middle text-center mb-0">
                    <thead style={{ backgroundColor: '#fafafa' }}>
                      <tr className="text-dark small fw-bold">
                        <th style={{ width: '22%' }}>اسم الطالب</th>
                        <th style={{ width: '28%' }}>القسم والتخصص</th>
                        <th style={{ width: '20%' }}>تاريخ قرار الإشراف</th>
                        <th style={{ width: '20%' }}>تاريخ المناقشة</th>
                        <th style={{ width: '10%' }}>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupervisor.students.map((student, idx) => {
                        const { enrollDate, expectedDate, actualDiscussDate } = getStudentDates(student);
                        const isDiscussed = Boolean(actualDiscussDate);
                        const studentName = student.name || student['اسم الطالب'] || 'غير محدد';
                        const deptName = student.department || student['القسم'] || 'غير محدد';
                        const specName = student.specialty || student['التخصص'] || '';

                        return (
                          <tr key={idx} className="small">
                            <td className="fw-bold text-dark">{studentName}</td>
                            <td className="text-muted">
                              <div className="fw-semibold text-dark">{deptName}</div>
                              {specName && <div className="small text-muted">{specName}</div>}
                            </td>
                            <td className="text-secondary fw-semibold">
                              {enrollDate || '—'}
                            </td>
                            <td className="text-secondary fw-semibold">
                              {actualDiscussDate ? (
                                <span className="text-success fw-bold">{actualDiscussDate} (فعلي)</span>
                              ) : expectedDate ? (
                                <span>{expectedDate} (متوقع)</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {isDiscussed ? (
                                <span className="badge bg-success text-white px-2 py-1 rounded-1 fw-bold small">
                                  ناقش
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark px-2 py-1 rounded-1 fw-bold small">
                                  لم يناقش
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light border-top-0 d-flex justify-content-start gap-2 p-3 no-print">
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-4 rounded-2"
                  onClick={handlePrint}
                >
                  <i className="fa-solid fa-print me-2"></i>
                  طباعة هذا التقرير
                </button>
                <button
                  type="button"
                  className="btn btn-secondary fw-bold px-4 rounded-2"
                  onClick={() => setShowModal(false)}
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Supervisors;