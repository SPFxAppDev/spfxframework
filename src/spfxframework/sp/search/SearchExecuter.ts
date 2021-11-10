import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { SPUri } from '../../utility/UrlHelper';
import { ISPFxAppDevBaseHelper, GeneralHelper } from '../BaseHelper';

export interface IHeaders {
    headers: {};
}

export interface IJsonSearchResult {
    d: ISearchDataObject;
}

export interface ISearchDataObject {
    query: IDataQuery;
}

export interface IDataQuery {
    PrimaryQueryResult: IPrimaryQueryResult;
}

export interface IPrimaryQueryResult {
    RelevantResults: IRelevantResults;
}

export interface IRelevantResults {
    Properties: ISearchResultPropertyCollection;
    TotalRows: number;
    Table: ISearchResultTable;
}

export interface ISearchResultPropertyCollection {
    results: Array<any>;
}

export interface ISearchResultTable {
    Rows: ISearchResultTableRows;
}

export interface ISearchResultTableRows {
    results: ISearchResultRowsResults[];
}

export interface ISearchResultRowsResults {
    Cells: ISearchResultCells;
}

export interface ISearchResultCells {
    results: ISearchResultCellResult[];
    GetTotalRows?(): number;
    TryGetValueFromResult?(propertyName: string, defaultValue?: any): any;
}

export interface ISearchResultCellResult {
    Key: string;
    Value: string;
}

//TODO: Update class after logging change
//TODO: Check if @log Decorator is possible to use...
export class SearchResultCells implements ISearchResultCells {
    public results: ISearchResultCellResult[];
    protected TotalRows?: number = null;

    private loggingCategory: string = 'SearchExecuter';

    public constructor(customLoggingCategory: string = null) {

        const helper: GeneralHelper = new GeneralHelper();

        if (!helper.isNullOrEmpty(customLoggingCategory)) {
            this.loggingCategory = customLoggingCategory;
        }
    }

    /**
     * @returns {number} The Number of Rows in Total.
     */
    public GetTotalRows(): number {

        if (this.TotalRows != null) {
            return this.TotalRows;
        }

        this.TotalRows = this.results != null && this.results.length > 0 ? this.results.length : 0;
    }

    /**
     * Try's to get the Value from the SearchResultCells.
     * @param {string} propertyName The Name of the Property.
     * @param {any} defaultValue The Default-Value which is returned if the propertyName doesn't match any Value.
     * @returns {any} The Value of the given Property-Name.
     */
    public TryGetValueFromResult(propertyName: string, defaultValue?: any): any {
        try {
            const helper: GeneralHelper = new GeneralHelper();

            if (this.results == null || this.results.length < 1) {
                return defaultValue;
            }

            let relevantValue: string;

            this.results.forEach((value: ISearchResultCellResult, index: number, array: ISearchResultCellResult[]) => {
                if (value.Key.toLocaleLowerCase() !== propertyName.toLocaleLowerCase()) {
                    return;
                }

                relevantValue = value.Value;
            });

            if (helper.isNullOrEmpty(relevantValue)) {
                return defaultValue;
            }

            return relevantValue;
        } catch (e) {
            // Logger.Log('Error occurred in SearchResultCells.TryGetValueFromResult', this.loggingCategory, LogType.Error, this.LoggingEnabled);
            // Logger.Log(e, this.loggingCategory, LogType.Error, this.LoggingEnabled);
            return defaultValue;
        }
    }
}

export class JsonSearchResult implements IJsonSearchResult {
    public d: ISearchDataObject;
    protected TotalRows?: number = null;

    private loggingCategory: string = 'SearchExecuter';

    

    public constructor(customLoggingCategory: string = null) {
        const helper: GeneralHelper = new GeneralHelper();

        if (!helper.isNullOrEmpty(customLoggingCategory)) {
            this.loggingCategory = customLoggingCategory;
        }
    }

    /**
     * @returns {number} The Number of Rows in Total.
     */
    public GetTotalRows(): number {

        if (this.TotalRows != null) {
            return this.TotalRows;
        }

        const helper: GeneralHelper = new GeneralHelper();

        const relevantResults: IRelevantResults = this.GetRelevantResults();

        if (!helper.isset(relevantResults) ||
        !helper.isset(relevantResults.TotalRows)) {
            return 0;
        }

        return relevantResults.TotalRows;
    }

    /**
     * @returns {ISearchResultRowsResults[]} The Results of the Rows of the RelevantSeachResults.
     */
    public GetSearchResult(): ISearchResultRowsResults[] {

        const helper: GeneralHelper = new GeneralHelper();

        const relevantResultTable: ISearchResultTable = this.GetSearchResultTable();

        if (!helper.isset(relevantResultTable) ||
        !helper.isset(relevantResultTable.Rows)) {
            return null;
        }

        if (!helper.isset(relevantResultTable.Rows.results)) {
            return null;
        }

        return relevantResultTable.Rows.results;
    }

    /**
     * Try's to return the Cells of the SearchResult by an Index.
     * @param {number} rowIndex The Index of the Row from which the SearchResultCells will be returned.
     * @returns {SearchResultCells} The Cells of the SearchResult.
     */
    public GetCellsFromRow(rowIndex: number): SearchResultCells {
        try {
            const searchResult: ISearchResultRowsResults[] = this.GetSearchResult();

            if (searchResult == null || searchResult.length < 1) {
                return null;
            }

            const searchResultCells: SearchResultCells = new SearchResultCells(this.loggingCategory);
            searchResultCells.results = searchResult[rowIndex].Cells.results;
            return searchResultCells;
        } catch (e) {
            // Logger.Log('Error occurred in JsonSearchResult.GetCells', this.loggingCategory, LogType.Error, this.LoggingEnabled);
            // Logger.Log(e, this.loggingCategory, LogType.Error, this.LoggingEnabled);
            return null;
        }
    }

    /**
     * Try's to Get the Value from the SearchResult.
     * @param propertyName The Name of the Property.
     * @param rowIndex The Index of the Row.
     * @param defaultValue The Value which get's returned in case the propertyName doesn't match any Value.
     * @returns {any} The Value of the Property in the specified Row.
     */
    public TryGetValueFromResult(propertyName: string, rowIndex: number, defaultValue?: any): any {
        try {
            const searchResultCells: SearchResultCells = this.GetCellsFromRow(rowIndex);

            if (searchResultCells) {
                return searchResultCells.TryGetValueFromResult(propertyName, defaultValue);
            }

            return defaultValue;
        } catch (e) {
            // Logger.Log('Error occurred in JsonSearchResult.TryGetValueFromResult', this.loggingCategory, LogType.Error, this.LoggingEnabled);
            // Logger.Log(e, this.loggingCategory, LogType.Error, this.LoggingEnabled);
            return defaultValue;
        }
    }

    private GetSearchResultTable(): ISearchResultTable {
        const helper: GeneralHelper = new GeneralHelper();

        const relevantResults: IRelevantResults = this.GetRelevantResults();

        if (!helper.isset(relevantResults) ||
        !helper.isset(relevantResults.Table)) {
            return null;
        }

        return relevantResults.Table;
    }

    private GetRelevantResults(): IRelevantResults {
        const helper: GeneralHelper = new GeneralHelper();

        if (!helper.isset(this.d)) {
            return null;
        }

        if (!helper.isset(this.d.query)) {
            return null;
        }

        if (!helper.isset(this.d.query.PrimaryQueryResult)) {
            return null;
        }

        return this.d.query.PrimaryQueryResult.RelevantResults;
    }
}

export class SearchExecuter {

    protected Context: WebPartContext|ApplicationCustomizerContext;

    protected readonly PeopleSearchResultSourceId: string = 'B09A7990-05EA-4AF9-81EF-EDFAB16C4E31';

    protected helper: ISPFxAppDevBaseHelper;

    protected readonly requestHeaders: IHeaders = {
        headers: {
          'odata-version': '3.0',
          'accept': 'application/json;odata=verbose',
          'content-type': 'application/json;odata=verbose'
        }
    };

    private loggingCategory: string = 'SearchExecuter';

    public constructor(ctx: WebPartContext|ApplicationCustomizerContext, customLoggingCategory: string = null) {
        this.Context = ctx;

        this.helper = {
            url: new SPUri(this.Context),
            functions: new GeneralHelper()
        };

        if (!this.helper.functions.isNullOrEmpty(customLoggingCategory)) {
            this.loggingCategory = customLoggingCategory;
        }
    }

    /**
     * Makes a People-Searchrequest against the Sharepoint-Search-API.
     * @param {string} searchTerm The Term which is searched for.
     * @param {number} maxItems The Number of Results to be returned.
     * @param {string} properties The selected Properties seperated by ",".
     * @returns {Promise<JsonSearchResult>} returns a JsonSearchResult.
     */
    public MakePeopleSearchRequest(searchTerm: string, maxItems: number, properties: string): Promise<JsonSearchResult>  {
        return this.MakeSearchRequest(searchTerm, maxItems, properties, this.PeopleSearchResultSourceId);
    }

    /**
     * Makes a Searchrequest against the Sharepoint-Search-API.
     * @param {string} searchTerm The Term which is searched for.
     * @param {number} maxItems The Number of Results to be returned.
     * @param {string} properties The selected Properties seperated by ",".
     * @returns {Promise<JsonSearchResult>} returns a JsonSearchResult.
     */
    public MakeSearchRequest(searchTerm: string, maxItems: number, properties: string, sourceId: string|null = null): Promise<JsonSearchResult>  {
        // Logger.Log('MakeSearchRequest START', this.loggingCategory, LogType.Log, enableLogging);
        let requestUrl: string = this.helper.url.MakeAbsoluteSiteUrl(`/_api/search/query?querytext='` + encodeURI(searchTerm) + `'`);

        if (!this.helper.functions.isNullOrEmpty(sourceId)) {
            requestUrl += `&sourceid='` + sourceId + `'`;
        }

        requestUrl += '&rowlimit=' + maxItems;

        if (this.helper.functions.isset(properties)) {
            requestUrl += `&selectproperties='` + properties + `'`;
        }

        const ctx: WebPartContext|ApplicationCustomizerContext = this.Context;
        // Logger.Log('SearchExecuter.MakeSearchRequest make request: ' + requestUrl, this.loggingCategory, LogType.Log, enableLogging);
        return new Promise<JsonSearchResult>((resolve, reject) => {
            ctx.spHttpClient.get(requestUrl,
                SPHttpClient.configurations.v1,
                this.requestHeaders)
                .then((response: SPHttpClientResponse) => {
                    response.json().then((responseJSON: IJsonSearchResult) => {
                        const searchResult: JsonSearchResult = new JsonSearchResult(this.loggingCategory);
                        searchResult.d = responseJSON.d;
                        resolve(searchResult);
                    });
                })
                .catch(error => {
                    // Logger.Log('Error occurred in SearchExecuter.MakeSearchRequest', this.loggingCategory, LogType.Error, enableLogging);
                    // Logger.Log(error, this.loggingCategory, LogType.Error, enableLogging);
                    reject(null);
                });
        });
    }
}