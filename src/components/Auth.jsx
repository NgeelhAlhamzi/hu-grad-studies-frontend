import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://hu-backend-nltw.onrender.com/api/auth';

function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const url = isLogin 
      ? `${BASE_URL}/login` 
      : `${BASE_URL}/register`;

    try {
      const response = await axios.post(url, formData);
      
      if (isLogin) {
        const token = response.data.token;
        const userName = response.data.userName || formData.email.split('@')[0];

        localStorage.getItem('token');
        localStorage.setItem('token', token);
        localStorage.setItem('userName', userName);
        
        onLoginSuccess(userName);
      } else {
        setMessage({ text: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', type: 'success' });
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (error) {
      const errorText = error.response?.data?.message || 'تعذر الاتصال بالسيرفر! يرجى التأكد من توفر الاتصال بالإنترنت.';
      setMessage({ text: errorText, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      dir="rtl" 
      className="d-flex align-items-center justify-content-center min-vh-100" 
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1a365d 100%)',
        fontFamily: "'Cairo', sans-serif"
      }}
    >
      <div 
        className="card border-0 shadow-lg p-4 p-md-5 text-white" 
        style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-center mb-4">
          <div 
            className="d-inline-flex align-items-center justify-content-center bg-warning rounded-circle mb-3 shadow" 
            style={{ width: '75px', height: '75px' }}
          >
            <i className="fa-solid fa-graduation-cap fa-3x text-dark"></i>
          </div>
          <h3 className="fw-extrabold text-white mb-1">نظام الاشراف الاكتروني</h3>
          <p className="text-warning small fw-bold mb-0">نظام إدارة الدراسات العليا والأبحاث العلمية</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} border-0 text-center small py-2 mb-3 rounded-3 shadow-sm`} role="alert">
            <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} me-1`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label small fw-bold text-light">الاسم الكامل / الكلية</label>
              <div className="input-group">
                <span className="input-group-text border-0 bg-white bg-opacity-10 text-white">
                  <i className="fa-solid fa-user"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-0 bg-white bg-opacity-10 text-white shadow-none placeholder-light" 
                  placeholder=""
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small fw-bold text-light">البريد الإلكتروني</label>
            <div className="input-group">
              <span className="input-group-text border-0 bg-white bg-opacity-10 text-white">
                <i className="fa-solid fa-envelope"></i>
              </span>
              <input 
                type="email" 
                className="form-control border-0 bg-white bg-opacity-10 text-white shadow-none placeholder-light" 
                placeholder="user@hu.edu.ye"
                required 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-light">كلمة المرور</label>
            <div className="input-group">
              <span className="input-group-text border-0 bg-white bg-opacity-10 text-white">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control border-0 bg-white bg-opacity-10 text-white shadow-none placeholder-light" 
                placeholder="••••••••"
                required 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button 
                type="button" 
                className="btn border-0 bg-white bg-opacity-10 text-warning shadow-none" 
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-warning w-100 py-2.5 fw-bold text-dark rounded-3 shadow border-0" 
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin me-2"></i> جاري التحقق...</span>
            ) : (
              <span>
                {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب الآن'}
                <i className="fa-solid fa-arrow-left ms-2"></i>
              </span>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            type="button" 
            className="btn btn-link text-warning text-decoration-none small p-0 fw-semibold" 
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ text: '', type: '' });
              setFormData({ name: '', email: '', password: '' });
            }}
          >
            {isLogin ? 'لا تملك حساباً؟ أنشئ حساب جامعة جديد الآن' : 'تمتلك حساباً بالفعل؟ سجل دخولك من هنا'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;