import { Button, Label, Modal, Table, Textarea, ToggleSwitch, TextInput, Pagination, Select } from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import { DefinitionRule } from '@/api-docs'
import { toast } from 'react-toastify'
import { HiOutlineTrash, HiPlus, HiPencil } from 'react-icons/hi'
import ReactMarkdown from 'react-markdown'
import { mainApi } from '@/App'
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import useTask from '@/hooks/useTask'

export function RuleList() {
    const { t } = useTranslation();
    const [rules, setRules] = useState<DefinitionRule[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [newRuleName, setNewRuleName] = useState('')
    const [newRuleContent, setNewRuleContent] = useState('')
    const [editingRule, setEditingRule] = useState<DefinitionRule | null>(null)
    const [defSelected, setDefSelected] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const projectId = useAppSelector(state => state.app.projectId);
    const [disabled, setDisabled] = useState(false)
    const { refreshSchema } = useTask()

    // Load rule list
    const loadRules = useCallback(async () => {
        try {
            const response = await mainApi.mainRuleDefinitionsGet(projectId, currentPage, pageSize)
            setRules(response.data.items || [])
            setTotalPages(Math.ceil((response.data.total || 0) / pageSize))
        } catch (error) {
            toast.error(t('rules.loadFailed'))
        }
    }, [currentPage, pageSize, projectId, t])

    // Initial load
    useEffect(() => {
        loadRules()
    }, [loadRules])

    // Add rule
    const handleAdd = async () => {
        if (!newRuleName.trim() || !newRuleContent.trim()) {
            toast.error(t('rules.inputRequired'))
            return
        }

        try {
            await mainApi.mainAddRuleDefinitionPost({
                project_id: projectId,
                name: newRuleName,
                content: newRuleContent,
                def_selected: defSelected,
                disabled: disabled
            })
            toast.success(t('rules.addSuccess'))
            setShowAddModal(false)
            setNewRuleName('')
            setNewRuleContent('')
            setDefSelected(false)
            loadRules()
            refreshSchema()
        } catch (error) {
            toast.error(t('rules.addFailed'))
        }
    }

    // Open edit modal
    const handleEdit = (rule: DefinitionRule) => {
        setEditingRule(rule)
        setDefSelected(rule.def_selected || false)
        setDisabled(rule.disabled || false)
        setShowEditModal(true)
    }

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingRule || !editingRule.name?.trim() || !editingRule.content?.trim()) {
            toast.error(t('rules.inputRequired'))
            return
        }

        try {
            await mainApi.mainUpdateRuleDefinitionPut({
                id: editingRule.id,
                name: editingRule.name!,
                content: editingRule.content!,
                def_selected: defSelected,
                disabled: disabled
            })
            toast.success(t('rules.updateSuccess'))
            setShowEditModal(false)
            setEditingRule(null)
            setDefSelected(false)
            loadRules()
            refreshSchema()
        } catch (error) {
            toast.error(t('rules.updateFailed'))
        }
    }

    // Delete rule
    const handleDelete = async (id: number) => {
        try {
            await mainApi.mainDeleteRuleDefinitionDelete({
                id
            })
            toast.success(t('rules.deleteSuccess'))
            loadRules()
            refreshSchema()
        } catch (error) {
            toast.error(t('rules.deleteFailed'))
        }
    }

    // Add page change processing function
    const onPageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Add page size change processing function
    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('rules.title')}</h2>
                <Button onClick={() => {
                    setShowAddModal(true)
                    setNewRuleName('')
                    setNewRuleContent('')
                    setDefSelected(false)
                    setDisabled(false)
                }}>
                    <HiPlus className="mr-2 h-5 w-5" />
                    {t('rules.add')}
                </Button>
            </div>

            <Table>
                <Table.Head>
                    <Table.HeadCell>ID</Table.HeadCell>
                    <Table.HeadCell>{t('rules.name')}</Table.HeadCell>
                    <Table.HeadCell>{t('rules.content')}</Table.HeadCell>
                    <Table.HeadCell>{t('rules.defaultSelected')}</Table.HeadCell>
                    <Table.HeadCell>{t('rules.disabled')}</Table.HeadCell>
                    <Table.HeadCell>{t('common.edit')}</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                    {rules.map((rule) => (
                        <Table.Row key={rule.id} className="bg-white">
                            <Table.Cell>{rule.id}</Table.Cell>
                            <Table.Cell>{rule.name}</Table.Cell>
                            <Table.Cell>
                                <ReactMarkdown className="prose prose-sm prose-slate">{rule.content}</ReactMarkdown>
                            </Table.Cell>
                            <Table.Cell>
                                <span className={rule.def_selected ? 'text-green-500 font-medium' : ''}>
                                    {rule.def_selected ? t('common.yes') : t('common.no')}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <span className={rule.disabled ? 'text-red-500 font-medium' : ''}>
                                    {rule.disabled ? t('common.yes') : t('common.no')}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2">
                                    <Button
                                        color="info"
                                        size="sm"
                                        onClick={() => handleEdit(rule)}
                                        className="flex-shrink-0"
                                    >
                                        <HiPencil className="mr-2 h-4 w-4" />
                                        {t('common.edit')}
                                    </Button>
                                    <Button
                                        color="failure"
                                        size="sm"
                                        onClick={() => handleDelete(rule.id!)}
                                        className="flex-shrink-0"
                                    >
                                        <HiOutlineTrash className="mr-2 h-4 w-4" />
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>

            {/* Add pagination component after the table */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="pageSize" value={t('docs.perPage')} />
                    <Select
                        id="pageSize"
                        value={pageSize.toString()}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className="w-20"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </Select>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    showIcons
                />
            </div>

            {/* Add rule modal */}
            <Modal show={showAddModal} onClose={() => {
                setShowAddModal(false)
                setNewRuleName('')
                setNewRuleContent('')
                setDefSelected(false)
                setDisabled(false)
            }} dismissible>
                <Modal.Header>{t('rules.add')}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="ruleName" value={t('rules.name')} />
                            </div>
                            <TextInput
                                id="ruleName"
                                value={newRuleName}
                                onChange={(e) => setNewRuleName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="ruleContent" value={t('rules.content')} />
                            </div>
                            <Textarea
                                id="ruleContent"
                                value={newRuleContent}
                                rows={10}
                                onChange={(e) => setNewRuleContent(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ToggleSwitch
                                id="rule-selected"
                                checked={defSelected}
                                onChange={setDefSelected}
                            />
                            <Label htmlFor="rule-selected" value={t('rules.defaultSelected')} />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ToggleSwitch
                                id="rule-disabled"
                                checked={disabled}
                                onChange={setDisabled}
                            />
                            <Label htmlFor="rule-disabled" value={t('rules.disabled')} />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleAdd}>{t('common.submit')}</Button>
                    <Button color="gray" onClick={() => setShowAddModal(false)}>
                        {t('common.cancel')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit rule modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} dismissible>
                <Modal.Header>{t('common.edit')}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="editRuleName" value={t('rules.name')} />
                            </div>
                            <Textarea
                                id="editRuleName"
                                value={editingRule?.name || ''}
                                rows={1}
                                onChange={(e) => setEditingRule(editingRule ? { ...editingRule, name: e.target.value } : null)}
                                required
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="editRuleContent" value={t('rules.content')} />
                            </div>
                            <Textarea
                                id="editRuleContent"
                                value={editingRule?.content || ''}
                                rows={10}
                                onChange={(e) => setEditingRule(editingRule ? { ...editingRule, content: e.target.value } : null)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ToggleSwitch
                                id="editRule-selected"
                                checked={defSelected}
                                onChange={setDefSelected}
                            />
                            <Label htmlFor="editRule-selected" value={t('rules.defaultSelected')} />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <ToggleSwitch
                                id="editRule-disabled"
                                checked={disabled}
                                onChange={setDisabled}
                            />
                            <Label htmlFor="editRule-disabled" value={t('rules.disabled')} />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleSaveEdit}>{t('common.submit')}</Button>
                    <Button color="gray" onClick={() => setShowEditModal(false)}>
                        {t('common.cancel')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
} 