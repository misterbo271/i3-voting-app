# Google Form Integration Setup

## 🎯 Current Status
The voting app is now integrated with your Google Form at: https://forms.gle/ijRmhMdNy2iFX5EU8

## 📋 How It Works
When users vote, the app will:
1. Submit their vote to the Google Form automatically
2. Save the vote locally for the UI display
3. Show loading indicators during submission
4. Continue working even if Google Form submission fails

## 🔧 Getting the Correct Field IDs

To ensure the Google Form integration works perfectly, you need to extract the correct field IDs:

### Step 1: Open the Form Source
1. Go to: https://forms.gle/ijRmhMdNy2iFX5EU8
2. Right-click and select "View Page Source" (or press Ctrl+U / Cmd+U)

### Step 2: Find the Field IDs
3. Press Ctrl+F (or Cmd+F) and search for: `entry.`
4. Look for patterns like: `name="entry.1234567890"`

### Step 3: Identify the Fields
You should find two main fields:
- **Field 1**: "Bạn thuộc team nào" (Which team do you belong to)
- **Field 2**: "Bạn bầu chọn cho" (You vote for)

### Step 4: Update the Code
Once you find the correct entry IDs, update them in:
`src/lib/googleForm.ts` in the `FIELD_IDS` object:

```typescript
const FIELD_IDS = {
  userTeam: 'entry.XXXXXXXXX', // Replace with actual ID for "Bạn thuộc team nào"
  votedFor: 'entry.YYYYYYYYY', // Replace with actual ID for "Bạn bầu chọn cho"
};
```

## 🧪 Testing the Integration

### Test Steps:
1. Open the voting app: http://localhost:3001
2. Select a team (e.g., Team 01)
3. Vote for another team (e.g., Team 02)
4. Check the browser console for submission logs
5. Check your Google Form responses to see if the vote was recorded

### Console Messages to Look For:
- ✅ `Vote successfully submitted to Google Form`
- ⚠️ `Failed to submit to Google Form, but continuing with local vote`
- ❌ `Error submitting to Google Form: [error details]`

## 🔄 Data Mapping

The app automatically maps team IDs to form values:
- `team-a` → `Team 1`
- `team-b` → `Team 2`
- `team-c` → `Team 3`
- `team-d` → `Team 4`

## 🛠️ Troubleshooting

### If votes aren't appearing in Google Form:
1. Check browser console for error messages
2. Verify the field IDs are correct
3. Ensure the Google Form accepts responses
4. Try the fallback submission method in the code

### Common Issues:
- **CORS errors**: Normal with Google Forms, votes should still work
- **Field ID mismatch**: Update the IDs in `googleForm.ts`
- **Form closed**: Make sure the Google Form is accepting responses

## 📊 Viewing Results

To see the submitted votes:
1. Go to your Google Form
2. Click the "Responses" tab
3. View individual responses or summary charts

The local voting results in the app are separate from the Google Form data and are used for the UI display only.
