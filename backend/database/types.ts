// ============================================================
// STEP 1: Define all query type variants
// ============================================================

// ----------------------
// WHERE Clause Builder
// ----------------------
export type WhereCondition = 
  | { type: 'equals'; field: string; value: any }
  | { type: 'in'; field: string; values: any[] }
  | { type: 'like'; field: string; value: string }
  | { type: 'null'; field: string; notNull: boolean }
  | { type: 'exists'; subquery: string; negate: boolean }
  | { type: 'and'; conditions: WhereCondition[] }
  | { type: 'or'; conditions: WhereCondition[] }
  | { type: 'raw'; sql: string }
  | { type: 'grater_then'; field: string; value: any };

export class WhereBuilder {
  private conditions: WhereCondition[] = [];

  equals(field: string, value: any): this {
    this.conditions.push({ type: 'equals', field, value });
    return this;
  }

  in(field: string, values: any[]): this {
    this.conditions.push({ type: 'in', field, values });
    return this;
  }

  and(conditions: WhereCondition[]): this {
    this.conditions.push({ type: 'and', conditions });
    return this;
  }

  or(conditions: WhereCondition[]): this {
    this.conditions.push({ type: 'or', conditions });
    return this;
  }

  exists(subquery: string, negate = false): this {
    this.conditions.push({ type: 'exists', subquery, negate });
    return this;
  }

  null(field: string, notNull = false): this {
    this.conditions.push({ type: 'null', field, notNull });
    return this;
  }
  
  raw(sql: string): this {
    this.conditions.push({ type: 'raw', sql });
    return this;
  }

  grater_then(field: string, value: any): this {
    this.conditions.push({ type: 'grater_then', field, value });
    return this;
  }
  
  build(): WhereCondition[] {
    return this.conditions;
  }

  isEmpty(): boolean {
    return this.conditions.length === 0;
  }

  reset(): void {
    this.conditions = []
  }
}

// ----------------------
// JOIN Clause
// ----------------------
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS' | '';

export type JoinClause = {
  type: JoinType;
  table: string;
  on: string;
};

// ----------------------
// ORDER BY Clause
// ----------------------
export type OrderByClause = {
  column: string;
  direction: 'ASC' | 'DESC';
};

// ----------------------
// CTE Clause
// ----------------------
export type CTEClause = {
  name: string;
  query: string;
};

// ----------------------
// Main Query Type (DISCRIMINATED UNION)
// ----------------------
export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export type BaseQuery = {
  table: string | undefined;
  ctes?: CTEClause[];
  where?: WhereBuilder;
  returning?: string[];
};

export type SelectQuery = BaseQuery & {
  type: 'SELECT';
  columns: string[];
  joins?: JoinClause[];
  groupBy?: string[];
  having?: WhereBuilder;
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
};

export type InsertQuery = BaseQuery & {
  type: 'INSERT';
  columns: string[];
  values: any[][];
};

export type UpdateQuery = BaseQuery & {
  type: 'UPDATE';
  set: Record<string, any>;
};

export type DeleteQuery = BaseQuery & {
  type: 'DELETE';
};

export type Query = SelectQuery | InsertQuery | UpdateQuery | DeleteQuery;

// ----------------------
// Build Output
// ----------------------
export type BuildResult = {
  sql: string;
  params: any[];
  paramTypes?: string[];
};