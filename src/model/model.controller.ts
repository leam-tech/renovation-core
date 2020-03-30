import { GetListParams } from "..";
import { RequestResponse } from "..";
import RenovationController from "../renovation.controller";
import { deepCloneObject } from "../utils";
import { DBBasicValues, DBFilter } from "../utils/filters";
import DocField from "./docfield";
import DocType from "./doctype";
import RenovationDocument from "./document";
import {
  AddChildDocParams,
  AddTagParams,
  AddToLocalsParams,
  AmendDocParams,
  AssignDocParams,
  CancelDocParams,
  CompleteDocAssignmentParams,
  CopyDocParams,
  DeleteDocParams,
  GetDocParams,
  GetDocsAssignedToUserParams,
  GetDocsAssignedToUserResponse,
  GetExportReportParams,
  GetFromLocalsParams,
  GetNewNameParams,
  GetReportParams,
  GetTaggedDocsParams,
  GetTagsParams,
  GetUsersAssignedToDocParams,
  GetUsersAssignedToDocResponse,
  GetValueParams,
  NewDocParams,
  RemoveTagParams,
  SaveDocParams,
  SaveSubmitDocParams,
  SearchLinkParams,
  SearchLinkResponse,
  SetLocalValueParams,
  SetValueParams,
  SubmitDocParams,
  UnAssignDocParams
} from "./interfaces";

/**
 * Class to handle the document CRUD operations
 * @abstract
 */
export default abstract class ModelController extends RenovationController {
  /**
   * Holds the new name prefix number per doctype
   */
  public static newNameCount: { [x: string]: number } = {};

  /**
   * Cache object for the docs
   */
  // tslint:disable-next-line: variable-name
  private _locals = {};
  /**
   * Cache object for the docs
   */
  public get locals() {
    return this._locals;
  }

  public set locals(value) {
    this._locals = value;
  }

  /**
   * Clears the `locals` and `newNameCount` and reset to `{}`
   */
  public clearCache() {
    this._locals = {};
    ModelController.newNameCount = {};
  }

  /**
   * Creates a new document `RenovationDocument` with default added properties and name generated.
   *
   * In addition, it's added to the local's cache
   *
   * Default fields:
   *      - docstatus: 0,
   *      - __islocal: 1,
   *      - __unsaved: 1
   *
   * @param {NewDocParams} newDocParams
   * @returns {Promise<RenovationDocument>} The new document as `RenovationDocument` within `RequestResponse`
   */
  public async newDoc(newDocParams: NewDocParams): Promise<RenovationDocument>;
  /**
   * Creates a new document `RenovationDocument` with default added properties and name generated.
   *
   * In addition, it's added to the local's cache
   *
   * Default fields:
   *      - docstatus: 0,
   *      - __islocal: 1,
   *      - __unsaved: 1
   *
   * @param doctype The doctype of the new document
   * @deprecated
   * @returns {Promise<RenovationDocument>} The new document as `RenovationDocument` within `RequestResponse`
   */
  // tslint:disable-next-line: unified-signatures
  public async newDoc(doctype: string): Promise<RenovationDocument>;
  public async newDoc(
    newDocParams: NewDocParams | string
  ): Promise<RenovationDocument> {
    let dt: string;
    if (typeof newDocParams === "string") {
      console.warn(
        "LTS-Renovation-Core",
        "newDoc(doctype) is deprecated, please use the interfaced method instead"
      );
      dt = newDocParams;
    } else {
      dt = newDocParams.doctype;
    }
    const doc = new RenovationDocument({
      doctype: dt,
      name: this.getNewName({ doctype: dt }),
      docstatus: 0,
      __islocal: 1,
      __unsaved: 1
    });
    this.addToLocals({ doc });
    return doc;
  }

  /**
   * Gets a new local name, `like New Sales Invoice 1`
   * @param {GetNewNameParams} getNewNameParams
   * @param {string} getNewNameParams.doctype The doctype of the new document
   * @returns {string} The new name based on the doctype and newNameCount
   */
  public getNewName(getNewNameParams: GetNewNameParams): string;
  /**
   * Gets a new local name, `like New Sales Invoice 1`
   * @param doctype The doctype of the new document
   * @deprecated
   * @returns {string} The new name based on the doctype and newNameCount
   */
  // tslint:disable-next-line: unified-signatures
  public getNewName(doctype: string): string;
  public getNewName(getNewNameParams: GetNewNameParams | string): string {
    let dt;
    if (typeof getNewNameParams === "string") {
      dt = getNewNameParams;
      console.warn(
        "LTS-Renovation-Core",
        "getNewName(doctype) is deprecated, please use the interfaced method instead"
      );
    } else {
      dt = getNewNameParams.doctype;
    }
    if (!ModelController.newNameCount[dt]) {
      ModelController.newNameCount[dt] = 0;
    }
    ModelController.newNameCount[dt]++;
    return `New ${dt} ${ModelController.newNameCount[dt]}`;
  }

  /**
   * Returns a cloned doc, with a new local name
   * @param {CopyDocParams} copyDocParams
   * @returns {Promise<RenovationDocument>} The copied document with a new name
   */
  public async copyDoc(
    copyDocParams: CopyDocParams
  ): Promise<RenovationDocument>;
  /**
   * Returns a cloned doc, with a new local name
   * @param doc The document to be cloned
   * @deprecated
   * @returns {Promise<RenovationDocument>} The copied document with a new name
   */
  // tslint:disable-next-line: unified-signatures
  public async copyDoc(doc: RenovationDocument): Promise<RenovationDocument>;
  public async copyDoc(
    doc: CopyDocParams | RenovationDocument
  ): Promise<RenovationDocument> {
    let d: RenovationDocument;

    if (doc.doc) {
      d = doc.doc;
    } else {
      d = doc;
      console.warn(
        "LTS-Renovation-Core",
        "copyDoc(doc) is deprecated, please use the interfaced approach instead"
      );
    }
    const clone = deepCloneObject(d);
    let newDoc = await this.newDoc(d.doctype);
    newDoc = Object.assign(clone, newDoc);
    this.locals[newDoc.doctype][newDoc.name] = newDoc;
    return newDoc;
  }

  /**
   * Clones a doc, set amended_from property to the original doc
   * @param {AmendDocParams} amendDocParams
   * @returns {Promise<RenovationDocument>} Cloned document with the amended_from field
   */
  public async amendDoc(
    amendDocParams: AmendDocParams
  ): Promise<RenovationDocument>;
  /**
   * Clones a doc, set amended_from property to the original doc
   * @param {RenovationDocument} doc The document to be amended
   * @returns {Promise<RenovationDocument>} Cloned document with the amended_from field
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public async amendDoc(doc: RenovationDocument): Promise<RenovationDocument>;
  public async amendDoc(
    amendDocParams: AmendDocParams | RenovationDocument
  ): Promise<RenovationDocument> {
    let d: RenovationDocument;
    // @ts-ignore
    if (amendDocParams.doctype) {
      d = amendDocParams;
      console.warn(
        "LTS-Renovation-Core",
        "amendDoc(doc) is deprecated, please use the interfaced approach instead"
      );
    } else {
      d = amendDocParams.doc;
    }
    const newDoc = await this.copyDoc({ doc: d });
    newDoc.amended_from = d.name;
    return newDoc;
  }

  /**
   * Returns a child doc instance, already attached to parent doc
   * @param {AddChildDocParams} addChildDocParams
   * @returns {Promise<RenovationDocument>} The child doc of the parent document
   */
  public async addChildDoc(
    addChildDocParams: AddChildDocParams
  ): Promise<RenovationDocument>;
  /**
   * Returns a child doc instance, already attached to parent doc
   * @param doc The target parent doctype
   * @param field The field which is a child doc
   * @returns {Promise<RenovationDocument>} The child doc of the parent document
   * @deprecated
   */
  public async addChildDoc(
    doc: RenovationDocument,
    field: string | DocField
  ): Promise<RenovationDocument>;
  public async addChildDoc(
    addChildDocParams: AddChildDocParams | RenovationDocument,
    field?: string | DocField
  ): Promise<RenovationDocument> {
    let args: AddChildDocParams;
    // @ts-ignore
    if (addChildDocParams.doctype) {
      args = {
        doc: addChildDocParams,
        field
      };
      console.warn(
        "LTS-Renovation-Core",
        "addChildDoc(doc,field) is deprecated, please use the interfaced approach instead"
      );
    } else {
      args = addChildDocParams as AddChildDocParams;
    }

    const getDf = async () => {
      const dtResponse = await this.config.coreInstance.meta.getDocMeta({
        doctype: args.doc.doctype
      });
      if (!dtResponse.success) {
        throw new Error("Failed fetching doctype meta");
      }
      if (typeof args.field !== "string") {
        const fieldname = args.field.fieldname;
        if (dtResponse.data.fields.some(f => f.fieldname === fieldname)) {
          return args.field;
        } else {
          throw new Error(
            `${fieldname} is not a child field of DocType ${dtResponse.data.doctype}`
          );
        }
      }
      return dtResponse.data.fields.find(f => f.fieldname === args.field);
    };

    // fetch the datafield
    let df;
    try {
      df = await getDf();
    } catch (e) {
      console.log(e);
    }
    if (!df) {
      throw new Error("Failed to get datafield");
    }
    if (["Table", "Table MultiSelect"].indexOf(df.fieldtype) < 0) {
      throw new Error(`${df.fieldname} is not a table field`);
    }
    const childDoc = await this.newDoc({ doctype: df.options });

    if (!args.doc[df.fieldname]) {
      args.doc[df.fieldname] = [];
    }
    childDoc.idx = args.doc[df.fieldname].length + 1;
    args.doc[df.fieldname].push(childDoc);

    childDoc.parent = args.doc.name;
    childDoc.parenttype = args.doc.doctype;
    childDoc.parentfield = df.fieldname;

    return childDoc;
  }

  /**
   * Delete doc, even from backend
   *
   * @param {DeleteDocParams} deleteDocParams
   * @returns {Promise<RequestResponse<string | null>>} The deleted document within `RequestResponse`
   */
  public abstract async deleteDoc(
    deleteDocParams: DeleteDocParams
  ): Promise<RequestResponse<string | null>>;
  /**
   * Delete doc, even from backend
   *
   * @param doctype The target doctype
   * @param docname The name of the targeted document
   * @deprecated
   * @returns {Promise<RequestResponse<string | null>>} The deleted document within `RequestResponse`
   */
  public abstract async deleteDoc(
    doctype: string,
    docname: string
  ): Promise<RequestResponse<string | null>>;

  /**
   * Gets the document by parsing the object to `RenovationDocument`
   * @param getDocParams The object to be parsed
   * @returns {RequestResponse<RenovationDocument>} The parsed document within `RequestResponse`
   */
  public getDoc(
    getDocParams: GetDocParams
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Gets the document from the local cache
   * @param doctype The target doctype
   * @param docname The document referenced by its name
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} `RenovationDocument` contained within `RequestResponse`.
   * Returns failure if doesn't exist in cache
   */
  public async getDoc(
    doctype: string,
    docname: string
  ): Promise<RequestResponse<RenovationDocument>>;
  public async getDoc(
    getDocParams: GetDocParams | string,
    docname?: string
  ): Promise<RequestResponse<RenovationDocument>> {
    let args: GetDocParams;
    if (typeof getDocParams === "string") {
      args = {
        doctype: getDocParams,
        docname
      };
      console.warn(
        "LTS-Renovation-Core",
        "getDoc(doctype,docname) is deprecated, please use the interfaced approach instead"
      );
    } else {
      args = getDocParams;
    }
    this.loadDocType(args.doctype);
    if (args.docname) {
      if ((this.locals[args.doctype] || {})[args.docname]) {
        return RequestResponse.success(this.locals[args.doctype][args.docname]);
      }
    } else {
      return RequestResponse.success(
        JSON.parse(
          JSON.stringify(new RenovationDocument(args))
        ) as RenovationDocument
      );
    }

    return Promise.resolve(
      RequestResponse.fail(RenovationController.genericError({ info: {} }))
    );
  }

  /**
   * Get list of entries on a doc
   *
   * @param getListParams The field input as interface `GetListArgument`
   * @returns {Promise<RequestResponse<[{[x: string]: DBBasicValues | [{}]}]>>} The list of documents within `RequestResponse`
   */
  public abstract async getList(
    getListParams: GetListParams
  ): Promise<RequestResponse<[{ [x: string]: DBBasicValues | [{}] }]>>;
  /**
   * Get list of entries on a doc (no child doc)
   *
   * @param doctype The target doctype
   * @param fields The fields to include
   * @param filters The filters to be applied when fetching the documents
   * @param orderBy Sorting criteria
   * @param limitPageStart From which document to get (Useful for pagination)
   * @param limitPageLength Number of documents to return
   * @param parent The parent doctype
   * @deprecated
   * @returns {Promise<RequestResponse<[{[x: string]: DBBasicValues | [{}]}]>>} The list of documents within `RequestResponse`
   */
  public abstract async getList(
    doctype: string,
    fields?: string[],
    filters?: DBFilter,
    orderBy?: string,
    limitPageStart?: number,
    limitPageLength?: number,
    parent?: string
  ): Promise<RequestResponse<[{ [x: string]: DBBasicValues | [{}] }]>>;

  /**
   * Get report values
   *
   * @param {GetReportParams} getReportParams
   * @returns {Promise<RequestResponse<{ result; columns }>>} The report returned within `RequestResponse`
   */
  public abstract async getReport(
    getReportParams: GetReportParams
  ): Promise<RequestResponse<{ result; columns }>>;
  /**
   * Get report values
   *
   * @param report The report name
   * @param filters Filters to apply when getting the report. Defaults to `{}`
   * @param user The target user. Defaults to `null`
   * @deprecated
   * @returns {Promise<RequestResponse<{ result; columns }>>} The report returned within `RequestResponse`
   */
  public abstract async getReport(
    report: string,
    filters?: { [x: string]: DBBasicValues },
    user?: string
  ): Promise<RequestResponse<{ result; columns }>>;

  /**
   * Get the report exported as Excel or PDF
   *
   * Currently only Excel is supported
   *
   * @param exportReportParams The params object required to fetch the report exported
   * @returns {Promise<RequestResponse<any>>} The binary data included in `RequestResponse`
   * @abstract
   */
  public abstract async exportReport(
    exportReportParams: GetExportReportParams
  ): Promise<RequestResponse<any>>;

  /**
   * Get a single value from db
   *
   * @param {GetValueParams} getValueParams
   * @returns {Promise<RequestResponse<{[x: string]: DBBasicValues}>>} The value of the field within `RequestResponse`
   */
  public abstract async getValue(
    getValueParams: GetValueParams
  ): Promise<RequestResponse<{ [x: string]: DBBasicValues }>>;
  /**
   * Get a single value from db
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param docfield The target field
   * @deprecated
   * @returns {Promise<RequestResponse<{[x: string]: DBBasicValues}>>} The value of the field within `RequestResponse`
   */
  public abstract async getValue(
    doctype: string,
    docname: string,
    docfield: string
  ): Promise<RequestResponse<{ [x: string]: DBBasicValues }>>;

  /**
   * Assigns a doc to a particular User
   * @param {AssignDocParams} params
   */
  public abstract async assignDoc(args: AssignDocParams);

  /**
   * Marks the assignment complete made by assignDoc()
   * @param args
   */
  public abstract async completeDocAssignment(
    args: CompleteDocAssignmentParams
  );

  /**
   * Unassigns an user from a given doc
   * @param {UnAssignDocParams} params
   */
  public abstract async unAssignDoc(args: UnAssignDocParams);

  /**
   * Returns a list of documents that is assigned to a user
   * @param args
   */
  public abstract async getDocsAssignedToUser(
    args: GetDocsAssignedToUserParams
  ): Promise<RequestResponse<GetDocsAssignedToUserResponse[]>>;

  /**
   * Returns a list of users attached to a single doc
   * @param args
   */
  public abstract async getUsersAssignedToDoc(
    args: GetUsersAssignedToDocParams
  ): Promise<RequestResponse<GetUsersAssignedToDocResponse[]>>;

  /**
   * Set local value on a document, triggering events for the operation
   * @param setLocalValueParams
   */
  public setLocalValue(setLocalValueParams: SetLocalValueParams);
  /**
   * Set local value on a document, triggering events for the operation
   * @param doctype The target doctype
   * @param docname The target document
   * @param docfield The target field
   * @param value The value to be set
   * @deprecated
   */
  public setLocalValue(
    doctype: string,
    docname: string,
    docfield: string,
    value: DBBasicValues
  );
  public setLocalValue(
    setLocalValueParams: SetLocalValueParams | string,
    docname?: string,
    docfield?: string,
    value?: DBBasicValues
  ) {
    let args: SetValueParams;
    if (typeof setLocalValueParams === "string") {
      args = {
        doctype: setLocalValueParams,
        docname,
        docfield,
        value
      };
      console.warn(
        "LTS-Renovation-Core",
        "setLocalValue(doctype,docname,docfield,value) is deprecated, please use the interfaced approach instead"
      );
    } else {
      args = setLocalValueParams;
    }

    if (
      !this.locals[args.doctype] ||
      !this.locals[args.doctype][args.docname]
    ) {
      throw new Error(`Cache doc not found: ${args.doctype}:${args.docname}`);
    }
    this.locals[args.doctype][args.docname].__unsaved = 1;
    this.locals[args.doctype][args.docname][args.docfield] = args.value;
    this.config.coreInstance.scriptManager.trigger({
      doctype: args.doctype,
      docname: args.docname,
      event: args.docfield
    });

    this.getCore().ui.refreshField(args.doctype, args.docfield);
    // recheck display_dependsOn
    this.config.coreInstance.ui.checkDisplayDependsOnAll(args.doctype);
  }

  /**
   * Sets a single value in db
   *
   * @param {SetValueParams} setValueParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The updated document as `RenovationDocument` within `RequestResponse`
   */
  public abstract async setValue(
    setValueParams: SetValueParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Sets a single value in db
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param docfield The target field
   * @param docvalue The value to be set
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The updated document as `RenovationDocument` within `RequestResponse`
   */
  public abstract async setValue(
    doctype: string,
    docname: string,
    docfield: string,
    docvalue: DBBasicValues
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Save a document
   *
   * @param {SaveDocParams} saveDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved document within `RequestResponse`
   */
  public abstract async saveDoc(
    saveDocParams: SaveDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Save a document
   *
   * @param doc The document to be saved
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved document within `RequestResponse`
   */
  public abstract async saveDoc(
    // tslint:disable-next-line: unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Submit a submittable document
   *
   * @param {SubmitDocParams} submitDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The submitted document within `RequestResponse`
   */
  public abstract async submitDoc(
    submitDocParams: SubmitDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Submit a submittable document
   *
   * @param doc The document to be submitted
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The submitted document within `RequestResponse`
   */
  // tslint:disable-next-line: unified-signatures
  public abstract async submitDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Saves the document first, then submit, in a single db transaction
   *
   * @param saveSubmitDocParams The document to be saved and submitted
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved and submitted document within `RequestResponse`
   */
  public abstract async saveSubmitDoc(
    saveSubmitDocParams: SaveSubmitDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Saves the document first, then submit, in a single db transaction
   *
   * @param doc The document to be saved and submitted
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The saved and submitted document within `RequestResponse`
   */
  // tslint:disable-next-line: unified-signatures
  public abstract async saveSubmitDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Cancels the submitted document
   *
   * @param {CancelDocParams} cancelDocParams
   * @returns {Promise<RequestResponse<RenovationDocument>>} The cancelled document within `RequestResponse`
   */
  public abstract async cancelDoc(
    cancelDocParams: CancelDocParams
  ): Promise<RequestResponse<RenovationDocument>>;
  /**
   * Cancels the submitted document
   *
   * @param doc The document to be cancelled
   * @deprecated
   * @returns {Promise<RequestResponse<RenovationDocument>>} The cancelled document within `RequestResponse`
   */
  // tslint:disable-next-line: unified-signatures
  public abstract async cancelDoc(
    // tslint:disable-next-line:unified-signatures
    doc: RenovationDocument
  ): Promise<RequestResponse<RenovationDocument>>;

  /**
   * Search for Link field values
   *
   * @param {SearchLinkParams} searchLinkParams
   *
   * @returns {Promise<RequestResponse<[SearchLinkResponse]>>} The search results within `RequestResponse`
   */
  public abstract async searchLink(
    searchLinkParams: SearchLinkParams
  ): Promise<RequestResponse<[SearchLinkResponse]>>;
  /**
   * Search for Link field values
   *
   * @param doctype The target doctype
   * @param txt The term to be searched
   * @param options Optional parameter for the API
   * @deprecated
   * @returns {Promise<RequestResponse<[SearchLinkResponse]>>} The search results within `RequestResponse`
   */
  public abstract async searchLink(
    doctype: string,
    txt: string,
    options?: unknown
  ): Promise<RequestResponse<[SearchLinkResponse]>>;

  /**
   * Add to local core cache
   * @param {AddToLocalsParams} addToLocalsParams
   */
  public addToLocals(addToLocalsParams: AddToLocalsParams);
  /**
   * Add to local core cache
   * @param doc Document to be added
   * @deprecated
   */
  // tslint:disable-next-line: unified-signatures
  public addToLocals(doc: RenovationDocument);
  public addToLocals(
    addToLocalsParams: AddToLocalsParams | RenovationDocument
  ) {
    let args: AddToLocalsParams;
    // @ts-ignore
    if (addToLocalsParams.doctype) {
      args = {
        doc: addToLocalsParams
      };
    } else {
      args = addToLocalsParams as AddToLocalsParams;
    }
    if (!this.locals[args.doc.doctype]) {
      this.locals[args.doc.doctype] = {};
    }
    if (!args.doc.name) {
      args.doc.name = this.getNewName(args.doc.doctype);
      args.doc.docstatus = 0; // treat as a new doc
      args.doc.__islocal = 1;
      args.doc.__unsaved = 1;
    }
    this.locals[args.doc.doctype][args.doc.name] = args.doc;

    for (const fieldname in args.doc) {
      if (!args.doc.hasOwnProperty(fieldname)) {
        continue;
      }
      if (args.doc[fieldname] instanceof Array) {
        for (const childDoc of args.doc[fieldname]) {
          this.addToLocals({ doc: childDoc });
        }
      }
    }
  }

  /**
   * Get doc from core cache
   * @param {GetFromLocalsParams} getFromLocalsParams
   * @returns {RenovationDocument | null} `RenovationDocument` in the cache. `null` if doesn't exist
   */
  public getFromLocals(
    getFromLocalsParams: GetFromLocalsParams
  ): RenovationDocument | null;
  /**
   * Get doc from core cache
   * @param doctype Doctype of the document
   * @param docname Name of the document
   * @deprecated
   * @returns {RenovationDocument | null} `RenovationDocument` in the cache. `null` if doesn't exist
   */
  public getFromLocals(
    doctype: string,
    docname: string
  ): RenovationDocument | null;
  public getFromLocals(
    getFromLocalParams: GetFromLocalsParams | string,
    docname?: string
  ): RenovationDocument | null {
    let args: GetFromLocalsParams;
    if (typeof getFromLocalParams === "string") {
      args = { doctype: getFromLocalParams, docname };
    } else {
      args = getFromLocalParams;
    }
    if (this.locals[args.doctype] && this.locals[args.doctype][args.docname]) {
      return this.locals[args.doctype][args.docname];
    } else {
      return null;
    }
  }

  // TAGS Section

  /**
   * Adds a tag to document
   *
   * @param addTagParams The target doctype
   *
   * @returns {Promise<RequestResponse<string>>} The tag within `RequestResponse`
   */
  public abstract async addTag(
    addTagParams: AddTagParams
  ): Promise<RequestResponse<string>>;
  /**
   * Adds a tag to document
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param tag The tag to be added
   * @deprecated
   * @returns {Promise<RequestResponse<string>>} The tag within `RequestResponse`
   */
  public abstract async addTag(
    doctype: string,
    docname: string,
    tag: string
  ): Promise<RequestResponse<string>>;

  /**
   * Removes a tag to document
   *
   * @param {RemoveTagParams} removeTagParams
   *
   * @return {Promise<RequestResponse<null>>} Empty response within `RequestResponse`
   */
  public abstract async removeTag(
    removeTagParams: RemoveTagParams
  ): Promise<RequestResponse<null>>;
  /**
   * Removes a tag to document
   *
   * @param doctype The target doctype
   * @param docname The target document
   * @param tag Tag to be deleted
   * @deprecated
   * @return {Promise<RequestResponse<null>>} Empty response within `RequestResponse`
   */
  public abstract async removeTag(
    doctype: string,
    docname: string,
    tag: string
  ): Promise<RequestResponse<null>>;

  /**
   * Gets all the names of all documents with the param-tag
   *
   * @param {GetTaggedDocsParams} getTaggedDocsParams
   *
   * @return {Promise<RequestResponse<null>>} List of documents within `RequestResponse`
   */
  public abstract async getTaggedDocs(
    getTaggedDocsParams: GetTaggedDocsParams
  ): Promise<RequestResponse<string[]>>;
  /**
   * Gets all the names of all documents with the param-tag
   *
   * @param doctype The target doctype
   * @param tag The target tag for which the documents need to be fetched
   * @deprecated
   * @return {Promise<RequestResponse<null>>} List of documents within `RequestResponse`
   */
  public abstract async getTaggedDocs(
    doctype: string,
    tag: string
  ): Promise<RequestResponse<string[]>>;

  /**
   * Returns all tags of a doctype
   *
   * @param {GetTagsParams} getTagsParams
   *
   * @return {Promise<RequestResponse<null>>} Tags list within `RequestResponse`
   */
  public abstract async getTags(
    getTagsParams: GetTagsParams
  ): Promise<RequestResponse<string[]>>;
  /**
   * Returns all tags of a doctype
   *
   * @param doctype The target doctype
   * @param likeTag Tag to be searched. Can be used in the form of SQL's LIKE statements
   * @deprecated
   * @return {Promise<RequestResponse<null>>} Tags list within `RequestResponse`
   */
  public abstract async getTags(
    doctype: string,
    likeTag?: string
  ): Promise<RequestResponse<string[]>>;

  /**
   * Loads the scripts of a doctype
   *
   * @param doctype The target doctype
   * @returns {Promise<RequestResponse<DocType>>}
   */
  protected async loadDocType(doctype): Promise<RequestResponse<DocType>> {
    return await this.getCore().meta.getDocMeta({ doctype });
  }
}
