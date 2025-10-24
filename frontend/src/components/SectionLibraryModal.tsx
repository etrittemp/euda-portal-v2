import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Plus,
  Copy,
  Layers
} from 'lucide-react';
import { questionnaireAPI } from '../api';
import { showToast } from '../utils/toast';
import { useTranslation } from '../hooks/useTranslation';

interface QuestionData {
  id: string;
  question_text: { en: string; sq: string; sr: string };
  question_type: string;
  section_id: string;
  options?: any;
  required: boolean;
  order_index: number;
  validation_rules?: any;
  help_text?: { en: string; sq: string; sr: string };
}

interface SectionData {
  id: string;
  title: { en: string; sq: string; sr: string };
  description: { en: string; sq: string; sr: string };
  order_index: number;
  questionCount: number;
  questions: QuestionData[];
  questionnaire_id: string;
}

interface QuestionnaireData {
  id: string;
  title: string;
  description: string;
  status: string;
  sections: SectionData[];
}

interface SelectedItem {
  type: 'section' | 'question';
  sourceQuestionnaireId: string;
  sectionId: string;
  questionId?: string;
  data: SectionData | QuestionData;
  tempId: string;
}

interface SectionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'add';
  targetQuestionnaireId?: string;
  onSuccess?: (questionnaireId: string) => void;
}

const SectionLibraryModal: React.FC<SectionLibraryModalProps> = ({
  isOpen,
  onClose,
  mode,
  targetQuestionnaireId,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireData[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionnaires, setExpandedQuestionnaires] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [newQuestionnaireTitle, setNewQuestionnaireTitle] = useState('');
  const [newQuestionnaireDescription, setNewQuestionnaireDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen]);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const data = await questionnaireAPI.getLibrary();
      setQuestionnaires(data.questionnaires || []);
      // Auto-expand first questionnaire
      if (data.questionnaires && data.questionnaires.length > 0) {
        setExpandedQuestionnaires(new Set([data.questionnaires[0].id]));
      }
    } catch (error: any) {
      console.error('Failed to load library:', error);
      showToast.error('Failed to load questionnaire library');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionnaire = (questionnaireId: string) => {
    const newExpanded = new Set(expandedQuestionnaires);
    if (newExpanded.has(questionnaireId)) {
      newExpanded.delete(questionnaireId);
    } else {
      newExpanded.add(questionnaireId);
    }
    setExpandedQuestionnaires(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isSectionSelected = (sectionId: string): 'all' | 'some' | 'none' => {
    const section = questionnaires
      .flatMap(q => q.sections)
      .find(s => s.id === sectionId);

    if (!section) return 'none';

    const sectionItem = selectedItems.find(
      item => item.type === 'section' && item.sectionId === sectionId
    );

    if (sectionItem) return 'all';

    const selectedQuestionCount = selectedItems.filter(
      item => item.type === 'question' && item.sectionId === sectionId
    ).length;

    if (selectedQuestionCount === 0) return 'none';
    if (selectedQuestionCount === section.questions.length) return 'all';
    return 'some';
  };

  const isQuestionSelected = (questionId: string): boolean => {
    return selectedItems.some(
      item => item.type === 'question' && item.questionId === questionId
    );
  };

  const toggleSectionSelection = (questionnaireId: string, section: SectionData) => {
    const selectionState = isSectionSelected(section.id);

    if (selectionState === 'all' || selectionState === 'some') {
      // Deselect section and all its questions
      setSelectedItems(prev => prev.filter(
        item => !(
          (item.type === 'section' && item.sectionId === section.id) ||
          (item.type === 'question' && item.sectionId === section.id)
        )
      ));
    } else {
      // Select section
      const newItem: SelectedItem = {
        type: 'section',
        sourceQuestionnaireId: questionnaireId,
        sectionId: section.id,
        data: section,
        tempId: `temp-section-${Date.now()}-${Math.random()}`
      };

      // Remove any individual question selections from this section
      setSelectedItems(prev => [
        ...prev.filter(item => !(item.type === 'question' && item.sectionId === section.id)),
        newItem
      ]);
    }
  };

  const toggleQuestionSelection = (questionnaireId: string, sectionId: string, question: QuestionData) => {
    const isSelected = isQuestionSelected(question.id);

    if (isSelected) {
      // Deselect question
      setSelectedItems(prev => prev.filter(
        item => !(item.type === 'question' && item.questionId === question.id)
      ));
    } else {
      // Check if entire section is selected
      const sectionSelected = selectedItems.some(
        item => item.type === 'section' && item.sectionId === sectionId
      );

      if (!sectionSelected) {
        // Select individual question
        const newItem: SelectedItem = {
          type: 'question',
          sourceQuestionnaireId: questionnaireId,
          sectionId: sectionId,
          questionId: question.id,
          data: question,
          tempId: `temp-question-${Date.now()}-${Math.random()}`
        };

        setSelectedItems(prev => [...prev, newItem]);
      }
    }
  };

  const removeSelectedItem = (tempId: string) => {
    setSelectedItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      showToast.error('Please select at least one section or question');
      return;
    }

    if (mode === 'create' && !newQuestionnaireTitle.trim()) {
      showToast.error('Please enter a questionnaire title');
      return;
    }

    try {
      setSubmitting(true);

      const items = selectedItems.map(item => ({
        type: item.type,
        sourceQuestionnaireId: item.sourceQuestionnaireId,
        sectionId: item.sectionId,
        ...(item.questionId && { questionId: item.questionId })
      }));

      const result = await questionnaireAPI.cloneSections({
        targetQuestionnaireId: mode === 'add' ? targetQuestionnaireId! : null,
        ...(mode === 'create' && {
          title: newQuestionnaireTitle,
          description: newQuestionnaireDescription
        }),
        items
      });

      showToast.success(result.message || 'Sections cloned successfully!');

      if (onSuccess) {
        onSuccess(result.questionnaireId);
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to clone sections:', error);
      showToast.error(error.response?.data?.error || 'Failed to clone sections');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestionnaires = questionnaires.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const questionTypeIcons: Record<string, string> = {
    text: '📝',
    textarea: '📄',
    boolean: '✓',
    radio: '⚪',
    checkbox: '☑️',
    select: '📋',
    number: '🔢',
    email: '📧',
    url: '🔗',
    date: '📅'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? t('createFromExisting') : t('addFromExisting')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('questionnaireTitle')} *
                </label>
                <input
                  type="text"
                  value={newQuestionnaireTitle}
                  onChange={(e) => setNewQuestionnaireTitle(e.target.value)}
                  placeholder={t('enterQuestionnaireTitle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('descriptionOptional')}
                </label>
                <input
                  type="text"
                  value={newQuestionnaireDescription}
                  onChange={(e) => setNewQuestionnaireDescription(e.target.value)}
                  placeholder={t('enterDescription')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Browse Library */}
          <div className="w-2/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchQuestionnaires')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                    <p className="text-gray-600">{t('loadingLibrary')}</p>
                  </div>
                </div>
              ) : filteredQuestionnaires.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    {searchQuery ? t('noQuestionnairesFound') : t('noQuestionnairesAvailable')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQuestionnaires.map(questionnaire => (
                    <div key={questionnaire.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Questionnaire Header */}
                      <div
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleQuestionnaire(questionnaire.id)}
                      >
                        {expandedQuestionnaires.has(questionnaire.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span className="flex-1 font-medium text-gray-900">{questionnaire.title}</span>
                        <span className="text-xs text-gray-500">{questionnaire.sections.length} {t('sections')}</span>
                      </div>

                      {/* Sections */}
                      {expandedQuestionnaires.has(questionnaire.id) && (
                        <div className="p-2 space-y-1">
                          {questionnaire.sections.map(section => {
                            const selectionState = isSectionSelected(section.id);
                            return (
                              <div key={section.id} className="border border-gray-100 rounded">
                                {/* Section Header */}
                                <div className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                  <button
                                    onClick={() => toggleSectionSelection(questionnaire.id, section)}
                                    className="flex-shrink-0"
                                  >
                                    {selectionState === 'all' ? (
                                      <CheckSquare className="w-5 h-5 text-purple-600" />
                                    ) : selectionState === 'some' ? (
                                      <MinusSquare className="w-5 h-5 text-purple-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => toggleSection(section.id)}
                                    className="flex items-center gap-2 flex-1 text-left"
                                  >
                                    {expandedSections.has(section.id) ? (
                                      <ChevronDown className="w-3 h-3 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-gray-500" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                      {section.title.en || section.title.sq || section.title.sr}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ({section.questions.length} {t('questions')})
                                    </span>
                                  </button>
                                </div>

                                {/* Questions */}
                                {expandedSections.has(section.id) && (
                                  <div className="ml-10 mr-2 mb-2 space-y-1">
                                    {section.questions.map(question => (
                                      <div
                                        key={question.id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                                      >
                                        <button
                                          onClick={() => toggleQuestionSelection(questionnaire.id, section.id, question)}
                                          disabled={selectedItems.some(item => item.type === 'section' && item.sectionId === section.id)}
                                          className="flex-shrink-0 disabled:opacity-50"
                                        >
                                          {isQuestionSelected(question.id) ? (
                                            <CheckSquare className="w-4 h-4 text-purple-600" />
                                          ) : (
                                            <Square className="w-4 h-4 text-gray-400" />
                                          )}
                                        </button>
                                        <span className="text-xs">{questionTypeIcons[question.question_type]}</span>
                                        <span className="text-xs text-gray-600 flex-1 truncate">
                                          {question.question_text.en || question.question_text.sq || question.question_text.sr}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Items */}
          <div className="w-1/3 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{t('selectedItems')}</h3>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    {t('clearAll')}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {selectedItems.filter(i => i.type === 'section').length} {t('sectionsSelected')}, {' '}
                {selectedItems.filter(i => i.type === 'question').length} {t('questionsSelected')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedItems.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400 text-center">
                    {t('noItemsSelected')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div
                      key={item.tempId}
                      className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-600">
                              {item.type === 'section' ? 'SECTION' : 'QUESTION'}
                            </span>
                            {item.type === 'question' && (
                              <span className="text-xs">
                                {questionTypeIcons[(item.data as QuestionData).question_type]}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 truncate">
                            {item.type === 'section'
                              ? ((item.data as SectionData).title.en || (item.data as SectionData).title.sq || (item.data as SectionData).title.sr)
                              : ((item.data as QuestionData).question_text.en || (item.data as QuestionData).question_text.sq || (item.data as QuestionData).question_text.sr)
                            }
                          </p>
                          {item.type === 'section' && (
                            <p className="text-xs text-gray-400 mt-1">
                              {(item.data as SectionData).questions.length} question(s)
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeSelectedItem(item.tempId)}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('processing')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {mode === 'create' ? t('createQuestionnaire') : t('addSelected')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionLibraryModal;
