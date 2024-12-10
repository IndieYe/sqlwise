import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GenerationRecords } from '@/components/records/GenerationRecords';
import { DDL } from '@/components/ddl/DDL';
import { DocList } from '@/components/docs/DocList';
import { RuleList } from '@/components/rules/RuleList';
import Settings from '@/components/settings/Settings';
import { AppSidebar } from '@/components/AppSidebar';
import AICommentModal from '@/components/records/refs/AICommentModal';
import useAppService from '@/hooks/useAppService';
import { Dropdown } from 'flowbite-react';
import { HiChevronDown } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { projectApi } from '@/App';
import { useAppSelector } from '@/store/hooks';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { DB_TYPE_LABELS, type DbType } from '@/consts';

export function ProjectLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = useAppSelector(state => state.app.projectId);
  const { t } = useTranslation();

  // Get project list
  const { data: projectList } = useRequest(async () => {
    const response = await projectApi.projectGet();
    return response.data.projects || [];
  });

  // Get current project information
  const { data: currentProject } = useRequest(async () => {
    if (projectId) {
      const response = await projectApi.projectIdGet(projectId);
      return response.data;
    }
    return null;
  }, {
    refreshDeps: [projectId]
  });

  // Services
  useAppService();

  if (!projectId) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">Loading...</div>
    </div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center h-10 border-b bg-gray-50 px-4">
        <div className="flex-1" />
        <Dropdown
          label={
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{currentProject?.name || t('project.loading', 'Loading...')}</span>
              <HiChevronDown className="h-4 w-4" />
            </div>
          }
          dismissOnClick={true}
          inline={true}
          arrowIcon={false}
        >
          {projectList?.map((project) => (
            <Dropdown.Item
              key={project.id}
              onClick={() => navigate(`/${project.id}${location.pathname.substring(location.pathname.indexOf('/', 1))}`, { replace: true })}
              className="text-sm"
            >
              <span>
                {project.name}
                {project.db_type && (
                  <span className="ml-2 text-gray-500">
                    {DB_TYPE_LABELS[project.db_type as DbType]} {project.db_version}
                  </span>
                )}
              </span>
            </Dropdown.Item>
          ))}
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => navigate('/')}>
            {t('project.backToList', 'Back to project list')}
          </Dropdown.Item>
        </Dropdown>
        <div className="flex-1 flex justify-end">
          <LanguageSwitcher />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-x-auto overflow-y-auto">
          <Routes>
            <Route path="records" element={<GenerationRecords />} />
            <Route path="ddls" element={<DDL />} />
            <Route path="docs" element={<DocList />} />
            <Route path="rules" element={<RuleList />} />
            <Route path="settings" element={<Settings />} />
            <Route path="" element={<Navigate to="records" replace />} />
          </Routes>
        </main>
        <AICommentModal />
      </div>
    </div>
  );
}