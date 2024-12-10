/**
 * VSCode-style fuzzy string matching
 * Supports matching across underscores and case-insensitive matching
 */
export const fuzzyMatch = (pattern: string, str: string): boolean => {
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();
    
    let patternIdx = 0;
    let strIdx = 0;
    
    while (patternIdx < pattern.length && strIdx < str.length) {
        // Support matching across underscores
        if (pattern[patternIdx] === str[strIdx] || 
            (str[strIdx] === '_' && pattern[patternIdx] === str[strIdx + 1])) {
            patternIdx++;
        }
        strIdx++;
    }
    
    return patternIdx === pattern.length;
};