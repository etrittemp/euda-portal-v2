import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Globe,
  Clock
} from 'lucide-react';
import { questionnaireAPI, responsesAPI } from './api';
import { useParams, useSearchParams } from 'react-router-dom';

interface Question {
  id: string;
  question_text: any; // Multi-language object
  question_type: string;
  options: any[] | null;
  required: boolean;
  order_index: number;
  validation_rules: any;
  help_text: any;
}

interface Section {
  id: string;
  title: any; // Multi-language object
  description: any;
  order_index: number;
  questions: Question[];
}

interface QuestionnaireData {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

const DynamicQuestionnaire: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [language, setLanguage] = useState<'en' | 'sq' | 'sr'>('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Contact info
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [country, setCountry] = useState('');

  const countries = [
    'Albania', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria',
    'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland',
    'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
    'Kosovo', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Montenegro',
    'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal',
    'Romania', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
    'Switzerland', 'Turkey', 'United Kingdom'
  ];

  const languageNames = {
    en: 'English',
    sq: 'Shqip',
    sr: 'Српски'
  };

  useEffect(() => {
    loadQuestionnaire();

    // Try to load saved draft from localStorage
    const savedDraft = localStorage.getItem(`questionnaire_draft_${id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setResponses(draft.responses || {});
        setContactName(draft.contactName || '');
        setContactEmail(draft.contactEmail || '');
        setCountry(draft.country || '');
        setLanguage(draft.language || 'en');
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }

    // Check for language preference from URL
    const langParam = searchParams.get('lang');
    if (langParam && ['en', 'sq', 'sr'].includes(langParam)) {
      setLanguage(langParam as 'en' | 'sq' | 'sr');
    }
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await questionnaireAPI.getPublic(id!);
      setQuestionnaire(data);
    } catch (err: any) {
      console.error('Error loading questionnaire:', err);
      setError(err.response?.data?.error || 'Failed to load questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const getText = (multiLangObj: any): string => {
    if (!multiLangObj) return '';
    if (typeof multiLangObj === 'string') return multiLangObj;
    return multiLangObj[language] || multiLangObj.en || multiLangObj.sq || multiLangObj.sr || '';
  };

  const handleResponseChange = (questionId: string, value: any, questionText: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question: questionText,
        answer: value
      }
    }));

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateQuestion = (question: Question, value: any): string | null => {
    const questionText = getText(question.question_text);

    // Check required
    if (question.required && (!value || value === '')) {
      return 'This field is required';
    }

    // Skip validation if empty and not required
    if (!value || value === '') {
      return null;
    }

    // Type-specific validation
    if (question.question_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (question.question_type === 'url') {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    if (question.question_type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }

      if (question.validation_rules) {
        if (question.validation_rules.min !== undefined && num < question.validation_rules.min) {
          return `Value must be at least ${question.validation_rules.min}`;
        }
        if (question.validation_rules.max !== undefined && num > question.validation_rules.max) {
          return `Value must be at most ${question.validation_rules.max}`;
        }
      }
    }

    // Custom validation rules
    if (question.validation_rules) {
      if (question.validation_rules.minLength && value.length < question.validation_rules.minLength) {
        return `Minimum length is ${question.validation_rules.minLength} characters`;
      }
      if (question.validation_rules.maxLength && value.length > question.validation_rules.maxLength) {
        return `Maximum length is ${question.validation_rules.maxLength} characters`;
      }
      if (question.validation_rules.pattern) {
        const regex = new RegExp(question.validation_rules.pattern);
        if (!regex.test(value)) {
          return question.validation_rules.patternMessage || 'Invalid format';
        }
      }
    }

    return null;
  };

  const validateCurrentSection = (): boolean => {
    if (!questionnaire) return false;

    const currentSection = questionnaire.sections[currentSectionIndex];
    const errors: { [key: string]: string } = {};

    for (const question of currentSection.questions) {
      const response = responses[question.id];
      const value = response?.answer;
      const error = validateQuestion(question, value);

      if (error) {
        errors[question.id] = error;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAllSections = (): boolean => {
    if (!questionnaire) return false;

    const errors: { [key: string]: string } = {};

    for (const section of questionnaire.sections) {
      for (const question of section.questions) {
        const response = responses[question.id];
        const value = response?.answer;
        const error = validateQuestion(question, value);

        if (error) {
          errors[question.id] = error;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveDraft = () => {
    if (!id) return;

    const draft = {
      responses,
      contactName,
      contactEmail,
      country,
      language,
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem(`questionnaire_draft_${id}`, JSON.stringify(draft));
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (questionnaire && currentSectionIndex < questionnaire.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      saveDraft();
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    // Validate contact info
    if (!contactName || !contactEmail || !country) {
      setError('Please fill in your contact information');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate all sections
    if (!validateAllSections()) {
      setError('Please fix all validation errors before submitting');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!window.confirm('Are you sure you want to submit this questionnaire?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await responsesAPI.create({
        country,
        contactName,
        contactEmail,
        completionStatus: 'Complete',
        responses,
        questionnaireId: id,
        language
      });

      // Clear draft from localStorage
      localStorage.removeItem(`questionnaire_draft_${id}`);

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Failed to submit questionnaire');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const response = responses[question.id];
    const value = response?.answer || '';
    const questionText = getText(question.question_text);
    const hasError = !!validationErrors[question.id];

    const inputClasses = `w-full px-4 py-2 border ${
      hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
    } rounded-lg focus:ring-2 focus:border-transparent`;

    switch (question.question_type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={question.question_type}
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
            placeholder={getText(question.help_text) || ''}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
            placeholder={getText(question.help_text) || ''}
            min={question.validation_rules?.min}
            max={question.validation_rules?.max}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
            rows={4}
            placeholder={getText(question.help_text) || ''}
          />
        );

      case 'boolean':
        // Boolean questions (Yes/No, Po/Jo) - render as radio buttons
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const isSelected = value === option.value;

              return (
                <div key={index}>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{getText(option.label)}</span>
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const isSelected = value === option.value || (typeof value === 'object' && value?.value === option.value);
              const customValue = typeof value === 'object' ? value?.customText || '' : '';

              return (
                <div key={index} className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => {
                        if (option.allowsCustomInput) {
                          handleResponseChange(question.id, { value: e.target.value, customText: '' }, questionText);
                        } else {
                          handleResponseChange(question.id, e.target.value, questionText);
                        }
                      }}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-900">{getText(option.label)}</span>
                  </label>
                  {option.allowsCustomInput && isSelected && (
                    <div className="ml-7 pl-4 border-l-2 border-purple-300">
                      <input
                        type="text"
                        value={customValue}
                        onChange={(e) => handleResponseChange(question.id, { value: option.value, customText: e.target.value }, questionText)}
                        placeholder={currentLanguage === 'en' ? 'Please specify...' :
                                   currentLanguage === 'sq' ? 'Ju lutem specifikoni...' :
                                   'Molimo navedite...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const isChecked = selectedValues.some((v: any) =>
                typeof v === 'string' ? v === option.value : v?.value === option.value
              );
              const existingItem = selectedValues.find((v: any) =>
                typeof v === 'string' ? v === option.value : v?.value === option.value
              );
              const customValue = typeof existingItem === 'object' ? existingItem?.customText || '' : '';

              return (
                <div key={index} className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={isChecked}
                      onChange={(e) => {
                        let newValues;
                        if (e.target.checked) {
                          const newItem = option.allowsCustomInput
                            ? { value: option.value, customText: '' }
                            : option.value;
                          newValues = [...selectedValues, newItem];
                        } else {
                          newValues = selectedValues.filter((v: any) =>
                            typeof v === 'string' ? v !== option.value : v?.value !== option.value
                          );
                        }
                        handleResponseChange(question.id, newValues, questionText);
                      }}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-3 text-gray-900">{getText(option.label)}</span>
                  </label>
                  {option.allowsCustomInput && isChecked && (
                    <div className="ml-7 pl-4 border-l-2 border-purple-300">
                      <input
                        type="text"
                        value={customValue}
                        onChange={(e) => {
                          const newValues = selectedValues.map((v: any) => {
                            if (typeof v === 'string') {
                              return v === option.value ? { value: option.value, customText: e.target.value } : v;
                            } else {
                              return v?.value === option.value ? { ...v, customText: e.target.value } : v;
                            }
                          });
                          handleResponseChange(question.id, newValues, questionText);
                        }}
                        placeholder={currentLanguage === 'en' ? 'Please specify...' :
                                   currentLanguage === 'sq' ? 'Ju lutem specifikoni...' :
                                   'Molimo navedite...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
          >
            <option value="">-- Select an option --</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {getText(option.label)}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value, questionText)}
            className={inputClasses}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your questionnaire has been submitted successfully. We appreciate your participation.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              A confirmation has been recorded under: <br />
              <strong>{contactEmail}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!questionnaire) return null;

  const currentSection = questionnaire.sections[currentSectionIndex];
  const progress = ((currentSectionIndex + 1) / questionnaire.sections.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{questionnaire.title}</h1>
              {questionnaire.description && (
                <p className="text-purple-100">{questionnaire.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sq' | 'sr')}
                className="px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code} className="text-gray-900">
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-purple-100 mt-2">
            Section {currentSectionIndex + 1} of {questionnaire.sections.length}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Contact Information (shown on first section) */}
        {currentSectionIndex === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select Country --</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Current Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getText(currentSection.title)}
          </h2>
          {currentSection.description && (
            <p className="text-gray-600 mb-6">{getText(currentSection.description)}</p>
          )}

          <div className="space-y-6">
            {currentSection.questions.map((question, index) => (
              <div key={question.id} className="border-l-4 border-purple-200 pl-4 py-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded mr-2">
                    Q{index + 1}
                  </span>
                  {getText(question.question_text)}
                  {question.required && <span className="text-red-600 ml-1">*</span>}
                </label>

                {question.help_text && (
                  <p className="text-sm text-gray-500 mb-2">{getText(question.help_text)}</p>
                )}

                {renderQuestionInput(question)}

                {validationErrors[question.id] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors[question.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={saveDraft}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Clock className="w-5 h-5 animate-pulse" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Draft
              </>
            )}
          </button>

          {currentSectionIndex < questionnaire.sections.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Questionnaire
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>* Required fields must be completed</p>
        </div>
      </div>
    </div>
  );
};

export default DynamicQuestionnaire;
