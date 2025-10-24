import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, AlertCircle, Lock, LogIn } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from '../components/LanguageSelector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LandingPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify if questionnaire exists and is active
      const response = await axios.get(`${API_URL}/api/questionnaires/verify/${code}`);
      const { exists, requiresPassword } = response.data;

      if (!exists) {
        setError(t('questionnaireNotFound'));
        triggerShake();
        setLoading(false);
        return;
      }

      if (requiresPassword) {
        setQuestionnaireId(code);
        setShowPasswordPrompt(true);
        setLoading(false);
      } else {
        // No password required, redirect to questionnaire
        navigate(`/questionnaire/${code}`);
      }
    } catch (err: any) {
      console.error('Code verification error:', err);
      setError(t('questionnaireNotFound'));
      triggerShake();
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify password
      const response = await axios.post(`${API_URL}/api/questionnaires/verify-password`, {
        questionnaireId,
        password
      });

      if (response.data.valid) {
        // Password correct, redirect to questionnaire
        navigate(`/questionnaire/${questionnaireId}`, {
          state: { passwordVerified: true }
        });
      } else {
        setError(t('incorrectPassword'));
        triggerShake();
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Password verification error:', err);
      setError(t('incorrectPassword'));
      triggerShake();
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowPasswordPrompt(false);
    setPassword('');
    setError('');
    setQuestionnaireId('');
  };

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-xl w-full max-w-md p-8 ${shake ? 'animate-shake' : ''}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t('passwordRequired')}</h1>
            <p className="text-gray-600 mt-2">{t('questionnairePasswordProtected')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  placeholder={t('enterQuestionnairePassword')}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors"
              >
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <>
                    {t('continue')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4 relative">
      {/* Login Button - Top Right */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg shadow-md hover:shadow-lg hover:bg-purple-50 transition-all"
      >
        <LogIn className="w-4 h-4" />
        <span className="font-medium">{t('adminLogin')}</span>
      </button>

      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-md p-8 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{t('questionnairePortal')}</h1>
          <p className="text-gray-600 mt-2">{t('enterCodeToBegin')}</p>
          <div className="mt-4 flex justify-center">
            <LanguageSelector variant="compact" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {t('questionnaireCode')}
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              placeholder={t('enterYourCode')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : (
              <>
                {t('continue')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            EUDA Questionnaire Portal
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
