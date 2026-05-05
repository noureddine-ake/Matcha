import { Pool, QueryResult } from "pg";
import {
    ColumnAttributes,
    ColumnReference,
    ColumnsMap,
    DefaultValue,
    SQLFunction,
    TableConstraints
} from "./define_types.js";
import config from '../utils/config.js'
import format from 'pg-format';

const sqlFunctions = ["CURRENT_TIMESTAMP", "NOW()"] as const;

const defaultToSQL = (value: DefaultValue): string => {
    if (value === null)
        return "DEFAULT NULL";
    if (typeof value === "boolean")
        return value ? 'DEFAULT TRUE' : 'DEFAULT FALSE';
    if (typeof value === 'string' && !sqlFunctions.includes(value as SQLFunction))
        return `DEFAULT '${value}'`;
    if (typeof value === 'string')
        return `DEFAULT ${value}`;
    throw (new Error(`Unsupported default value: ${value}`))
}

const referenceToSQL = (value: ColumnReference): string => {
    const refTableColumn = `${value.table}(${value.column})`
    let attr = ["REFERENCES", refTableColumn]
    if (value.onDelete) attr.push("ON DELETE", value.onDelete)
    return attr.join(' ')
}

const getQueryAtt = (colName: string, colAtt: ColumnAttributes) => {

    if (!/^\w+$/.test(colName))
        throw new Error(`Invalid column name: "${colName}"`);

    if (!colAtt.type)
        throw new Error(`Column: "${colName} is missing type property"`);

    let parts = [colName, colAtt.type];

    if (colAtt.primaryKey) parts.push('PRIMARY KEY');
    if (colAtt.unique) parts.push('UNIQUE');
    if (colAtt.notNull) parts.push('NOT NULL');

    if (colAtt.default || typeof colAtt.default == 'boolean')
        parts.push(defaultToSQL(colAtt.default));

    if (colAtt.references) parts.push(referenceToSQL(colAtt.references));

    return parts.join(' ');
}

const ColumnsToQuery = (columns: ColumnsMap, constraints?: TableConstraints): string => {
    const column = Object.entries(columns);

    const columnsParts = column.map(([colName, colAtt]) => {
        try {
            const elemets = getQueryAtt(colName, colAtt);
            return elemets
        } catch (error) {
            throw error;
        }
    })

    if (constraints?.primaryKey) columnsParts.push(`PRIMARY KEY (${constraints.primaryKey.join(', ')})`);
    if (constraints?.unique) columnsParts.push(`UNIQUE (${constraints.unique.join(', ')})`);

    return columnsParts.join(', ');
}


// singletone class ORM (with database connection)
class ORM {
    private connection;

    constructor() {
        const data = {
            user: config.db_user,
            host: config.db_host,
            database: config.db_name,
            password: config.db_pwd,
            port: config.db_port,
        }

        this.connection = new Pool(data);
    }

    // Function to define a model for a table in the database
    public define = async (
        tableName: string,
        columns: ColumnsMap,
        constraints?: TableConstraints
    ): Promise<void> => {
        try {
            if (!columns) throw new Error(`Empty columns for table: ${tableName}`)

            const colQueryStr = ColumnsToQuery(columns, constraints)
            const query = format(
                'CREATE TABLE IF NOT EXISTS %I (%s)',
                tableName,
                colQueryStr
            )

            await this.connection?.query(query);
        } catch (error: unknown) {
            throw (error);
        }
    }

    public run = async (query: string, params: unknown[]): Promise<QueryResult<any> | null> => {
        try {
            if (query.trim().length) {
                const ret = await this.connection?.query(query, params);
                return ret;
            }
            return null;
        } catch (error: unknown) {
            throw (error)
        }
    }
}

export default new ORM();
