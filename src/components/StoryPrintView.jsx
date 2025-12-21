import React from 'react';
import { generateAssessment, extractVocabularyWords } from './AssessmentGenerator';

/**
 * StoryPrintView
 * 
 * Swiss-design printable story component with comprehensive assessment quiz.
 * Generates A4-sized PDF-ready content for printing.
 * Uses Free Dictionary API for dynamic vocabulary definitions.
 */

// Generate CSS styles for print
const getPrintStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    @page {
        size: A4;
        margin: 15mm;
    }
    
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #FFFFFF;
        color: #111111;
        line-height: 1.6;
        font-size: 11pt;
    }
    
    .page {
        max-width: 210mm;
        margin: 0 auto;
        padding: 0;
    }
    
    .story-page {
        /* Let content flow naturally, no forced page break */
    }
    
    .header {
        border-bottom: 3px solid #880000;
        padding-bottom: 15px;
        margin-bottom: 25px;
        page-break-inside: avoid;
    }
    
    .header-meta {
        font-size: 10pt;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 15px;
        color: #666666;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header-meta .country {
        color: #880000;
    }
    
    .header-meta .slug-link {
        font-size: 9pt;
        color: #880000;
        font-weight: 600;
        letter-spacing: 0.05em;
    }
    
    .title {
        font-size: 28pt;
        font-weight: 800;
        color: #111111;
        line-height: 1.15;
        margin-bottom: 8px;
    }
    
    .story-section {
        margin-bottom: 30px;
    }
    
    .section-label {
        font-size: 8pt;
        font-weight: 700;
        color: #880000;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: 12px;
    }
    
    .story-text {
        font-size: 12pt;
        line-height: 1.85;
        color: #222222;
        text-align: justify;
        hyphens: auto;
    }
    
    .word-bank {
        background: #F8F8F8;
        border-left: 4px solid #880000;
        padding: 15px 20px;
        margin: 25px 0;
        page-break-inside: avoid;
    }
    
    .word-bank-title {
        font-size: 9pt;
        font-weight: 700;
        color: #880000;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 10px;
    }
    
    .word-bank-words {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .word-tag {
        background: #FFFFFF;
        border: 1px solid #DDDDDD;
        padding: 4px 10px;
        font-size: 10pt;
        font-weight: 500;
        border-radius: 3px;
    }
    
    .story-image-container {
        margin-bottom: 30px;
        page-break-inside: avoid;
    }

    .story-image {
        width: 100%;
        max-height: 250px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .image-attribution {
        font-size: 8pt;
        color: #888888;
        margin-top: 6px;
        text-align: right;
        font-style: italic;
    }

    .instructions-box {
        background: linear-gradient(135deg, #FEF7F7 0%, #FFFFFF 100%);
        border: 1px solid #E8D4D4;
        border-left: 4px solid #880000;
        padding: 18px 22px;
        margin: 25px 0;
        page-break-inside: avoid;
    }
    
    .instructions-title {
        font-size: 10pt;
        font-weight: 700;
        color: #880000;
        margin-bottom: 10px;
    }
    
    .instructions-list {
        font-size: 10pt;
        color: #444444;
        padding-left: 20px;
    }
    
    .instructions-list li {
        margin-bottom: 5px;
    }
    
    .assessment-page {
        page-break-before: always;
    }
    
    .assessment-header {
        background: #880000;
        color: #FFFFFF;
        padding: 20px 25px;
        margin-bottom: 25px;
    }
    
    .assessment-title {
        font-size: 18pt;
        font-weight: 800;
        margin-bottom: 5px;
    }
    
    .assessment-subtitle {
        font-size: 10pt;
        opacity: 0.9;
    }
    
    .assessment-section {
        margin-bottom: 30px;
        page-break-inside: avoid;
    }
    
    .assessment-section-title {
        font-size: 12pt;
        font-weight: 700;
        color: #880000;
        border-bottom: 2px solid #880000;
        padding-bottom: 8px;
        margin-bottom: 15px;
    }
    
    .assessment-instructions {
        font-size: 10pt;
        font-style: italic;
        color: #555555;
        margin-bottom: 15px;
    }
    
    .question {
        margin-bottom: 20px;
        page-break-inside: avoid;
    }
    
    .question-number {
        font-weight: 700;
        color: #880000;
        margin-right: 8px;
    }
    
    .question-text {
        font-size: 11pt;
        color: #222222;
        margin-bottom: 8px;
    }
    
    .question-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 10px;
    }
    
    .option {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 10pt;
    }
    
    .option-box {
        width: 16px;
        height: 16px;
        border: 2px solid #880000;
        border-radius: 3px;
        flex-shrink: 0;
    }
    
    .answer-lines {
        margin-top: 10px;
    }
    
    .answer-line {
        border-bottom: 1px solid #CCCCCC;
        height: 28px;
        margin-bottom: 5px;
    }
    
    .name-date {
        display: flex;
        gap: 30px;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid #E5E5E5;
    }
    
    .name-date-field {
        flex: 1;
    }
    
    .name-date-label {
        font-size: 9pt;
        font-weight: 600;
        color: #666666;
        margin-bottom: 5px;
    }
    
    .name-date-line {
        border-bottom: 2px solid #CCCCCC;
        height: 25px;
    }
    
    .score-box {
        float: right;
        border: 2px solid #880000;
        padding: 15px 25px;
        text-align: center;
        margin-left: 20px;
    }
    
    .score-label {
        font-size: 9pt;
        color: #666666;
        margin-bottom: 5px;
    }
    
    .score-value {
        font-size: 20pt;
        font-weight: 800;
        color: #880000;
    }
    
    @media print {
        body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .no-print {
            display: none !important;
        }
    }
`;

// Generate the Story Page HTML
const generateStoryPageHTML = (storyData, currentMonth, wordBank, shareLink, wikiImage) => {
    const wordTags = wordBank.map(word =>
        '<span class="word-tag">' + word + '</span>'
    ).join('');

    const imageHTML = wikiImage ? `
        <div class="story-image-container">
            <img src="${wikiImage.url}" alt="${wikiImage.title}" class="story-image" />
            <div class="image-attribution">Image: ${wikiImage.title} • Source: Wikipedia</div>
        </div>
    ` : '';

    return `
        <div class="page story-page">
            <div class="header">
                <div class="header-meta">
                    <span>Month ${currentMonth} · Day ${storyData.day} · <span class="country">${storyData.country}</span></span>
                    <span class="slug-link">${shareLink}</span>
                </div>
                <h1 class="title">${storyData.title}</h1>
            </div>
            
            ${imageHTML}
            
            <div class="story-section">
                <div class="section-label">Read Aloud</div>
                <p class="story-text">${storyData.text}</p>
            </div>
            
            <div class="word-bank">
                <div class="word-bank-title">Key Vocabulary</div>
                <div class="word-bank-words">
                    ${wordTags}
                </div>
            </div>
        </div>
    `;
};

// Generate a single question HTML based on type
const generateQuestionHTML = (question, index) => {
    const num = index + 1;

    if (question.type === 'fill-blank') {
        return `
            <div class="question">
                <span class="question-number">${num}.</span>
                <span class="question-text">${question.question}</span>
            </div>
        `;
    } else if (question.type === 'vocabulary-mc') {
        const optionsHTML = question.options.map((opt, j) => `
            <div class="option">
                <div class="option-box"></div>
                <span>${String.fromCharCode(65 + j)}. ${opt}</span>
            </div>
        `).join('');

        return `
            <div class="question">
                <span class="question-number">${num}.</span>
                <span class="question-text">${question.question}</span>
                <div class="question-options">
                    ${optionsHTML}
                </div>
            </div>
        `;
    } else if (question.type === 'comprehension' || question.type === 'open-ended') {
        return `
            <div class="question">
                <span class="question-number">${num}.</span>
                <span class="question-text">${question.question}</span>
                <div class="answer-lines">
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                </div>
            </div>
        `;
    }
    return '';
};

// Generate the Assessment Page HTML
const generateAssessmentPageHTML = (storyData, currentMonth, assessment) => {
    const sectionsHTML = assessment.sections.map(section => {
        const questionsHTML = section.questions.map((q, i) =>
            generateQuestionHTML(q, i)
        ).join('');

        return `
            <div class="assessment-section">
                <div class="assessment-section-title">${section.title}</div>
                <div class="assessment-instructions">${section.instructions}</div>
                ${questionsHTML}
            </div>
        `;
    }).join('');

    return `
        <div class="page assessment-page">
            <div class="assessment-header">
                <div class="assessment-title">Vocabulary & Comprehension Quiz</div>
                <div class="assessment-subtitle">${storyData.title} · ${storyData.country}</div>
            </div>
            
            <div class="score-box">
                <div class="score-label">SCORE</div>
                <div class="score-value">__/10</div>
            </div>
            
            <div class="name-date">
                <div class="name-date-field">
                    <div class="name-date-label">NAME</div>
                    <div class="name-date-line"></div>
                </div>
                <div class="name-date-field">
                    <div class="name-date-label">DATE</div>
                    <div class="name-date-line"></div>
                </div>
            </div>
            
            ${sectionsHTML}
        </div>
    `;
};

// Main component
const StoryPrintView = ({ storyData, currentMonth, currentDay, wikiImage, onPrintComplete }) => {

    const executePrint = async () => {
        // Generate assessment quiz (async with API calls)
        const assessment = await generateAssessment(storyData);
        const wordBank = extractVocabularyWords(storyData.text, 12);

        // Use storyData.day or currentDay as fallback
        const day = storyData.day || currentDay || 1;

        // Generate share link (same format as copy button)
        const baseUrl = window.location.origin;
        const shareLink = `${baseUrl}/m${currentMonth}-day${day}`;

        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('Please allow pop-ups to print the story.');
            return;
        }

        // Build the complete HTML document
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${storyData.title} - English Reading Practice</title>
                <style>${getPrintStyles()}</style>
            </head>
            <body>
                ${generateStoryPageHTML(storyData, currentMonth, wordBank, shareLink, wikiImage)}
                ${generateAssessmentPageHTML(storyData, currentMonth, assessment)}
                
                <script>
                    window.onload = function() {
                        // Function to trigger print
                        const triggerPrint = () => {
                            setTimeout(function() {
                                window.print();
                            }, 800);
                        };

                        // Check if images are loaded
                        const images = document.images;
                        let loadedCount = 0;
                        const totalImages = images.length;

                        if (totalImages === 0) {
                            triggerPrint();
                        } else {
                            const checkProgress = () => {
                                loadedCount++;
                                if (loadedCount === totalImages) {
                                    triggerPrint();
                                }
                            };

                            for (let i = 0; i < totalImages; i++) {
                                if (images[i].complete) {
                                    checkProgress();
                                } else {
                                    images[i].onload = checkProgress;
                                    images[i].onerror = checkProgress;
                                }
                            }
                        }
                    };
                    window.onafterprint = function() {
                        // window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();

        if (onPrintComplete) {
            onPrintComplete();
        }
    };

    return { executePrint };
};

export default StoryPrintView;
