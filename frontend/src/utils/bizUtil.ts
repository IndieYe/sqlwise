import { TaskColumnDTO } from "@/api-docs/api"
import { SelectedColumn } from "@/store/slices/recordsSlice"
import { Schema } from "@/api-docs"

export const getSelectedColumns = (columns: TaskColumnDTO[] | undefined, schema: Schema) => {
    const selectedColumns: SelectedColumn[] = []
    const tableMap = new Map<string, string[]>()

    // Group columns by table name
    columns?.forEach(column => {
        const tableName = column.table_name!
        const columnName = column.column_name!

        if (!tableMap.has(tableName)) {
            tableMap.set(tableName, [])
        }
        tableMap.get(tableName)!.push(columnName)
    })

    // Sort columns by schema.columns
    tableMap.forEach((columns, table) => {
        columns.sort((a, b) => schema!.columns!.findIndex(c => c.table === table && c.column === a) - schema!.columns!.findIndex(c => c.table === table && c.column === b))
    })

    // Convert map to selectedColumns array
    tableMap.forEach((columns, table) => {
        selectedColumns.push({
            table,
            columns
        })
    })

    return selectedColumns
}