import { useAppSelector } from '@/store/hooks';
import { TableList } from './TableList';
import TableCommentEditor from '@/components/ddl/TableCommentEditor';

export function DDL() {
    const selectedTable = useAppSelector(state => state.ddl.selectedTable);

    const handleConfirm = () => {
        // Handle logic after confirmation
    };

    return (
        <div className="flex h-full w-full">
            {/* Left list */}
            <TableList />
            {/* Right content */}
            <div className="ai-content flex-1 relative overflow-y-auto p-4">
                {selectedTable && (
                    <TableCommentEditor
                        tableName={selectedTable}
                        onConfirm={handleConfirm}
                    />
                )}
            </div>
        </div>
    );
} 