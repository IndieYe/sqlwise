import { Modal, Tabs } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { FileImportTab } from './FileImportTab';
import { QueryImportTab } from './QueryImportTab';

interface UploadDDLModalProps {
    show: boolean;
    onClose: () => void;
}

export function UploadDDLModal({ show, onClose }: UploadDDLModalProps) {
    const { t } = useTranslation();

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} dismissible>
            <Modal.Header>{t('ddl.uploadDDLFiles')}</Modal.Header>
            <Modal.Body>
                <Tabs>
                    <Tabs.Item active title={t('ddl.importMethods.fileImport')}>
                        <FileImportTab onClose={onClose} />
                    </Tabs.Item>
                    <Tabs.Item title={t('ddl.importMethods.queryImport')}>
                        <QueryImportTab onClose={onClose} />
                    </Tabs.Item>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
} 