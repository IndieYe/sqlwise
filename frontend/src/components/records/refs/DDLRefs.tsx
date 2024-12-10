import { useCallback, useMemo, useRef } from "react";
import { useAppSelector } from "@/store/hooks"
import { Table, Checkbox, TextInput, Tooltip } from 'flowbite-react';
import { SelectedColumn, setAICommentTable, setEditTable, setShowAICommentModal, setShowEditModal } from "../../../store/slices/recordsSlice";
import { HiPencil, HiSearch, HiTrash } from "react-icons/hi";
import { useState } from 'react';
import { useAppDispatch } from "@/store/hooks";
import { setSelectedColumns } from "@/store/slices/recordsSlice";
import DDLRefsModal from "./DDLRefsModal";
import { fuzzyMatch } from '@/utils/stringUtils';
import { useTranslation } from 'react-i18next';

interface ColumnViewProps {
    column: string;
    table: string;
}

const ColumnView = ({ column, table }: ColumnViewProps) => {
    const schema = useAppSelector(state => state.schema.schema)
    const column_def = useMemo(() => schema?.columns?.find(c => c.table === table && c.column === column), [schema?.columns, table, column])
    const dispatch = useAppDispatch();
    const selectedColumns = useAppSelector(state => state.records.selectedColumns);

    const handleDelete = () => {
        const updatedColumns = selectedColumns.map(col => {
            if (col.table === table) {
                return {
                    ...col,
                    columns: col.columns.filter(c => c !== column)
                };
            }
            return col;
        });
        dispatch(setSelectedColumns(updatedColumns));
    };

    return (
        <Table.Row>
            <Table.Cell>
                <Checkbox
                    checked={true}
                    onChange={handleDelete}
                    className="w-4 h-4"
                />
            </Table.Cell>
            <Table.Cell>{column}</Table.Cell>
            <Table.Cell>{column_def?.type || ''}</Table.Cell>
            <Table.Cell>{column_def?.comment || ''}</Table.Cell>
            <Table.Cell>{column_def?.ai_comment ?? ''}</Table.Cell>
        </Table.Row>
    )
}

const TableView = ({ col }: { col: SelectedColumn }) => {
    const { t } = useTranslation();
    const schema = useAppSelector(state => state.schema.schema);
    const totalColumns = useMemo(() => schema?.columns?.filter(c => c.table === col.table).length, [schema?.columns, col.table]);
    const table_def = useMemo(() => schema?.tables?.find(t => t.table === col.table), [schema?.tables, col.table]);
    const dispatch = useAppDispatch();
    const selectedColumns = useAppSelector(state => state.records.selectedColumns);
    const tableRef = useRef<HTMLDivElement>(null);
    const [allSelected, setAllSelected] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

    const availableColumns = useMemo(() => {
        if (!schema?.columns) return [];
        return schema.columns.filter(c => 
            c.table === col.table && 
            !col.columns.includes(c.column!)
        );
    }, [schema?.columns, col.table, col.columns]);

    const filteredColumns = useMemo(() => {
        if (!searchText) return [];
        return availableColumns.filter(c => 
            (c.column?.toLowerCase().includes(searchText.toLowerCase()) ||
            (c.column && fuzzyMatch(searchText, c.column)) ||
            (c.comment && fuzzyMatch(searchText, c.comment)))
        );
    }, [availableColumns, searchText]);

    const handleColumnAdd = useCallback((columnName: string) => {
        const updatedColumns = selectedColumns.map(column => {
            if (column.table === col.table) {
                return {
                    ...column,
                    columns: [...column.columns, columnName]
                };
            }
            return column;
        });
        dispatch(setSelectedColumns(updatedColumns));
        setSearchText('');
        setIsSearchDropdownOpen(false);
    }, [col.table, dispatch, selectedColumns]);

    const handleEdit = useCallback(() => {
        dispatch(setEditTable(col.table));
        dispatch(setShowEditModal(true));
    }, [col.table]);

    const handleDelete = useCallback(() => {
        const updatedColumns = selectedColumns.filter(
            column => column.table !== col.table
        );
        dispatch(setSelectedColumns(updatedColumns));
    }, [col.table, dispatch, selectedColumns]);

    const handleSelectAll = useCallback((checked: boolean) => {
        setAllSelected(checked);
        const updatedColumns = selectedColumns.map(column => {
            if (column.table === col.table) {
                return {
                    ...column,
                    columns: checked ? schema?.columns?.filter(c => c.table === col.table).map(c => c.column!) || [] : []
                };
            }
            return column;
        });
        dispatch(setSelectedColumns(updatedColumns));
    }, [col.table, schema?.columns, dispatch, selectedColumns]);

    return <div
        ref={tableRef}
        className="mb-2 border border-gray-200 rounded-lg p-4 shadow-sm"
    >
        <div className="mb-2 relative">
            <div className="flex items-center gap-2">
                <Tooltip content={t('ddlRefs.viewTableStructure')}>
                    <div className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => {
                        dispatch(setAICommentTable(col.table))
                        dispatch(setShowAICommentModal(true))
                    }}>{col.table}</div>
                </Tooltip>
                <div className="flex items-center gap-1">
                    <div className="text-sm text-gray-500">{table_def?.comment || ''}</div>
                    <div className="text-sm text-gray-500">{table_def?.ai_comment ?? ''}</div>
                    <div className="text-sm text-gray-500">
                        <span className="text-cyan-600 font-mono">{col.columns.length}</span>/<span className="font-mono">{totalColumns}</span> {t('ddlRefs.columns')}
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 z-10 flex items-center gap-2 bg-white px-3 py-2">
                <button className="text-gray-500 hover:text-blue-500 transition-colors" onClick={handleEdit}>
                    <HiPencil className="h-5 w-5" />
                </button>
                <button
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    onClick={handleDelete}
                >
                    <HiTrash className="h-5 w-5" />
                </button>
            </div>
        </div>

        <div className="relative mb-2">
            <TextInput
                sizing="sm"
                icon={HiSearch}
                placeholder={t('ddlRefsModal.searchColumns')}
                value={searchText}
                onChange={(e) => {
                    setSearchText(e.target.value);
                    setIsSearchDropdownOpen(true);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onBlur={() => {
                    setTimeout(() => setIsSearchDropdownOpen(false), 200);
                }}
            />
            {isSearchDropdownOpen && filteredColumns.length > 0 && (
                <div className="absolute w-full z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-1">
                        {filteredColumns.map((column) => (
                            <li
                                key={column.column}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between group"
                                onClick={() => handleColumnAdd(column.column!)}
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                    {column.column}
                                </span>
                                <span className="text-xs text-gray-500 group-hover:text-gray-700">
                                    {column.comment || ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="mt-2">
            <Table theme={{
                root: {
                    base: "w-full text-left text-sm text-gray-500 dark:text-gray-400",
                    shadow: "shadow-none"
                },
                body: {
                    base: "divide-y divide-gray-200 dark:divide-gray-700",
                    //@ts-ignore
                    cell: "p-3"
                },
                head: {
                    base: "bg-gray-50 dark:bg-gray-700",
                    //@ts-ignore
                    cell: "p-3 text-xs font-medium text-gray-700 dark:text-gray-400"
                }
            }}>
                <Table.Head>
                    <Table.HeadCell className="w-12">
                        <Checkbox
                            checked={allSelected}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                    </Table.HeadCell>
                    <Table.HeadCell>{t('ddlRefs.columnName')}</Table.HeadCell>
                    <Table.HeadCell>{t('ddlRefs.type')}</Table.HeadCell>
                    <Table.HeadCell>{t('ddlRefs.comment')}</Table.HeadCell>
                    <Table.HeadCell>{t('ddlRefs.aiComment')}</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                    {col.columns.length > 0 ? (
                        col.columns.map((column) => (
                            <ColumnView key={column} column={column} table={col.table} />
                        ))
                    ) : (
                        <Table.Row>
                            <Table.Cell colSpan={5} className="text-center text-gray-500 py-2 text-sm italic">
                                {t('ddlRefs.noColumnsSelected')}
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </div>
    </div>
}

const TableSearch = () => {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const schema = useAppSelector(state => state.schema.schema);
    const selectedColumns = useAppSelector(state => state.records.selectedColumns);
    const dispatch = useAppDispatch();

    // Filter tables based on search text and disabled status
    const filteredTables = useMemo(() => {
        if (!searchText || !schema?.tables) return [];
        return schema.tables.filter(table =>
            // Filter out disabled tables
            !table.disabled &&
            // Filter by search text
            (table.table?.toLowerCase().includes(searchText.toLowerCase()) ||
            (table.table && fuzzyMatch(searchText, table.table))) &&
            // Filter out already selected tables
            !selectedColumns.some(col => col.table === table.table)
        );
    }, [searchText, schema?.tables, selectedColumns]);

    const handleTableSelect = (tableName: string) => {
        // Get all columns for the selected table
        const tableColumns = (schema?.columns
            ?.filter(col => col.table === tableName)
            .map(col => col.column) || []) as string[];

        const newSelectedColumn: SelectedColumn = {
            table: tableName,
            columns: tableColumns
        };

        dispatch(setSelectedColumns([...selectedColumns, newSelectedColumn]));
        setSearchText('');
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative mb-1">
            <TextInput
                className="w-full"
                sizing="sm"
                placeholder={t('ddlRefs.searchTable')}
                icon={HiSearch}
                value={searchText}
                onChange={(e) => {
                    setSearchText(e.target.value);
                    setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => {
                    // Delay closing dropdown to allow clicking options
                    setTimeout(() => setIsDropdownOpen(false), 200);
                }}
            />
            {isDropdownOpen && filteredTables.length > 0 && (
                <div className="absolute w-full z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-1">
                        {filteredTables.map((table) => (
                            <li
                                key={table.table}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between group"
                                onClick={() => handleTableSelect(table.table!)}
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                    {table.table}
                                </span>
                                <span className="text-xs text-gray-500 group-hover:text-gray-700">
                                    {table.comment || ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const DDLRefs = () => {
    const selectedColumns = useAppSelector(state => state.records.selectedColumns)

    return (
        <div className="p-1 min-h-[250px]">
            <TableSearch />
            
            {selectedColumns.map(col => (<TableView key={col.table} col={col} />))}
            <DDLRefsModal />
        </div>
    )
}

export default DDLRefs