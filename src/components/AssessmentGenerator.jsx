/**
 * AssessmentGenerator
 * Auto-generates vocabulary and comprehension quizzes based on story content.
 * Uses the Free Dictionary API for dynamic word definitions.
 * 
 * Quiz Types:
 * 1. Vocabulary - Fill in the blank with context clues
 * 2. Word Meaning - Multiple choice definitions (fetched from API)
 * 3. Comprehension - Questions about the story content
 */

// Common words to exclude from vocabulary extraction
const COMMON_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
    'hers', 'ours', 'theirs', 'who', 'whom', 'whose', 'which', 'what', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'also', 'now', 'here', 'there', 'then', 'if', 'because', 'as', 'until', 'while',
    'although', 'though', 'after', 'before', 'since', 'during', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'once', 'am', 'from', 'up', 'down', 'out', 'off', 'over', 'any', 'many', 'much',
    'one', 'two', 'three', 'first', 'second', 'new', 'old', 'high', 'long', 'little',
    'big', 'small', 'large', 'great', 'good', 'right', 'left', 'still', 'even', 'back',
    'well', 'way', 'use', 'make', 'like', 'time', 'very', 'when', 'come', 'made', 'find',
    'day', 'get', 'go', 'see', 'know', 'take', 'say', 'look', 'think', 'give', 'want',
    'tell', 'call', 'try', 'ask', 'need', 'feel', 'become', 'leave', 'put', 'mean',
    'keep', 'let', 'begin', 'seem', 'help', 'show', 'hear', 'play', 'run', 'move',
    'live', 'believe', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose',
    'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand',
    'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow',
    'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait',
    'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill',
    'remain', 'suggest', 'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull',
    'morning', 'evening', 'night', 'today', 'tomorrow', 'yesterday', 'always', 'never',
    'sometimes', 'often', 'usually', 'really', 'actually', 'probably', 'maybe', 'perhaps',
    'already', 'almost', 'enough', 'quite', 'rather', 'around', 'however', 'therefore',
    'inside', 'outside', 'across', 'along', 'behind', 'beside', 'within', 'without',
    'people', 'person', 'place', 'thing', 'world', 'country', 'city', 'street', 'house',
    'family', 'friend', 'woman', 'child', 'water', 'food', 'hand', 'part', 'year', 'work'
]);

/**
 * Fetch word definition from Free Dictionary API
 * Same API used in ReadingCard for consistency
 */
async function fetchWordDefinition(word) {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].meanings && data[0].meanings.length > 0) {
                const meaning = data[0].meanings[0];
                const definition = meaning.definitions[0]?.definition || null;
                if (definition) {
                    return {
                        word: cleanWord,
                        definition: definition,
                        partOfSpeech: meaning.partOfSpeech || 'word',
                        phonetic: data[0].phonetic || '',
                        source: 'api'
                    };
                }
            }
        }
    } catch (error) {
        console.error('Error fetching definition for', cleanWord, error);
    }
    return null;
}

/**
 * Extract vocabulary words from story text
 * Selects words with VARIED lengths for better quiz diversity
 */
export function extractVocabularyWords(text, count = 8) {
    const words = text.toLowerCase()
        .replace(/[.,!?;:()"'-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 5 && !COMMON_WORDS.has(w));

    // Count word frequency
    const wordCount = {};
    words.forEach(w => {
        wordCount[w] = (wordCount[w] || 0) + 1;
    });

    // Get unique words, excluding very common ones
    const uniqueWords = [...new Set(words)]
        .filter(w => wordCount[w] <= 3);

    // Group words by length to ensure variety
    const byLength = {};
    uniqueWords.forEach(w => {
        const len = w.length;
        if (!byLength[len]) byLength[len] = [];
        byLength[len].push(w);
    });

    // Select words with varied lengths (pick from different length groups)
    const result = [];
    const lengths = Object.keys(byLength).map(Number).sort((a, b) => b - a);

    let lengthIndex = 0;
    while (result.length < count && lengths.length > 0) {
        const currentLength = lengths[lengthIndex % lengths.length];
        const wordsOfLength = byLength[currentLength];

        if (wordsOfLength && wordsOfLength.length > 0) {
            result.push(wordsOfLength.shift());
        }

        // Remove empty length groups
        if (!wordsOfLength || wordsOfLength.length === 0) {
            const idx = lengths.indexOf(currentLength);
            if (idx > -1) lengths.splice(idx, 1);
            if (lengthIndex >= lengths.length) lengthIndex = 0;
        } else {
            lengthIndex++;
        }
    }

    return result;
}

/**
 * Find a sentence containing a specific word
 */
function findSentenceWithWord(text, word) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const lowerWord = word.toLowerCase();

    for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(lowerWord)) {
            return sentence;
        }
    }
    return null;
}

/**
 * Generate fill-in-the-blank questions from story text
 */
export function generateFillInBlank(text, count = 4) {
    const vocabWords = extractVocabularyWords(text, count * 3);
    const questions = [];

    for (const word of vocabWords) {
        if (questions.length >= count) break;

        const sentence = findSentenceWithWord(text, word);
        if (sentence && sentence.length > 30) {
            // Create blank version - replace the word with underscores
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const blankSentence = sentence.replace(regex, '_'.repeat(Math.min(word.length, 12)));

            if (blankSentence !== sentence) {
                questions.push({
                    type: 'fill-blank',
                    question: blankSentence,
                    answer: word
                });
            }
        }
    }

    return questions;
}

/**
 * Generate vocabulary multiple choice questions using API definitions
 */
export async function generateVocabularyMC(text, count = 4) {
    const vocabWords = extractVocabularyWords(text, count * 3);
    const questions = [];

    // Fetch definitions for all candidate words in parallel
    const definitionPromises = vocabWords.map(word => fetchWordDefinition(word));
    const definitions = await Promise.all(definitionPromises);

    // Filter words that have valid definitions
    const wordsWithDefs = vocabWords
        .map((word, i) => ({ word, def: definitions[i] }))
        .filter(item => item.def !== null);

    // Create questions from words with definitions
    for (let i = 0; i < wordsWithDefs.length && questions.length < count; i++) {
        const { word, def } = wordsWithDefs[i];

        // Get 3 other words as distractors (wrong answers)
        const otherWords = wordsWithDefs
            .filter((item, idx) => idx !== i)
            .slice(0, 3)
            .map(item => item.word);

        // If we don't have enough distractors, use some from the vocab list
        while (otherWords.length < 3) {
            const randomWord = vocabWords[Math.floor(Math.random() * vocabWords.length)];
            if (randomWord !== word && !otherWords.includes(randomWord)) {
                otherWords.push(randomWord);
            }
        }

        // Shuffle options: 3 wrong + 1 correct
        const options = [...otherWords.slice(0, 3), word].sort(() => Math.random() - 0.5);

        questions.push({
            type: 'vocabulary-mc',
            question: `Which word means "${def.definition}"?`,
            options,
            answer: word,
            partOfSpeech: def.partOfSpeech
        });
    }

    return questions;
}

/**
 * Generate comprehension questions based on story content
 */
export function generateComprehensionQuestions(storyData) {
    const { title, country, text } = storyData;
    const questions = [];

    // Question about location/country
    questions.push({
        type: 'comprehension',
        question: `In which country does this story take place?`,
        answer: country,
        hint: 'Look at the story header or opening sentences'
    });

    // Question about the main topic
    const titleWords = title.split(' ').filter(w => w.length > 3);
    const mainTopic = titleWords.slice(-2).join(' ');
    questions.push({
        type: 'comprehension',
        question: `What is the main subject or activity described in this story?`,
        answer: mainTopic,
        hint: 'Think about the main theme of the story'
    });

    // Find educational content (sentences with "which is", "called", "known as")
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const educationalPattern = /which is|called|known as|meaning|refers to/i;
    const educationalSentences = sentences.filter(s => educationalPattern.test(s));

    if (educationalSentences.length > 0) {
        // Create a question about a fact from the story
        questions.push({
            type: 'open-ended',
            question: `Write down one cultural or historical fact you learned from this story.`,
            answer: '(Answers will vary based on the story)',
            hint: 'Look for sentences that explain what something is or means'
        });
    }

    // Reflection question
    questions.push({
        type: 'open-ended',
        question: `What was the most interesting thing you learned about ${country} from this story? Explain in 1-2 sentences.`,
        answer: '(Personal response)',
        hint: 'Share your own thoughts and observations'
    });

    return questions;
}

/**
 * Main function to generate complete assessment
 * This is async because vocabulary MC questions require API calls
 */
export async function generateAssessment(storyData, options = {}) {
    const {
        fillInBlankCount = 3,
        vocabMCCount = 3,
        comprehensionCount = 3
    } = options;

    const text = storyData.text;

    // Generate fill-in-blank questions (sync)
    const fillInBlankQuestions = generateFillInBlank(text, fillInBlankCount);

    // Generate vocabulary MC questions (async - uses API)
    const vocabMCQuestions = await generateVocabularyMC(text, vocabMCCount);

    // Generate comprehension questions (sync)
    const comprehensionQuestions = generateComprehensionQuestions(storyData).slice(0, comprehensionCount);

    return {
        storyInfo: {
            title: storyData.title,
            country: storyData.country,
            day: storyData.day
        },
        sections: [
            {
                title: 'Part A: Vocabulary in Context',
                instructions: 'Fill in the blank with the correct word from the story.',
                questions: fillInBlankQuestions
            },
            {
                title: 'Part B: Word Meanings',
                instructions: 'Choose the word that best matches the given definition.',
                questions: vocabMCQuestions
            },
            {
                title: 'Part C: Reading Comprehension',
                instructions: 'Answer the following questions about the story.',
                questions: comprehensionQuestions
            }
        ],
        wordBank: extractVocabularyWords(text, 10)
    };
}

export default {
    generateAssessment,
    extractVocabularyWords,
    generateFillInBlank,
    generateVocabularyMC,
    generateComprehensionQuestions,
    fetchWordDefinition
};
