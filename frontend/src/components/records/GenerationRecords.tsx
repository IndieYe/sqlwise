import { QuestionList } from './QuestionList';
import { MainContent } from './MainContent';
import useTask from '@/hooks/useTask';
import { useEffect } from 'react';

export function GenerationRecords() {
    const { refreshQuestions } = useTask();

    // Initial fetch questions
    useEffect(() => {
        refreshQuestions()
    }, [refreshQuestions])

    return (
        <div className="flex h-full w-full">
            {/* Left list */}
            <QuestionList />
            {/* Right content */}
            <MainContent />
        </div>
    );
} 