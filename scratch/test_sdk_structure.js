const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: 'dummy_key' });
console.log('GoogleGenAI initialized successfully');
console.log('models object:', typeof ai.models);
console.log('generateContent exists:', typeof ai.models.generateContent);
