import { MdContentCopy } from 'react-icons/md';
import { FaCode } from 'react-icons/fa6';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toast } from 'react-toastify';
import { Button, Tooltip } from 'flowbite-react';
import { mainApi } from '@/App';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import useTask from '@/hooks/useTask';
import { FaPaperPlane } from 'react-icons/fa';
import { setEditingSql } from '@/store/slices/recordsSlice';
import { format } from 'sql-formatter';
import { SqlFeedback } from './SqlFeedback';
import { useTranslation } from 'react-i18next';

export function SqlResult() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const sql = useAppSelector(state => state.task.task?.sql);
    const editingSql = useAppSelector(state => state.records.editingSql);
    const sqlModified = useAppSelector(state => state.records.sqlModified);
    const selectedColumns = useAppSelector(state => state.records.selectedColumns);
    const taskId = useAppSelector(state => state.task.taskId);
    const { refreshTask, refreshQuestions } = useTask();
    const sqlRight = useAppSelector(state => state.task.task?.sql_right);
    const sqlRefer = useAppSelector(state => state.task.task?.sql_refer);
    const currentJob = useAppSelector(state => state.task.currentJob);
    const taskModified = useAppSelector(state => state.records.taskModified);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // The last job is still running
    const disabledGenerate = useMemo(() => 
        taskModified || sqlModified || (currentJob && (currentJob.job_status === 'init' || currentJob.job_status === 'running')),
        [taskModified, sqlModified, currentJob]
    );

    // Initialize editing content
    const handleSqlChange = (value: string) => {
        dispatch(setEditingSql(value));
    };

    // Generate
    const handleGenerate = useCallback(async () => {
        await mainApi.mainGeneratePost({
            taskId: taskId!,
        })
        if (taskId) {
            refreshTask(taskId)
        }
    }, [taskId, selectedColumns, refreshTask])

    const handleCopy = async () => {
        if (sql) {
            try {
                await navigator.clipboard.writeText(sql);
                toast.success(t('sqlResult.copySuccess'));
            } catch (err) {
                toast.error(t('sqlResult.copyFailed'));
            }
        }
    };

    // Format SQL processing function
    const handleFormat = useCallback(() => {
        if (editingSql) {
            try {
                const formattedSql = format(editingSql, {
                    language: 'mysql',
                    linesBetweenQueries: 2,
                    keywordCase: 'upper',
                    indentStyle: 'standard'
                });
                dispatch(setEditingSql(formattedSql));
                toast.success(t('sqlResult.formatSuccess'));
            } catch (err) {
                toast.error(t('sqlResult.formatFailed'));
            }
        }
    }, [editingSql, dispatch, t]);

    // Modify feedback processing function
    const handleFeedback = useCallback(async (isPositive: boolean, canRefer?: boolean) => {
        if (!taskId) return;
        
        try {
            // 0: Not feedback
            // 1: Correct + can refer
            // 2: Correct + cannot refer
            // 3: Error
            const oldType = (sqlRight === undefined || sqlRight === null) ? 0 : (sqlRight ? (sqlRefer ? 1 : 2) : 3)
            const newType = isPositive ? (canRefer ? 1 : 2) : 3
            // If the selected option is the same as before, return directly
            if (oldType === newType) {
                return;
            }

            await mainApi.mainUpdateSqlFeedbackPost({
                taskId: Number(taskId),
                sqlRight: isPositive,
                sqlRefer: isPositive ? (canRefer ?? false) : false
            });
            await refreshTask(taskId);
            refreshQuestions();
            toast.success(isPositive ? t('sqlResult.feedbackPositive') : t('sqlResult.feedbackNegative'));
        } catch (err) {
            toast.error(t('sqlResult.feedbackFailed'));
        }
    }, [taskId, refreshTask, refreshQuestions, sqlRight, sqlRefer, t]);

    // Initialize height effect
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '44px';
        }
    }, []);

    // Modify the effect of listening to the change of editingSql
    useEffect(() => {
        if (textareaRef.current) {
            // Set height to auto first to recalculate scrollHeight
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [editingSql]);

    return (
        <div className="w-full mt-4">
            <div className="w-full flex justify-between items-center text-left mb-0 bg-cyan-700 p-2 rounded-t-lg text-white">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">{t('sqlResult.title')}</h2>
                </div>
                {sql && !sqlModified && (
                    <div className="flex items-center gap-2">
                        <Tooltip content={t('sqlResult.formatSql')}>
                            <button
                                className="text-white hover:text-gray-200" 
                                onClick={handleFormat}>
                                <FaCode className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        <Tooltip content={t('sqlResult.copySql')}>
                            <button 
                                className="text-white hover:text-gray-200" 
                                onClick={handleCopy}>
                                <MdContentCopy className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className="p-3 bg-white rounded-b-lg shadow">
                {sql ? (
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={editingSql}
                            onChange={e => handleSqlChange(e.target.value)}
                            rows={1}
                            className="block w-full p-3 text-sm text-gray-900 bg-white border-0 resize-none overflow-hidden focus:ring-0 font-mono"
                        />
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-20">
                        <span className="text-gray-400 text-lg">{t('sqlResult.notGenerated')}</span>
                    </div>
                )}
                
                {/* Use feedback component */}
                {sql && (
                    <SqlFeedback 
                        onFeedback={handleFeedback}
                        sqlRight={sqlRight}
                        sqlRefer={sqlRefer}
                    />
                )}
                
                <div className="mt-2 flex justify-end">
                    <Button 
                        onClick={handleGenerate}
                        disabled={disabledGenerate}
                    >
                        <div className="flex items-center gap-2">
                            <FaPaperPlane className="h-4 w-4" />
                            <span>{sql ? t('sqlResult.regenerate') : t('sqlResult.generate')}</span>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
} 