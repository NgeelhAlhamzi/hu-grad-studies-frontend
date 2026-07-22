import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_URL = 'https://hu-backend-nltw.onrender.com/api/students';

function ImportExport({ students = [], onDataImported, onDataClear }) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isError, setIsError] = useState(false);
  const cancelControllerRef = useRef(null);

  // 🔹 دالة معالجة التواريخ
  const formatDateValue = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const str = String(val).trim();
    if (!str || str === 'NaT' || str === 'null' || str === 'undefined') return '';

    let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;

    match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;

    return str;
  };

  const handleCloseModal = () => {
    if (cancelControllerRef.current) {
      cancelControllerRef.current.abort();
    }
    setLoading(false);
    setShowStatusModal(false);
  };

  // 🔹 تصدير البيانات
  const handleExport = () => {
    try {
      if (!students || students.length === 0) {
        alert('⚠️ لا توجد بيانات طلاب حالياً لتصديرها!');
        return;
      }

      const exportData = students.map((s, index) => ({
        'م': index + 1,
        'اسم الطالب': s.name || '',
        'الدرجة العلمية': s.degree || 'ماجستير',
        'القسم والتخصص': s.department || '',
        'المشرف العلمي': s.supervisor || '',
        'تاريخ قرار الإشراف': s.enrollDate || '',
        'تاريخ المناقشة المتوقع': s.expectedDate || '',
        'تاريخ المناقشة الفعلي': s.actualDiscussDate || '',
        'الحالة': s.actualDiscussDate ? 'ناقش' : 'لم يناقش'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');

      XLSX.writeFile(workbook, `كشف_طلاب_الدراسات_العليا_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('خطأ التصدير:', error);
      alert('❌ حدث خطأ أثناء التصدير.');
    }
  };

  // 🔹 استيراد ورفع البيانات (سرعة فائقة دفعة واحدة)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    cancelControllerRef.current = new AbortController();

    setLoading(true);
    setIsError(false);
    setShowStatusModal(true);
    setStatusMessage('جاري قراءة وتحليل ملف الإكسل...');

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          setIsError(true);
          setStatusMessage('⚠️ ملف الإكسل فارغ!');
          setLoading(false);
          return;
        }

        const formattedStudents = rawData.map((row) => {
          const keys = Object.keys(row);
          const firstValue = keys.length > 0 ? row[keys[0]] : '';
          const secondValue = keys.length > 1 ? row[keys[1]] : '';

          const name = row['اسم الطالب'] || row['الاسم'] || row['اسم الطالب الكامل'] || row['Name'] || secondValue || firstValue || '';
          const department = row['القسم والتخصص'] || row['القسم'] || row['التخصص'] || row['Department'] || 'دراسات عليا';
          const supervisor = row['المشرف العلمي'] || row['المشرف'] || row['Supervisor'] || 'غير محدد';
          const degree = row['الدرجة العلمية'] || row['الدرجة'] || row['Degree'] || 'ماجستير';

          const enrollDate = formatDateValue(
            row['تاريخ قرار الإشراف'] || row['تاريخ قرار الاشراف في مجلس القسم'] || row['تاريخ الإشراف'] || row['enrollDate']
          );

          const expectedDate = formatDateValue(
            row['تاريخ المناقشة المتوقع'] || row['تاريخ متوقع المناقشة'] || row['expectedDate']
          );

          const actualDiscussDate = formatDateValue(
            row['تاريخ المناقشة الفعلي'] || row['تاريخ إصدار لجنة المناقشة'] || row['actualDiscussDate']
          );

          return {
            name: String(name).trim(),
            degree: String(degree).trim(),
            department: String(department).trim(),
            supervisor: String(supervisor).trim(),
            enrollDate,
            expectedDate,
            actualDiscussDate
          };
        }).filter(s => s.name !== '' && s.name !== 'م' && s.name !== 'ت');

        if (formattedStudents.length === 0) {
          setIsError(true);
          setStatusMessage('⚠️ لم يتم العثور على أسماء طلاب صالحة في الملف!');
          setLoading(false);
          return;
        }

        setStatusMessage(`جاري حفظ ${formattedStudents.length} طالب في السيرفر دفعة واحدة...`);

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 🚀 إرسال قائمة الطلاب كاملة في طلب واحد سريع
        try {
          // جرب أولاً إرسال القائمة كاملة
          await axios.post(API_URL, formattedStudents, { 
            headers,
            signal: cancelControllerRef.current.signal
          });
          
          setIsError(false);
          setStatusMessage(`✅ تم حفظ جميع الطلاب (${formattedStudents.length} طالب) بنجاح!`);
          
          if (onDataImported) {
            await onDataImported(formattedStudents);
          }
        } catch (postError) {
          // إذا كان السيرفر لا يدعم الإرسال المجمع في POST واحدة، نلجأ إلى الحفظ المتتابع الفوري
          console.warn('السيرفر لا يقبل المصفوفات المباشرة، يتم الحفظ التتابعي:', postError);
          
          let successCount = 0;
          for (let i = 0; i < formattedStudents.length; i++) {
            try {
              await axios.post(API_URL, formattedStudents[i], { headers });
              successCount++;
              setStatusMessage(`جاري الحفظ: ${successCount} من أصل ${formattedStudents.length}...`);
            } catch (err) {
              console.error('خطأ في حفظ الطالب:', formattedStudents[i].name);
            }
          }

          if (successCount > 0) {
            setIsError(false);
            setStatusMessage(`✅ اكتمل الحفظ! تم إضافة ${successCount} طالب بنجاح.`);
            if (onDataImported) {
              await onDataImported();
            }
          } else {
            throw new Error('فشل الحفظ في السيرفر.');
          }
        }

      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') return;
        console.error('خطأ الاستيراد:', err);
        setIsError(true);
        setStatusMessage(`❌ حدث خطأ: ${err.response?.data?.message || err.message || 'تعذر الاتصال بالسيرفر'}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div dir="rtl" className="p-2">
      <div className="bg-light p-3 rounded-3 mb-4 text-center border">
        <h4 className="fw-bold text-primary m-0">نظام إدارة ومتابعة الدراسات العليا</h4>
      </div>

      <div className="row g-4">
        {/* رفع واستيراد الملف */}
        <div className="col-md-6">
          <div className="card h-100 border-0 shadow-sm p-4 text-center rounded-4">
            <h5 className="fw-bold text-primary mb-2">
              <i className="fa-solid fa-cloud-arrow-up me-2"></i>
              استيراد ورفع كشف الطلاب (Excel)
            </h5>
            <p className="text-muted small mb-4">
              رفع ملف Excel وحفظ سجلات الطلاب مباشرة في السيرفر.
            </p>

            <div className="border border-2 border-dashed rounded-4 p-4 bg-light d-flex flex-column align-items-center justify-content-center">
              <i className="fa-solid fa-file-excel text-success display-4 mb-3"></i>

              <label 
                htmlFor="excel-upload" 
                className={`btn btn-outline-success fw-bold px-4 py-2 rounded-3 ${loading ? 'disabled' : ''}`}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <i className="fa-solid fa-file-import me-2"></i>
                {loading ? '⚡ جاري المعالجة...' : 'اختاري ملف الإكسل لرفعه'}
              </label>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx, .xls"
                className="d-none"
                onChange={handleFileUpload}
                disabled={loading}
              />
              <span className="text-muted small mt-2">الصيغ المقبولة: xlsx. أو xls.</span>
            </div>
          </div>
        </div>

        {/* تصدير الملف */}
        <div className="col-md-6">
          <div className="card h-100 border-0 shadow-sm p-4 text-center rounded-4">
            <h5 className="fw-bold text-success mb-2">
              <i className="fa-solid fa-cloud-arrow-down me-2"></i>
              تصدير البيانات والنسخ الاحتياطي
            </h5>
            <p className="text-muted small mb-4">
              تصدير سجلات الطلاب المحفوظة في السيرفر إلى ملف إكسل.
            </p>

            <div className="d-flex flex-column gap-3 mt-auto">
              <button
                className="btn btn-success btn-lg fw-bold rounded-3 shadow-sm py-3"
                onClick={handleExport}
                disabled={loading}
              >
                <i className="fa-solid fa-file-excel me-2"></i>
                تصدير البيانات إلى Excel
              </button>

              <button
                className="btn btn-outline-danger fw-bold rounded-3 py-2"
                onClick={() => {
                  if (window.confirm('⚠️ هل أنتِ متأكدة من تصفير الواجهة؟')) {
                    if (onDataClear) onDataClear();
                  }
                }}
                disabled={loading}
              >
                <i className="fa-solid fa-trash-can me-2"></i>
                تصفير الواجهة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 نافذة متابعة حالة الاستيراد */}
      {showStatusModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center position-relative">
              
              <button 
                type="button" 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={handleCloseModal}
              ></button>

              <div className="mb-3 mt-2">
                {loading ? (
                  <div className="spinner-border text-primary" style={{ width: '3.5rem', height: '3.5rem' }} role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                  </div>
                ) : isError ? (
                  <div className="text-danger fs-1">❌</div>
                ) : (
                  <div className="text-success fs-1">✅</div>
                )}
              </div>

              <h5 className="fw-bold mb-3">حالة عملية الاستيراد</h5>
              <p className={`fw-semibold ${isError ? 'text-danger' : 'text-secondary'}`}>
                {statusMessage}
              </p>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button 
                  className="btn btn-primary fw-bold px-4 rounded-3"
                  onClick={handleCloseModal}
                >
                  {loading ? 'إلغاء العملية ✕' : 'إغلاق ومتابعة'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportExport;