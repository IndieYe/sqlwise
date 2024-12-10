import { Button, Label, Modal, Table, Textarea, ToggleSwitch, Pagination, Select } from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import { DefinitionDoc } from '@/api-docs'
import { toast } from 'react-toastify'
import { HiOutlineTrash, HiPlus, HiPencil } from 'react-icons/hi'
import ReactMarkdown from 'react-markdown'
import { mainApi } from '@/App'
import { useAppSelector } from '@/store/hooks'
import { useTranslation } from 'react-i18next'

export function DocList() {
    const { t } = useTranslation()
    const projectId = useAppSelector(state => state.app.projectId)
    const [docs, setDocs] = useState<DefinitionDoc[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [newDoc, setNewDoc] = useState('')
    const [editingDoc, setEditingDoc] = useState<DefinitionDoc | null>(null)
    const [defSelected, setDefSelected] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [editDisabled, setEditDisabled] = useState(false)

    // Load document list
    const loadDocs = useCallback(async () => {
        try {
            const response = await mainApi.mainDocDefinitionsGet(projectId, currentPage, pageSize)
            setDocs(response.data.items || [])
            setTotalPages(Math.ceil((response.data.total || 0) / pageSize))
        } catch (error) {
            toast.error(t('docs.loadFailed'))
        }
    }, [currentPage, pageSize, projectId, t])

    // Initial load
    useEffect(() => {
        loadDocs()
    }, [loadDocs, currentPage])

    // Add document
    const handleAdd = async () => {
        if (!newDoc.trim()) {
            toast.error(t('docs.inputRequired'))
            return
        }

        try {
            await mainApi.mainDocDefinitionPost({
                project_id: projectId,
                def_doc: newDoc,
                def_selected: defSelected,
                disabled: editDisabled,
            })
            toast.success(t('docs.addSuccess'))
            setShowAddModal(false)
            setNewDoc('')
            loadDocs()
        } catch (error) {
            toast.error(t('docs.addFailed'))
        }
    }

    // Open edit modal
    const handleEdit = (doc: DefinitionDoc) => {
        setEditingDoc(doc)
        setShowEditModal(true)
        setDefSelected(doc.def_selected || false)
        setEditDisabled(doc.disabled || false)
    }

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingDoc || !editingDoc.def_doc.trim()) {
            toast.error(t('docs.inputRequired'))
            return
        }

        try {
            await mainApi.mainDocDefinitionPut({
                id: editingDoc.id!,
                def_doc: editingDoc.def_doc,
                def_selected: defSelected,
                disabled: editDisabled,
            })
            toast.success(t('docs.updateSuccess'))
            setShowEditModal(false)
            setEditingDoc(null)
            loadDocs()
        } catch (error) {
            toast.error(t('docs.updateFailed'))
        }
    }

    // Delete document
    const handleDelete = async (id: number) => {
        try {
            await mainApi.mainDeleteDocDefinitionDelete({
                id
            })
            toast.success(t('docs.deleteSuccess'))
            loadDocs()
        } catch (error) {
            toast.error(t('docs.deleteFailed'))
        }
    }

    // Handle page change
    const onPageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Handle page size change
    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('docs.title')}</h2>
                <Button onClick={() => {
                    setNewDoc('')
                    setDefSelected(false)
                    setEditDisabled(false)
                    setShowAddModal(true)
                }}>
                    <HiPlus className="mr-2 h-5 w-5" />
                    {t('docs.add')}
                </Button>
            </div>

            <Table>
                <Table.Head>
                    <Table.HeadCell>ID</Table.HeadCell>
                    <Table.HeadCell>{t('docs.content')}</Table.HeadCell>
                    <Table.HeadCell>{t('docs.defaultSelected')}</Table.HeadCell>
                    <Table.HeadCell>{t('docs.disabled')}</Table.HeadCell>
                    <Table.HeadCell>{t('common.edit')}</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                    {docs.map((doc) => (
                        <Table.Row key={doc.id} className="bg-white">
                            <Table.Cell>{doc.id}</Table.Cell>
                            <Table.Cell>
                                <ReactMarkdown className="prose prose-sm prose-slate">{doc.def_doc}</ReactMarkdown>
                            </Table.Cell>
                            <Table.Cell>
                                <span className={doc.def_selected ? 'text-green-500 font-medium' : ''}>
                                    {doc.def_selected ? t('common.yes') : t('common.no')}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <span className={doc.disabled ? 'text-red-500 font-medium' : ''}>
                                    {doc.disabled ? t('common.yes') : t('common.no')}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2">
                                    <Button
                                        color="info"
                                        size="sm"
                                        onClick={() => handleEdit(doc)}
                                    >
                                        <HiPencil className="mr-2 h-4 w-4" />
                                        {t('common.edit')}
                                    </Button>
                                    <Button
                                        color="failure"
                                        size="sm"
                                        onClick={() => handleDelete(doc.id!)}
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

            {/* Add document modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} dismissible>
                <Modal.Header>{t('docs.add')}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div>
                            <div className="mb-3">
                                <Label htmlFor="doc" value={t('docs.content')} className="text-lg font-medium" />
                            </div>
                            <Textarea
                                id="doc"
                                value={newDoc}
                                rows={10}
                                onChange={(e) => setNewDoc(e.target.value)}
                                required
                                className="mb-3 w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex items-center gap-2">
                                <ToggleSwitch
                                    id="doc-selected"
                                    checked={defSelected}
                                    onChange={setDefSelected}
                                />
                                <label htmlFor="doc-selected" className="text-gray-700">{t('docs.defaultSelected')}</label>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <ToggleSwitch
                                    id="doc-disabled"
                                    checked={editDisabled}
                                    onChange={setEditDisabled}
                                />
                                <label htmlFor="doc-disabled" className="text-gray-700">{t('docs.disabled')}</label>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex gap-3">
                        <Button onClick={handleAdd} className="px-5">{t('common.submit')}</Button>
                        <Button color="gray" onClick={() => setShowAddModal(false)} className="px-5">
                            {t('common.cancel')}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Edit document modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} dismissible>
                <Modal.Header>{t('docs.edit')}</Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div>
                            <div className="mb-3">
                                <Label htmlFor="editDoc" value={t('docs.content')} className="text-lg font-medium" />
                            </div>
                            <Textarea
                                id="editDoc"
                                value={editingDoc?.def_doc || ''}
                                rows={10}
                                onChange={(e) => setEditingDoc(editingDoc ? {...editingDoc, def_doc: e.target.value} : null)}
                                required
                                className="mb-3 w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex items-center gap-2">
                                <ToggleSwitch
                                    id="editDoc-selected"
                                    checked={defSelected}
                                    onChange={setDefSelected}
                                />
                                <label htmlFor="editDoc-selected" className="text-gray-700">{t('docs.defaultSelected')}</label>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <ToggleSwitch
                                    id="editDoc-disabled"
                                    checked={editDisabled}
                                    onChange={setEditDisabled}
                                />
                                <label htmlFor="editDoc-disabled" className="text-gray-700">{t('docs.disabled')}</label>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="flex gap-3">
                        <Button onClick={handleSaveEdit} className="px-5">{t('common.submit')}</Button>
                        <Button color="gray" onClick={() => setShowEditModal(false)} className="px-5">
                            {t('common.cancel')}
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    )
} 