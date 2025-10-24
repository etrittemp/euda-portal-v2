import React from 'react';

const QuestionnairePage: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/euda-questionnaire.html"
        className="w-full h-full border-0"
        title="EUDA Questionnaire"
      />
    </div>
  );
};

export default QuestionnairePage;
