import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { HiOutlineClipboardList, HiQuestionMarkCircle } from 'react-icons/hi';
import { Tabs, TabsRef, Button } from 'flowbite-react';
import { QuestionInput } from './QuestionInput';
import { SqlResult } from './SqlResult';
import { Refs } from './Refs';
import { JobList } from './JobList';
import { SqlLearning } from './SqlLearning';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { setActiveTab } from '@/store/slices/recordsSlice';
import { mainApi } from '@/App';
import { toast } from 'react-toastify';
import useTask from '@/hooks/useTask';

// Right bottom task info component
function TaskInfo() {
    const { t } = useTranslation();
    const currentTaskId = useAppSelector(state => state.task.taskId);

    if (!currentTaskId) return null;

    return (
        <div className="fixed bottom-4 right-4 text-xs text-gray-300 select-none">
            {t('generationRecords.taskId')}: {currentTaskId}
        </div>
    );
} 

// Add bottom modification panel component
function ModificationPanel() {
  const { t } = useTranslation();
  const taskId = useAppSelector(state => state.task.taskId);
  const task = useAppSelector(state => state.task.task);
  const editingQuestion = useAppSelector(state => state.records.editingQuestion);
  const editingQuestionSupplement = useAppSelector(state => state.records.editingQuestionSupplement);
  const taskOptions = useAppSelector(state => state.records.taskOptions);
  const selectedRules = useAppSelector(state => state.records.selectedRules);
  const editingDocs = useAppSelector(state => state.records.editingDocs);
  const editingSqls = useAppSelector(state => state.records.editingSqls);
  const editingSql = useAppSelector(state => state.records.editingSql);
  const questionModified = useAppSelector(state => state.records.questionModified);
  const questionSupplementModified = useAppSelector(state => state.records.questionSupplementModified);
  const optionsModified = useAppSelector(state => state.records.optionsModified);
  const rulesModified = useAppSelector(state => state.records.rulesModified);
  const sqlModified = useAppSelector(state => state.records.sqlModified);
  const docsModified = useAppSelector(state => state.records.docsModified);
  const sqlsModified = useAppSelector(state => state.records.sqlsModified);
  const ddlModified = useAppSelector(state => state.records.ddlModified);
  const selectedColumns = useAppSelector(state => state.records.selectedColumns);
  const { applyTask, refreshTask } = useTask();

  const handleSubmit = async () => {
    try {
      await mainApi.mainUpdateTaskPost({
        task_id: taskId!,

        question: questionModified?editingQuestion:'',
        question_supplement: questionSupplementModified?editingQuestionSupplement:'',
        options: optionsModified?(taskOptions || {}):{},
        rules: rulesModified?selectedRules:[],
        doc_ids: docsModified?editingDocs.map(doc => doc.doc_id):[],
        sql_ids: sqlsModified?editingSqls.map(sql => sql.task_id!):[],
        columns: ddlModified?selectedColumns:[],
        sql: sqlModified?editingSql:'',

        question_modified: questionModified,
        question_supplement_modified: questionSupplementModified,
        options_modified: optionsModified,
        rules_modified: rulesModified,
        doc_ids_modified: docsModified,
        sql_ids_modified: sqlsModified,
        columns_modified: ddlModified,
        sql_modified: sqlModified,
      });
      
      toast.success(t('task.submitSuccess'));
      refreshTask(taskId!);
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(t('task.submitFailed'));
    }
  };

  const handleRevert = () => {
    if (task) {
      applyTask(task);
      toast.success(t('task.restoreSuccess'));
    }
  };

  return (
    <div className="fixed bottom-4 w-[calc(100%-16rem)] left-[16rem] flex justify-center">
      <div className="flex gap-2 bg-white p-2 rounded-lg shadow-lg border">
        <Button size="sm" onClick={handleSubmit}>
          {t('task.submitChanges')}
        </Button>
        <Button size="sm" color="gray" onClick={handleRevert}>
          {t('task.restore')}
        </Button>
      </div>
    </div>
  );
}

// Right content component
export function MainContent() {
    const { t } = useTranslation();
    const tabsRef = useRef<TabsRef>(null);
    const activeTab = useAppSelector(state => state.records.activeTab);
    const currentTaskId = useAppSelector(state => state.task.taskId);
    const dispatch = useAppDispatch();
    const taskModified = useAppSelector(state => state.records.taskModified);

    const handleActiveTabChange = (index: number) => {
        dispatch(setActiveTab(index));
    }

    useEffect(() => {
        if (tabsRef.current) {
            tabsRef.current.setActiveTab(activeTab);
        }
    }, [activeTab]);

    return (
        <div className="ai-content flex-1 overflow-y-auto p-4 relative">
            <Tabs variant='underline' ref={tabsRef} onActiveTabChange={handleActiveTabChange}>
                {/* Question tab */}
                <Tabs.Item 
                    active 
                    title={t('generationRecords.question')} 
                    icon={HiQuestionMarkCircle}
                >
                    <div className="space-y-4">
                        {/* Question input */}
                        <QuestionInput />
                        {/* Generation result */}
                        {currentTaskId && <SqlResult />}
                        {/* Add learning component */}
                        {currentTaskId && <SqlLearning />}
                    </div>
                </Tabs.Item>
                {/* References tab */}
                {currentTaskId && (
                    <Tabs.Item 
                        title={t('generationRecords.references')} 
                        icon={HiOutlineClipboardList}
                    >
                        <Refs/>
                    </Tabs.Item>
                )}
            </Tabs>
            <JobList />
            <TaskInfo />
            {currentTaskId && taskModified && <ModificationPanel />}
        </div>
    );
}
