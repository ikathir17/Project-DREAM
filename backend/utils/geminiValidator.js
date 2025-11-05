const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API with the provided API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Validates if a complaint is a genuine disaster complaint using Gemini AI
 * @param {string} type - The type of disaster (e.g., flood, earthquake, fire)
 * @param {string} description - The description of the complaint
 * @returns {Promise<{isValid: boolean, confidence: string}>} - Validation result
 */
async function validateDisasterComplaint(type, description) {
  try {
    // Get the generative model - using models/gemini-2.5-flash (fast and efficient)
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    // Create a focused prompt for yes/no validation
    const prompt = `You are a disaster management AI validator. Determine if this is a GENUINE disaster-related emergency.

Complaint Type: ${type}
Description: ${description}

Is this a real disaster complaint that requires immediate attention?

Respond with ONLY ONE WORD - either "YES" or "NO". No explanation, no punctuation, just the word.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toUpperCase();

    // Parse the response
    const isValid = text.includes('YES');
    
    console.log(`Gemini Validation - Type: ${type}, Response: ${text}, Valid: ${isValid}`);

    return {
      isValid: isValid,
      confidence: text,
      rawResponse: text
    };

  } catch (error) {
    console.error('Gemini validation error:', error);
    
    // If Gemini fails, return a default response to not block the system
    // The complaint will still go through ML model validation
    return {
      isValid: null, // null indicates validation failed, not that complaint is invalid
      confidence: 'error',
      error: error.message
    };
  }
}

/**
 * Enhanced validation with detailed reasoning (optional, for logging/debugging)
 * @param {string} type - The type of disaster
 * @param {string} description - The description of the complaint
 * @returns {Promise<{isValid: boolean, reasoning: string}>}
 */
async function validateWithReasoning(type, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

    const prompt = `You are a disaster management AI validator. Analyze this complaint:

Complaint Type: ${type}
Description: ${description}

Provide your analysis in this exact format:
VERDICT: [YES or NO]
REASONING: [Brief explanation in one sentence]

Determine if this is a genuine disaster complaint that requires emergency response.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse verdict and reasoning
    const verdictMatch = text.match(/VERDICT:\s*(YES|NO)/i);
    const reasoningMatch = text.match(/REASONING:\s*(.+)/i);

    const isValid = verdictMatch ? verdictMatch[1].toUpperCase() === 'YES' : false;
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided';

    console.log(`Gemini Detailed Validation - Valid: ${isValid}, Reasoning: ${reasoning}`);

    return {
      isValid: isValid,
      reasoning: reasoning,
      rawResponse: text
    };

  } catch (error) {
    console.error('Gemini detailed validation error:', error);
    return {
      isValid: null,
      reasoning: 'Validation service unavailable',
      error: error.message
    };
  }
}

module.exports = {
  validateDisasterComplaint,
  validateWithReasoning
};
