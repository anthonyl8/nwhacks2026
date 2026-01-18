import React from 'react';
import InputField from '../components/InputField';
import NavBar from '../components/NavBar';

const NewSessionContainer: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('Sessions');
  const [formData, setFormData] = React.useState({
    feeling: '',
    talkAbout: '',
    avoidTopics: '',
    conversationStyle: '',
    chatLength:'',
    sessionName:'',
    recordOption: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartSession = () => {
    console.log('Session started with data:', formData);
  };

  return (
    <div className="min-h-screen bg-teal-700 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="space-y-6">
          <InputField
            label="How are you currently feeling?"
            isOptional={false}
            hasOptions={false}
            defaultText="relaxed, stressed, sad, ..."
            value={formData.feeling}
            onChange={(value) => handleInputChange('feeling', value)}
          />

          <InputField
            label="Anything on your mind that you would like to talk about?"
            isOptional={true}
            hasOptions={false}
            defaultText="work, school, relationships, goals, fun facts, ..."
            value={formData.talkAbout}
            onChange={(value) => handleInputChange('talkAbout', value)}
          />

          <InputField
            label="Anything that you don't want to talk about for this session?"
            isOptional={true}
            hasOptions={false}
            defaultText="type in any topic you would like to avoid"
            value={formData.avoidTopics}
            onChange={(value) => handleInputChange('avoidTopics', value)}
          />

          <InputField
            label="How should I talk to you right now?"
            isOptional={true}
            hasOptions={true}
            options={['friend', 'acquaintance', 'mentor', 'stranger']}
            defaultText="Select one of the options"
            value={formData.conversationStyle}
            onChange={(value) => handleInputChange('conversationStyle', value)}
          />

          <InputField
          label="How long are we chatting for?"
          isOptional={false}
          hasOptions={true}
          options={['I would like to fall asleep eventually', 'I want to stay up for a bit longer and chat!']}
          defaultText="Select one of the options"
          value={formData.chatLength}
          onChange={(value) => handleInputChange('chatLength', value)}
          />

          <InputField
          label="What would you like to name this session?"
          isOptional={true}
          hasOptions={false}
          defaultText="Enter a descriptive name that will help you remember our chat!"
          value={formData.sessionName}
          onChange={(value) => handleInputChange('sessionName', value)}
          />

          <InputField
          label="Would you like to record this session? Nothing will be recorded without your permission."
          isOptional={false}
          hasOptions={true}
          options={['Yes, I would like to record this session for analysis purposes',
                    'No, I would not like to save this session after it is over'
          ]}
          defaultText="Enter a descriptive name that will help you remember our chat!"
          value={formData.recordOption}
          onChange={(value) => handleInputChange('recordOption', value)}
          />

          <div className="flex justify-center pt-6">
            <button
              onClick={handleStartSession}
              className="px-12 py-3 bg-white text-teal-700 rounded-full font-medium hover:bg-teal-50 transition-colors shadow-md"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSessionContainer;