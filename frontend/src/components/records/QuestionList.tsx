import useTask from '@/hooks/useTask';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Button, Pagination } from 'flowbite-react';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { IoIosLink } from 'react-icons/io';
import { IoCheckmark, IoClose } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { setQuestionsPage } from '@/store/slices/recordsSlice';
import { useTranslation } from 'react-i18next';

interface QuestionItemProps {
    id: number;
    question: string;
    sql_right: boolean | undefined | null;
    sql_refer: boolean | undefined | null;
    isActive: boolean;
    onClick: (taskId: number) => void;
    onDelete: (taskId: number) => void;
}

function QuestionItem({ id, question, sql_right, sql_refer, isActive, onClick, onDelete }: QuestionItemProps) {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling to avoid triggering click events
        onDelete(id);
    };

    return (
        <li
            className={`py-2 px-4 hover:bg-gray-200 cursor-pointer rounded-lg text-sm group flex items-center justify-between
                ${isActive ? 'bg-gray-200' : ''}`}
            onClick={() => onClick(id)}
        >
            {
                sql_right === undefined || sql_right === null ? (
                    <div className="w-[1.25em] mr-2" />
                ) : sql_right ? (
                    sql_refer ? <IoIosLink className="text-cyan-700 text-xl mr-2" /> : <IoCheckmark className="text-green-600 text-xl mr-2" />
                ) : (
                    <IoClose className="text-gray-400 text-xl mr-2" />
                )
            }
            <span className="truncate flex-1 mr-2">{question}</span>
            <button
                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
            >
                <HiTrash className="h-4 w-4" />
            </button>
        </li>
    );
}

export function QuestionList() {
    const { t } = useTranslation();
    const questions = useAppSelector(state => state.task.questions);
    const currentTaskId = useAppSelector(state => state.task.taskId);
    const { refreshTask, newTask, deleteTask } = useTask();
    const currentPage = useAppSelector(state => state.records.questions_page);
    const totalPages = useAppSelector(state => state.records.questions_total_pages);
    const dispatch = useAppDispatch();

    const handleQuestionClick = (taskId: number) => {
        refreshTask(taskId);
    };

    const handleNewGeneration = () => {
        newTask();
    };

    const handleDelete = async (taskId: number) => {
        try {
            await deleteTask(taskId);
            toast.success(t('questionList.deleteSuccess'));
        } catch (error) {
            toast.error(t('questionList.deleteFailed'));
        }
    };

    const handlePageChange = (page: number) => {
        dispatch(setQuestionsPage(page));
    };

    return (
        <div className="w-80 bg-gray-50 flex flex-col">
            <div className="p-2">
                <Button 
                    className="w-full"
                    onClick={handleNewGeneration}
                >
                    <HiPlus className="mr-2 h-5 w-5" />
                    {t('questionList.newGeneration')}
                </Button>
            </div>
            <ul className="p-2 overflow-y-auto flex-1">
                {questions.map((record) => (
                    <QuestionItem
                        key={record.id}
                        id={record.id || 0}
                        sql_right={record.sql_right}
                        sql_refer={record.sql_refer}
                        question={record.question || ''}
                        isActive={currentTaskId === record.id}
                        onClick={handleQuestionClick}
                        onDelete={handleDelete}
                    />
                ))}
            </ul>
            <div className="p-2 border-t border-gray-200 flex justify-center">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showIcons={true}
                    layout="navigation"
                />
            </div>
        </div>
    );
} 