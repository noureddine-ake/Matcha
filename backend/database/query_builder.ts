import { equal } from "node:assert";
import orm from "./orm.js";
import { Raw } from "./raw.js";
import { BuildResult, DeleteQuery, InsertQuery, JoinType, Query, SelectQuery, UpdateQuery, WhereBuilder } from "./types.js";

export class QueryBuilder {
    public query: Query | null;
    public whereBuilder: WhereBuilder;
    public havingBuilder: WhereBuilder;


    constructor() {
        this.query = null;
        this.whereBuilder = new WhereBuilder();
        this.havingBuilder = new WhereBuilder();
    };

    select(table: string, columns: (string | Raw)[]) {
        this.query = {
            type: 'SELECT',
            columns,
            table,
        }

        return this;
    }

    from(table: string) {
        if (this.query && this.query.type === 'SELECT') {
            this.query.table = table;
        }
        return this;
    }

    insert(table: string, data: Record<string, any>) {
        const columns = Object.keys(data);
        const values = Object.values(data);

        this.query = {
            type: 'INSERT',
            table,
            columns,
            values: [values]
        }


        return this;
    }

    insertMany(table: string, data: Record<string, any>[]): this {
        if (data.length === 0) return this;
        const columns = Object.keys(data[0]);
        const values = data.map(row => Object.values(row));

        this.query = {
            type: 'INSERT',
            table,
            columns,
            values
        };
        return this;
    }

    update(table: string, set: Record<string, any>) {
        this.query = {
            type: 'UPDATE',
            table,
            set,
        }

        return this;
    }

    delete(table: string): this {
        this.query = { table, type: 'DELETE' }

        return this;
    }

    values(values: any[]): this {
        if (this.query?.type === 'INSERT') {
            this.query.values.push(values)
        }
        return this;
    }

    returning(columns: string[]) {
        if (this.query) {
            this.query.returning = columns
        }

        return this;
    }

    // ===================
    // JOIN methods
    // ===================
    join(type: JoinType, table: string, on: string) {
        if (this.query && this.query.type === 'SELECT') {
            if (!this.query.joins) {
                this.query.joins = []
            }

            this.query.joins.push({ type, table, on })
        }
        return this;
    }

    innerJoin(table: string, on: string) {
        return this.join('INNER', table, on);
    }

    leftJoin(table: string, on: string) {
        return this.join('LEFT', table, on);
    }

    // ===================
    // WHERE methods
    // ===================
    where(field: string, value: any, type: '=' | '!=' | 'in' | 'null' | 'not null' | 'exists' | '>' | '<' = '=') {
        switch (type) {
            case '=':
                this.whereBuilder.equals(field, value);
                break;
            case '!=':
                this.whereBuilder.not_equals(field, value);
                break
            case 'in':
                this.whereBuilder.in(field, value);
                break;
            case 'null':
                this.whereBuilder.null(field, false);
                break;
            case 'not null':
                this.whereBuilder.null(field, true);
                break;
            case 'exists':
                this.whereBuilder.exists(field, value);
                break;
            case '>':
                this.whereBuilder.grater_then(field, value);
                break;
            case '<':
                this.whereBuilder.less_then(field, value);
                break;
        }
        return this;
    }

    whereAnd(conditions: Record<string, any>) {
        const condis = Object.entries(conditions).map(([field, value]: [field: string, value: any]) => ({
            type: 'equals' as const,
            field,
            value,
            equals: true,
        }));

        this.whereBuilder.and(condis)
        return this;
    }

    whereIn(field: string, values: any[]) {
        this.whereBuilder.in(field, values)
        return this;
    }

    whereNull(field: string, notNull: boolean) {
        this.whereBuilder.null(field, notNull)
        return this;
    }

    whereExists(subquery: string, negate: boolean) {
        this.whereBuilder.exists(subquery, negate)
        return this;
    }

    // ===================
    // GROUP BY & HAVING
    // ===================
    groupBy(...fields: string[]) {
        if (this.query && this.query.type === 'SELECT') {
            this.query.groupBy = fields
        }

        return this;
    }

    having(field: string, value: any) {
        if (this.query && this.query.type == 'SELECT')
            this.havingBuilder.equals(field, value);
        return this;
    }

    // ===================
    // ORDER & Pagination
    // ===================
    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
        if (this.query && this.query.type == 'SELECT') {
            if (!this.query.orderBy) { this.query.orderBy = [] }
            this.query.orderBy?.push({ column, direction });
        }
        return this;
    }

    limit(n: number): this {
        if (this.query && this.query.type === 'SELECT') {
            this.query.limit = n;
        }
        return this;
    }

    offset(n: number): this {
        if (this.query && this.query.type === 'SELECT') {
            this.query.offset = n;
        }
        return this;
    }

    // ===================
    // CTE methods
    // ===================
    with(name: string, query: string): this {
        if (this.query) {
            if (!this.query.ctes) {
                this.query.ctes = [];
            }
            this.query.ctes.push({ name, query });
        }
        return this;
    }

    build(): BuildResult {
        if (!this.query)
            throw new Error('No query defined. Call select(), insert(), update(), or delete() first.')

        let ret: BuildResult;
        switch (this.query.type) {
            case 'SELECT':
                ret = this.buildSelect();
                this.reset();
                break;
            case 'UPDATE':
                ret = this.buildUpdate();
                this.reset();
                break;
            case 'INSERT':
                ret = this.buildInsert();
                this.reset();
                break;
            case 'DELETE':
                ret = this.buildDelete();
                this.reset();
                break;
            default: throw new Error('ouuups !!!');
        }

        return ret;
    }

    reset(): void {
        this.query = null;
        this.whereBuilder.reset();
        this.havingBuilder.reset();
    }

    private buildSelect(): BuildResult {
        const q = this.query as SelectQuery;
        const parts: string[] = [];
        const params: any[] = [];
        let paramIndex = 1

        // with (ctes);
        if (q.ctes && q.ctes.length > 0) {
            const allctes = q.ctes.map((cte) => {
                return `${cte.name} AS (${cte.query})`
            })
            parts.push(`WITH ${allctes.join(', ')}`);
        }

        // select
        if (q.columns && q.columns.length > 0) {
            const columnStrings = q.columns.map(col => {
                if (col instanceof Raw) {
                    return col.value;
                }
                return col;
            });
            parts.push(`SELECT ${columnStrings.join(', ')}`);
        }

        // from
        if (q.table) parts.push(`FROM ${q.table}`)

        // joins
        if (q.joins && q.joins.length > 0) {
            for (const join of q.joins) {
                parts.push(`${join.type} JOIN ${join.table} ON ${join.on}`)
            }
        }

        // where
        if (!this.whereBuilder.isEmpty()) {
            const wherecondString = this.buildWhereClause(this.whereBuilder, params, paramIndex)
            if (wherecondString) parts.push(`WHERE ${wherecondString}`);
        }


        // groupBy
        if (q.groupBy && q.groupBy.length > 0) {
            parts.push(`GROUP BY ${q.groupBy.join(', ')}`)
        }

        // having
        if (!this.havingBuilder.isEmpty()) {
            const havingcondString = this.buildWhereClause(this.havingBuilder, params, paramIndex)
            if (havingcondString) parts.push(`HAVING ${havingcondString}`);
        }


        // orderBy
        if (q.orderBy && q.orderBy.length > 0) {
            const orderStrings = q.orderBy.map(
                o => `${o.column} ${o.direction}`
            )
            parts.push(`ORDER BY ${orderStrings.join(', ')}`)
        }


        // limit
        if (q.limit != undefined) {
            parts.push(`LIMIT ${q.limit}`)
        }
        // offset
        if (q.offset != undefined) {
            parts.push(`OFFSET ${q.offset}`)
        }
        // returning
        if (q.returning && q.returning.length > 0) {
            parts.push(`RETURNING ${q.returning.join(', ')}`)
        }

        return {
            sql: parts.join('\n'),
            params
        }
    }

    private buildInsert(): BuildResult {
        const q = this.query as InsertQuery;
        const parts: string[] = [];
        const params: any[] = [];

        if (q.ctes && q.ctes.length > 0) {
            const cteStrings = q.ctes.map(cte => `${cte.name} AS (${cte.query})`);
            parts.push(`WITH ${cteStrings.join(', ')}`);
        }

        parts.push(`INSERT INTO ${q.table} (${q.columns.join(', ')})`);

        let paramCounter = 1;
        const valuePlaceholders = q.values.map((_, rowIdx) => {
            const placeholders = q.columns.map((_, colIdx) => {
                if (q.values[rowIdx][colIdx] instanceof Raw) {
                    return (q.values[rowIdx][colIdx] as Raw).value;
                }
                return `$${paramCounter++}`;
            });
            return `(${placeholders.join(', ')})`;
        });
        parts.push(`VALUES ${valuePlaceholders.join(', ')}`);

        for (const row of q.values) {
            for (const value of row) {
                if (!(value instanceof Raw)) {
                    params.push(value);
                }
            }
        }

        if (q.returning && q.returning.length > 0) {
            parts.push(`RETURNING ${q.returning.join(', ')}`);
        }

        return {
            sql: parts.join('\n'),
            params
        };
    }

    private buildUpdate(): BuildResult {
        const q = this.query as UpdateQuery;
        const parts: string[] = [];
        const params: any[] = [];

        // UPDATE
        parts.push(`UPDATE ${q.table}`);

        // SET
        const setParts = Object.entries(q.set).map(([key], idx) => {
            const value = Object.values(q.set)[idx];
            if (value instanceof Raw) {
                return `${key} = ${value.value}`;
            }
            params.push(value);
            return `${key} = $${params.length}`;
        });
        parts.push(`SET ${setParts.join(', ')}`);

        // WHERE
        if (!this.whereBuilder.isEmpty()) {
            const whereSql = this.buildWhereClause(this.whereBuilder, params, params.length + 1);
            if (whereSql) {
                parts.push(`WHERE ${whereSql}`);
            }
        }

        // RETURNING
        if (q.returning && q.returning.length > 0) {
            parts.push(`RETURNING ${q.returning.join(', ')}`);
        }

        return {
            sql: parts.join('\n'),
            params
        };
    }

    private buildDelete(): BuildResult {
        const q = this.query as DeleteQuery;
        const parts: string[] = [];
        const params: any[] = [];

        // DELETE FROM
        parts.push(`DELETE FROM ${q.table}`);

        // WHERE
        if (!this.whereBuilder.isEmpty()) {
            const whereSql = this.buildWhereClause(this.whereBuilder, params, params.length + 1);
            if (whereSql) {
                parts.push(`WHERE ${whereSql}`);
            }
        }

        // RETURNING
        if (q.returning && q.returning.length > 0) {
            parts.push(`RETURNING ${q.returning.join(', ')}`);
        }

        return {
            sql: parts.join('\n'),
            params
        };
    }

    private buildWhereClause(builder: WhereBuilder, params: any[], startIndex: number): string {
        const conditions = builder.build();
        if (conditions.length == 0) {
            return ''
        }
        return conditions.map(cond => {
            switch (cond.type) {
                case 'equals':
                    params.push(cond.value);
                    return `${cond.field} ${cond.equals ? '=' : '!='} $${params.length}`;
                case 'in':
                    const placeholders = cond.values.map((_, idx) => {
                        params.push(cond.values[idx]);
                        return `$${params.length}`;
                    });
                    return `${cond.field} IN (${placeholders.join(', ')})`;
                case 'null':
                    return cond.notNull
                        ? `${cond.field} IS NOT NULL`
                        : `${cond.field} IS NULL`;
                case 'exists':
                    return cond.negate
                        ? `NOT EXISTS (${cond.subquery})`
                        : `EXISTS (${cond.subquery})`;
                case 'raw':
                    return cond.sql;
                case 'grater_then':
                    const value = cond.value;
                    if (value instanceof Raw) {
                        return `${cond.field} > ${value.value}`;
                    }
                    params.push(cond.value);
                    return `${cond.field} > $${params.length}`;
                case 'less_then':
                    const ltValue = cond.value;
                    if (ltValue instanceof Raw) {
                        return `${cond.field} < ${ltValue.value}`;
                    }
                    params.push(cond.value);
                    return `${cond.field} < $${params.length}`;
                default:
                    return '';
            }
        }).join(' AND ');
    }

    toString(): string {
        return this.build().sql;
    }

    toParams(): any[] {
        return this.build().params;
    }

    run() {
        const ret = this.build()
        return orm.run(ret.sql, ret.params)
    }
}
