// Test utility for Google Form integration
// Run this in browser console to test form submission

import { submitToGoogleForm } from '@/lib/googleForm';

export const testFormSubmission = async () => {
  console.log('🧪 Testing Google Form submission...');
  
  const testData = {
    userTeam: 'team-a', // Team 01
    votedFor: 'team-b', // Team 02
  };
  
  try {
    const result = await submitToGoogleForm(testData);
    
    if (result) {
      console.log('✅ Test submission successful!');
      console.log('Check your Google Form responses to verify the data was received.');
    } else {
      console.log('❌ Test submission failed.');
      console.log('This might be due to incorrect field IDs or form settings.');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test submission error:', error);
    return false;
  }
};

// Instructions for manual testing
export const getTestInstructions = () => {
  console.log(`
🧪 GOOGLE FORM INTEGRATION TEST

To test the Google Form integration:

1. Open browser console (F12)
2. Run: testFormSubmission()
3. Check the console for success/error messages
4. Go to your Google Form responses to verify data was submitted

Expected console output:
✅ "Test submission successful!" - Integration working
❌ "Test submission failed." - Check field IDs in googleForm.ts

Form URL: https://forms.gle/ijRmhMdNy2iFX5EU8

Test data being submitted:
- User Team: Team 1 (team-a)
- Voted For: Team 2 (team-b)
  `);
};

// Browser-friendly version for console testing
if (typeof window !== 'undefined') {
  (window as any).testGoogleForm = testFormSubmission;
  (window as any).getTestInstructions = getTestInstructions;
}
