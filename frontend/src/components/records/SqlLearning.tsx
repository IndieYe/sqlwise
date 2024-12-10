import { Button, Tooltip, Checkbox } from 'flowbite-react';
import { FaBrain, FaCheck } from 'react-icons/fa';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toast } from 'react-toastify';
import { mainApi } from '@/App';
import { useCallback, useState } from 'react';
import useTask from '@/hooks/useTask';
import { TableNotes, ColumnNotes, TableRelations } from './LearningDetails';
import { setSelectedLearningItems } from '@/store/slices/recordsSlice';
import { useTranslation } from 'react-i18next';

export function SqlLearning() {
    const dispatch = useAppDispatch();
    const taskId = useAppSelector(state => state.task.taskId);
    const taskModified = useAppSelector(state => state.records.taskModified);
    const task = useAppSelector(state => state.task.task);
    const selectedLearningItems = useAppSelector(state => state.records.selectedLearningItems);
    const tableCellTypes = useAppSelector(state => state.records.tableCellTypes);
    const columnCellTypes = useAppSelector(state => state.records.columnCellTypes);
    const relationCellTypes = useAppSelector(state => state.records.relationCellTypes);
    const learnTables = useAppSelector(state => state.records.learnTables);
    const learnColumns = useAppSelector(state => state.records.learnColumns);
    const learnRelations = useAppSelector(state => state.records.learnRelations);
    const finalLearnTables = useAppSelector(state => state.records.finalLearnTables);
    const finalLearnColumns = useAppSelector(state => state.records.finalLearnColumns);
    const finalLearnRelations = useAppSelector(state => state.records.finalLearnRelations);
    const [isLoading, setIsLoading] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const { refreshTask, refreshSchema } = useTask();
    const [showNew, setShowNew] = useState(true);
    const [showNewOverride, setShowNewOverride] = useState(false);
    const [showModified, setShowModified] = useState(false);
    const [showUnchanged, setShowUnchanged] = useState(false);
    const [showNone, setShowNone] = useState(false);
    const schema = useAppSelector(state => state.schema.schema);
    const currentJob = useAppSelector(state => state.task.currentJob);
    const isLearning = currentJob?.job_type === 'learn_from_sql' && (currentJob?.job_status === 'init' || currentJob?.job_status === 'running');
    const { t } = useTranslation();

    const handleLearn = useCallback(async () => {
        if (!taskId) return;

        try {
            setIsLoading(true);
            await mainApi.mainLearnPost({ taskId: Number(taskId) });
            refreshTask(taskId);
            toast.success(t('sqlLearning.startLearnSuccess'));
        } catch (err) {
            toast.error(t('sqlLearning.learnFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [taskId, refreshTask, t]);

    const handleAcceptLearn = useCallback(async () => {
        if (!taskId || !task?.learn_result) return;

        try {
            setIsAccepting(true);

            const filteredTables = finalLearnTables.filter(table =>
                selectedLearningItems.includes(`table:${table.table}`)) || [];

            const filteredColumns = finalLearnColumns.filter(column =>
                selectedLearningItems.includes(`column:${column.table}:${column.column}`)) || [];

            const filteredRelations = finalLearnRelations.filter(relation => {
                const relationId = `relation:${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`;
                return selectedLearningItems.includes(relationId);
            });

            await mainApi.mainAcceptLearnResultPost({
                taskId: Number(taskId),
                learnResult: {
                    tables: filteredTables,
                    columns: filteredColumns,
                    relations: filteredRelations
                }
            });
            
            await refreshSchema();
            await refreshTask(taskId);

            toast.success(t('sqlLearning.acceptSuccess', { count: selectedLearningItems.length }));
        } catch (err) {
            toast.error(t('sqlLearning.acceptFailed'));
        } finally {
            setIsAccepting(false);
        }
    }, [taskId, finalLearnTables, finalLearnColumns, finalLearnRelations, selectedLearningItems, refreshSchema, refreshTask, t]);

    const handleSelectAll = useCallback(() => {
        const allItems: string[] = [];

        // Add visible table items
        learnTables.forEach(table => {
            const cellType = tableCellTypes[table.table!];
            const isNew = cellType === 'new';
            const isNewOverride = cellType === 'newOverride';
            const isModified = cellType === 'modify';
            const isUnchanged = cellType === 'stay';
            const isNone = cellType === 'none';

            if ((isNew && showNew) ||
                (isNewOverride && showNewOverride) ||
                (isModified && showModified) ||
                (isUnchanged && showUnchanged) ||
                (isNone && showNone)) {
                allItems.push(`table:${table.table}`);
            }
        });

        // Add visible column items
        learnColumns.forEach(column => {
            const cellType = columnCellTypes[`${column.table}:${column.column}`];
            const isNew = cellType === 'new';
            const isNewOverride = cellType === 'newOverride';
            const isModified = cellType === 'modify';
            const isUnchanged = cellType === 'stay';
            const isNone = cellType === 'none';


            if ((isNew && showNew) ||
                (isNewOverride && showNewOverride) ||
                (isModified && showModified) ||
                (isUnchanged && showUnchanged) ||
                (isNone && showNone)) {
                allItems.push(`column:${column.table}:${column.column}`);
            }
        });

        // Add visible relation items
        learnRelations.forEach(relation => {
            const cellType = relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`];
            const isNew = cellType === 'new';
            const isUnchanged = cellType === 'stay';
            const isModified = cellType === 'modify';
            const isNone = cellType === 'none';

            if ((isNew && showNew) ||
                (isUnchanged && showUnchanged) ||
                (isModified && showModified) ||
                (isNone && showNone)) {
                allItems.push(
                    `relation:${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`
                );
            }
        });

        dispatch(setSelectedLearningItems(allItems));
    }, [
        learnTables,
        learnColumns,
        learnRelations,
        schema,
        showNew,
        showNewOverride,
        showModified,
        showUnchanged,
        showNone,
        dispatch
    ]);

    const handleDeselectAll = useCallback(() => {
        dispatch(setSelectedLearningItems([]));
    }, [dispatch]);

    const renderLearnResult = () => {
        if (!learnTables.length && !learnColumns.length && !learnRelations.length) return null;

        // Calculate counts
        const tableCounts = {
            new: learnTables.filter(table => tableCellTypes[table.table!] === 'new').length,
            newOverride: learnTables.filter(table => tableCellTypes[table.table!] === 'newOverride').length,
            modified: learnTables.filter(table => tableCellTypes[table.table!] === 'modify').length,
            unchanged: learnTables.filter(table => tableCellTypes[table.table!] === 'stay').length,
            none: learnTables.filter(table => tableCellTypes[table.table!] === 'none').length
        };

        const columnCounts = {
            new: learnColumns.filter(column => columnCellTypes[`${column.table}:${column.column}`] === 'new').length,
            newOverride: learnColumns.filter(column => columnCellTypes[`${column.table}:${column.column}`] === 'newOverride').length,
            modified: learnColumns.filter(column => columnCellTypes[`${column.table}:${column.column}`] === 'modify').length,
            unchanged: learnColumns.filter(column => columnCellTypes[`${column.table}:${column.column}`] === 'stay').length,
            none: learnColumns.filter(column => columnCellTypes[`${column.table}:${column.column}`] === 'none').length
        };

        const relationCounts = {
            new: learnRelations.filter(relation => relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`] === 'new').length,
            unchanged: learnRelations.filter(relation => relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`] === 'stay').length,
            modified: learnRelations.filter(relation => relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`] === 'modify').length,
            none: learnRelations.filter(relation => relationCellTypes[`${relation.table1}:${relation.column1}:${relation.table2}:${relation.column2}`] === 'none').length
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg select-none text-sm">
                    <div className="flex items-center gap-2">
                        <Button
                            size="xs"
                            color="gray"
                            onClick={handleSelectAll}
                        >
                            {t('sqlLearning.selectAll')}
                        </Button>
                        <Button
                            size="xs"
                            color="gray"
                            onClick={handleDeselectAll}
                        >
                            {t('sqlLearning.deselectAll')}
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-gray-600 font-medium">
                            {t('sqlLearning.display')}
                        </div>
                        <label className="flex items-center" htmlFor="showNew">
                            <Checkbox
                                id="showNew"
                                className="mr-1"
                                checked={showNew}
                                onChange={(e) => setShowNew(e.target.checked)}
                            />
                            <Tooltip content={t('sqlLearning.newTooltip')}>
                                {t('sqlLearning.new')} (<span className="text-cyan-600">{tableCounts.new + columnCounts.new + relationCounts.new}</span>)
                            </Tooltip>
                        </label>
                        <label className="flex items-center" htmlFor="showNewOverride">
                            <Checkbox
                                id="showNewOverride"
                                className="mr-1"
                                checked={showNewOverride}
                                onChange={(e) => setShowNewOverride(e.target.checked)}
                            />
                            <Tooltip content={t('sqlLearning.overrideTooltip')}>
                                {t('sqlLearning.override')} (<span className="text-cyan-600">{tableCounts.newOverride + columnCounts.newOverride}</span>)
                            </Tooltip>
                        </label>
                        <label className="flex items-center" htmlFor="showModified">
                            <Checkbox
                                id="showModified"
                                className="mr-1"
                                checked={showModified}
                                onChange={(e) => setShowModified(e.target.checked)}
                            />
                            <Tooltip content={t('sqlLearning.modifyTooltip')}>
                                {t('sqlLearning.modified')} (<span className="text-cyan-600">{tableCounts.modified + columnCounts.modified + relationCounts.modified}</span>)
                            </Tooltip>
                        </label>
                        <label className="flex items-center text-gray-500" htmlFor="showUnchanged">
                            <Checkbox
                                id="showUnchanged"
                                className="mr-1"
                                checked={showUnchanged}
                                onChange={(e) => setShowUnchanged(e.target.checked)}
                            />
                            {t('sqlLearning.unchanged')} (<span className="text-cyan-600">{tableCounts.unchanged + columnCounts.unchanged + relationCounts.unchanged}</span>)
                        </label>
                        <label className="flex items-center text-gray-500" htmlFor="showNone">
                            <Checkbox
                                id="showNone"
                                className="mr-1"
                                checked={showNone}
                                onChange={(e) => setShowNone(e.target.checked)}
                            />
                            {t('sqlLearning.notExist')} (<span className="text-cyan-600">{tableCounts.none + columnCounts.none + relationCounts.none}</span>)
                        </label>
                    </div>
                </div>
                <TableNotes
                    showNew={showNew}
                    showNewOverride={showNewOverride}
                    showModified={showModified}
                    showUnchanged={showUnchanged}
                    showNone={showNone}
                />
                <ColumnNotes
                    showNew={showNew}
                    showNewOverride={showNewOverride}
                    showModified={showModified}
                    showUnchanged={showUnchanged}
                    showNone={showNone}
                />
                <TableRelations
                    showNew={showNew}
                    showUnchanged={showUnchanged}
                    showModified={showModified}
                    showNone={showNone}
                />
            </div>
        );
    };

    return (
        <div className="w-full mt-4">
            <div className="w-full flex justify-between items-center text-left mb-0 bg-cyan-700 p-2 rounded-t-lg text-white">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">{t('sqlLearning.title')}</h2>
                </div>
            </div>
            <div className="p-3 bg-white rounded-b-lg shadow min-h-[250px] flex flex-col">
                {renderLearnResult() || (
                    <div className="flex-1 flex justify-center items-center h-20">
                        <span className="text-gray-400 text-lg">{t('sqlLearning.startLearning')}</span>
                    </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                    {task?.learn_result && selectedLearningItems.length > 0 && (
                        <Tooltip content={t('sqlLearning.acceptTooltip')}>
                            <Button
                                onClick={handleAcceptLearn}
                                disabled={isAccepting}
                            >
                                <div className="flex items-center gap-2">
                                    <FaCheck className="h-4 w-4" />
                                    <span>{t('sqlLearning.acceptSuggestions')}({selectedLearningItems.length})</span>
                                </div>
                            </Button>
                        </Tooltip>
                    )}
                    <Button
                        gradientDuoTone="greenToBlue"
                        onClick={handleLearn}
                        disabled={isLoading || isLearning || !task?.sql || taskModified}
                    >
                        <div className="flex items-center gap-2">
                            <FaBrain className="h-4 w-4" />
                            <span>
                                {task?.learn_result 
                                    ? t('sqlLearning.regenerateSuggestions')
                                    : t('sqlLearning.generateSuggestions')
                                }
                            </span>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
} 