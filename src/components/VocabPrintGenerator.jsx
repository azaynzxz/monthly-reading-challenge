import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { extractVocabularyWords } from './AssessmentGenerator';

/**
 * VocabPrintGenerator
 * 
 * Generates a branded PDF vocabulary table from story text.
 * Uses Dictionary API for IPA + definitions, converts IPA to Indonesian-friendly phonetics.
 * Supports toggle: filled meanings vs blank for exercise.
 */

// ============================================================
// IPA → Indonesian Phonetic Converter
// ============================================================

/**
 * Convert IPA phonetic string to Indonesian-friendly pronunciation
 * Indonesian speakers read Latin letters differently, so we map IPA symbols
 * to how Indonesians would naturally read them.
 */
const ipaToIndonesian = (ipa) => {
    if (!ipa) return '';

    // Clean IPA string - remove slashes and brackets
    let result = ipa.replace(/[\/\[\]]/g, '').trim();

    // IPA → Indonesian mapping (ordered by specificity, longest first)
    const mappings = [
        // Diphthongs (must come before single vowels)
        ['eɪ', 'ei'],
        ['aɪ', 'ai'],
        ['ɔɪ', 'oi'],
        ['aʊ', 'au'],
        ['oʊ', 'ou'],
        ['ɪə', 'ia'],
        ['eə', 'ea'],
        ['ʊə', 'ua'],

        // Long vowels
        ['iː', 'ii'],
        ['uː', 'uu'],
        ['ɑː', 'aa'],
        ['ɔː', 'oo'],
        ['ɜː', 'er'],
        ['ɛː', 'ee'],

        // Short vowels
        ['æ', 'e'],
        ['ɑ', 'a'],
        ['ɒ', 'o'],
        ['ʌ', 'a'],
        ['ə', 'e'],
        ['ɛ', 'e'],
        ['ɪ', 'i'],
        ['ʊ', 'u'],
        ['ɔ', 'o'],
        ['i', 'i'],
        ['u', 'u'],
        ['e', 'e'],
        ['o', 'o'],
        ['a', 'a'],

        // Consonant clusters & digraphs
        ['tʃ', 'c'],
        ['dʒ', 'j'],
        ['ʃ', 'sy'],
        ['ʒ', 'sy'],
        ['θ', 't'],
        ['ð', 'd'],
        ['ŋ', 'ng'],
        ['ɹ', 'r'],
        ['ɾ', 'r'],
        ['ɫ', 'l'],
        ['ʔ', ''],
        ['ˈ', ''],     // primary stress
        ['ˌ', ''],     // secondary stress
        ['ː', ''],     // length mark (handled above)

        // Standard consonants (passthrough)
        ['b', 'b'],
        ['d', 'd'],
        ['f', 'f'],
        ['ɡ', 'g'],
        ['g', 'g'],
        ['h', 'h'],
        ['j', 'y'],     // IPA [j] = Indonesian 'y'
        ['k', 'k'],
        ['l', 'l'],
        ['m', 'm'],
        ['n', 'n'],
        ['p', 'p'],
        ['r', 'r'],
        ['s', 's'],
        ['t', 't'],
        ['v', 'v'],
        ['w', 'w'],
        ['z', 'z'],
    ];

    let output = '';
    let i = 0;
    while (i < result.length) {
        let matched = false;
        // Try longest match first (2 chars, then 1)
        for (const [from, to] of mappings) {
            if (result.substring(i, i + from.length) === from) {
                output += to;
                i += from.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            // Skip unknown characters
            i++;
        }
    }

    return output;
};

/**
 * Rule-based English word → Indonesian phonetic (fallback when no IPA available)
 * Converts common English spelling patterns to Indonesian pronunciation.
 */
const englishToIndonesianPhonetic = (word) => {
    if (!word) return '';

    let result = word.toLowerCase();

    // Multi-character patterns first (order matters!)
    const patterns = [
        // Silent letters & special endings
        [/ght\b/g, 't'],
        [/ough\b/g, 'of'],
        [/ough/g, 'o'],
        [/tion\b/g, 'syen'],
        [/sion\b/g, 'syen'],
        [/cious\b/g, 'syes'],
        [/tious\b/g, 'syes'],
        [/cial\b/g, 'syal'],
        [/tial\b/g, 'syal'],
        [/ture\b/g, 'cer'],
        [/sure\b/g, 'syer'],
        [/ous\b/g, 'es'],
        [/ious\b/g, 'ies'],
        [/eous\b/g, 'ies'],
        [/ble\b/g, 'bel'],
        [/tle\b/g, 'tel'],
        [/ple\b/g, 'pel'],
        [/gle\b/g, 'gel'],
        [/able\b/g, 'ebel'],
        [/ible\b/g, 'ibel'],

        // Common vowel combinations
        [/ea(?=[^r])/g, 'ii'],
        [/ea\b/g, 'ia'],
        [/ee/g, 'ii'],
        [/oo/g, 'uu'],
        [/ou/g, 'au'],
        [/ow\b/g, 'ou'],
        [/ow(?=[nl])/g, 'ou'],
        [/ow/g, 'au'],
        [/oi/g, 'oi'],
        [/oy/g, 'oi'],
        [/ie\b/g, 'i'],
        [/ie/g, 'ai'],
        [/ai/g, 'ei'],
        [/ay\b/g, 'ei'],
        [/igh/g, 'ai'],
        [/i(?=.*e\b)/g, 'ai'],   // magic e (simplified)

        // Consonant combinations
        [/th(?=[ei])/g, 'd'],
        [/th/g, 't'],
        [/sh/g, 'sy'],
        [/ch/g, 'c'],
        [/ck/g, 'k'],
        [/ph/g, 'f'],
        [/wh/g, 'w'],
        [/wr/g, 'r'],
        [/kn/g, 'n'],
        [/gn\b/g, 'n'],
        [/mb\b/g, 'm'],
        [/ng/g, 'ng'],
        [/qu/g, 'kw'],
        [/x/g, 'ks'],

        // Single vowels in specific contexts  
        [/(?<=[^aeiou])e\b/g, ''],  // silent e at end
        [/y\b/g, 'i'],
        [/y(?=[aeiou])/g, 'y'],
    ];

    for (const [pattern, replacement] of patterns) {
        result = result.replace(pattern, replacement);
    }

    return result;
};

/**
 * Get pronunciation for a word - tries IPA conversion first, falls back to rule-based
 */
const getPronunciation = (word, ipa) => {
    if (ipa) {
        const converted = ipaToIndonesian(ipa);
        if (converted) return converted;
    }
    return englishToIndonesianPhonetic(word);
};


// ============================================================
// Dictionary API Integration
// ============================================================

/**
 * Check if a word is likely a proper noun by examining its usage in the original text.
 * A word is a proper noun if it appears capitalized AND not at the start of a sentence.
 */
const isProperNoun = (word, originalText) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()'"\-]/g, '');
    if (cleanWord.length < 2) return false;

    // Find all occurrences in the original text
    const regex = new RegExp(`\\b${cleanWord}\\b`, 'gi');
    let match;
    let capitalizedCount = 0;
    let totalCount = 0;

    while ((match = regex.exec(originalText)) !== null) {
        totalCount++;
        const matchedWord = match[0];
        const pos = match.index;

        // Check if capitalized
        if (matchedWord[0] === matchedWord[0].toUpperCase() && matchedWord[0] !== matchedWord[0].toLowerCase()) {
            // Check if it's NOT at the start of a sentence
            const before = originalText.substring(Math.max(0, pos - 3), pos).trim();
            const isStartOfSentence = pos === 0 || /[.!?]\s*$/.test(before);

            if (!isStartOfSentence) {
                capitalizedCount++;
            }
        }
    }

    // If most non-start-of-sentence occurrences are capitalized, it's likely a proper noun
    return totalCount > 0 && capitalizedCount > 0;
};

/**
 * Fetch word data (IPA + meaning) from Free Dictionary API
 * Returns null only for confirmed 404 (word not in dictionary).
 * For network errors / rate limits, falls back to rule-based pronunciation.
 */
const fetchWordData = async (word) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()'"\-]/g, '');

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                const entry = data[0];
                const ipa = entry.phonetic ||
                    (entry.phonetics && entry.phonetics.find(p => p.text)?.text) || '';

                let meaning = '';
                let partOfSpeech = '';
                if (entry.meanings && entry.meanings.length > 0) {
                    partOfSpeech = entry.meanings[0].partOfSpeech || '';
                    if (entry.meanings[0].definitions && entry.meanings[0].definitions.length > 0) {
                        meaning = entry.meanings[0].definitions[0].definition || '';
                    }
                }

                return {
                    word: cleanWord,
                    ipa,
                    pronunciation: getPronunciation(cleanWord, ipa),
                    meaning,
                    partOfSpeech
                };
            }
        }

        // 404 = word genuinely not in English dictionary — skip it
        if (response.status === 404) {
            return null;
        }

        // Other HTTP errors (429 rate limit, 500 server error) — use fallback
        return {
            word: cleanWord,
            ipa: '',
            pronunciation: englishToIndonesianPhonetic(cleanWord),
            meaning: '',
            partOfSpeech: ''
        };
    } catch (error) {
        // Network error / timeout — don't lose the word, use fallback pronunciation
        return {
            word: cleanWord,
            ipa: '',
            pronunciation: englishToIndonesianPhonetic(cleanWord),
            meaning: '',
            partOfSpeech: ''
        };
    }
};

/**
 * Fetch data for multiple words with rate limiting
 * Skips words not found in the dictionary
 */
const fetchAllWordData = async (words, onProgress) => {
    const results = [];
    let processed = 0;
    for (let i = 0; i < words.length; i++) {
        const data = await fetchWordData(words[i]);
        processed++;
        if (data !== null) {
            results.push(data);
        }
        if (onProgress) onProgress(processed, words.length);
        // Small delay to avoid rate limiting
        if (i < words.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return results;
};


// ============================================================
// PDF Generator
// ============================================================

/**
 * Generate vocabulary PDF
 * @param {Object} options
 * @param {Object} options.storyData - Story data object from month JSON
 * @param {number} options.currentMonth - Current month number
 * @param {number} options.currentDay - Current day number
 * @param {boolean} options.fillMeanings - Whether to include meanings or leave blank
 * @param {Function} options.onProgress - Progress callback (current, total)
 * @param {Function} options.onComplete - Completion callback
 */
const generateVocabPDF = async ({ storyData, currentMonth, currentDay, fillMeanings = false, onProgress, onComplete }) => {
    try {
        // 1. Extract more candidates (many may be filtered out)
        const rawWords = extractVocabularyWords(storyData.text, 40);

        // 2. Filter out proper nouns (place names, people names, etc.)
        const words = rawWords.filter(w => !isProperNoun(w, storyData.text)).slice(0, 25);

        // 3. Fetch pronunciation + translation data (unknown words are skipped automatically)
        const wordData = await fetchAllWordData(words, onProgress);

        // 4. Guard: need at least some words
        if (wordData.length === 0) {
            alert('No vocabulary words found for this story. Try a different story.');
            if (onComplete) onComplete();
            return;
        }

        // 5. Fetch Indonesian translations if fillMeanings is on
        if (fillMeanings) {
            for (let i = 0; i < wordData.length; i++) {
                try {
                    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(wordData[i].word)}&langpair=en|id`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.responseData && data.responseData.translatedText) {
                            const translated = data.responseData.translatedText;
                            // Only use translation if it's different from the original word
                            if (translated.toLowerCase() !== wordData[i].word.toLowerCase()) {
                                wordData[i].indonesian = translated;
                            }
                        }
                    }
                } catch (e) {
                    // Skip translation for this word
                }
                if (i < wordData.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 80));
                }
            }
        }

        // 6. Load logo image for footer
        let logoBase64 = null;
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                logoImg.src = '/logo-horizontal.svg';
            });
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth || 400;
            canvas.height = logoImg.naturalHeight || 100;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
            logoBase64 = canvas.toDataURL('image/png');
        } catch (e) {
            // Logo loading failed — will use text fallback
        }

        // 7. Create PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);

        // Colors
        const brandRed = [136, 0, 0];     // #880000
        const darkText = [17, 17, 17];     // #111111
        const grayText = [102, 102, 102];  // #666666
        const lightGray = [245, 245, 245]; // #F5F5F5
        const white = [255, 255, 255];

        // ---- START CONTENT (clean, no header) ----
        let y = margin;

        // Name / Date fields
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.text('NAME', margin, y);
        doc.text('DATE', margin + contentWidth * 0.6, y);
        y += 2;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin + 15, y, margin + contentWidth * 0.55, y);
        doc.line(margin + contentWidth * 0.6 + 13, y, pageWidth - margin, y);
        y += 5;

        // Story reference
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...grayText);
        doc.text(`Month ${currentMonth} · Day ${storyData.day} · ${storyData.country} — "${storyData.title}"`, margin, y);
        y += 6;

        // Instructions box
        doc.setFillColor(254, 247, 247);
        doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F');
        doc.setFillColor(...brandRed);
        doc.rect(margin, y, 1.2, 12, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...brandRed);
        doc.text('HOW TO PRACTICE', margin + 5, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...grayText);
        const instructions = fillMeanings
            ? 'Read the pronunciation. Study the Indonesian meaning. Practice using each word in a sentence.'
            : 'Read the pronunciation. Write the meaning in Indonesian. Practice using each word in a sentence.';
        doc.text(instructions, margin + 5, y + 9, { maxWidth: contentWidth - 10 });
        y += 16;

        // ---- VOCABULARY TABLE ----
        const tableData = wordData.map((item, index) => {
            const row = [
                (index + 1).toString(),
                item.word,
                item.pronunciation,
            ];
            if (fillMeanings) {
                row.push(item.indonesian || '');
            } else {
                row.push('');
            }
            return row;
        });

        autoTable(doc, {
            startY: y,
            head: [['No', 'Words', 'Pronunciation', 'Meaning']],
            body: tableData,
            margin: { left: margin, right: margin },
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
                lineColor: [220, 220, 220],
                lineWidth: 0.3,
                textColor: darkText,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: brandRed,
                textColor: white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'left',
                cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
            },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center', fontStyle: 'bold', textColor: brandRed },
                1: { cellWidth: 35, fontStyle: 'bold' },
                2: { cellWidth: 40, fontStyle: 'italic', textColor: grayText },
                3: { cellWidth: 'auto', minCellHeight: fillMeanings ? 6 : 10 },
            },
            alternateRowStyles: {
                fillColor: lightGray,
            },
            didDrawCell: (data) => {
                if (!fillMeanings && data.column.index === 3 && data.section === 'body') {
                    const cellX = data.cell.x + 3;
                    const cellWidth = data.cell.width - 6;
                    const cellY = data.cell.y + data.cell.height - 3;
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.2);
                    doc.line(cellX, cellY, cellX + cellWidth, cellY);
                }
            },
            tableLineColor: [220, 220, 220],
            tableLineWidth: 0.3,
        });

        // ---- FOOTER WITH LOGO ----
        const footerY = pageHeight - 15;

        // Footer line
        doc.setDrawColor(...brandRed);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

        // Logo on the left
        if (logoBase64) {
            try {
                doc.addImage(logoBase64, 'PNG', margin, footerY, 30, 7.5);
            } catch (e) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(...brandRed);
                doc.text('ENGLISH FLUENCY JOURNEY', margin, footerY + 5);
            }
        } else {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...brandRed);
            doc.text('ENGLISH FLUENCY JOURNEY', margin, footerY + 5);
        }

        // Website URL on the right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...brandRed);
        doc.text('myenglish.my.id', pageWidth - margin, footerY + 5, { align: 'right' });

        // ---- SAVE ----
        const filename = `vocab-m${currentMonth}-day${storyData.day}${fillMeanings ? '-with-meanings' : '-exercise'}.pdf`;
        doc.save(filename);

        if (onComplete) onComplete();

    } catch (error) {
        console.error('Error generating vocab PDF:', error);
        throw error;
    }
};

export default generateVocabPDF;

