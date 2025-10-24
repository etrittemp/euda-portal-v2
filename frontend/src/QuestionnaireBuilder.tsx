import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Save,
  Eye,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  Check,
  Share2,
  Layers
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionnaireAPI } from './api';
import { useTranslation } from './hooks/useTranslation';
import LanguageSelector from './components/LanguageSelector';
import ShareModal from './components/ShareModal';
import SectionLibraryModal from './components/SectionLibraryModal';
import { showToast } from './utils/toast';

interface QuestionOption {
  value: string;
  label: { en: string; sq: string; sr: string };
  allowsCustomInput?: boolean;
}

interface Question {
  id: string;
  question_text: { en: string; sq: string; sr: string };
  question_type: string;
  options: QuestionOption[] | null;
  required: boolean;
  order_index: number;
  validation_rules: any;
  help_text: { en: string; sq: string; sr: string };
}

interface Section {
  id: string;
  title: { en: string; sq: string; sr: string };
  description: { en: string; sq: string; sr: string };
  order_index: number;
  questions: Question[];
}

interface QuestionnaireData {
  id?: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  password?: string;
  sections: Section[];
}

const QuestionnaireBuilder: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    title: '',
    description: '',
    status: 'draft',
    sections: [
      {
        id: `section-${Date.now()}`,
        title: { en: 'Section 1', sq: 'Seksioni 1', sr: 'Секција 1' },
        description: { en: '', sq: '', sr: '' },
        order_index: 0,
        questions: []
      }
    ]
  });

  const [activeSection, setActiveSection] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'sq' | 'sr'>('en');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const questionTypes = [
    { value: 'text', label: { en: 'Short Text', sq: 'Tekst i Shkurtër', sr: 'Кратак текст' }, icon: '📝' },
    { value: 'textarea', label: { en: 'Long Text', sq: 'Tekst i Gjatë', sr: 'Дуг текст' }, icon: '📄' },
    { value: 'boolean', label: { en: 'Yes/No', sq: 'Po/Jo', sr: 'Да/Не' }, icon: '✓' },
    { value: 'radio', label: { en: 'Multiple Choice', sq: 'Zgjedhje e Shumëfishtë', sr: 'Вишеструки избор' }, icon: '⚪' },
    { value: 'checkbox', label: { en: 'Checkboxes', sq: 'Kutitë zgjedhëse', sr: 'Квадратићи за потврду' }, icon: '☑️' },
    { value: 'select', label: { en: 'Dropdown', sq: 'Meny Rënës', sr: 'Падајући мени' }, icon: '📋' },
    { value: 'number', label: { en: 'Number', sq: 'Numër', sr: 'Број' }, icon: '🔢' },
    { value: 'email', label: { en: 'Email', sq: 'Email', sr: 'Е-пошта' }, icon: '📧' },
    { value: 'url', label: { en: 'URL', sq: 'URL', sr: 'УРЛ' }, icon: '🔗' },
    { value: 'date', label: { en: 'Date', sq: 'Data', sr: 'Датум' }, icon: '📅' }
  ];

  const translations = {
    en: {
      required: 'Required',
      question: 'Question',
      helpText: 'Help Text (Optional)',
      options: 'Options',
      addOption: 'Add Option',
      validationRules: 'Validation Rules',
      minValue: 'Min Value',
      maxValue: 'Max Value',
      deleteQuestion: 'Delete question',
      duplicateQuestion: 'Duplicate question',
      moveUp: 'Move up',
      moveDown: 'Move down',
      sectionTitle: 'Section Title',
      sectionDescription: 'Section Description (Optional)',
      deleteSection: 'Delete Section',
      addSection: 'Add Section',
      addQuestion: 'Add Question',
      save: 'Save',
      preview: 'Preview',
      share: 'Share',
      saving: 'Saving...',
      cancel: 'Cancel',
      saveQuestionnaire: 'Save Questionnaire',
      backToQuestionnaires: 'Back to questionnaires',
      untitledQuestionnaire: 'Untitled Questionnaire',
      questionnaireTitle: 'Questionnaire Title',
      questionnaireDescription: 'Questionnaire description (optional)',
      password: 'Password (Optional)',
      passwordPlaceholder: 'Leave empty for no password protection',
      enterQuestion: 'Enter question',
      addHelperText: 'Add helper text or instructions',
      option: 'Option',
      questionsAcrossSections: 'questions across',
      sections: 'sections',
      loadingQuestionnaire: 'Loading questionnaire...',
      selectLanguageForEditing: 'Select language for editing all content'
    },
    sq: {
      required: 'E detyrueshme',
      question: 'Pyetje',
      helpText: 'Teksti Ndihmës (Opsional)',
      options: 'Opsionet',
      addOption: 'Shto Opsion',
      validationRules: 'Rregullat e Vlerësimit',
      minValue: 'Vlera Minimale',
      maxValue: 'Vlera Maksimale',
      deleteQuestion: 'Fshi pyetjen',
      duplicateQuestion: 'Dyfisho pyetjen',
      moveUp: 'Lëviz lart',
      moveDown: 'Lëviz poshtë',
      sectionTitle: 'Titulli i Seksionit',
      sectionDescription: 'Përshkrimi i Seksionit (Opsional)',
      deleteSection: 'Fshi Seksionin',
      addSection: 'Shto Seksion',
      addQuestion: 'Shto Pyetje',
      save: 'Ruaj',
      preview: 'Shiko',
      share: 'Shpërndaj',
      saving: 'Duke ruajtur...',
      cancel: 'Anulo',
      saveQuestionnaire: 'Ruaj Pyetësorin',
      backToQuestionnaires: 'Kthehu te pyetësorët',
      untitledQuestionnaire: 'Pyetësor pa Titull',
      questionnaireTitle: 'Titulli i Pyetësorit',
      questionnaireDescription: 'Përshkrimi i pyetësorit (opsional)',
      password: 'Fjalëkalimi (Opsional)',
      passwordPlaceholder: 'Lëre bosh për të mos pasur mbrojtje me fjalëkalim',
      enterQuestion: 'Vendos pyetjen',
      addHelperText: 'Shto tekst ndihmës ose udhëzime',
      option: 'Opsioni',
      questionsAcrossSections: 'pyetje nëpër',
      sections: 'seksione',
      loadingQuestionnaire: 'Duke ngarkuar pyetësorin...',
      selectLanguageForEditing: 'Zgjidh gjuhën për redaktimin e të gjithë përmbajtjes'
    },
    sr: {
      required: 'Обавезно',
      question: 'Питање',
      helpText: 'Текст помоћи (опционално)',
      options: 'Опције',
      addOption: 'Додај опцију',
      validationRules: 'Правила валидације',
      minValue: 'Мин вредност',
      maxValue: 'Макс вредност',
      deleteQuestion: 'Избриши питање',
      duplicateQuestion: 'Дуплирај питање',
      moveUp: 'Помери горе',
      moveDown: 'Помери доле',
      sectionTitle: 'Наслов секције',
      sectionDescription: 'Опис секције (опционално)',
      deleteSection: 'Избриши секцију',
      addSection: 'Додај секцију',
      addQuestion: 'Додај питање',
      save: 'Сачувај',
      preview: 'Преглед',
      share: 'Подели',
      saving: 'Чување...',
      cancel: 'Откажи',
      saveQuestionnaire: 'Сачувај упитник',
      backToQuestionnaires: 'Назад на упитнике',
      untitledQuestionnaire: 'Упитник без наслова',
      questionnaireTitle: 'Наслов упитника',
      questionnaireDescription: 'Опис упитника (опционално)',
      password: 'Лозинка (Опционално)',
      passwordPlaceholder: 'Оставите празно за приступ без лозинке',
      enterQuestion: 'Унесите питање',
      addHelperText: 'Додајте текст помоћи или упутства',
      option: 'Опција',
      questionsAcrossSections: 'питања у',
      sections: 'секције',
      loadingQuestionnaire: 'Учитавање упитника...',
      selectLanguageForEditing: 'Изаберите језик за уређивање целог садржаја'
    }
  };

  const tr = (key: keyof typeof translations.en) => translations[currentLanguage][key];

  useEffect(() => {
    if (id) {
      loadQuestionnaire();
    }
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const data = await questionnaireAPI.getById(id!);
      setQuestionnaire(data);
    } catch (err: any) {
      console.error('Error loading questionnaire:', err);
      setError('Failed to load questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const saveQuestionnaire = async () => {
    if (!questionnaire.title.trim()) {
      setError('Please enter a questionnaire title');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (id) {
        await questionnaireAPI.update(id, questionnaire);
      } else {
        const created = await questionnaireAPI.create(questionnaire);
        navigate(`/questionnaires/builder/${created.id}`, { replace: true });
      }

      showToast.success('Questionnaire saved successfully!');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save questionnaire');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: {
        en: `Section ${questionnaire.sections.length + 1}`,
        sq: `Seksioni ${questionnaire.sections.length + 1}`,
        sr: `Секција ${questionnaire.sections.length + 1}`
      },
      description: { en: '', sq: '', sr: '' },
      order_index: questionnaire.sections.length,
      questions: []
    };

    setQuestionnaire(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setActiveSection(questionnaire.sections.length);
  };

  const deleteSection = (sectionIndex: number) => {
    if (questionnaire.sections.length === 1) {
      showToast.error('Cannot delete the last section');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this section and all its questions?')) {
      return;
    }

    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex)
    }));

    if (activeSection >= sectionIndex && activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  const updateSection = (sectionIndex: number, field: string, value: any) => {
    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, [field]: value }
          : section
      )
    }));
  };

  const addQuestion = (sectionIndex: number) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      question_text: { en: '', sq: '', sr: '' },
      question_type: 'text',
      options: null,
      required: false,
      order_index: questionnaire.sections[sectionIndex].questions.length,
      validation_rules: {},
      help_text: { en: '', sq: '', sr: '' }
    };

    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    }));

    setActiveQuestion(newQuestion.id);
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, questions: section.questions.filter((_, qi) => qi !== questionIndex) }
          : section
      )
    }));

    setActiveQuestion(null);
  };

  const duplicateQuestion = (sectionIndex: number, questionIndex: number) => {
    const question = questionnaire.sections[sectionIndex].questions[questionIndex];
    const duplicated: Question = {
      ...question,
      id: `question-${Date.now()}`,
      order_index: questionIndex + 1
    };

    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              questions: [
                ...section.questions.slice(0, questionIndex + 1),
                duplicated,
                ...section.questions.slice(questionIndex + 1)
              ]
            }
          : section
      )
    }));
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, field: string, value: any) => {
    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((q, qi) =>
                qi === questionIndex ? { ...q, [field]: value } : q
              )
            }
          : section
      )
    }));
  };

  const addOption = (sectionIndex: number, questionIndex: number) => {
    const question = questionnaire.sections[sectionIndex].questions[questionIndex];
    const newOption: QuestionOption = {
      value: `option-${(question.options?.length || 0) + 1}`,
      label: { en: '', sq: '', sr: '' }
    };

    const options = question.options || [];
    updateQuestion(sectionIndex, questionIndex, 'options', [...options, newOption]);
  };

  const updateOption = (sectionIndex: number, questionIndex: number, optionIndex: number, lang: 'en' | 'sq' | 'sr', value: string) => {
    const question = questionnaire.sections[sectionIndex].questions[questionIndex];
    const options = question.options || [];

    const updatedOptions = options.map((opt, i) =>
      i === optionIndex
        ? { ...opt, label: { ...opt.label, [lang]: value } }
        : opt
    );

    updateQuestion(sectionIndex, questionIndex, 'options', updatedOptions);
  };

  const toggleOptionCustomInput = (sectionIndex: number, questionIndex: number, optionIndex: number) => {
    const question = questionnaire.sections[sectionIndex].questions[questionIndex];
    const options = question.options || [];

    const updatedOptions = options.map((opt, i) =>
      i === optionIndex
        ? { ...opt, allowsCustomInput: !opt.allowsCustomInput }
        : opt
    );

    updateQuestion(sectionIndex, questionIndex, 'options', updatedOptions);
  };

  const deleteOption = (sectionIndex: number, questionIndex: number, optionIndex: number) => {
    const question = questionnaire.sections[sectionIndex].questions[questionIndex];
    const options = question.options || [];
    updateQuestion(sectionIndex, questionIndex, 'options', options.filter((_, i) => i !== optionIndex));
  };

  const moveQuestion = (sectionIndex: number, questionIndex: number, direction: 'up' | 'down') => {
    const section = questionnaire.sections[sectionIndex];
    if (direction === 'up' && questionIndex === 0) return;
    if (direction === 'down' && questionIndex === section.questions.length - 1) return;

    const newIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
    const newQuestions = [...section.questions];
    [newQuestions[questionIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[questionIndex]];

    setQuestionnaire(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === sectionIndex ? { ...s, questions: newQuestions } : s
      )
    }));
  };

  const renderQuestionEditor = (question: Question, sectionIndex: number, questionIndex: number) => {
    const isActive = activeQuestion === question.id;
    const hasOptions = ['boolean', 'radio', 'checkbox', 'select'].includes(question.question_type);

    return (
      <div
        key={question.id}
        className={`bg-white rounded-lg shadow-md mb-4 transition-all ${
          isActive ? 'ring-2 ring-purple-500' : ''
        }`}
      >
        <div className="p-4">
          {/* Question Header */}
          <div className="flex items-start gap-3 mb-3">
            <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />

            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <select
                  value={question.question_type}
                  onChange={(e) => {
                    updateQuestion(sectionIndex, questionIndex, 'question_type', e.target.value);
                    if (['boolean', 'radio', 'checkbox', 'select'].includes(e.target.value) && !question.options) {
                      const defaultOptions = e.target.value === 'boolean'
                        ? [
                            { value: 'yes', label: { en: 'Yes', sq: 'Po', sr: 'Да' } },
                            { value: 'no', label: { en: 'No', sq: 'Jo', sr: 'Не' } }
                          ]
                        : [{ value: 'option-1', label: { en: 'Option 1', sq: 'Opsioni 1', sr: 'Опција 1' } }];
                      updateQuestion(sectionIndex, questionIndex, 'options', defaultOptions);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  onClick={() => setActiveQuestion(question.id)}
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label[currentLanguage]}
                    </option>
                  ))}
                </select>

                <div className="flex-1" />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'required', e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{tr('required')}</span>
                </label>
              </div>

              {/* Question Text - Multi-language */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {tr('question')} ({currentLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={question.question_text[currentLanguage]}
                  onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'question_text', {
                    ...question.question_text,
                    [currentLanguage]: e.target.value
                  })}
                  placeholder={tr('enterQuestion') + ` (${currentLanguage.toUpperCase()})`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onClick={() => setActiveQuestion(question.id)}
                />
              </div>

              {/* Help Text */}
              {isActive && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {tr('helpText')} ({currentLanguage.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={question.help_text[currentLanguage]}
                    onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'help_text', {
                      ...question.help_text,
                      [currentLanguage]: e.target.value
                    })}
                    placeholder={tr('addHelperText')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              )}

              {/* Options for Multiple Choice, Checkbox, Dropdown */}
              {hasOptions && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    {tr('options')} ({currentLanguage.toUpperCase()})
                  </label>
                  <div className="space-y-3">
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {question.question_type === 'boolean' ? '✓' :
                             question.question_type === 'radio' ? '⚪' :
                             question.question_type === 'checkbox' ? '☑️' : '▼'}
                          </span>
                          <input
                            type="text"
                            value={option.label[currentLanguage]}
                            onChange={(e) => updateOption(sectionIndex, questionIndex, optIndex, currentLanguage, e.target.value)}
                            placeholder={`${tr('option')} ${optIndex + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                          <button
                            onClick={() => deleteOption(sectionIndex, questionIndex, optIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title={tr('deleteQuestion')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {(question.question_type === 'radio' || question.question_type === 'checkbox') && (
                          <div className="ml-8 flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`custom-input-${sectionIndex}-${questionIndex}-${optIndex}`}
                              checked={option.allowsCustomInput || false}
                              onChange={() => toggleOptionCustomInput(sectionIndex, questionIndex, optIndex)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                            />
                            <label
                              htmlFor={`custom-input-${sectionIndex}-${questionIndex}-${optIndex}`}
                              className="text-xs text-gray-600 cursor-pointer"
                            >
                              {currentLanguage === 'en' ? 'Allow custom text input' :
                               currentLanguage === 'sq' ? 'Lejo hyrjen e tekstit të personalizuar' :
                               'Dozvoliti prilagođeni tekstualni unos'}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(sectionIndex, questionIndex)}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      {tr('addOption')}
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Rules (shown when active) */}
              {isActive && question.question_type === 'number' && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-700 mb-2">{tr('validationRules')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{tr('minValue')}</label>
                      <input
                        type="number"
                        value={question.validation_rules?.min || ''}
                        onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'validation_rules', {
                          ...question.validation_rules,
                          min: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{tr('maxValue')}</label>
                      <input
                        type="number"
                        value={question.validation_rules?.max || ''}
                        onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'validation_rules', {
                          ...question.validation_rules,
                          max: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Question Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => duplicateQuestion(sectionIndex, questionIndex)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title={tr('duplicateQuestion')}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteQuestion(sectionIndex, questionIndex)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title={tr('deleteQuestion')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            <button
              onClick={() => moveQuestion(sectionIndex, questionIndex, 'up')}
              disabled={questionIndex === 0}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title={tr('moveUp')}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveQuestion(sectionIndex, questionIndex, 'down')}
              disabled={questionIndex === questionnaire.sections[sectionIndex].questions.length - 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title={tr('moveDown')}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">{tr('loadingQuestionnaire')}</p>
        </div>
      </div>
    );
  }

  const currentSection = questionnaire.sections[activeSection];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/questionnaires')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title={tr('backToQuestionnaires')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <input
                  type="text"
                  value={questionnaire.title}
                  onChange={(e) => setQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={tr('untitledQuestionnaire')}
                  className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 px-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as 'en' | 'sq' | 'sr')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500"
                title={tr('selectLanguageForEditing')}
              >
                <option value="en">🌐 English (EN)</option>
                <option value="sq">🌐 Shqip (SQ)</option>
                <option value="sr">🌐 Српски (SR)</option>
              </select>

              <button
                onClick={() => setShareModalOpen(true)}
                disabled={!id}
                className="px-4 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                {tr('share')}
              </button>

              <button
                onClick={() => id && window.open(`/questionnaire/${id}`, '_blank')}
                disabled={!id}
                className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                {tr('preview')}
              </button>

              <button
                onClick={saveQuestionnaire}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:bg-gray-400"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {tr('saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {tr('save')}
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Questionnaire Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <input
            type="text"
            value={questionnaire.title}
            onChange={(e) => setQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
            placeholder={tr('questionnaireTitle')}
            className="w-full text-2xl font-bold text-gray-900 border-none focus:outline-none focus:ring-0 px-0 mb-4"
          />
          <textarea
            value={questionnaire.description}
            onChange={(e) => setQuestionnaire(prev => ({ ...prev, description: e.target.value }))}
            placeholder={tr('questionnaireDescription')}
            rows={2}
            className="w-full text-gray-600 border-none focus:outline-none focus:ring-0 px-0 resize-none mb-4"
          />
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tr('password')}
            </label>
            <input
              type="text"
              value={questionnaire.password || ''}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, password: e.target.value }))}
              placeholder={tr('passwordPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
            />
          </div>
        </div>

        {/* Section Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex items-center border-b border-gray-200 overflow-x-auto">
            {questionnaire.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === index
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {section.title[currentLanguage] || `Section ${index + 1}`}
              </button>
            ))}
            <button
              onClick={addSection}
              className="px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {tr('addSection')}
            </button>
            <button
              onClick={() => setLibraryModalOpen(true)}
              className="px-4 py-3 text-sm font-medium text-cyan-600 hover:bg-cyan-50 flex items-center gap-1 whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              {t('addFromExisting')}
            </button>
          </div>

          {/* Section Editor */}
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('sectionTitle')} ({currentLanguage.toUpperCase()})
              </label>
              <input
                type="text"
                value={currentSection.title[currentLanguage]}
                onChange={(e) => updateSection(activeSection, 'title', {
                  ...currentSection.title,
                  [currentLanguage]: e.target.value
                })}
                placeholder={tr('sectionTitle')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('sectionDescription')} ({currentLanguage.toUpperCase()})
              </label>
              <textarea
                value={currentSection.description[currentLanguage]}
                onChange={(e) => updateSection(activeSection, 'description', {
                  ...currentSection.description,
                  [currentLanguage]: e.target.value
                })}
                placeholder={tr('sectionDescription')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {questionnaire.sections.length > 1 && (
              <button
                onClick={() => deleteSection(activeSection)}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mb-4"
              >
                <Trash2 className="w-4 h-4" />
                {tr('deleteSection')}
              </button>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="mb-6">
          {currentSection.questions.map((question, qIndex) =>
            renderQuestionEditor(question, activeSection, qIndex)
          )}

          <button
            onClick={() => addQuestion(activeSection)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {tr('addQuestion')}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">
            {questionnaire.sections.reduce((acc, s) => acc + s.questions.length, 0)} {tr('questionsAcrossSections')} {questionnaire.sections.length} {tr('sections')}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/questionnaires')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {tr('cancel')}
            </button>
            <button
              onClick={saveQuestionnaire}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? tr('saving') : tr('saveQuestionnaire')}
            </button>
          </div>
        </div>
      </div>

      {id && questionnaire.title && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          questionnaireId={id}
          questionnaireTitle={questionnaire.title}
          language={currentLanguage}
        />
      )}

      {id && (
        <SectionLibraryModal
          isOpen={libraryModalOpen}
          onClose={() => setLibraryModalOpen(false)}
          mode="add"
          targetQuestionnaireId={id}
          onSuccess={(questionnaireId) => {
            setLibraryModalOpen(false);
            // Reload the questionnaire to show the newly added sections
            loadQuestionnaire();
            showToast.success('Sections added successfully!');
          }}
        />
      )}
    </div>
  );
};

export default QuestionnaireBuilder;
