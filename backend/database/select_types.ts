
export type JoinTypes = 'LEFT' |  'RIGHT' | 'INNER';
export type Agregate = "COUNT" | "SUM" | "AVG" | "MAX" | "MIN";

export type JoinOptions = {
    type: JoinTypes
    on: string;
}

// export type WhereTypes = {

// }

export const withAgregate = (aggregat: Agregate, column: string) => {
    return `${aggregat}(${column})`
}

export type GroupByType = {
    
}

export type HavingType = {
    
}

export type OrderByType = {

}

export type OptionsTypes = {
    columns: string[];
    joins: JoinOptions[];
    where: string;
    groupBy: GroupByType;
    having: HavingType;
    orderBy: OrderByType;
    limit: Number;
    offset: number;
}

// ─── Table-Level Constraints (composite PKs, multi-col UNIQUE) ───────────────

export type TableConstraints = {
  primaryKey ?: string[]           // PRIMARY KEY (user_id, tag_id)
  unique     ?: string[]           // UNIQUE(blocker_user_id, blocked_user_id)
                                   // pass multiple → multiple constraints
}

// ─── The define() Signature ──────────────────────────────────────────────────

export type OptionsMap = Record<string, OptionsTypes>