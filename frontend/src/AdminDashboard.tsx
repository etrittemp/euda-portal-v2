import React, { useState, useEffect } from 'react';
import { Download, Users, FileText, TrendingUp, ChevronDown, ChevronRight, Search, RefreshCw, Trash2, Eye, LogOut } from 'lucide-react';
import { responsesAPI } from './api';
import { useAuth } from './AuthContext';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from './hooks/useTranslation';
import { showToast } from './utils/toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detailed'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await responsesAPI.getAll();
      // Transform API response to match frontend format
      const transformedData = data.map(item => ({
        id: item.id,
        timestamp: item.submitted_at,
        country: item.country,
        contactName: item.contact_name,
        contactEmail: item.contact_email,
        completionStatus: item.completion_status,
        responses: item.responses
      }));
      setResponses(transformedData);
    } catch (error) {
      console.error('Error loading responses:', error);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const countries = ['All', ...new Set(responses.map(r => r.country))];

  const filteredResponses = responses.filter(r => {
    const matchesSearch = r.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'All' || r.country === filterCountry;
    const matchesStatus = filterStatus === 'All' || r.completionStatus === filterStatus;
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const downloadResponseCSV = (response) => {
    // Create comprehensive CSV with all questions and answers
    const rows = [];

    // Header info
    rows.push(['EUDA Roadmap Questionnaire Response']);
    rows.push(['']);
    rows.push(['Contact Information']);
    rows.push(['Country', response.country || '']);
    rows.push(['Contact Name', response.contactName || '']);
    rows.push(['Email', response.contactEmail || '']);
    rows.push(['Submission Date', new Date(response.timestamp).toLocaleString()]);
    rows.push(['Completion Status', response.completionStatus || '']);
    rows.push(['']);
    rows.push(['Question', 'Answer']);
    rows.push(['']);

    // All question responses - ensure full text is included
    Object.entries(response.responses).forEach(([key, data]) => {
      let question, answer;

      // Handle both old format (string) and new format (object with question/answer)
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        question = (data.question || key || '').toString();
        answer = (data.answer || '').toString();
      } else {
        question = key.toString();
        answer = (data || '').toString();
      }

      // Preserve the full answer text including line breaks
      rows.push([question, answer]);
    });

    // Properly escape CSV fields - wrap in quotes and escape internal quotes
    const csv = rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes by doubling them and wrap entire cell in quotes
        return `"${cellStr.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EUDA_Response_${response.country}_${response.contactName}_${response.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllCSV = () => {
    if (filteredResponses.length === 0) {
      showToast.error('No responses to download');
      return;
    }

    // Create comprehensive CSV with all responses
    const rows = [];

    // Header
    rows.push(['EUDA Roadmap Questionnaire - All Responses']);
    rows.push(['Generated', new Date().toLocaleString()]);
    rows.push(['']);

    filteredResponses.forEach((response, index) => {
      rows.push([`Response ${index + 1}`]);
      rows.push(['Country', response.country || '']);
      rows.push(['Contact Name', response.contactName || '']);
      rows.push(['Email', response.contactEmail || '']);
      rows.push(['Submission Date', new Date(response.timestamp).toLocaleString()]);
      rows.push(['Completion Status', response.completionStatus || '']);
      rows.push(['']);
      rows.push(['Question', 'Answer']);

      // Ensure full text is preserved for all answers
      Object.entries(response.responses).forEach(([key, data]) => {
        let question, answer;

        // Handle both old format (string) and new format (object with question/answer)
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          question = (data.question || key || '').toString();
          answer = (data.answer || '').toString();
        } else {
          question = key.toString();
          answer = (data || '').toString();
        }

        rows.push([question, answer]);
      });

      rows.push(['']);
      rows.push(['---']);
      rows.push(['']);
    });

    // Properly escape CSV fields - wrap in quotes and escape internal quotes
    const csv = rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes by doubling them and wrap entire cell in quotes
        return `"${cellStr.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EUDA_All_Responses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteResponse = async (responseId) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await responsesAPI.delete(responseId);
        const updatedResponses = responses.filter(r => r.id !== responseId);
        setResponses(updatedResponses);

        if (selectedResponse?.id === responseId) {
          setSelectedResponse(null);
          setViewMode('list');
        }

        showToast.success(t('deletedSuccessfully'));
      } catch (error) {
        console.error('Error deleting response:', error);
        showToast.error(t('failedToDelete'));
      }
    }
  };

  const clearAllResponses = async () => {
    if (window.confirm(t('confirmDeleteAll'))) {
      if (window.confirm(t('confirmDeleteAll'))) {
        try {
          await responsesAPI.deleteAll();
          setResponses([]);
          setSelectedResponse(null);
          setViewMode('list');
          alert(t('deletedSuccessfully'));
        } catch (error) {
          console.error('Error clearing responses:', error);
          alert(t('failedToDelete'));
        }
      }
    }
  };

  const viewResponse = (response) => {
    setSelectedResponse(response);
    setViewMode('detailed');
    setExpandedSections({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const stats = {
    total: responses.length,
    complete: responses.filter(r => r.completionStatus === 'Complete').length,
    partial: responses.filter(r => r.completionStatus === 'Partial').length,
    countries: new Set(responses.map(r => r.country)).size
  };

  const sections = [
    { id: '1', name: 'National Drug Observatory (NDO)' },
    { id: '2', name: 'Network of Experts and Data Providers' },
    { id: '3', name: 'Data Collection' },
    { id: '4', name: 'Early Warning System (EWS)' },
    { id: '5', name: 'Drug Alert System (EDAS)' },
    { id: '6', name: 'Wastewater Analysis' },
    { id: '7', name: 'Syringe Residue Analysis' },
    { id: '8', name: 'Emergencies' },
    { id: '9', name: 'European Prevention Curriculum (EUPC)' },
    { id: '10', name: 'Participation in EUDA Activities' },
    { id: '11', name: 'Publications and Communication' },
    { id: '12', name: 'National Strategy and Coordination' },
    { id: '13', name: 'Achievements and Challenges' }
  ];

  // Detailed View Component
  const DetailedView = ({ response }) => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <button
                onClick={() => setViewMode('list')}
                className="text-sm text-purple-600 hover:text-purple-700 mb-2"
              >
                ← Back to list
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {response.contactName}
              </h2>
              <p className="text-gray-600">{response.country}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadResponseCSV(response)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button
                onClick={() => deleteResponse(response.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-medium">{response.contactEmail}</p>
            </div>
            <div>
              <p className="text-gray-600">Submitted:</p>
              <p className="font-medium">{new Date(response.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                response.completionStatus === 'Complete'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {response.completionStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <h3 className="text-lg font-semibold mb-4">Questionnaire Responses</h3>

          <div className="space-y-6">
            {Object.entries(response.responses).map(([key, data], index) => {
              // Handle both old format (string) and new format (object with question/answer)
              let question, answer;

              if (typeof data === 'object' && data !== null) {
                question = data.question || key;
                answer = data.answer || '';
              } else {
                question = key;
                answer = data || '';
              }

              // Debug log
              if (index === 0) {
                console.log('Sample data structure:', { key, data, question, answer });
              }

              return (
                <div key={key} className="border-l-4 border-purple-200 pl-4 py-2">
                  <div className="flex items-start gap-2">
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                      Q{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 mb-2 break-words">
                        {question}
                      </p>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {answer || 'No answer provided'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{t('adminDashboard')}</h1>
              <p className="text-purple-100">{t('viewResponses')}</p>
              {user && <p className="text-purple-200 text-sm mt-1">{t('loggedInAs')}: {user.email}</p>}
            </div>
            <div className="flex gap-2 items-start">
              <LanguageSelector
                variant="compact"
                className="bg-white bg-opacity-20 text-white border-white border-opacity-30"
              />
              <button
                onClick={() => window.location.href = '/questionnaires'}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t('manageQuestionnaires')}
              </button>
              <button
                onClick={loadResponses}
                disabled={loading}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">{t('loading')}...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('totalResponses')}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('complete')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.complete}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('partial')}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.partial}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('countries')}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.countries}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or country..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>

                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Complete">Complete</option>
                    <option value="Partial">Partial</option>
                  </select>

                  <button
                    onClick={downloadAllCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={filteredResponses.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>

                  <button
                    onClick={clearAllResponses}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={responses.length === 0}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {responses.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">No Responses Yet</h3>
                <p className="text-blue-700">Responses submitted through the questionnaire will appear here.</p>
              </div>
            )}

            {responses.length > 0 && filteredResponses.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <Search className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Matching Responses</h3>
                <p className="text-yellow-700">Try adjusting your search or filter criteria.</p>
              </div>
            )}

            {filteredResponses.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredResponses.map((response) => (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{response.contactName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{response.country}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{response.contactEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(response.timestamp).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              response.completionStatus === 'Complete'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {response.completionStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewResponse(response)}
                              className="text-purple-600 hover:text-purple-900 mr-3"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5 inline" />
                            </button>
                            <button
                              onClick={() => downloadResponseCSV(response)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Download CSV"
                            >
                              <Download className="w-5 h-5 inline" />
                            </button>
                            <button
                              onClick={() => deleteResponse(response.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'detailed' && selectedResponse && (
          <DetailedView response={selectedResponse} />
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
