import { Textarea } from 'flowbite-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface QuestionSupplementProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const QuestionSupplement: FC<QuestionSupplementProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        {t('questionSupplement.title')}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('questionSupplement.placeholder')}
        disabled={disabled}
        rows={3}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
      />
    </div>
  );
};

export default QuestionSupplement; 