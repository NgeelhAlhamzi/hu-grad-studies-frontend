import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://hu-backend-nltw.onrender.com/api/students';

function Students({ students: initialStudents = [], onDataChange }) {
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    supervisor: '',
    enrollDate: '',
    expectedDate: '',
    actualDiscussDate: '',
    degree: 'ماجستير',
    status: 'لم يناقش'
  });

  // 🔹 تحميل مكتبة FontAwesome تلقائياً لضمان ظهور الأيقونات
  useEffect(() => {
    const linkId = 'font-awesome-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // 🔹 دالة تنسيق التاريخ
  const formatDate = (dateVal) => {
    if (!dateVal || dateVal === 'NaT' || dateVal === 'null' || dateVal === 'undefined') return '';
    const str = String(dateVal).trim();
    if (!str) return '';

    let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }

    match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
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

  const getStudentDates = (student) => {
    const enrollDate = formatDate(
      student.enrollDate || 
      student['تاريخ قرار الاشراف في مجلس القسم'] || 
      student['تاريخ قرار الاشراف'] ||
      student['تاريخ التسجيل'] ||
      student.registrationDate
    );

    const actualDiscussDate = formatDate(
      student.actualDiscussDate || 
      student['تاريخ إصدار لجنة المناقشة'] || 
      student['تاريخ المناقشة'] ||
      student['تاريخ المناقشة الفعلي'] ||
      student.discussionDate
    );

    let expectedDate = formatDate(
      student.expectedDate || 
      student['تاريخ متوقع المناقشة'] ||
      student['التاريخ المتوقع']
    );

    if (!expectedDate && enrollDate) {
      expectedDate = calculateOneYearLater(enrollDate);
    }

    return { enrollDate, expectedDate, actualDiscussDate };
  };

  const getStudentStatus = (student) => {
    const { actualDiscussDate } = getStudentDates(student);
    const rawStatus = student.status || student.studentStatus || student['حالة الطالب'] || student['الحالة'] || '';

    if (rawStatus) {
      const clean = String(rawStatus).trim();
      if (clean.includes('ناقش') || clean.includes('مكتمل') || clean.includes('خريج')) {
        return { isDiscussed: true, label: 'ناقش بنجاح' };
      }
      if (clean.includes('لم يناقش') || clean.includes('مستمر') || clean.includes('قيد')) {
        return { isDiscussed: false, label: 'لم يناقش' };
      }
    }

    if (actualDiscussDate) {
      return { isDiscussed: true, label: 'ناقش بنجاح' };
    }

    return { isDiscussed: false, label: 'لم يناقش' };
  };

  const calculateOneYearLater = (startDateStr) => {
    const cleanDate = formatDate(startDateStr);
    if (!cleanDate) return '';
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 1;
      return `${year}-${parts[1]}-${parts[2]}`;
    }
    return '';
  };

  const calculateTimeStatus = (expectedDateStr, actualDateStr) => {
    if (actualDateStr) {
      return { text: 'ناقش بنجاح 🎓', type: 'success' };
    }

    const cleanExpected = formatDate(expectedDateStr);
    if (!cleanExpected) return { text: 'قيد الدراسة', type: 'info' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parts = cleanExpected.split('-');
    const expected = new Date(parts[0], parts[1] - 1, parts[2]);

    if (isNaN(expected.getTime())) return { text: 'قيد الدراسة', type: 'info' };

    const diffDays = Math.ceil((expected - today) / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30);

    if (diffDays < 0) {
      const monthsOver = Math.abs(diffMonths);
      return { 
        text: `متأخر بـ ${monthsOver === 0 ? 'أيام' : `${monthsOver} شهر`} ⚠️`, 
        type: 'danger' 
      };
    } else {
      return { 
        text: `متبقي ${diffMonths === 0 ? 'أقل من شهر' : `${diffMonths} شهر`} ⏳`, 
        type: 'warning' 
      };
    }
  };

  const getSupervisorUnfinishedCount = (supervisorName) => {
    if (!supervisorName || !supervisorName.trim()) return 0;

    return students.filter(s => {
      const sup = s.supervisor || s['المشرف'] || s['اسم المشرف'] || '';
      const { isDiscussed } = getStudentStatus(s);
      const studentId = s.id || s._id;

      if (editId && String(studentId) === String(editId)) return false;

      const isSameSupervisor = sup.trim().toLowerCase() === supervisorName.trim().toLowerCase();
      return isSameSupervisor && !isDiscussed;
    }).length;
  };

  const handleEnrollDateChange = (e) => {
    const newEnrollDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      enrollDate: newEnrollDate,
      expectedDate: calculateOneYearLater(newEnrollDate)
    }));
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditId(student.id || student._id);
      const { enrollDate, expectedDate, actualDiscussDate } = getStudentDates(student);
      const statusInfo = getStudentStatus(student);

      setFormData({
        name: student.name || student['اسم الطالب'] || student['اسم الطالب ثلاثي'] || '',
        department: student.department || student['القسم'] || student['القسم والتخصص'] || '',
        supervisor: student.supervisor || student['المشرف'] || student['اسم المشرف'] || '',
        enrollDate: enrollDate,
        expectedDate: expectedDate,
        actualDiscussDate: actualDiscussDate,
        degree: student.degree || student['الدرجة'] || 'ماجستير',
        status: statusInfo.isDiscussed ? 'ناقش' : 'لم يناقش'
      });
    } else {
      const todayStr = formatDate(new Date());
      setEditId(null);
      setFormData({
        name: '',
        department: '',
        supervisor: '',
        enrollDate: todayStr,
        expectedDate: calculateOneYearLater(todayStr),
        actualDiscussDate: '',
        degree: 'ماجستير',
        status: 'لم يناقش'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const unfinishedCount = getSupervisorUnfinishedCount(formData.supervisor);
    const isAddingUnfinishedStudent = !formData.actualDiscussDate && formData.status !== 'ناقش';

    if (unfinishedCount >= 5 && isAddingUnfinishedStudent) {
      const isConfirmed = window.confirm(
        `⚠️ تنبيه هام (شرط الإشراف):\n\nالمشرف (${formData.supervisor}) لديه حالياً (${unfinishedCount}) طلاب لم يناقشوا بعد.\n\nهل ترغبين في المتابعة وحفظ الطالب رغم تجاوز النصاب؟`
      );
      if (!isConfirmed) return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData, { headers });
      } else {
        await axios.post(API_URL, formData, { headers });
      }
      handleCloseModal();
      if (onDataChange) await onDataChange();
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنتِ متأكدة من حذف هذا الطالب؟')) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (onDataChange) await onDataChange();
      } catch (error) {
        console.error('خطأ في الحذف:', error);
        alert('حدث خطأ أثناء الحذف');
      } finally {
        setLoading(false);
      }
    }
  };

  const safeStudents = Array.isArray(students) ? students : [];

  const filteredStudents = safeStudents.filter(s => {
    const name = s.name || s['اسم الطالب'] || s['اسم الطالب ثلاثي'] || '';
    const supervisor = s.supervisor || s['المشرف'] || s['اسم المشرف'] || '';
    const department = s.department || s['القسم'] || s['القسم والتخصص'] || '';
    const { isDiscussed } = getStudentStatus(s);

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ناقش') return matchesSearch && isDiscussed;
    if (statusFilter === 'لم يناقش') return matchesSearch && !isDiscussed;
    return matchesSearch;
  }).reverse();

  const modalUnfinishedCount = getSupervisorUnfinishedCount(formData.supervisor);

  return (
    <div dir="rtl" className="container-fluid p-2 p-md-3">
      {/* 🔹 شريط العنوان */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="fw-bold text-primary m-0">إدارة شؤون طلاب الدراسات العليا</h4>
        <span className="badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill fw-bold">
          <i className="fa-solid fa-user-check me-1"></i> الموظفة المختصة
        </span>
      </div>

      {/* 🔹 شريط البحث والتصفية */}
      <div className="card border-0 shadow-sm p-3 mb-3 rounded-3 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-bold text-secondary mb-1">
              🔍 البحث:
            </label>
            <input
              type="text"
              className="form-control form-control-sm bg-light border-0 shadow-none"
              placeholder="ابحث عن اسم الطالب أو المشرف أو القسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-bold text-secondary mb-1">
              🌪️ التصفية:
            </label>
            <select
              className="form-select form-select-sm bg-light border-0 shadow-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="الكل">عرض الكل</option>
              <option value="ناقش">ناقش بنجاح</option>
              <option value="لم يناقش">قيد الدراسة / لم يناقش</option>
            </select>
          </div>

          <div className="col-12 col-md-4 text-md-end mt-2 mt-md-auto">
            <button
              className="btn btn-primary btn-sm fw-bold w-100 py-2 shadow-sm rounded-3"
              onClick={() => handleOpenModal()}
            >
              <i className="fa-solid fa-plus me-1"></i> + إضافة طالب جديد
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 جدول الطلاب المتجاوب مع كافة الأجهزة */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <div className="table-responsive" style={{ maxHeight: '75vh' }}>
          <table className="table table-hover align-middle mb-0 text-center style-table">
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr className="text-secondary small fw-bold">
                <th style={{ width: '35px' }}>م</th>
                <th>اسم الطالب</th>
                <th>القسم والتخصص</th>
                <th>المشرف العلمي</th>
                <th>تاريخ القرار</th>
                <th>المناقشة (متوقع / فعلي)</th>
                <th>المدة المتبقية</th>
                <th>الحالة</th>
                <th style={{ width: '80px' }}>إجراء</th>
              </tr>
            </thead>
            <tbody className="small">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const studentName = student.name || student['اسم الطالب'] || student['اسم الطالب ثلاثي'] || 'غير محدد';
                  const supervisorName = student.supervisor || student['المشرف'] || student['اسم المشرف'] || 'غير محدد';
                  const deptName = student.department || student['القسم'] || student['القسم والتخصص'] || '';
                  const specName = student.specialty || student['التخصص'] || '';

                  const { enrollDate, expectedDate, actualDiscussDate } = getStudentDates(student);
                  const statusInfo = getStudentStatus(student);
                  const unfinishedCount = getSupervisorUnfinishedCount(supervisorName);
                  const timeStatus = calculateTimeStatus(expectedDate, actualDiscussDate);

                  return (
                    <tr key={student.id || student._id || index} className="border-bottom">
                      <td className="fw-bold text-muted">{index + 1}</td>

                      <td className="fw-bold text-dark text-start px-2" style={{ minWidth: '130px' }}>
                        {studentName}
                        <div className="text-muted style-subtext">{student.degree || student['الدرجة'] || 'ماجستير'}</div>
                      </td>

                      <td style={{ minWidth: '120px' }}>
                        <div className="fw-semibold text-dark">{deptName}</div>
                        {specName && <div className="text-muted style-subtext">{specName}</div>}
                      </td>

                      <td style={{ minWidth: '130px' }}>
                        <div className="fw-bold text-dark">{supervisorName}</div>
                        {unfinishedCount >= 5 && (
                          <span className="badge bg-danger-subtle text-danger border border-danger rounded-pill px-1 style-subtext d-block mt-1">
                            ⚠️ تجاوز النصاب ({unfinishedCount})
                          </span>
                        )}
                      </td>

                      <td className="fw-semibold text-secondary" style={{ minWidth: '100px' }}>
                        {enrollDate ? enrollDate : <span className="text-muted">—</span>}
                      </td>

                      <td style={{ minWidth: '140px' }}>
                        <div className="text-muted style-subtext">متوقع: {expectedDate || '—'}</div>
                        {actualDiscussDate ? (
                          <div className="text-success fw-bold style-subtext">فعلي: {actualDiscussDate}</div>
                        ) : (
                          <div className="text-secondary opacity-75 style-subtext">فعلي: —</div>
                        )}
                      </td>

                      <td style={{ minWidth: '120px' }}>
                        <span className={`badge bg-${timeStatus.type}-subtle text-${timeStatus.type} border border-${timeStatus.type} px-2 py-1 rounded-2 fw-bold style-subtext`}>
                          {timeStatus.text}
                        </span>
                      </td>

                      {/* 🔹 حالة الطالب */}
                      <td style={{ minWidth: '90px' }}>
                        {statusInfo.isDiscussed ? (
                          <span className="badge bg-success px-2 py-1 rounded-pill style-subtext fw-bold">
                            🎓 {statusInfo.label}
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark px-2 py-1 rounded-pill style-subtext fw-bold">
                            ⏳ {statusInfo.label}
                          </span>
                        )}
                      </td>

                      {/* 🔹 أزرار الأيقونات المصغرة والأنيقة للغاية */}
                      <td style={{ minWidth: '80px' }}>
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-outline-primary btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleOpenModal(student)}
                            title="تعديل"
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>
                          </button>
                          
                          <button
                            className="btn btn-outline-danger btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '28px', height: '28px' }}
                            onClick={() => handleDelete(student.id || student._id)}
                            title="حذف"
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: '11px' }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    لا توجد بيانات مطابقة للبحث حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 النافذة المنبثقة للإضافة والتعديل */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered p-2">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white rounded-top-4 py-2 px-3">
                <h6 className="modal-title fw-bold m-0">
                  {editId ? '📝 تعديل بيانات طالب' : '➕ إضافة طالب جديد'}
                </h6>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-3">

                  {/* 🚨 شريط تحذيري */}
                  {formData.supervisor && modalUnfinishedCount >= 5 && !formData.actualDiscussDate && formData.status !== 'ناقش' && (
                    <div className="alert alert-danger border-danger d-flex align-items-center gap-2 mb-3 rounded-3 p-2 small">
                      <span className="fs-5">⚠️</span>
                      <div>
                        <strong>تحذير الإشراف:</strong> المشرف <u>{formData.supervisor}</u> يمتلك حالياً <strong>{modalUnfinishedCount} طلاب لم يناقشوا بعد</strong> (تجاوز النصاب).
                      </div>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold mb-1">اسم الطالب الكامل</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold mb-1">القسم والتخصص</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold mb-1">المشرف العلمي</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.supervisor}
                        onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold mb-1">حالة الطالب</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="لم يناقش">لم يناقش / قيد الدراسة</option>
                        <option value="ناقش">ناقش بنجاح</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold mb-1">تاريخ قرار الإشراف</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={formData.enrollDate}
                        onChange={handleEnrollDateChange}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold mb-1">المتوقع للمناقشة</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={formData.expectedDate}
                        onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold mb-1">التاريخ الفعلي (إن وجد)</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={formData.actualDiscussDate}
                        onChange={(e) => setFormData({ ...formData, actualDiscussDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light rounded-bottom-4 py-2 px-3">
                  <button type="button" className="btn btn-secondary btn-sm fw-bold" onClick={handleCloseModal}>إلغاء</button>
                  <button type="submit" className="btn btn-primary btn-sm fw-bold" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 تنسيقات CSS إضافية لتحسين الجودة والتجاوب */}
      <style>{`
        .style-subtext {
          font-size: 0.75rem !important;
        }
        .style-table td, .style-table th {
          padding: 8px 4px !important;
          vertical-align: middle;
        }
        @media (max-width: 576px) {
          .style-table th, .style-table td {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Students;