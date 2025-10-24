// Translation keys for the application
// This file contains all UI text translations for English, Albanian (Shqip), and Serbian (Српски)

export interface Translations {
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  create: string;
  update: string;
  submit: string;
  back: string;
  next: string;
  previous: string;
  search: string;
  filter: string;
  all: string;
  required: string;
  optional: string;

  // Authentication
  login: string;
  logout: string;
  email: string;
  password: string;
  signIn: string;
  signingIn: string;
  invalidCredentials: string;
  adminLogin: string;

  // Landing Page
  questionnairePortal: string;
  enterCodeToBegin: string;
  questionnaireCode: string;
  enterYourCode: string;
  continue: string;
  passwordRequired: string;
  questionnairePasswordProtected: string;
  enterQuestionnairePassword: string;
  questionnaireNotFound: string;
  incorrectPassword: string;

  // Dashboard
  dashboard: string;
  adminDashboard: string;
  totalResponses: string;
  complete: string;
  partial: string;
  countries: string;
  refresh: string;
  downloadCSV: string;
  downloadJSON: string;
  clearAll: string;
  noResponses: string;
  noMatchingResponses: string;
  viewDetails: string;
  deleteResponse: string;
  confirmDelete: string;
  confirmDeleteAll: string;

  // Questionnaire Management
  questionnaires: string;
  manageQuestionnaires: string;
  createNew: string;
  createFromExisting: string;
  addFromExisting: string;
  uploadDocument: string;
  sectionLibrary: string;
  browseLibrary: string;
  selectedItems: string;
  selectSectionsQuestions: string;
  noItemsSelected: string;
  sectionsSelected: string;
  questionsSelected: string;
  addSelected: string;
  noQuestionnairesFound: string;
  questions: string;
  sections: string;
  processing: string;
  sectionsAddedSuccess: string;
  failedToCloneSections: string;
  loadingLibrary: string;
  createQuestionnaire: string;
  noQuestionnairesAvailable: string;
  questionnaireTitle: string;
  questionnaireDescription: string;
  status: string;
  draft: string;
  active: string;
  archived: string;
  duplicate: string;
  activate: string;
  archive: string;
  reactivate: string;
  preview: string;
  viewResponses: string;
  noQuestionnaires: string;
  noMatchingQuestionnaires: string;
  uploadFile: string;
  converting: string;
  creating: string;
  uploadAndConvert: string;
  fileUploadTip: string;
  selectFileAndTitle: string;
  documentFileWordOrPDF: string;
  selectedFile: string;
  enterQuestionnaireTitle: string;
  descriptionOptional: string;
  enterDescription: string;
  getStartedMessage: string;
  tryAdjustingFilters: string;
  searchQuestionnaires: string;
  allStatus: string;
  responses: string;
  created: string;
  published: string;
  enterDuplicateTitle: string;
  confirmDeleteQuestionnaire: string;
  questionnaireActivated: string;
  questionnaireArchived: string;
  questionnaireReactivated: string;
  failedToUpdateStatus: string;
  questionnaireDuplicated: string;
  failedToDuplicate: string;
  failedToDelete: string;
  failedToUpload: string;
  previewQuestionnaire: string;
  loadingQuestionnaires: string;
  createManageMonitor: string;
  tip: string;

  // Questionnaire Form
  contactInformation: string;
  yourName: string;
  emailAddress: string;
  country: string;
  selectCountry: string;
  section: string;
  of: string;
  saveDraft: string;
  saved: string;
  submitQuestionnaire: string;
  submitting: string;
  thankYou: string;
  submissionSuccess: string;
  confirmationRecorded: string;
  fillContactInfo: string;
  fixValidationErrors: string;
  confirmSubmit: string;

  // Validation
  fieldRequired: string;
  invalidEmail: string;
  invalidURL: string;
  invalidNumber: string;
  minValue: string;
  maxValue: string;
  minLength: string;
  maxLength: string;
  invalidFormat: string;

  // Status Messages
  loadingQuestionnaire: string;
  failedToLoad: string;
  createdSuccessfully: string;
  updatedSuccessfully: string;
  deletedSuccessfully: string;
  uploadedSuccessfully: string;
  cannotDeleteWithResponses: string;

  // Question Types
  textInput: string;
  textArea: string;
  singleChoice: string;
  multipleChoice: string;
  dropdown: string;
  dateInput: string;
  numberInput: string;
  emailInput: string;
  urlInput: string;
  fileUpload: string;

  // Misc
  selectOption: string;
  enterText: string;
  chooseFile: string;
  loggedInAs: string;
  contactSuperadmin: string;
}

export const translations: Record<'en' | 'sq' | 'sr', Translations> = {
  // English
  en: {
    // Common
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    required: 'Required',
    optional: 'Optional',

    // Authentication
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    invalidCredentials: 'Invalid email or password',
    adminLogin: 'Admin Login',

    // Landing Page
    questionnairePortal: 'Questionnaire Portal',
    enterCodeToBegin: 'Enter your questionnaire code to begin',
    questionnaireCode: 'Questionnaire Code',
    enterYourCode: 'Enter your code',
    continue: 'Continue',
    passwordRequired: 'Password Required',
    questionnairePasswordProtected: 'This questionnaire is password protected',
    enterQuestionnairePassword: 'Enter questionnaire password',
    questionnaireNotFound: 'Questionnaire not found. Please check the code and try again.',
    incorrectPassword: 'Incorrect password. Please try again.',

    // Dashboard
    dashboard: 'Dashboard',
    adminDashboard: 'Admin Dashboard',
    totalResponses: 'Total Responses',
    complete: 'Complete',
    partial: 'Partial',
    countries: 'Countries',
    refresh: 'Refresh',
    downloadCSV: 'Download CSV',
    downloadJSON: 'Download JSON',
    clearAll: 'Clear All',
    noResponses: 'No Responses Yet',
    noMatchingResponses: 'No Matching Responses',
    viewDetails: 'View Details',
    deleteResponse: 'Delete Response',
    confirmDelete: 'Are you sure you want to delete this response?',
    confirmDeleteAll: 'Are you sure you want to delete ALL responses? This action cannot be undone.',

    // Questionnaire Management
    questionnaires: 'Questionnaires',
    manageQuestionnaires: 'Manage Questionnaires',
    createNew: 'Create New',
    createFromExisting: 'Create from Existing',
    addFromExisting: 'Add from Existing',
    uploadDocument: 'Upload Document',
    sectionLibrary: 'Section Library',
    browseLibrary: 'Browse Library',
    selectedItems: 'Selected Items',
    selectSectionsQuestions: 'Select sections or questions from existing questionnaires',
    noItemsSelected: 'No items selected. Select sections or questions from the left.',
    sectionsSelected: 'section(s)',
    questionsSelected: 'question(s)',
    addSelected: 'Add Selected',
    noQuestionnairesFound: 'No questionnaires found',
    questions: 'questions',
    sections: 'sections',
    processing: 'Processing...',
    sectionsAddedSuccess: 'Sections added successfully!',
    failedToCloneSections: 'Failed to clone sections',
    loadingLibrary: 'Loading library...',
    createQuestionnaire: 'Create Questionnaire',
    noQuestionnairesAvailable: 'No questionnaires available',
    questionnaireTitle: 'Questionnaire Title',
    questionnaireDescription: 'Description',
    status: 'Status',
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
    duplicate: 'Duplicate',
    activate: 'Activate',
    archive: 'Archive',
    reactivate: 'Reactivate',
    preview: 'Preview',
    viewResponses: 'View Responses',
    noQuestionnaires: 'No Questionnaires Yet',
    noMatchingQuestionnaires: 'No Matching Questionnaires',
    uploadFile: 'Upload File',
    converting: 'Converting...',
    creating: 'Creating',
    uploadAndConvert: 'Upload & Convert',
    fileUploadTip: 'The system will automatically detect sections and questions from your document. You can edit them after upload.',
    selectFileAndTitle: 'Please select a file and provide a title',
    documentFileWordOrPDF: 'Document File (Word or PDF)',
    selectedFile: 'Selected',
    enterQuestionnaireTitle: 'Enter questionnaire title',
    descriptionOptional: 'Description (Optional)',
    enterDescription: 'Enter questionnaire description',
    getStartedMessage: 'Get started by creating a new questionnaire or uploading a document',
    tryAdjustingFilters: 'Try adjusting your search or filter criteria',
    searchQuestionnaires: 'Search questionnaires...',
    allStatus: 'All Status',
    responses: 'Responses',
    created: 'Created',
    published: 'Published',
    enterDuplicateTitle: 'Enter title for duplicated questionnaire:',
    confirmDeleteQuestionnaire: 'Are you sure you want to delete this questionnaire? This action cannot be undone.',
    questionnaireActivated: 'Questionnaire activated successfully',
    questionnaireArchived: 'Questionnaire archived successfully',
    questionnaireReactivated: 'Questionnaire reactivated successfully',
    failedToUpdateStatus: 'Failed to update questionnaire status',
    questionnaireDuplicated: 'Questionnaire duplicated successfully!',
    failedToDuplicate: 'Failed to duplicate questionnaire',
    failedToDelete: 'Failed to delete questionnaire',
    failedToUpload: 'Failed to upload file',
    previewQuestionnaire: 'Preview Questionnaire',
    loadingQuestionnaires: 'Loading questionnaires...',
    createManageMonitor: 'Create, manage, and monitor your questionnaires',
    tip: 'Tip',

    // Questionnaire Form
    contactInformation: 'Contact Information',
    yourName: 'Your Name',
    emailAddress: 'Email Address',
    country: 'Country',
    selectCountry: 'Select Country',
    section: 'Section',
    of: 'of',
    saveDraft: 'Save Draft',
    saved: 'Saved',
    submitQuestionnaire: 'Submit Questionnaire',
    submitting: 'Submitting...',
    thankYou: 'Thank You!',
    submissionSuccess: 'Your questionnaire has been submitted successfully. We appreciate your participation.',
    confirmationRecorded: 'A confirmation has been recorded under:',
    fillContactInfo: 'Please fill in your contact information',
    fixValidationErrors: 'Please fix all validation errors before submitting',
    confirmSubmit: 'Are you sure you want to submit this questionnaire?',

    // Validation
    fieldRequired: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidURL: 'Please enter a valid URL',
    invalidNumber: 'Please enter a valid number',
    minValue: 'Value must be at least',
    maxValue: 'Value must be at most',
    minLength: 'Minimum length is',
    maxLength: 'Maximum length is',
    invalidFormat: 'Invalid format',

    // Status Messages
    loadingQuestionnaire: 'Loading questionnaire...',
    failedToLoad: 'Failed to load questionnaire',
    createdSuccessfully: 'Created successfully',
    updatedSuccessfully: 'Updated successfully',
    deletedSuccessfully: 'Deleted successfully',
    uploadedSuccessfully: 'Uploaded successfully',
    cannotDeleteWithResponses: 'Cannot delete questionnaire with existing responses. Archive it instead.',

    // Question Types
    textInput: 'Text Input',
    textArea: 'Text Area',
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    dropdown: 'Dropdown',
    dateInput: 'Date',
    numberInput: 'Number',
    emailInput: 'Email',
    urlInput: 'URL',
    fileUpload: 'File Upload',

    // Misc
    selectOption: 'Select an option',
    enterText: 'Enter text',
    chooseFile: 'Choose file',
    loggedInAs: 'Logged in as',
    contactSuperadmin: 'Contact the superadmin if you need access',
  },

  // Albanian (Shqip)
  sq: {
    // Common
    loading: 'Duke ngarkuar',
    error: 'Gabim',
    success: 'Sukses',
    cancel: 'Anulo',
    save: 'Ruaj',
    delete: 'Fshi',
    edit: 'Ndrysho',
    create: 'Krijo',
    update: 'Përditëso',
    submit: 'Dërgo',
    back: 'Kthehu',
    next: 'Tjetër',
    previous: 'Paraardhës',
    search: 'Kërko',
    filter: 'Filtro',
    all: 'Të gjitha',
    required: 'I detyrueshëm',
    optional: 'Opsional',

    // Authentication
    login: 'Hyrje',
    logout: 'Dalje',
    email: 'Email',
    password: 'Fjalëkalimi',
    signIn: 'Hyr',
    signingIn: 'Duke hyrë...',
    invalidCredentials: 'Email ose fjalëkalim i pavlefshëm',
    adminLogin: 'Hyrje e Administratorit',

    // Landing Page
    questionnairePortal: 'Portali i Pyetësorit',
    enterCodeToBegin: 'Vendosni kodin e pyetësorit tuaj për të filluar',
    questionnaireCode: 'Kodi i Pyetësorit',
    enterYourCode: 'Vendosni kodin tuaj',
    continue: 'Vazhdo',
    passwordRequired: 'Kërkohet Fjalëkalimi',
    questionnairePasswordProtected: 'Ky pyetësor është i mbrojtur me fjalëkalim',
    enterQuestionnairePassword: 'Vendosni fjalëkalimin e pyetësorit',
    questionnaireNotFound: 'Pyetësori nuk u gjet. Ju lutem kontrolloni kodin dhe provoni përsëri.',
    incorrectPassword: 'Fjalëkalim i pasaktë. Ju lutem provoni përsëri.',

    // Dashboard
    dashboard: 'Paneli',
    adminDashboard: 'Paneli i Administratorit',
    totalResponses: 'Përgjigje Totale',
    complete: 'Të plota',
    partial: 'Të pjesshme',
    countries: 'Shtete',
    refresh: 'Rifresko',
    downloadCSV: 'Shkarko CSV',
    downloadJSON: 'Shkarko JSON',
    clearAll: 'Pastro të gjitha',
    noResponses: 'Ende nuk ka përgjigje',
    noMatchingResponses: 'Nuk ka përgjigje që përputhen',
    viewDetails: 'Shiko detajet',
    deleteResponse: 'Fshi përgjigjen',
    confirmDelete: 'Jeni të sigurt që dëshironi të fshini këtë përgjigje?',
    confirmDeleteAll: 'Jeni të sigurt që dëshironi të fshini TË GJITHA përgjigjet? Ky veprim nuk mund të zhbëhet.',

    // Questionnaire Management
    questionnaires: 'Pyetësorët',
    manageQuestionnaires: 'Menaxho pyetësorët',
    createNew: 'Krijo të ri',
    createFromExisting: 'Krijo nga ekzistues',
    addFromExisting: 'Shto nga ekzistues',
    uploadDocument: 'Ngarko dokument',
    sectionLibrary: 'Biblioteka e seksioneve',
    browseLibrary: 'Shfleto bibliotekën',
    selectedItems: 'Artikujt e zgjedhur',
    selectSectionsQuestions: 'Zgjidhni seksione ose pyetje nga pyetësorët ekzistues',
    noItemsSelected: 'Nuk ka artikuj të zgjedhur. Zgjidhni seksione ose pyetje nga e majta.',
    sectionsSelected: 'seksion(e)',
    questionsSelected: 'pyetje',
    addSelected: 'Shto të zgjedhurat',
    noQuestionnairesFound: 'Nuk u gjetën pyetësorë',
    questions: 'pyetje',
    sections: 'seksione',
    processing: 'Duke përpunuar...',
    sectionsAddedSuccess: 'Seksionet u shtuan me sukses!',
    failedToCloneSections: 'Dështoi klonëzimi i seksioneve',
    loadingLibrary: 'Duke ngarkuar bibliotekën...',
    createQuestionnaire: 'Krijo pyetësor',
    noQuestionnairesAvailable: 'Nuk ka pyetësorë të disponueshëm',
    questionnaireTitle: 'Titulli i pyetësorit',
    questionnaireDescription: 'Përshkrimi',
    status: 'Statusi',
    draft: 'Draft',
    active: 'Aktiv',
    archived: 'Arkivuar',
    duplicate: 'Dyfisho',
    activate: 'Aktivizo',
    archive: 'Arkivo',
    reactivate: 'Riaktivizo',
    preview: 'Pamje paraprake',
    viewResponses: 'Shiko përgjigjet',
    noQuestionnaires: 'Ende nuk ka pyetësorë',
    noMatchingQuestionnaires: 'Nuk ka pyetësorë që përputhen',
    uploadFile: 'Ngarko skedar',
    converting: 'Duke konvertuar...',
    creating: 'Duke krijuar',
    uploadAndConvert: 'Ngarko dhe konverto',
    fileUploadTip: 'Sistemi do të zbulojë automatikisht seksionet dhe pyetjet nga dokumenti juaj. Mund t\'i modifikoni ato pas ngarkimit.',
    selectFileAndTitle: 'Ju lutemi zgjidhni një skedar dhe jepni një titull',
    documentFileWordOrPDF: 'Skedari i dokumentit (Word ose PDF)',
    selectedFile: 'I zgjedhur',
    enterQuestionnaireTitle: 'Shkruani titullin e pyetësorit',
    descriptionOptional: 'Përshkrimi (Opsional)',
    enterDescription: 'Shkruani përshkrimin e pyetësorit',
    getStartedMessage: 'Filloni duke krijuar një pyetësor të ri ose duke ngarkuar një dokument',
    tryAdjustingFilters: 'Provoni të rregulloni kriteret e kërkimit ose filtrit',
    searchQuestionnaires: 'Kërko pyetësorë...',
    allStatus: 'Të gjitha statuset',
    responses: 'Përgjigje',
    created: 'Krijuar',
    published: 'Publikuar',
    enterDuplicateTitle: 'Shkruani titullin për pyetësorin e dyfishuar:',
    confirmDeleteQuestionnaire: 'Jeni të sigurt që dëshironi të fshini këtë pyetësor? Ky veprim nuk mund të zhbëhet.',
    questionnaireActivated: 'Pyetësori u aktivizua me sukses',
    questionnaireArchived: 'Pyetësori u arkivua me sukses',
    questionnaireReactivated: 'Pyetësori u riaktivizua me sukses',
    failedToUpdateStatus: 'Dështoi përditësimi i statusit të pyetësorit',
    questionnaireDuplicated: 'Pyetësori u dyfishua me sukses!',
    failedToDuplicate: 'Dështoi dyfishimi i pyetësorit',
    failedToDelete: 'Dështoi fshirja e pyetësorit',
    failedToUpload: 'Dështoi ngarkimi i skedarit',
    previewQuestionnaire: 'Pamje paraprake e pyetësorit',
    loadingQuestionnaires: 'Duke ngarkuar pyetësorët...',
    createManageMonitor: 'Krijoni, menaxhoni dhe monitoroni pyetësorët tuaj',
    tip: 'Këshillë',

    // Questionnaire Form
    contactInformation: 'Informacioni i kontaktit',
    yourName: 'Emri juaj',
    emailAddress: 'Adresa e emailit',
    country: 'Shteti',
    selectCountry: 'Zgjidhni shtetin',
    section: 'Seksioni',
    of: 'nga',
    saveDraft: 'Ruaj draft',
    saved: 'U ruajt',
    submitQuestionnaire: 'Dërgo pyetësorin',
    submitting: 'Duke dërguar...',
    thankYou: 'Faleminderit!',
    submissionSuccess: 'Pyetësori juaj u dërgua me sukses. Faleminderit për pjesëmarrjen.',
    confirmationRecorded: 'Një konfirmim është regjistruar nën:',
    fillContactInfo: 'Ju lutemi plotësoni informacionin tuaj të kontaktit',
    fixValidationErrors: 'Ju lutemi korrigjoni të gjitha gabimet e validimit para se të dërgoni',
    confirmSubmit: 'Jeni të sigurt që dëshironi të dërgoni këtë pyetësor?',

    // Validation
    fieldRequired: 'Kjo fushë është e detyrueshme',
    invalidEmail: 'Ju lutemi vendosni një adresë email të vlefshme',
    invalidURL: 'Ju lutemi vendosni një URL të vlefshme',
    invalidNumber: 'Ju lutemi vendosni një numër të vlefshëm',
    minValue: 'Vlera duhet të jetë të paktën',
    maxValue: 'Vlera duhet të jetë maksimumi',
    minLength: 'Gjatësia minimale është',
    maxLength: 'Gjatësia maksimale është',
    invalidFormat: 'Format i pavlefshëm',

    // Status Messages
    loadingQuestionnaire: 'Duke ngarkuar pyetësorin...',
    failedToLoad: 'Dështoi ngarkimi i pyetësorit',
    createdSuccessfully: 'U krijua me sukses',
    updatedSuccessfully: 'U përditësua me sukses',
    deletedSuccessfully: 'U fshi me sukses',
    uploadedSuccessfully: 'U ngarkua me sukses',
    cannotDeleteWithResponses: 'Nuk mund të fshihet pyetësori me përgjigje ekzistuese. Arkivoni atë në vend të kësaj.',

    // Question Types
    textInput: 'Fusha teksti',
    textArea: 'Zonë teksti',
    singleChoice: 'Zgjedhje e vetme',
    multipleChoice: 'Zgjedhje të shumta',
    dropdown: 'Meny dropdown',
    dateInput: 'Data',
    numberInput: 'Numër',
    emailInput: 'Email',
    urlInput: 'URL',
    fileUpload: 'Ngarkim skedari',

    // Misc
    selectOption: 'Zgjidhni një opsion',
    enterText: 'Shkruani tekstin',
    chooseFile: 'Zgjidhni skedar',
    loggedInAs: 'I kyçur si',
    contactSuperadmin: 'Kontaktoni superadministratorin nëse keni nevojë për qasje',
  },

  // Serbian (Српски)
  sr: {
    // Common
    loading: 'Учитавање',
    error: 'Грешка',
    success: 'Успех',
    cancel: 'Откажи',
    save: 'Сачувај',
    delete: 'Обриши',
    edit: 'Измени',
    create: 'Креирај',
    update: 'Ажурирај',
    submit: 'Пошаљи',
    back: 'Назад',
    next: 'Следеће',
    previous: 'Претходно',
    search: 'Претражи',
    filter: 'Филтрирај',
    all: 'Све',
    required: 'Обавезно',
    optional: 'Опционо',

    // Authentication
    login: 'Пријава',
    logout: 'Одјава',
    email: 'Емаил',
    password: 'Лозинка',
    signIn: 'Пријави се',
    signingIn: 'Пријављивање...',
    invalidCredentials: 'Неважећа емаил адреса или лозинка',
    adminLogin: 'Администраторска пријава',

    // Landing Page
    questionnairePortal: 'Портал упитника',
    enterCodeToBegin: 'Унесите код упитника да бисте почели',
    questionnaireCode: 'Код упитника',
    enterYourCode: 'Унесите ваш код',
    continue: 'Настави',
    passwordRequired: 'Потребна је лозинка',
    questionnairePasswordProtected: 'Овај упитник је заштићен лозинком',
    enterQuestionnairePassword: 'Унесите лозинку упитника',
    questionnaireNotFound: 'Упитник није пронађен. Проверите код и покушајте поново.',
    incorrectPassword: 'Нетачна лозинка. Молимо покушајте поново.',

    // Dashboard
    dashboard: 'Контролна табла',
    adminDashboard: 'Администраторска контролна табла',
    totalResponses: 'Укупно одговора',
    complete: 'Комплетно',
    partial: 'Делимично',
    countries: 'Земље',
    refresh: 'Освежи',
    downloadCSV: 'Преузми CSV',
    downloadJSON: 'Преузми JSON',
    clearAll: 'Обриши све',
    noResponses: 'Још нема одговора',
    noMatchingResponses: 'Нема одговарајућих одговора',
    viewDetails: 'Погледај детаље',
    deleteResponse: 'Обриши одговор',
    confirmDelete: 'Да ли сте сигурни да желите да обришете овај одговор?',
    confirmDeleteAll: 'Да ли сте сигурни да желите да обришете СВЕ одговоре? Ова акција се не може поништити.',

    // Questionnaire Management
    questionnaires: 'Упитници',
    manageQuestionnaires: 'Управљај упитницима',
    createNew: 'Креирај нови',
    createFromExisting: 'Креирај од постојећег',
    addFromExisting: 'Додај од постојећег',
    uploadDocument: 'Отпреми документ',
    sectionLibrary: 'Библиотека секција',
    browseLibrary: 'Прегледај библиотеку',
    selectedItems: 'Изабране ставке',
    selectSectionsQuestions: 'Изаберите секције или питања из постојећих упитника',
    noItemsSelected: 'Нема изабраних ставки. Изаберите секције или питања са леве стране.',
    sectionsSelected: 'секција/е',
    questionsSelected: 'питања',
    addSelected: 'Додај изабрано',
    noQuestionnairesFound: 'Нема пронађених упитника',
    questions: 'питања',
    sections: 'секције',
    processing: 'Обрађивање...',
    sectionsAddedSuccess: 'Секције успешно додате!',
    failedToCloneSections: 'Неуспело клонирање секција',
    loadingLibrary: 'Учитавање библиотеке...',
    createQuestionnaire: 'Креирај упитник',
    noQuestionnairesAvailable: 'Нема доступних упитника',
    questionnaireTitle: 'Наслов упитника',
    questionnaireDescription: 'Опис',
    status: 'Статус',
    draft: 'Нацрт',
    active: 'Активан',
    archived: 'Архивиран',
    duplicate: 'Дуплирај',
    activate: 'Активирај',
    archive: 'Архивирај',
    reactivate: 'Реактивирај',
    preview: 'Преглед',
    viewResponses: 'Погледај одговоре',
    noQuestionnaires: 'Још нема упитника',
    noMatchingQuestionnaires: 'Нема одговарајућих упитника',
    uploadFile: 'Отпреми фајл',
    converting: 'Конверзија...',
    creating: 'Креирање',
    uploadAndConvert: 'Отпреми и конвертуј',
    fileUploadTip: 'Систем ће автоматски детектовати секције и питања из вашег документа. Можете их уредити након отпремања.',
    selectFileAndTitle: 'Молимо изаберите фајл и наведите наслов',
    documentFileWordOrPDF: 'Документ фајл (Word или PDF)',
    selectedFile: 'Изабрано',
    enterQuestionnaireTitle: 'Унесите наслов упитника',
    descriptionOptional: 'Опис (Опционо)',
    enterDescription: 'Унесите опис упитника',
    getStartedMessage: 'Почните креирањем новог упитника или отпремањем документа',
    tryAdjustingFilters: 'Покушајте да прилагодите критеријуме претраге или филтера',
    searchQuestionnaires: 'Претражи упитнике...',
    allStatus: 'Сви статуси',
    responses: 'Одговори',
    created: 'Креирано',
    published: 'Објављено',
    enterDuplicateTitle: 'Унесите наслов за дуплирани упитник:',
    confirmDeleteQuestionnaire: 'Да ли сте сигурни да желите да обришете овај упитник? Ова акција се не може поништити.',
    questionnaireActivated: 'Упитник успешно активиран',
    questionnaireArchived: 'Упитник успешно архивиран',
    questionnaireReactivated: 'Упитник успешно реактивиран',
    failedToUpdateStatus: 'Неуспешно ажурирање статуса упитника',
    questionnaireDuplicated: 'Упитник успешно дуплиран!',
    failedToDuplicate: 'Неуспешно дуплирање упитника',
    failedToDelete: 'Неуспешно брисање упитника',
    failedToUpload: 'Неуспешно отпремање фајла',
    previewQuestionnaire: 'Преглед упитника',
    loadingQuestionnaires: 'Учитавање упитника...',
    createManageMonitor: 'Креирајте, управљајте и пратите ваше упитнике',
    tip: 'Савет',

    // Questionnaire Form
    contactInformation: 'Контакт информације',
    yourName: 'Ваше име',
    emailAddress: 'Емаил адреса',
    country: 'Земља',
    selectCountry: 'Изаберите земљу',
    section: 'Секција',
    of: 'од',
    saveDraft: 'Сачувај нацрт',
    saved: 'Сачувано',
    submitQuestionnaire: 'Пошаљи упитник',
    submitting: 'Слање...',
    thankYou: 'Хвала вам!',
    submissionSuccess: 'Ваш упитник је успешно послат. Хвала вам на учешћу.',
    confirmationRecorded: 'Потврда је забележена под:',
    fillContactInfo: 'Молимо попуните ваше контакт информације',
    fixValidationErrors: 'Молимо исправите све грешке валидације пре слања',
    confirmSubmit: 'Да ли сте сигурни да желите да пошаљете овај упитник?',

    // Validation
    fieldRequired: 'Ово поље је обавезно',
    invalidEmail: 'Молимо унесите важећу емаил адресу',
    invalidURL: 'Молимо унесите важећу URL адресу',
    invalidNumber: 'Молимо унесите важећи број',
    minValue: 'Вредност мора бити најмање',
    maxValue: 'Вредност мора бити највише',
    minLength: 'Минимална дужина је',
    maxLength: 'Максимална дужина је',
    invalidFormat: 'Неважећи формат',

    // Status Messages
    loadingQuestionnaire: 'Учитавање упитника...',
    failedToLoad: 'Учитавање упитника није успело',
    createdSuccessfully: 'Успешно креирано',
    updatedSuccessfully: 'Успешно ажурирано',
    deletedSuccessfully: 'Успешно обрисано',
    uploadedSuccessfully: 'Успешно отпремљено',
    cannotDeleteWithResponses: 'Не може се обрисати упитник са постојећим одговорима. Уместо тога га архивирајте.',

    // Question Types
    textInput: 'Текстуални унос',
    textArea: 'Текстуална област',
    singleChoice: 'Један избор',
    multipleChoice: 'Вишеструки избор',
    dropdown: 'Падајући мени',
    dateInput: 'Датум',
    numberInput: 'Број',
    emailInput: 'Емаил',
    urlInput: 'URL',
    fileUpload: 'Отпремање фајла',

    // Misc
    selectOption: 'Изаберите опцију',
    enterText: 'Унесите текст',
    chooseFile: 'Изаберите фајл',
    loggedInAs: 'Пријављени као',
    contactSuperadmin: 'Контактирајте суперадминистратора ако вам је потребан приступ',
  },
};

export type Language = 'en' | 'sq' | 'sr';

export const getTranslation = (lang: Language, key: keyof Translations): string => {
  return translations[lang][key] || translations.en[key] || key;
};
