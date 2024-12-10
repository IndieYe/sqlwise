import { useState } from 'react';
import { Card, Button, Modal, Label, TextInput, Textarea } from 'flowbite-react';
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi';
import { Project } from '@/api-docs';
import { toast } from 'react-toastify';
import { useRequest } from 'ahooks';
import { projectApi } from '@/App';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { DB_TYPES, DB_TYPE_LABELS, type DbType } from '@/consts';
import { setProjectId } from '@/store/slices/appSlice';
import { useAppDispatch } from '@/store/hooks';

export function ProjectList() {
  const dispatch = useAppDispatch()
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dbType, setDbType] = useState<DbType>(DB_TYPES.MYSQL);
  const [dbVersion, setDbVersion] = useState('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get project list
  const { data: projectList, refresh } = useRequest(async () => {
    const response = await projectApi.projectGet();
    return response.data.projects || [];
  });

  // Create project
  const handleCreate = async () => {
    try {
      await projectApi.projectPost({ 
        name, 
        description,
        db_type: dbType,
        db_version: dbVersion 
      });
      toast.success(t('projects.createSuccess'));
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setDbType(DB_TYPES.MYSQL);
      setDbVersion('');
      refresh();
    } catch (error) {
      toast.error(t('projects.createFail'));
    }
  };

  // Create example project
  const handleCreateExample = async () => {
    try {
      await projectApi.examplePost();
      toast.success(t('projects.createSuccess'));
      refresh();
    } catch (error) {
      toast.error(t('projects.createFail'));
    }
  };

  // Update project
  const handleUpdate = async () => {
    if (!currentProject?.id) return;
    try {
      await projectApi.projectIdPut(currentProject.id, { 
        name, 
        description,
        db_type: dbType || DB_TYPES.MYSQL,
        db_version: dbVersion 
      });
      toast.success(t('projects.updateSuccess'));
      setShowEditModal(false);
      refresh();
    } catch (error) {
      toast.error(t('projects.updateFail'));
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!currentProject?.id) return;
    try {
      await projectApi.projectIdDelete(currentProject.id);
      toast.success(t('projects.deleteSuccess'));
      setShowDeleteModal(false);
      refresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('projects.deleteFail');
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Project Logo" className="w-8 h-8" />
          <h1 className="text-2xl font-bold">{t('projects.title')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button color="gray" onClick={handleCreateExample}>
            <HiPlus className="mr-2 h-5 w-5" />
            {t('projects.createExample')}
          </Button>
          <Button onClick={() => {
            setName('');
            setDescription('');
            setDbType(DB_TYPES.MYSQL);
            setDbVersion('');
            setShowCreateModal(true);
          }}>
            <HiPlus className="mr-2 h-5 w-5" />
            {t('projects.create')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectList?.map((project: Project) => (
          <Card 
            key={project.id} 
            className="max-w-sm cursor-pointer"
            onClick={() => {
              dispatch(setProjectId(project.id!))
              navigate(`/${project.id}`)
            }}
          >
            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {project.name}
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              {project.description}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <div>{DB_TYPE_LABELS[project.db_type as DbType]} {project.db_version}</div>
            </div>
            <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                color="light"
                onClick={() => {
                  setCurrentProject(project);
                  setName(project.name || '');
                  setDescription(project.description || '');
                  setDbType((project.db_type as DbType) || DB_TYPES.MYSQL);
                  setDbVersion(project.db_version || '');
                  setShowEditModal(true);
                }}
              >
                <HiOutlinePencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                color="failure"
                onClick={() => {
                  setCurrentProject(project);
                  setDeleteConfirmName('');
                  setShowDeleteModal(true);
                }}
              >
                <HiOutlineTrash className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create project modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} dismissible>
        <Modal.Header>{t('projects.create')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('projects.name')}</Label>
              <TextInput
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">{t('projects.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="dbType">{t('projects.dbType')}</Label>
              <select
                id="dbType"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={dbType}
                onChange={(e) => setDbType(e.target.value as DbType)}
              >
                {Object.entries(DB_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dbVersion">{t('projects.dbVersion')}</Label>
              <TextInput
                id="dbVersion"
                value={dbVersion}
                onChange={(e) => setDbVersion(e.target.value)}
                placeholder={t('projects.dbVersionPlaceholder')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleCreate}>{t('common.submit')}</Button>
          <Button color="gray" onClick={() => setShowCreateModal(false)}>
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit project modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Header>{t('projects.edit')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('projects.name')}</Label>
              <TextInput
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('projects.description')}</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-dbType">{t('projects.dbType')}</Label>
              <select
                id="edit-dbType"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={dbType}
                onChange={(e) => setDbType(e.target.value as DbType)}
              >
                {Object.entries(DB_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-dbVersion">{t('projects.dbVersion')}</Label>
              <TextInput
                id="edit-dbVersion"
                value={dbVersion}
                onChange={(e) => setDbVersion(e.target.value)}
                placeholder={t('projects.dbVersionPlaceholder')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleUpdate}>{t('common.submit')}</Button>
          <Button color="gray" onClick={() => setShowEditModal(false)}>
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Header>{t('projects.delete')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p>{t('projects.deleteConfirm')}</p>
            <div>
              <Label htmlFor="delete-confirm">{t('projects.deleteNameConfirm')}</Label>
              <TextInput
                id="delete-confirm"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={t('projects.deleteNamePlaceholder')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="failure" 
            onClick={handleDelete}
            disabled={deleteConfirmName !== currentProject?.name}
          >
            {t('common.delete')}
          </Button>
          <Button color="gray" onClick={() => setShowDeleteModal(false)}>
            {t('common.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 