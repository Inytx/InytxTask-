
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Priority, Category, ParsedTaskData, DEFAULT_CATEGORIES } from "../types";

// Helper to check if API key exists safely
const getClient = () => {
  try {
    // Check if process is defined to avoid ReferenceError in some browser envs
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  } catch (e) {
    // Ignore access errors
  }
  console.warn("No API_KEY found. using local fallback parser.");
  return null;
};

// Robust local parser for when AI is unavailable
const basicLocalParser = (input: string): ParsedTaskData => {
  let title = input;
  const lower = title.toLowerCase();
  
  // 1. Date Detection
  let dueDate: string | null = null;
  const now = new Date();
  
  // Regex for specific relative days (in X days / dans X jours)
  // Captures optional "scheduled/prévu" prefix, mandatory "in/dans", number, and unit.
  const relativeDaysRegex = /\b(?:(?:scheduled|prévu)\s+)?(?:in|dans)\s+(\d+)\s+(?:days?|jours?)\b/i;
  
  // Regex for keywords (English & French)
  const tomorrowRegex = /\b(tomorrow|demain)\b/i;
  const todayRegex = /\b(today|aujourd'hui)\b/i;
  
  const relativeMatch = title.match(relativeDaysRegex);

  if (relativeMatch) {
    // Handle "In X days"
    const daysToAdd = parseInt(relativeMatch[1], 10);
    if (!isNaN(daysToAdd)) {
        const d = new Date(now);
        d.setDate(d.getDate() + daysToAdd);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dueDate = `${year}-${month}-${day}`;
        
        // Remove the whole phrase "prévu dans X jours" from title
        title = title.replace(relativeDaysRegex, ' ');
    }
  } else if (tomorrowRegex.test(lower)) {
    // Handle Tomorrow
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dueDate = `${year}-${month}-${day}`;
    
    title = title.replace(tomorrowRegex, ' ');
  } else if (todayRegex.test(lower)) {
    // Handle Today
    const d = new Date(now);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dueDate = `${year}-${month}-${day}`;
    
    title = title.replace(todayRegex, ' ');
  }

  // 2. Priority Detection
  let priority = Priority.MEDIUM;
  const highRegex = /\b(urgent|high|important|haute|fort)\b/i;
  const lowRegex = /\b(low|trivial|basse|faible)\b/i;

  if (highRegex.test(title)) {
    priority = Priority.HIGH;
    title = title.replace(highRegex, ' ');
  } else if (lowRegex.test(title)) {
    priority = Priority.LOW;
    title = title.replace(lowRegex, ' ');
  }

  // 3. Category Detection
  let category: Category = "Other"; // Default
  
  // We can't regex match strictly against dynamic categories easily here without passing them in.
  // We keep standard detection for common ones, otherwise default.
  const workRegex = /\b(work|boulot|travail|job|meeting|reunion|projet)\b/i;
  const personalRegex = /\b(personal|perso|home|maison|achat|shopping)\b/i;
  const healthRegex = /\b(health|santé|sante|sport|gym|doctor|medecin|rdv)\b/i;
  const learningRegex = /\b(learn|study|apprendre|cours|ecole|école|read|lire)\b/i;

  if (workRegex.test(title)) {
    category = "Work";
    title = title.replace(workRegex, ' ');
  } else if (personalRegex.test(title)) {
    category = "Personal";
    title = title.replace(personalRegex, ' ');
  } else if (healthRegex.test(title)) {
    category = "Health";
    title = title.replace(healthRegex, ' ');
  } else if (learningRegex.test(title)) {
    category = "Learning";
    title = title.replace(learningRegex, ' ');
  }

  // Clean up title (remove extra spaces and punctuation left over)
  title = title.replace(/\s+/g, ' ').trim();
  
  return {
    title: title || input, // Fallback to original if stripped empty
    priority,
    category,
    dueDate,
    notes: ""
  };
};

export const parseNaturalLanguageTask = async (input: string): Promise<ParsedTaskData> => {
  const ai = getClient();
  
  // Fallback if no API key
  if (!ai) {
    return basicLocalParser(input);
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The core task name without time/priority keywords." },
      priority: { type: Type.STRING, enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH] },
      category: { type: Type.STRING, description: "The category of the task. Suggest a short, single-word category if implied, otherwise 'Other'." },
      dueDate: { type: Type.STRING, description: "ISO 8601 date string if a time is mentioned, otherwise null." },
      notes: { type: Type.STRING, description: "Any additional context, description, or details mentioned in the input that are not part of the core title." }
    },
    required: ["title", "priority", "category"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this task input into structured data. Current date is ${new Date().toISOString()}. Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as ParsedTaskData;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("NLP Parsing Error, switching to local fallback:", error);
    return basicLocalParser(input);
  }
};

export const generateSmartBreakdown = async (taskTitle: string): Promise<string[]> => {
  const ai = getClient();
  if (!ai) return ["Analyze requirements", "Plan execution", "Execute task", "Review output"];

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 3 to 5 concrete, actionable sub-steps.",
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down the task "${taskTitle}" into 3-5 simple, actionable sub-tasks. Keep them short.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return data.steps || [];
    }
    return [];
  } catch (error) {
    console.error("Breakdown Error:", error);
    return ["Manual Step 1", "Manual Step 2", "Check Completion"];
  }
};
