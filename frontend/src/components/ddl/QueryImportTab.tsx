import { Button, Select } from 'flowbite-react';
import { HiClipboard } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useTask from '@/hooks/useTask';
import { mainApi } from '@/App';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { DB_COLUMN_QUERIES, DB_TABLE_QUERIES, DB_TYPES, DB_TYPE_LABELS, DbType } from '@/consts';
import useAsyncEffect from 'ahooks/lib/useAsyncEffect';

interface QueryImportTabProps {
    onClose: () => void;
}

export function QueryImportTab({ onClose }: QueryImportTabProps) {
    const { t } = useTranslation();
    const { refreshSchema } = useTask();
    const projectId = useAppSelector(state => state.app.projectId);
    const [selectedDbType, setSelectedDbType] = useState<DbType>(DB_TYPES.MYSQL);
    const [tableQuery, setTableQuery] = useState('');
    const [columnQuery, setColumnQuery] = useState('');
    const [tableQueryResult, setTableQueryResult] = useState('');
    const [columnQueryResult, setColumnQueryResult] = useState('');

    useAsyncEffect(async () => {
        if (projectId) {
          const response = await mainApi.mainProjectSettingsGet(projectId);
          setSelectedDbType(response.data.db_type as DbType);
        }
      }, [projectId]);
    
    useEffect(() => {
        const tableQueryTemplate = DB_TABLE_QUERIES[selectedDbType] || '';
        const columnQueryTemplate = DB_COLUMN_QUERIES[selectedDbType] || '';
        setTableQuery(tableQueryTemplate);
        setColumnQuery(columnQueryTemplate);
    }, [selectedDbType]);

    const handleQuerySubmit = async () => {
        if (!tableQuery.trim() || !columnQuery.trim()) {
            toast.error(t('ddl.importMethods.queryPlaceholder'));
            return;
        }

        try {
            await mainApi.mainUpdateDDLByQueryPost({
                project_id: projectId,
                tables: JSON.parse(tableQueryResult),
                columns: JSON.parse(columnQueryResult),
            });
            toast.success(t('ddl.importMethods.querySuccess'));
            setTableQuery('');
            setColumnQuery('');
            setTableQueryResult('');
            setColumnQueryResult('');
            refreshSchema();
            onClose();
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data?.message || t('common.invalidParams');
                toast.error(t('ddl.importMethods.queryFailed') + ': ' + errorMessage);
            } else {
                toast.error(t('ddl.importMethods.queryFailed') + ': ' + (error.message || t('common.unknownError')));
            }
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Select
                    value={selectedDbType}
                    onChange={e => setSelectedDbType(e.target.value as DbType)}
                >
                    {Object.entries(DB_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </Select>
            </div>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {t('ddl.importMethods.tableQuery')}
                </label>
                <div className="relative">
                    <pre className="relative w-full p-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto">
                        <code className="language-sql">
                            {tableQuery}
                        </code>
                    </pre>
                    <button
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 bg-gray-50 rounded"
                        onClick={() => {
                            navigator.clipboard.writeText(tableQuery);
                            toast.success(t('ddl.importMethods.queryCopied'));
                        }}
                    >
                        <HiClipboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {t('ddl.importMethods.columnQuery')}
                </label>
                <div className="relative">
                    <pre className="relative w-full p-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto">
                        <code className="language-sql">
                            {columnQuery}
                        </code>
                    </pre>
                    <button
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 bg-gray-50 rounded"
                        onClick={() => {
                            navigator.clipboard.writeText(columnQuery);
                            toast.success(t('ddl.importMethods.queryCopied'));
                        }}
                    >
                        <HiClipboard className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {t('ddl.importMethods.tableQueryResult')}
                </label>
                <textarea
                    className="w-full h-48 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder={`${t('ddl.importMethods.queryResultPlaceholder')}\n\n${t('ddl.importMethods.tableQueryResultExample')}`}
                    value={tableQueryResult}
                    onChange={(e) => setTableQueryResult(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {t('ddl.importMethods.columnQueryResult')}
                </label>
                <textarea
                    className="w-full h-48 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder={`${t('ddl.importMethods.queryResultPlaceholder')}\n\n${t('ddl.importMethods.columnQueryResultExample')}`}
                    value={columnQueryResult}
                    onChange={(e) => setColumnQueryResult(e.target.value)}
                />
            </div>

            <div className="flex justify-center">
                <Button onClick={handleQuerySubmit}>
                    {t('ddl.importMethods.executeQuery')}
                </Button>
            </div>
        </div>
    );
} 