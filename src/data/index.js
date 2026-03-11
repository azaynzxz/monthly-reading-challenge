import month1Data from './month1.json';
import month2Data from './month2.json';
import month3Data from './month3.json';
import month4Data from './month4.json';

const mdFiles = import.meta.glob('./*/*.md', { query: '?raw', import: 'default', eager: true });

const processMonthData = (monthData, monthNum) => {
    return monthData.map(dayData => {
        const mdKey = `./month${monthNum}/day${dayData.day}.md`;
        const textRaw = mdFiles[mdKey];
        // Handle Vite varying return formats for raw
        const text = typeof textRaw === 'string' ? textRaw : (textRaw?.default || "Story content not found.");

        return {
            ...dayData,
            text
        };
    });
};

export const month1 = processMonthData(month1Data, 1);
export const month2 = processMonthData(month2Data, 2);
export const month3 = processMonthData(month3Data, 3);
export const month4 = processMonthData(month4Data, 4);
export const allMonthsDataObj = { 1: month1, 2: month2, 3: month3, 4: month4 };
