import { useAppSelector } from "@/store/hooks";
import { useTranslation } from 'react-i18next';

interface TableInfo {
    t: string;  // Table name
    d: string;  // Table description
}

interface ColumnInfo {
    t: string;  // Table name
    c: string;  // Column name
    d: string;  // Column description
}

interface RelatedInfo {
    tables: TableInfo[];
    columns: ColumnInfo[];
}

const TableItem = ({ table }: { table: TableInfo }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 w-fit">
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-900">
                {table.t}
            </span>
            <span className="text-sm text-gray-600">
                {table.d}
            </span>
        </div>
    </div>
);

const ColumnItem = ({ column }: { column: ColumnInfo }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 w-fit">
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-900">
                {column.t}.{column.c}
            </span>
            <span className="text-sm text-gray-600">
                {column.d}
            </span>
        </div>
    </div>
);

const RelatedColumnsRefs = () => {
    const { t } = useTranslation();
    const task = useAppSelector(state => state.task.task);
    const relatedInfo: RelatedInfo = task?.related_columns ? JSON.parse(task.related_columns) : { tables: [], columns: [] };

    if (!relatedInfo.tables?.length && !relatedInfo.columns?.length) {
        return (
            <div className="text-sm text-gray-500 p-4 text-center">
                {t('relatedColumnsRefs.noRelatedInfo')}
            </div>
        );
    }

    return (
        <div className="space-y-4 p-1 min-h-[100px]">
            {relatedInfo.tables?.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">{t('relatedColumnsRefs.relatedTables')}</h3>
                    <div className="flex flex-wrap gap-4">
                        {relatedInfo.tables.map((table, index) => (
                            <TableItem key={`table-${index}`} table={table} />
                        ))}
                    </div>
                </div>
            )}
            
            {relatedInfo.columns?.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">{t('relatedColumnsRefs.relatedColumns')}</h3>
                    <div className="flex flex-wrap gap-4">
                        {relatedInfo.columns.map((column, index) => (
                            <ColumnItem key={`column-${index}`} column={column} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelatedColumnsRefs; 