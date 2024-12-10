import { Button, Checkbox, Tooltip } from "flowbite-react";
import { Modal, Table, TextInput } from "flowbite-react";
import { useEffect, useMemo } from "react";
import { useRef } from "react";
import { mergeEnvData } from "@/store/slices/appSlice";
import { setShowEditModal, setSelectedColumns } from "@/store/slices/recordsSlice";
import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { HiSearch, HiEye, HiEyeOff } from "react-icons/hi";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { fuzzyMatch } from "@/utils/stringUtils";
import './DDLRefsModal.css';
import { useTranslation } from 'react-i18next';

// Edit table modal - displays all columns and allows column selection
const DDLRefsModal = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const showEditModal = useAppSelector(state => state.records.showEditModal);
    const schema = useAppSelector(state => state.schema.schema);
    const selectedColumns = useAppSelector(state => state.records.selectedColumns);
    const editTable = useAppSelector(state => state.records.editTable);
    const [searchText, setSearchText] = useState('');
    const [tempSelectedColumns, setTempSelectedColumns] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const envData = useAppSelector(state => state.app.envData);
    const [showAll, setShowAll] = useState(true);

    // Get all columns of the current editing table
    const allColumns = useMemo(() => {
        if (!editTable || !schema?.columns) return [];
        return schema.columns.filter(col => col.table === editTable);
    }, [schema?.columns, editTable]);

    // Filtered columns based on search text
    const filteredColumns = useMemo(() => {
        let columns = !searchText ? allColumns : allColumns.filter(col =>
            fuzzyMatch(searchText, col.column || '') ||
            fuzzyMatch(searchText, col.comment || '')
        );

        // If not showing all, only display selected columns
        if (!showAll) {
            columns = columns.filter(col => tempSelectedColumns.includes(col.column!));
        }

        return columns;
    }, [allColumns, searchText, showAll, tempSelectedColumns]);

    // Initialize temporary selected state
    useEffect(() => {
        if (showEditModal) {
            const currentColumns = selectedColumns.find(col => col.table === editTable)?.columns || [];
            setTempSelectedColumns(currentColumns);
            // Focus search input when modal is shown
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [editTable, selectedColumns, showEditModal]);

    // Handle column selection toggle
    const handleColumnToggle = (columnName: string) => {
        setTempSelectedColumns(prev => {
            if (prev.includes(columnName)) {
                return prev.filter(c => c !== columnName);
            } else {
                return [...prev, columnName];
            }
        });
    };

    // Handle select all / deselect all
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setTempSelectedColumns(filteredColumns.map(col => col.column!));
        } else {
            setTempSelectedColumns([]);
        }
    };

    const handleClose = () => {
        dispatch(setShowEditModal(false));
    };

    const handleConfirm = () => {
        const updatedColumns = selectedColumns.map(col => {
            if (col.table === editTable) {
                return {
                    ...col,
                    columns: tempSelectedColumns
                };
            }
            return col;
        });
        dispatch(setSelectedColumns(updatedColumns));
        handleClose();
    };

    return (
        <Modal
            show={showEditModal}
            onClose={handleClose}
            dismissible
            size="4xl"
            position="top-center"
        >
            <Modal.Header>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <span>{editTable}</span>
                        <Tooltip content={t('ddlRefsModal.quickSelectTooltip')}>
                            <div className="flex items-center">
                                <Checkbox
                                    id="quickSelect"
                                    className="mr-2"
                                    checked={envData.quickSelect}
                                    onChange={(e) => dispatch(mergeEnvData({quickSelect: e.target.checked}))}
                                />
                                <label htmlFor="quickSelect" className="text-sm text-gray-700">
                                    {t('ddlRefsModal.quickSelect')}
                                </label>
                            </div>
                        </Tooltip>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="flex items-center gap-2 text-cyan-700 hover:text-cyan-900"
                        >
                            {showAll ? (
                                <HiEye className="w-5 h-5" />
                            ) : (
                                <HiEyeOff className="w-5 h-5" />
                            )}
                            <span className="text-sm">
                                {showAll ? t('ddlRefsModal.showAll') : t('ddlRefsModal.showSelected')}
                            </span>
                        </button>
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="space-y-2">
                    <TextInput
                        ref={searchInputRef}
                        sizing="sm"
                        icon={HiSearch}
                        placeholder={t('ddlRefsModal.searchColumns')}
                        value={searchText}
                        autoFocus
                        onChange={e => setSearchText(e.target.value)}
                    />
                    <Table striped>
                        <Table.Head>
                            <Table.HeadCell className="w-12 py-2">
                                <Checkbox
                                    checked={tempSelectedColumns.length === filteredColumns.length && filteredColumns.length > 0}
                                    onChange={e => handleSelectAll(e.target.checked)}
                                />
                            </Table.HeadCell>
                            <Table.HeadCell className="py-2">{t('ddlRefsModal.columnName')}</Table.HeadCell>
                            <Table.HeadCell className="py-2">{t('ddlRefsModal.type')}</Table.HeadCell>
                            <Table.HeadCell className="py-2">{t('ddlRefsModal.comment')}</Table.HeadCell>
                            <Table.HeadCell className="py-2">{t('ddlRefsModal.aiComment')}</Table.HeadCell>
                        </Table.Head>
                        <Table.Body className="transition-all">
                            <TransitionGroup component={null}>
                                {filteredColumns.map((column) => (
                                    <CSSTransition
                                        key={column.column}
                                        timeout={300}
                                        classNames="table-row"
                                    >
                                        <Table.Row>
                                            <Table.Cell className="py-1">
                                                <Checkbox
                                                    checked={tempSelectedColumns.includes(column.column!)}
                                                    onChange={() => handleColumnToggle(column.column!)}
                                                    onMouseEnter={() => {
                                                        if (envData.quickSelect) {
                                                            handleColumnToggle(column.column!)
                                                        }
                                                    }}
                                                />
                                            </Table.Cell>
                                            <Table.Cell className="py-1">{column.column}</Table.Cell>
                                            <Table.Cell className="py-1">{column.type}</Table.Cell>
                                            <Table.Cell className="py-1">{column.comment || ''}</Table.Cell>
                                            <Table.Cell className="py-1">
                                                {column.ai_comment || ''}
                                            </Table.Cell>
                                        </Table.Row>
                                    </CSSTransition>
                                ))}
                            </TransitionGroup>
                        </Table.Body>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="flex justify-center w-full gap-2">
                    <Button onClick={handleConfirm}>
                        {t('ddlRefsModal.confirm')}
                    </Button>
                    <Button
                        color="gray"
                        onClick={handleClose}
                    >
                        {t('ddlRefsModal.cancel')}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default DDLRefsModal