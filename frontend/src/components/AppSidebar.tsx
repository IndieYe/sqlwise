import { Sidebar } from 'flowbite-react';
import { 
  HiOutlineDocumentText,
  HiOutlineDatabase,
  HiOutlineClipboardList,
  HiOutlineBookOpen,
  HiOutlineCog
} from 'react-icons/hi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentMenu } from '@/store/slices/appSlice';
import { twMerge } from 'tailwind-merge';
import { useHover } from 'ahooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
  const dispatch = useAppDispatch();
  const projectId = useAppSelector(state => state.app.projectId);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMenuClick = (menu: string) => {
    dispatch(setCurrentMenu(menu));
    navigate(`/${projectId}/${menu}`);
  };

  const isCollapsed = location.pathname.endsWith('/records');

  const hovered = useHover(document.querySelector('.my-sidebar'));

  return (
    <Sidebar 
      aria-label="Application Sidebar" 
      className={twMerge(
        "transition-all duration-300 my-sidebar",
        isCollapsed ? "w-16 group hover:w-48" : "w-48"
      )}
    >
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          {[
            { icon: HiOutlineClipboardList, text: t('project.records'), menu: 'records' },
            { icon: HiOutlineDatabase, text: t('project.ddl'), menu: 'ddls' },
            { icon: HiOutlineDocumentText, text: t('project.docs'), menu: 'docs' },
            { icon: HiOutlineBookOpen, text: t('project.rules'), menu: 'rules' },
            { icon: HiOutlineCog, text: t('project.settings'), menu: 'settings' }
          ].map(({ icon: Icon, text, menu }) => (
            <Sidebar.Item
              key={menu}
              icon={(!isCollapsed || hovered) ? Icon : undefined}
              active={location.pathname === `/${projectId}/${menu}`}
              onClick={() => handleMenuClick(menu)}
              className={twMerge(
                "flex my-sidebar-item cursor-pointer",
                isCollapsed ? "justify-center px-0 group-hover:justify-start group-hover:px-2" : ""
              )}
            >
              <span className="">
                {(!isCollapsed || hovered) ? text : <Icon className="w-6 h-6" />}
              </span>
            </Sidebar.Item>
          ))}
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
} 