import { Dropdown } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { IoLanguageOutline } from 'react-icons/io5';
import { useAppDispatch } from '@/store/hooks';
import { setLanguage } from '@/store/slices/appSlice';
import { changeLanguage } from '@/i18n/i18n';

const languages = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en-US', name: 'English' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const handleLanguageChange = (langCode: string) => {
    dispatch(setLanguage(langCode));
    changeLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language)?.name || '中文';

  return (
    <Dropdown
      label={currentLanguage}
      dismissOnClick={true}
      renderTrigger={() => (
        <button
          className="inline-flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <IoLanguageOutline className="h-5 w-5" />
          <span>{currentLanguage}</span>
        </button>
      )}
    >
      {languages.map((lang) => (
        <Dropdown.Item
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={i18n.language === lang.code ? 'bg-gray-100 dark:bg-gray-600' : ''}
        >
          {lang.name}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );
};
