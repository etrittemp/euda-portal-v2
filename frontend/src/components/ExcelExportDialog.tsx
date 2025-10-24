import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { questionnaireAPI } from '../api';
import { showToast } from '../utils/toast';

interface ExcelExportDialogProps {
  questionnaireId: string;
  questionnaireTitle: string;
  onClose: () => void;
}

const ExcelExportDialog: React.FC<ExcelExportDialogProps> = ({
  questionnaireId,
  questionnaireTitle,
  onClose,
}) => {
  const [language, setLanguage] = useState('en');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
    { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  ];

  const features = [
    'Summary Dashboard with key metrics',
    'Raw data in tabular format',
    'Question-by-question breakdown',
    'Open-ended responses',
    'Metadata and export information',
    'Beautiful formatting and colors',
    'Conditional formatting',
    'Charts and visualizations',
    'Multi-language support',
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      showToast.loading('Generating Excel file...');

      const response = await questionnaireAPI.exportToExcel(questionnaireId, language);

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const filename = `${questionnaireTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportComplete(true);
      showToast.success('Excel file downloaded successfully!');

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FileSpreadsheet size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Export to Excel</h2>
              <p className="text-purple-100 mt-1">{questionnaireTitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {exportComplete && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3 animate-slideInRight">
              <CheckCircle2 size={24} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Export Complete!</p>
                <p className="text-sm text-green-700">Your file has been downloaded successfully.</p>
              </div>
            </div>
          )}

          {/* Language Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Globe size={18} />
              <span>Select Export Language</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  disabled={isExporting}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${
                      language === lang.code
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                    }
                    ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <span>💡</span>
              <span>This affects question text and labels in the export</span>
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              📊 What's Included in Your Export:
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-gray-700"
                  >
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Export Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">
                  State-of-the-art Excel Format
                </p>
                <p className="text-blue-700">
                  The export includes 5 professional sheets with advanced formatting,
                  conditional colors, auto-filters, and more. Compatible with Excel 2007+
                  and Google Sheets.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportComplete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : exportComplete ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Download Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelExportDialog;
