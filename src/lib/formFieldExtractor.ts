// Utility to extract Google Form field IDs
// This helps get the correct entry IDs for form submission

export interface FormFieldInfo {
  userTeamFieldId: string;
  votedForFieldId: string;
}

// Known working field IDs for the specific form
// These should be updated based on the actual form inspection
export const KNOWN_FIELD_IDS: FormFieldInfo = {
  userTeamFieldId: 'entry.1045781291', // "Bạn thuộc team nào"
  votedForFieldId: 'entry.1166974658', // "Bạn bầu chọn cho"
};

// Alternative approach: Submit with all possible field names
// Google Forms will ignore unknown fields
export const submitWithAllPossibleFields = (userTeamValue: string, votedForValue: string): FormData => {
  const formData = new FormData();
  
  // Common field ID patterns for Google Forms
  const commonPatterns = [
    'entry.1045781291',
    'entry.1166974658', 
    'entry.2005620554',
    'entry.1877115667',
    'entry.1234567890',
    'entry.0987654321',
    'entry.1111111111',
    'entry.2222222222',
  ];
  
  // Add user team data with multiple possible field names
  commonPatterns.forEach((fieldId, index) => {
    if (index % 2 === 0) {
      // Even indices for user team
      formData.append(fieldId, userTeamValue);
    } else {
      // Odd indices for voted team
      formData.append(fieldId, votedForValue);
    }
  });
  
  return formData;
};

// Instructions for manual field ID extraction
export const getFieldExtractionInstructions = (): string => {
  return `
🔍 To find the correct Google Form field IDs:

1. Open the form: https://forms.gle/ijRmhMdNy2iFX5EU8
2. Right-click → "View Page Source" or press Ctrl+U
3. Search for "entry." (Ctrl+F)
4. Look for patterns like: name="entry.1234567890"
5. Find the field for "Bạn thuộc team nào" (Which team do you belong to)
6. Find the field for "Bạn bầu chọn cho" (You vote for)
7. Update KNOWN_FIELD_IDS in formFieldExtractor.ts

Example patterns to look for:
- <input name="entry.1045781291" ...> (first question)
- <input name="entry.1166974658" ...> (second question)
  `;
};
