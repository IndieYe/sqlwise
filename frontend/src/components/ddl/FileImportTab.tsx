import { Button } from 'flowbite-react';
import { HiUpload, HiDownload } from 'react-icons/hi';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { mainApi } from '@/App';
import useTask from '@/hooks/useTask';
import { useAppSelector } from '@/store/hooks';

interface FileImportTabProps {
    onClose: () => void;
}

export function FileImportTab({ onClose }: FileImportTabProps) {
    const { t } = useTranslation();
    const [selectedTableFile, setSelectedTableFile] = useState<File | null>(null);
    const [selectedColumnFile, setSelectedColumnFile] = useState<File | null>(null);
    const { refreshSchema } = useTask();
    const projectId = useAppSelector(state => state.app.projectId);

    const handleTableFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedTableFile(event.target.files[0]);
        }
    };

    const handleColumnFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedColumnFile(event.target.files[0]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.currentTarget.classList.add('border-blue-500');
    };

    const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('border-blue-500');
    };

    const handleTableDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('border-blue-500');
        
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'text/csv') {
                setSelectedTableFile(file);
            } else {
                toast.error(t('ddl.onlySupportCSV'));
            }
        }
    };

    const handleColumnDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.currentTarget.classList.remove('border-blue-500');
        
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'text/csv') {
                setSelectedColumnFile(file);
            } else {
                toast.error(t('ddl.onlySupportCSV'));
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedTableFile || !selectedColumnFile) {
            toast.error(t('ddl.selectBothFiles'));
            return;
        }

        try {
            await mainApi.mainUpdateDDLPost(projectId, selectedTableFile, selectedColumnFile);
            toast.success(t('ddl.uploadSuccess'));
            refreshSchema();
            onClose();
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data?.message || t('common.invalidParams');
                toast.error(t('ddl.uploadFailed') + ': ' + errorMessage);
            } else {
                toast.error(t('ddl.uploadFailed') + ': ' + (error.message || t('common.unknownError')));
            }
        }
    };

    const downloadTemplate = (type: 'tables' | 'columns') => {
        const link = document.createElement('a');
        link.href = `/${type}_template.csv`;
        link.download = `${type}_template.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center w-full gap-2">
                <label 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleTableDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <HiUpload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{t('ddl.clickToUpload')}</span> {t('ddl.orDragTableFile')}
                        </p>
                        <p className="text-xs text-gray-500">{t('ddl.supportCSV')}</p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".csv"
                        onChange={handleTableFileChange}
                    />
                </label>
                <button
                    type="button"
                    onClick={() => downloadTemplate('tables')}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                    <HiDownload className="w-4 h-4 mr-1" />
                    {t('ddl.downloadTemplate')}
                </button>
            </div>
            {selectedTableFile && (
                <p className="text-sm text-gray-500">
                    {t('ddl.selectedTableFile')}: {selectedTableFile.name}
                </p>
            )}

            <div className="flex flex-col items-center justify-center w-full gap-2">
                <label 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleColumnDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <HiUpload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{t('ddl.clickToUpload')}</span> {t('ddl.orDragColumnFile')}
                        </p>
                        <p className="text-xs text-gray-500">{t('ddl.supportCSV')}</p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept=".csv"
                        onChange={handleColumnFileChange}
                    />
                </label>
                <button
                    type="button"
                    onClick={() => downloadTemplate('columns')}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                    <HiDownload className="w-4 h-4 mr-1" />
                    {t('ddl.downloadTemplate')}
                </button>
            </div>
            {selectedColumnFile && (
                <p className="text-sm text-gray-500">
                    {t('ddl.selectedColumnFile')}: {selectedColumnFile.name}
                </p>
            )}
            
            <div className="flex justify-center">
                <Button 
                    onClick={handleUpload}
                    disabled={!selectedTableFile || !selectedColumnFile}
                >
                    {t('common.upload')}
                </Button>
            </div>
        </div>
    );
} 