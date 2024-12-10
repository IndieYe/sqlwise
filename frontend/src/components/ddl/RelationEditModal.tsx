import { Button, Label, Modal, Select } from "flowbite-react";
import { useState, useEffect } from "react";
import { Schema, TableRelationDTO } from "@/api-docs";
import { useTranslation } from "react-i18next";

interface RelationEditModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (relation: TableRelationDTO) => void;
  currentTable: string;
  currentColumn: string;
  otherTable: string;
  otherColumn: string;
  relationType: string;
  schema?: Schema;
}

const RelationEditModal = ({
  show,
  onClose,
  onConfirm,
  currentTable,
  currentColumn,
  otherTable,
  otherColumn,
  relationType,
  schema
}: RelationEditModalProps) => {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState(otherTable);
  const [selectedColumn, setSelectedColumn] = useState(otherColumn);
  const [selectedRelationType, setSelectedRelationType] = useState(relationType);

  // Reset states when props change
  useEffect(() => {
    setSelectedTable(otherTable);
    setSelectedColumn(otherColumn);
    setSelectedRelationType(relationType);
  }, [otherTable, otherColumn, relationType]);

  // Get all table names (excluding current table)
  const tables = schema?.tables
    ?.map(t => t.table)
    .filter(t => t !== currentTable) || [];
  
  // Get all columns of the selected table
  const columns = schema?.columns
    ?.filter(col => col.table === selectedTable)
    .map(col => col.column) || [];

  const handleConfirm = () => {
    if (!selectedTable || !selectedColumn) {
      return; // Prevent empty submission
    }
    
    onConfirm({
      table1: currentTable,
      column1: currentColumn,
      table2: selectedTable,
      column2: selectedColumn,
      relation_type: selectedRelationType
    });
    onClose();
  };

  const isNewRelation = !otherColumn; // Check if in create mode

  return (
    <Modal show={show} onClose={onClose} dismissible>
      <Modal.Header>
        {isNewRelation ? t('ddl.addRelation') : t('ddl.editRelation')}
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <Label>{t('ddl.currentTable')}</Label>
            <div className="mt-1 font-mono">
              {currentTable}.{currentColumn}
            </div>
          </div>
          
          <div>
            <Label>{t('ddl.relatedTable')}</Label>
            <Select 
              className="mt-1"
              value={selectedTable}
              onChange={e => {
                setSelectedTable(e.target.value);
                setSelectedColumn('');
              }}
            >
              <option value="">{t('ddl.selectTable')}</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>{t('ddl.relatedColumn')}</Label>
            <Select
              className="mt-1"
              value={selectedColumn}
              onChange={e => setSelectedColumn(e.target.value)}
              disabled={!selectedTable}
            >
              <option value="">{t('ddl.selectColumn')}</option>
              {columns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>{t('ddl.relationType')}</Label>
            <Select
              className="mt-1"
              value={selectedRelationType}
              onChange={e => setSelectedRelationType(e.target.value)}
            >
              <option value="1-1">{t('ddl.oneToOne')}</option>
              <option value="1-n">{t('ddl.oneToMany')}</option>
              <option value="n-1">{t('ddl.manyToOne')}</option>
              <option value="n-n">{t('ddl.manyToMany')}</option>
            </Select>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedTable || !selectedColumn}
        >
          {t('common.submit')}
        </Button>
        <Button color="gray" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RelationEditModal; 