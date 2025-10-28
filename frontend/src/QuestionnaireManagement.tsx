import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Eye,
  Edit,
  Copy,
  Trash2,
  Archive,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  BarChart3,
  FileUp,
  X,
  Save,
  AlertCircle,
  Share2,
  FileSpreadsheet,
  Layers,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { questionnaireAPI } from './api';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from './hooks/useTranslation';
import ShareModal from './components/ShareModal';
import ExcelExportDialog from './components/ExcelExportDialog';
import SectionLibraryModal from './components/SectionLibraryModal';
import { showToast } from './utils/toast';
import { useAuth } from './AuthContext';

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  sections?: any[];
}

const QuestionnaireManagement: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<Questionnaire[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ [key: string]: any }>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [excelExportModalOpen, setExcelExportModalOpen] = useState(false);
  const [selectedExportQuestionnaire, setSelectedExportQuestionnaire] = useState<Questionnaire | null>(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  useEffect(() => {
    filterQuestionnaires();
  }, [questionnaires, searchTerm, statusFilter]);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await questionnaireAPI.getAll();
      setQuestionnaires(data);

      // Load stats for each questionnaire
      const statsData: { [key: string]: any } = {};
      for (const q of data) {
        try {
          const qStats = await questionnaireAPI.getStats(q.id);
          statsData[q.id] = qStats;
        } catch (err) {
          console.error(`Failed to load stats for ${q.id}:`, err);
        }
      }
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading questionnaires:', err);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const filterQuestionnaires = () => {
    let filtered = questionnaires;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestionnaires(filtered);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill title from filename
      if (!uploadTitle) {
        const filename = e.target.files[0].name.replace(/\.[^/.]+$/, '');
        setUploadTitle(filename);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle) {
      setError(t('selectFileAndTitle'));
      return;
    }

    try {
      setUploading(true);
      setError('');
      await questionnaireAPI.uploadFile(selectedFile, uploadTitle, uploadDescription);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      showToast.success(t('uploadedSuccessfully'));
      loadQuestionnaires();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || t('failedToUpload'));
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    // Simply redirect to the builder page
    // The builder will handle the actual creation
    navigate('/questionnaires/builder');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await questionnaireAPI.update(id, { status: newStatus });
      const message = newStatus === 'active' ? t('questionnaireActivated') :
                      newStatus === 'archived' ? t('questionnaireArchived') :
                      t('questionnaireReactivated');
      showToast.success(message);
      loadQuestionnaires();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast.error(t('failedToUpdateStatus'));
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    const newTitle = prompt(t('enterDuplicateTitle'), `${title} (Copy)`);
    if (!newTitle) return;

    try {
      await questionnaireAPI.duplicate(id, newTitle);
      showToast.success(t('questionnaireDuplicated'));
      loadQuestionnaires();
    } catch (err) {
      console.error('Error duplicating:', err);
      showToast.error(t('failedToDuplicate'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First attempt - check if there are responses
      await questionnaireAPI.delete(id);
      showToast.success(t('deletedSuccessfully'));
      loadQuestionnaires();
    } catch (err: any) {
      console.error('Error deleting:', err);

      // If there are responses, ask for confirmation
      if (err.response?.data?.requiresConfirmation) {
        const responseCount = err.response.data.responseCount;
        const message = `This questionnaire has ${responseCount} response${responseCount > 1 ? 's' : ''}.\n\nDeleting it will permanently remove:\n- The questionnaire\n- All ${responseCount} response${responseCount > 1 ? 's' : ''}\n- All associated data\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?`;

        if (window.confirm(message)) {
          try {
            // Second attempt with force=true
            await questionnaireAPI.delete(id, true);
            showToast.success(t('deletedSuccessfully'));
            loadQuestionnaires();
          } catch (deleteErr: any) {
            console.error('Error force deleting:', deleteErr);
            showToast.error(deleteErr.response?.data?.error || t('failedToDelete'));
          }
        }
      } else {
        showToast.error(err.response?.data?.error || t('failedToDelete'));
      }
    }
  };

  const handleShare = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setShareModalOpen(true);
  };

  const handleExcelExport = (questionnaire: Questionnaire) => {
    setSelectedExportQuestionnaire(questionnaire);
    setExcelExportModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-orange-100 text-orange-800'
    };

    const icons = {
      draft: <Clock className="w-3 h-3 mr-1" />,
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      archived: <Archive className="w-3 h-3 mr-1" />
    };

    const labels: Record<string, string> = {
      draft: t('draft'),
      active: t('active'),
      archived: t('archived')
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status] || status}
      </span>
    );
  };

  // No longer need the create modal - directly navigate to builder

  const renderUploadModal = () => {
    if (!showUploadModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">{t('uploadDocument')}</h3>
            <button
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadTitle('');
                setUploadDescription('');
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('documentFileWordOrPDF')}
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  {t('selectedFile')}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label htmlFor="uploadTitle" className="block text-sm font-medium text-gray-700 mb-2">
                {t('questionnaireTitle')} *
              </label>
              <input
                id="uploadTitle"
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder={t('enterQuestionnaireTitle')}
                required
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="uploadDescription" className="block text-sm font-medium text-gray-700 mb-2">
                {t('descriptionOptional')}
              </label>
              <textarea
                id="uploadDescription"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder={t('enterDescription')}
                rows={3}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadTitle || uploading}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('converting')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('uploadAndConvert')}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                  setUploadDescription('');
                  setError('');
                }}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>{t('tip')}:</strong> {t('fileUploadTip')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('manageQuestionnaires')}</h1>
              <p className="text-purple-100">{t('createManageMonitor')}</p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="text-sm text-purple-100">
                  {user.name}
                </div>
              )}
              <LanguageSelector
                variant="compact"
                className="bg-white bg-opacity-20 text-white border-white border-opacity-30"
              />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors border border-white border-opacity-30"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('createNew')}
              </button>
              <button
                onClick={() => setLibraryModalOpen(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                {t('createFromExisting')}
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <FileUp className="w-4 h-4" />
                {t('uploadDocument')}
              </button>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('searchQuestionnaires')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">{t('allStatus')}</option>
                <option value="draft">{t('draft')}</option>
                <option value="active">{t('active')}</option>
                <option value="archived">{t('archived')}</option>
              </select>
            </div>
          </div>
        </div>

        {error && !showUploadModal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">{t('loadingQuestionnaires')}</p>
            </div>
          </div>
        ) : filteredQuestionnaires.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {questionnaires.length === 0 ? t('noQuestionnaires') : t('noMatchingQuestionnaires')}
            </h3>
            <p className="text-gray-600 mb-6">
              {questionnaires.length === 0
                ? t('getStartedMessage')
                : t('tryAdjustingFilters')}
            </p>
            {questionnaires.length === 0 && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('createNew')}
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <FileUp className="w-4 h-4" />
                  {t('uploadDocument')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestionnaires.map((questionnaire) => (
              <div key={questionnaire.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {questionnaire.title}
                      </h3>
                      {getStatusBadge(questionnaire.status)}
                    </div>
                  </div>

                  {questionnaire.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {questionnaire.description}
                    </p>
                  )}

                  {stats[questionnaire.id] && (
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600">{t('responses')}</p>
                        <p className="text-lg font-semibold text-gray-900">{stats[questionnaire.id].total_responses || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{t('complete')}</p>
                        <p className="text-lg font-semibold text-green-600">{stats[questionnaire.id].complete || 0}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => navigate(`/questionnaires/builder/${questionnaire.id}`)}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center justify-center gap-2 text-sm"
                      title={t('edit')}
                    >
                      <Edit className="w-4 h-4" />
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleShare(questionnaire)}
                      className="px-3 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 flex items-center justify-center gap-2 text-sm"
                      title={t('share')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/questionnaire/${questionnaire.id}`, '_blank')}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2 text-sm"
                      title={t('previewQuestionnaire')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(questionnaire.id, questionnaire.title)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2 text-sm"
                      title={t('duplicate')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.location.href = `/dashboard?questionnaire=${questionnaire.id}`}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2 text-sm"
                      title={t('viewResponses')}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcelExport(questionnaire)}
                      className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center justify-center gap-2 text-sm"
                      title="Export to Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {questionnaire.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(questionnaire.id, 'active')}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        {t('activate')}
                      </button>
                    )}
                    {questionnaire.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(questionnaire.id, 'archived')}
                        className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        {t('archive')}
                      </button>
                    )}
                    {questionnaire.status === 'archived' && (
                      <button
                        onClick={() => handleStatusChange(questionnaire.id, 'active')}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        {t('reactivate')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(questionnaire.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <p>{t('created')}: {new Date(questionnaire.created_at).toLocaleDateString()}</p>
                    {questionnaire.published_at && (
                      <p>{t('published')}: {new Date(questionnaire.published_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {renderUploadModal()}

      {selectedQuestionnaire && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedQuestionnaire(null);
          }}
          questionnaireId={selectedQuestionnaire.id}
          questionnaireTitle={selectedQuestionnaire.title}
        />
      )}

      {selectedExportQuestionnaire && excelExportModalOpen && (
        <ExcelExportDialog
          questionnaireId={selectedExportQuestionnaire.id}
          questionnaireTitle={selectedExportQuestionnaire.title}
          onClose={() => {
            setExcelExportModalOpen(false);
            setSelectedExportQuestionnaire(null);
          }}
        />
      )}

      <SectionLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        mode="create"
        onSuccess={(questionnaireId) => {
          setLibraryModalOpen(false);
          navigate(`/questionnaires/builder/${questionnaireId}`);
        }}
      />
    </div>
  );
};

export default QuestionnaireManagement;
