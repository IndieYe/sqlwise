import { VectorSQL } from "@/api-docs"
import { mainApi } from "@/App"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { Card, TextInput, Button, Popover, Label, RangeSlider } from 'flowbite-react'
import { HiSearch, HiTrash, HiViewGrid } from "react-icons/hi"
import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import { mergeEnvData } from "@/store/slices/appSlice"
import { setEditingSqls } from "@/store/slices/recordsSlice"
import { useTranslation } from 'react-i18next'

interface SqlItemProps {
    question: string
    sql: string
    taskId: number
    onDelete: (taskId: number) => void
}

const SqlItem = ({ question, sql, taskId, onDelete }: SqlItemProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = useCallback(() => {
        setIsDeleting(true);
        setTimeout(() => {
            onDelete(taskId);
        }, 300);
    }, [taskId, onDelete]);

    return (
        <Card className={`mb-4 transition-all duration-300 ${
            isDeleting ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
        }`}>
            <div className="space-y-3 h-full flex flex-col justify-start">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {question}
                        </h5>
                    </div>
                    <button
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        onClick={handleDelete}
                    >
                        <HiTrash className="h-5 w-5" />
                    </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300">
                        {sql}
                    </pre>
                </div>
            </div>
        </Card>
    )
}

const LayoutPopover = () => {
    const dispatch = useAppDispatch();
    const envData = useAppSelector(state => state.app.envData);
    const { t } = useTranslation();
    
    return (
        <Popover
            trigger="click"
            content={
                <div className="p-3 w-48">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="columns">{t('sqlRefs.displayColumns')}</Label>
                            <span className="text-sm text-gray-500">{envData.sqlDisplayColumns}</span>
                        </div>
                        <RangeSlider
                            id="columns"
                            min={1}
                            max={4}
                            value={envData.sqlDisplayColumns}
                            onChange={(e) => dispatch(mergeEnvData({sqlDisplayColumns: Number(e.target.value)}))}
                        />
                    </div>
                </div>
            }
        >
            <Button size="sm" color="gray">
                <HiViewGrid className="h-4 w-4" />
            </Button>
        </Popover>
    );
};

const SqlSearch = () => {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<VectorSQL[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const editingSqls = useAppSelector(state => state.records.editingSqls);
    const dispatch = useAppDispatch();
    const projectId = useAppSelector(state => state.app.projectId);
    
    // Handle search
    const handleSearch = async () => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await mainApi.mainSearchSqlLogPost({
                project_id: projectId,
                content: searchText
            });
            
            const results = response.data.sqls
            
            setSearchResults(results || []);
            setIsDropdownOpen(true);
        } catch (error) {
            console.error('搜索SQL记录失败:', error);
            toast.error(t('sqlRefs.searchFailed'));
        }
    };

    // Modify keyboard event handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isComposing) {
            handleSearch();
        }
    };

    const handleSqlSelect = (result: VectorSQL) => {
        // Check if the same SQL already exists
        const exists = editingSqls.some(sql => sql.task_id === result.task_id);
        if (!exists) {
            dispatch(setEditingSqls([...editingSqls, result]));
        }
        setSearchText('');
        setIsDropdownOpen(false);
    };

    return (
        <div className="relative mb-4">
            <div className="flex gap-2">
                <TextInput
                    className="w-full"
                    sizing="sm"
                    placeholder={t('sqlRefs.searchSql')}
                    icon={HiSearch}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => {
                        setTimeout(() => setIsDropdownOpen(false), 200);
                    }}
                />
                <LayoutPopover />
            </div>
            
            {/* Dropdown to display search results */}
            {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute w-full z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <ul className="py-1">
                        {searchResults.map((result, index) => (
                            <li
                                key={index}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                onClick={() => handleSqlSelect(result)}
                            >
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-gray-700">
                                        {result.question}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {result.sql}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const SqlRefs = () => {
    const editingSqls = useAppSelector(state => state.records.editingSqls);
    const envData = useAppSelector(state => state.app.envData);
    const dispatch = useAppDispatch();

    const handleDelete = useCallback((taskId: number) => {
        const updatedSqls = editingSqls.filter(sql => sql.task_id !== taskId);
        dispatch(setEditingSqls(updatedSqls));
    }, [editingSqls, dispatch]);

    return (
        <div className="space-y-4 p-1 min-h-[250px]">
            <SqlSearch />
            
            {editingSqls.length > 0 && (
                <div className={`grid grid-cols-${envData.sqlDisplayColumns} gap-4`}>
                    {editingSqls.map(sql => (
                        <SqlItem 
                            key={sql.task_id}
                            taskId={sql.task_id!}
                            question={sql.question || ''}
                            sql={sql.sql || ''}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default SqlRefs