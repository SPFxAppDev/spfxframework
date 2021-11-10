export interface IQueryEntry {
    Value: string | number;
    Operator: string;
    Conector: string;
    FieldName: string;
    ValueType: string;
    IsLookup?: boolean;
}
//TODO: Optimize this code...

export class QueryBuilder {

    /**
     * Builds the Part inside the <Where> Parameter of a CamlQuery with the given parameters.
     * @param {QueryBuilder} querys An Array of QueryEntrys used to build a CamlQuery.
     * @param {number} index The index going through the QueryBuilder-Array.
     * @param {string} initalConector The Conector which is used if there is none provided in the QueryEntry.
     * @returns {string} The Part of a CamlQuery which is inside the <Where> Parameters of the Query.
     */
    public static BuildQuery(querys: IQueryEntry[], index: number, initalConector: string = ''): string {

        if (querys.length === 1) {
            return this.GetQueryInnerPart(querys[0]);
        }

        if (index === querys.length - 1) {
            return this.GetQueryInnerPart(querys[index]);
        }

        if (index === 0 && querys.length === 2) {
            return '<' + initalConector + '>' + this.GetQueryInnerPart(querys[index]) + this.BuildQuery(querys, ++index) + '</' + initalConector + '>';
        }

        if (index === 0 && querys.length > 2) {
            return '<' + initalConector + '>' + this.GetQueryInnerPart(querys[index]) + '<' + querys[index].Conector + '>' + this.BuildQuery(querys, ++index) + '</' + querys[index].Conector + '>' + '</' + initalConector + '>';
        }

        if (index + 1 === querys.length - 1) {
            return this.GetQueryInnerPart(querys[index]) + this.BuildQuery(querys, ++index);
        }

        const innerPart: string = this.GetQueryInnerPart(querys[index]);
        return innerPart + '<' + querys[index].Conector + '>' + this.BuildQuery(querys, ++index) + '</' + querys[index].Conector + '>';
    }

    private static GetQueryInnerPart(queryEntry: IQueryEntry): string {

        if (queryEntry.IsLookup != null && queryEntry.IsLookup) {
            return `<${queryEntry.Operator}><FieldRef Name="${queryEntry.FieldName}" LookupId="TRUE" />
            <Value Type="${queryEntry.ValueType}">${queryEntry.Value}</Value></${queryEntry.Operator}>`;
        }

        return `<${queryEntry.Operator}><FieldRef Name="${queryEntry.FieldName}" />
        <Value Type="${queryEntry.ValueType}">${queryEntry.Value}</Value></${queryEntry.Operator}>`;
    }
}