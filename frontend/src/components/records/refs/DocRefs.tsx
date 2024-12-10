import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { DefinitionDocQueryResultDTO } from "@/api-docs";
import ReactMarkdown from "react-markdown";
import { Card, TextInput, Button, Popover, Label, RangeSlider } from "flowbite-react";
import { HiSearch, HiX, HiViewGrid } from "react-icons/hi";
import { SelectedDoc, setEditingDocs } from "@/store/slices/recordsSlice";
import { useState } from "react";
import { mainApi } from "@/App";
import { toast } from "react-toastify";
import { useMemoizedFn } from "ahooks";
import { mergeEnvData } from "@/store/slices/appSlice";
import { useTranslation } from 'react-i18next';

const DocItem = ({ doc, onRemove }: { doc: SelectedDoc; onRemove: () => void }) => {
    const { t } = useTranslation();
    return (
        <Card className="mb-2 relative">
            <div className="h-full">
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    title={t('docRefs.delete')}
                >
                    <HiX className="w-4 h-4" />
                </button>
                <ReactMarkdown className="prose prose-sm prose-slate">
                    {doc.def_doc}
                </ReactMarkdown>
            </div>
        </Card>
    );
};

const LayoutPopover = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const envData = useAppSelector(state => state.app.envData);

    return (
        <Popover
            trigger="click"
            content={
                <div className="p-3 w-48">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="columns">{t('docRefs.displayColumns')}</Label>
                            <span className="text-sm text-gray-500">{envData.docDisplayColumns}</span>
                        </div>
                        <RangeSlider
                            id="columns"
                            min={1}
                            max={4}
                            value={envData.docDisplayColumns}
                            onChange={(e) => dispatch(mergeEnvData({ docDisplayColumns: Number(e.target.value) }))}
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

const DocSearch = () => {
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<DefinitionDocQueryResultDTO[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const editingDocs = useAppSelector(state => state.records.editingDocs);
    const dispatch = useAppDispatch();
    const projectId = useAppSelector(state => state.app.projectId);
    
    // Handle search
    const handleSearch = async () => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await mainApi.mainQueryDocDefinitionPost({
                project_id: projectId,
                query: searchText
            });

            const results = response.data.doc_definitions || [];
            setSearchResults(results);
            setIsDropdownOpen(true);
        } catch (error) {
            console.error('搜索文档失败:', error);
            toast.error(t('docRefs.searchFailed'));
        }
    };

    // Modify keyboard event handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isComposing) {
            handleSearch();
        }
    };

    const handleDocSelect = useMemoizedFn((doc: DefinitionDocQueryResultDTO) => {
        const exists = editingDocs.some(d => d.doc_id === doc.id);
        if (exists) {
            toast.info(t('docRefs.docAlreadyAdded'));
            return;
        }
        const newDocs = [...editingDocs, { doc_id: doc.id!, def_doc: doc.def_doc }];
        dispatch(setEditingDocs(newDocs));
        setSearchText('');
        setIsDropdownOpen(false);
    });

    return (
        <div className="relative mb-4">
            <div className="flex gap-2">
                <TextInput
                    className="w-full"
                    sizing="sm"
                    placeholder={t('docRefs.searchDocs')}
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
                        {searchResults.map((doc) => (
                            <li
                                key={doc.id}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                onClick={() => handleDocSelect(doc)}
                            >
                                <div className="text-sm text-gray-700 line-clamp-2">
                                    {doc.def_doc}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const DocRefs = () => {
    const editingDocs = useAppSelector(state => state.records.editingDocs);
    const envData = useAppSelector(state => state.app.envData);
    const dispatch = useAppDispatch();

    const handleRemoveDoc = (docId: string) => {
        const newDocs = editingDocs.filter(doc => "" + doc.doc_id !== docId);
        dispatch(setEditingDocs(newDocs));
    };

    return (
        <div className="space-y-4 p-1 min-h-[250px]">
            <DocSearch />

            <div className={`grid grid-cols-${envData.docDisplayColumns} gap-4`}>
                {editingDocs.map(doc => (
                    <DocItem
                        key={doc.doc_id}
                        doc={doc}
                        onRemove={() => handleRemoveDoc("" + doc.doc_id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default DocRefs;