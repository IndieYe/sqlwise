import { useState } from 'react';
import { mainApi } from '../../App';
import { ProjectSettingsDTO } from '../../api-docs';
import { Card, Tooltip, Button } from 'flowbite-react';
import { useAppSelector } from '@/store/hooks';
import useAsyncEffect from 'ahooks/lib/useAsyncEffect';
import { toast } from 'react-toastify';
import { MdRefresh } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { DB_TYPE_LABELS, type DbType } from '@/consts';

const Settings = () => {
  const { t } = useTranslation();
  const projectId = useAppSelector(state => state.app.projectId);
  const [settings, setSettings] = useState<ProjectSettingsDTO | null>(null);
  const [refreshingDoc, setRefreshingDoc] = useState(false);
  const [refreshingTable, setRefreshingTable] = useState(false);
  const [refreshingColumn, setRefreshingColumn] = useState(false);
  const [refreshingSql, setRefreshingSql] = useState(false);

  useAsyncEffect(async () => {
    if (projectId) {
      const response = await mainApi.mainProjectSettingsGet(projectId);
      setSettings(response.data);
    }
  }, [projectId]);

  const handleRefreshDocIndex = async () => {
    if (!projectId) return;
    
    try {
      setRefreshingDoc(true);
      await mainApi.mainRefreshIndexPost({ 
        project_id: projectId,
        refresh_doc: true 
      });
      toast.success(t('settings.refreshSuccess'));
      
      const response = await mainApi.mainProjectSettingsGet(projectId);
      setSettings(response.data);
    } catch (error) {
      toast.error(t('settings.refreshFailed'));
    } finally {
      setRefreshingDoc(false);
    }
  };

  const handleRefreshTableIndex = async () => {
    if (!projectId) return;
    
    try {
      setRefreshingTable(true);
      await mainApi.mainRefreshIndexPost({ 
        project_id: projectId,
        refresh_table: true 
      });
      toast.success(t('settings.refreshSuccess'));
      
      const response = await mainApi.mainProjectSettingsGet(projectId);
      setSettings(response.data);
    } catch (error) {
      toast.error(t('settings.refreshFailed'));
    } finally {
      setRefreshingTable(false);
    }
  };

  const handleRefreshColumnIndex = async () => {
    if (!projectId) return;
    
    try {
      setRefreshingColumn(true);
      await mainApi.mainRefreshIndexPost({ 
        project_id: projectId,
        refresh_column: true 
      });
      toast.success(t('settings.refreshSuccess'));
      
      const response = await mainApi.mainProjectSettingsGet(projectId);
      setSettings(response.data);
    } catch (error) {
      toast.error(t('settings.refreshFailed'));
    } finally {
      setRefreshingColumn(false);
    }
  };

  const handleRefreshSqlIndex = async () => {
    if (!projectId) return;
    
    try {
      setRefreshingSql(true);
      await mainApi.mainRefreshIndexPost({ 
        project_id: projectId,
        refresh_sql: true 
      });
      toast.success(t('settings.refreshSuccess'));
      
      const response = await mainApi.mainProjectSettingsGet(projectId);
      setSettings(response.data);
    } catch (error) {
      toast.error(t('settings.refreshFailed'));
    } finally {
      setRefreshingSql(false);
    }
  };

  if (!settings) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>
      
      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{t('settings.projectInfo.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">{t('settings.projectInfo.name')}: </span>
            <span>{settings.name}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.projectInfo.dbType')}: </span>
            <span>{DB_TYPE_LABELS[settings.db_type as DbType]}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.projectInfo.description')}: </span>
            <span>{settings.description}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.projectInfo.dbVersion')}: </span>
            <span>{settings.db_version}</span>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{t('settings.definitionStatus.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <span className="font-medium">{t('settings.definitionStatus.documents')}: </span>
            <span className="mx-2">{settings.definition_doc_count}</span>
            <Tooltip content={t('settings.refreshDocIndexTooltip')} placement="right">
              <Button 
                size="xs"
                pill
                onClick={handleRefreshDocIndex}
                disabled={refreshingDoc}
                className="!p-1.5"
              >
                <MdRefresh className={`h-4 w-4 ${refreshingDoc ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
          <div>
            <span className="font-medium">{t('settings.definitionStatus.rules')}: </span>
            <span>{settings.definition_rule_count}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{t('settings.definitionStatus.tables')}: </span>
            <span className="mx-2">{settings.definition_table_count}</span>
            <Tooltip content={t('settings.refreshTableIndexTooltip')} placement="right">
              <Button
                size="xs"
                pill
                onClick={handleRefreshTableIndex}
                disabled={refreshingTable}
                className="!p-1.5"
              >
                <MdRefresh className={`h-4 w-4 ${refreshingTable ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{t('settings.definitionStatus.columns')}: </span>
            <span className="mx-2">{settings.definition_column_count}</span>
            <Tooltip content={t('settings.refreshColumnIndexTooltip')} placement="right">
              <Button
                size="xs"
                pill
                onClick={handleRefreshColumnIndex}
                disabled={refreshingColumn}
                className="!p-1.5"
              >
                <MdRefresh className={`h-4 w-4 ${refreshingColumn ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
          <div>
            <span className="font-medium">{t('settings.definitionStatus.relations')}: </span>
            <span>{settings.definition_relation_count}</span>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{t('settings.taskStatus.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <span className="font-medium">{t('settings.taskStatus.tasks')}: </span>
            <span className="mx-2">{settings.task_count}</span>
            <Tooltip content={t('settings.refreshSqlIndexTooltip')} placement="right">
              <Button
                size="xs"
                pill
                onClick={handleRefreshSqlIndex}
                disabled={refreshingSql}
                className="!p-1.5"
              >
                <MdRefresh className={`h-4 w-4 ${refreshingSql ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
          </div>
          <div>
            <span className="font-medium">{t('settings.taskStatus.taskDocuments')}: </span>
            <span>{settings.task_doc_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.taskStatus.taskSql')}: </span>
            <span>{settings.task_sql_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.taskStatus.taskTables')}: </span>
            <span>{settings.task_table_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.taskStatus.taskColumns')}: </span>
            <span>{settings.task_column_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.taskStatus.jobs')}: </span>
            <span>{settings.job_count}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-2">{t('settings.vectorStatus.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">{t('settings.vectorStatus.waitingTables')}: </span>
            <span>{settings.vector_waiting_table_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.vectorStatus.waitingColumns')}: </span>
            <span>{settings.vector_waiting_column_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.vectorStatus.waitingDocuments')}: </span>
            <span>{settings.vector_waiting_doc_count}</span>
          </div>
          <div>
            <span className="font-medium">{t('settings.vectorStatus.waitingTasks')}: </span>
            <span>{settings.vector_waiting_task_count}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
