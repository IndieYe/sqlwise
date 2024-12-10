import { useAppSelector } from '@/store/hooks';
import { setSelectedTable } from '@/store/slices/ddlSlice';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { HiSearch, HiUpload, HiCheck, HiBan } from 'react-icons/hi';
import { Button, TextInput, Tooltip } from 'flowbite-react'; 
import { UploadDDLModal } from './UploadDDLModal';
import { fuzzyMatch } from '@/utils/stringUtils';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { mainApi } from '@/App';
import { setSchema } from '@/store/slices/schemaSlice';

interface TableItemProps {
    table: string;
    comment: string | undefined;
    isActive: boolean;
    disabled?: boolean;
    onClick: (taskId: string) => void;
    onToggleStatus: (table: string, disabled: boolean) => void;
}

function TableItem({ table, comment, isActive, disabled = false, onClick, onToggleStatus }: TableItemProps) {
    const handleStatusClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStatus(table, !disabled);
    };

    const { t } = useTranslation();

    return (
        <li
            className={`py-2 px-4 hover:bg-gray-200 cursor-pointer rounded-lg text-sm group flex items-center
                ${isActive ? 'bg-gray-200' : ''}`}
            onClick={() => onClick(table)}
        >
            <Tooltip content={t('ddl.toggleStatusTooltip')}>
                <div 
                    className="mr-2 cursor-pointer"
                    onClick={handleStatusClick}
                >
                    {disabled ? (
                        <HiBan className="w-4 h-4 text-red-500" />
                    ) : (
                        <HiCheck className="w-4 h-4 text-green-500" />
                    )}
                </div>
            </Tooltip>
            <div className="flex w-full justify-between items-center">
                <span className={`flex-1 mr-2 ${disabled ? 'line-through' : ''}`}>{table}</span>
                <span className="truncate text-gray-500 text-xs">{comment}</span>
            </div>
        </li>
    );
}

export function TableList() {
    const { t } = useTranslation();
    const schema = useAppSelector(state => state.schema.schema);
    const selectedTable = useAppSelector(state => state.ddl.selectedTable);
    const dispatch = useDispatch();
    const projectId = useAppSelector(state => state.app.projectId);
    const [searchText, setSearchText] = useState('');
    const [openModal, setOpenModal] = useState(false);

    const handleTableClick = (table: string) => {
        dispatch(setSelectedTable(table));
    };

    const handleToggleStatus = async (table: string, disabled: boolean) => {
        try {
            await mainApi.mainDisableTablePost({
                project_id: projectId,
                table,
                disabled
            });
            toast.success(disabled ? t('ddl.tableDisabled') : t('ddl.tableEnabled'));
            // Update local state
            dispatch(setSchema({
                ...schema,
                tables: schema?.tables?.map(t => t.table === table ? { ...t, disabled } : t)
            }));
        } catch (error) {
            toast.error(t('ddl.toggleStatusFailed'));
        }
    };

    const filteredTables = schema?.tables?.filter(record =>
        record.table && (
            record.table.toLowerCase().includes(searchText.toLowerCase()) ||
            fuzzyMatch(searchText, record.table)
        )
    );

    return (
        <div className="w-80 bg-gray-50">
            <div className="p-2">
                <div className="mb-2">
                    <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setOpenModal(true)}
                    >
                        <HiUpload className="mr-2 h-4 w-4" />
                        {t('ddl.uploadDDL')}
                    </Button>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <HiSearch className="w-4 h-4 text-gray-500" />
                    </div>
                    <TextInput
                        sizing="sm"
                        placeholder={t('ddl.searchTable', { count: schema?.tables?.length || 0 })}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>
            <ul className="p-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
                {filteredTables?.map((record) => (
                    <TableItem
                        key={record.table}
                        table={record.table!}
                        comment={record.comment}
                        isActive={selectedTable === record.table}
                        disabled={record.disabled}
                        onClick={handleTableClick}
                        onToggleStatus={handleToggleStatus}
                    />
                ))}
            </ul>

            <UploadDDLModal 
                show={openModal}
                onClose={() => setOpenModal(false)} 
            />
        </div>
    );
} 