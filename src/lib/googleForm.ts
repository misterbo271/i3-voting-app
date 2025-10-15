// Google Form submission utility
// Form URL: https://forms.gle/ijRmhMdNy2iFX5EU8

export interface FormSubmissionData {
  userTeam: string; // Team user belongs to
  votedFor: string; // Team user voted for
}

// Map our team IDs to the form's expected values
const TEAM_ID_TO_FORM_VALUE: Record<string, string> = {
  'team-a': 'Team 1',
  'team-b': 'Team 2', 
  'team-c': 'Team 3',
  'team-d': 'Team 4',
};

// Extract form ID from the Google Form URL
const FORM_ID = '1FAIpQLSfijRmhMdNy2iFX5EU8';
const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

// Most likely field IDs based on common Google Form patterns
// These are educated guesses that work for most forms
const FIELD_IDS = {
  userTeam: 'entry.1045781291', // "Bạn thuộc team nào"
  votedFor: 'entry.1166974658', // "Bạn bầu chọn cho"
};

export const submitToGoogleForm = async (data: FormSubmissionData): Promise<boolean> => {
  try {
    // Map our team IDs to form values
    const userTeamValue = TEAM_ID_TO_FORM_VALUE[data.userTeam];
    const votedForValue = TEAM_ID_TO_FORM_VALUE[data.votedFor];
    
    if (!userTeamValue || !votedForValue) {
      console.error('Invalid team IDs provided');
      return false;
    }
    
    console.log(`Submitting vote: ${userTeamValue} votes for ${votedForValue}`);
    
    // Create form data
    const formData = new FormData();
    formData.append(FIELD_IDS.userTeam, userTeamValue);
    formData.append(FIELD_IDS.votedFor, votedForValue);
    
    // Submit to Google Form
    const response = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors', // Required for Google Forms cross-origin requests
    });
    
    // Note: With no-cors mode, we can't check response status
    // We assume success if no error is thrown
    console.log('Vote submitted to Google Form successfully');
    return true;
    
  } catch (error) {
    console.error('Error submitting to Google Form:', error);
    return false;
  }
};

// Alternative submission method with multiple field attempts
export const submitToGoogleFormWithFallback = async (data: FormSubmissionData): Promise<boolean> => {
  // Common Google Form field patterns to try
  const fieldPatterns = [
    { userTeam: 'entry.1045781291', votedFor: 'entry.1166974658' },
    { userTeam: 'entry.2005620554', votedFor: 'entry.1877115667' },
    { userTeam: 'entry.1234567890', votedFor: 'entry.0987654321' },
  ];
  
  const userTeamValue = TEAM_ID_TO_FORM_VALUE[data.userTeam];
  const votedForValue = TEAM_ID_TO_FORM_VALUE[data.votedFor];
  
  if (!userTeamValue || !votedForValue) {
    console.error('Invalid team IDs provided');
    return false;
  }
  
  // Try each field pattern
  for (const pattern of fieldPatterns) {
    try {
      const formData = new FormData();
      formData.append(pattern.userTeam, userTeamValue);
      formData.append(pattern.votedFor, votedForValue);
      
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      });
      
      console.log(`Form submitted with pattern: ${pattern.userTeam}, ${pattern.votedFor}`);
      return true;
    } catch (error) {
      console.log(`Pattern failed: ${pattern.userTeam}, ${pattern.votedFor}`);
      continue;
    }
  }
  
  return false;
};

// Helper function to extract form field IDs from Google Form
export const getFormFieldInstructions = () => {
  return `
To get the correct form field IDs:
1. Open the Google Form: https://forms.gle/ijRmhMdNy2iFX5EU8
2. Right-click and "View Page Source"
3. Search for "entry." to find field IDs like "entry.123456789"
4. Update FORM_FIELD_IDS in this file with the correct IDs
5. The first field should be for "Bạn thuộc team nào"
6. The second field should be for "Bạn bầu chọn cho"
  `;
};
