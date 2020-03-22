import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { RenovationError } from "..";

import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";
import RenovationDocument from "./document";
import { GetExportReportParams } from "./interfaces";

describe("Frappe Model Controller", function() {
  let renovation: Renovation;
  this.timeout(10000);

  // const logOnFail = (r: RequestResponse<any>) => {
  //   if (!r.success) {
  //     console.log(r);
  //   }
  // };

  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  afterEach(function() {
    renovation.model.clearCache();
  });

  describe("getDoc", function() {
    it("should return RenovationDocument when proper object is passed", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-success-object-input");

      const testDocument = await renovation.model.getDoc({
        doctype: "Test Doctype",
        name: "TD-00001"
      });
      completeRecording();
      expect(testDocument.success).to.be.true;
      expect(testDocument.data.name).to.equal("TD-00001");
    });

    it("should return RenovationDocument when proper object is passed [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-success-object-input-deprecated");

      const testDocument = await renovation.model.getDoc(
        "Customer",
        "Test Customer"
      );
      completeRecording();
      expect(testDocument.data.name).to.equal("Test Customer");
    });

    it("should throw error for object with doctype unspecified", async function() {
      try {
        await renovation.model.getDoc({ name: "TD-00001" });
      } catch (e) {
        expect(e.message).to.be.equal("Invalid object for doctype");
      }
    });

    it("should return failure for wrong input types", async function() {
      // @ts-ignore
      const getDoc = await renovation.model.getDoc("wrong input");
      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(412);
      expect(getDoc.error.title).to.be.equal("Wrong input");
    });

    it("should return failure for non-existing docs", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-fail-non-existing");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "NON-EXISTING"
      });
      completeRecording();
      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(404);
      expect(getDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return failure for non-existing docs where the server responds with success", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-fail-non-existing-success-true");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "NON-EXISTING"
      });
      completeRecording();
      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(404);
      expect(getDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return failure where the server responds with non 2xx http code", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-fail-not-200");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "NON-EXISTING"
      });
      completeRecording();
      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(404);
      expect(getDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return failure where the server responds with undefined response", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-fail-response-undefined");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "NON-EXISTING"
      });
      completeRecording();
      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(400);
      expect(getDoc.error.title).to.be.equal(
        RenovationController.GENERIC_ERROR_TITLE
      );
    });

    it("should return RenovationDocument for Item A Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetDoc-success-string-input");
      const docResponse = await renovation.model.getDoc({
        doctype: "Item",
        docname: "Item A"
      });
      completeRecording();
      expect(docResponse.data.name).to.equal("Item A");
    });

    it("should return the document from cache when the document is in locals", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      const cacheDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "New Item 1"
      });
      expect(cacheDoc.success).to.be.true;
      expect(cacheDoc.data).to.be.instanceOf(RenovationDocument);
      expect(cacheDoc.data.name).to.be.equal("New Item 1");
    });

    it("should return the document if it's new and not in cache", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      renovation.model.clearCache();
      const cacheDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "New Item 1"
      });
      expect(cacheDoc.success).to.be.true;
      expect(cacheDoc.data).to.be.instanceOf(RenovationDocument);
      expect(cacheDoc.data.name).to.be.equal("New Item 1");
    });
  });

  describe("getList", function() {
    it("should return just names of Invoices for no fields specified", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice"
      });
      completeRecording();
      expect(docResponse.success).to.be.true;
      expect(docResponse.data[0].name).contains("SINV");
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(1);
    });
    it("should return just names of Invoices for no fields specified [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success");
      const docResponse = await renovation.model.getList("Sales Invoice");
      completeRecording();
      expect(docResponse.success).to.be.true;
      expect(docResponse.data[0].name).contains("SINV");
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(1);
    });

    it("should return just names of Invoices for no fields specified with object as input", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success-object");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice"
      });
      completeRecording();
      expect(docResponse.success).to.be.true;
      expect(docResponse.data[0].name).contains("SINV");
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(1);
    });

    it("should return name + grand_total for the fields passed in", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success-fields");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice",
        fields: ["name", "grand_total"]
      });
      completeRecording();
      expect(docResponse.success).to.equals(true);
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(2);
    });

    it("should return only return 5 items on pagination", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success-limitPageLength");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice",
        fields: ["name"],
        filters: [],
        orderBy: "",
        limitPageStart: 0,
        limitPageLength: 5
      });
      completeRecording();
      expect(docResponse.success).to.equals(true);
      expect(docResponse.data.length).to.be.equal(5);
    });

    it("should return tableField details", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success-tableFields");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice",
        tableFields: {
          items: ["item_code", "item_name"]
        }
      });
      completeRecording();
      expect(docResponse.success).to.equals(true);
      expect(docResponse.data.length).greaterThan(0);
      expect((docResponse.data[0].items as [{}]).length).greaterThan(0);
      expect(docResponse.data[0].items[0].item_code.length).greaterThan(0);
    });

    it("should return all fields", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getList-success-fields-asterisk");
      const docResponse = await renovation.model.getList({
        doctype: "Sales Invoice",
        fields: ["*"]
      });
      completeRecording();
      expect(docResponse.success).to.equals(true);
      expect(docResponse.data[0]).to.be.instanceOf(RenovationDocument);
      expect(Object.keys(docResponse.data[0]).length).to.be.greaterThan(1);
    });
  });
  //
  describe("deleteDoc", async function() {
    it("should delete an Item successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeDeleteDoc-success-create-and-delete");
      const doc = await renovation.model.newDoc({ doctype: "Item" });
      doc.item_code = "TEST ITEM 1";
      doc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc({ doc });
      expect(savedDoc.success).equals(true);
      const deletedDoc = await renovation.model.deleteDoc({
        doctype: "Item",
        docname: "TEST ITEM 1"
      });
      completeRecording();
      expect(deletedDoc.success).to.be.true;
    });

    it("should delete an Item successfully [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeDeleteDoc-success-create-and-delete");
      const doc = await renovation.model.newDoc({ doctype: "Item" });
      doc.item_code = "TEST ITEM 1";
      doc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc({ doc });
      expect(savedDoc.success).equals(true);
      const deletedDoc = await renovation.model.deleteDoc(
        "Item",
        "TEST ITEM 1"
      );
      completeRecording();
      expect(deletedDoc.success).to.be.true;
    });

    it("should verify doc was deleted from cache too", async function() {
      // try getDoc
      const docCache = await renovation.model.getDoc({
        doctype: "Item",
        docname: "TEST ITEM 1"
      });
      expect(docCache.success).to.be.false; // verifies deleted from cache
    });

    it("should delete a document the doesn't exist in the cache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeDeleteDoc-success-not-in-cache");
      const deletedDoc = await renovation.model.deleteDoc({
        doctype: "Item",
        docname: "TEST ITEM 2"
      });
      completeRecording();
      expect(deletedDoc.success).to.be.true;
    });
    it("should fail to delete an Item that doesn't exist", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeDeleteDoc-fail-non-existing");
      const deletedDoc = await renovation.model.deleteDoc({
        doctype: "Item",
        docname: "non_existing"
      });
      completeRecording();
      expect(deletedDoc.success).to.be.false;
      expect(deletedDoc.httpCode).to.be.equal(404);
      expect(deletedDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
  });

  describe("getValue", function() {
    const fieldName = "item_name";
    const fieldValue = "Item A TEST";

    it("should read same barcode from Item A", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetValue-success");
      const resp = await renovation.model.getValue({
        doctype: "Item",
        docname: "Item A",
        docfield: fieldName
      });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).to.be.equal(fieldValue);
    });
    it("should read same barcode from Item A [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetValue-success");
      const resp = await renovation.model.getValue("Item", "Item A", fieldName);
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).to.be.equal(fieldValue);
    });

    it("should return failure for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetValue-fail-non-existing-doctype");
      const resp = await renovation.model.getValue({
        doctype: "NON-EXISTING",
        docname: "non_existing",
        docfield: fieldName
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
    });
    it("should return undefined data for non-existing document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetValue-fail-non-existing-document");
      const resp = await renovation.model.getValue({
        doctype: "Item",
        docname: "non_existing",
        docfield: fieldName
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
    });
    it("should return failure for non-existing field", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetValue-fail-non-existing-field");
      const resp = await renovation.model.getValue({
        doctype: "Item",
        docname: "Item A",
        docfield: "non_existing"
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
    });
  });

  describe("getReport", function() {
    it("should get report successfully for Items Valuation Rate", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetReport-success");
      const report = await renovation.model.getReport({
        report: "Items Valuation Rate",
        filters: {},
        user: null
      });
      completeRecording();
      expect(report.success).to.be.true;
    });

    it("should get report successfully for Items Valuation Rate [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetReport-success");
      const report = await renovation.model.getReport("Items Valuation Rate");
      completeRecording();
      expect(report.success).to.be.true;
    });

    it("should get failure for non-existing report", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetReport-non-existing");
      const report = await renovation.model.getReport({
        report: "NON EXISTING REPORT",
        filters: {}
      });
      completeRecording();
      expect(report.success).to.be.false;
      expect(report.httpCode).to.be.equal(404);
      expect(report.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
  });

  describe("setValue", function() {
    const fieldName = "item_name";
    const fieldValue = "Item A TEST";
    it("should set item name value successfully for Item A", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSetValue-success");
      const resp = await renovation.model.setValue({
        doctype: "Item",
        docname: "Item A",
        docfield: fieldName,
        value: fieldValue
      });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).equals(fieldValue);
    });
    it("should set item name value successfully for Item A [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSetValue-success");
      const resp = await renovation.model.setValue(
        "Item",
        "Item A",
        fieldName,
        fieldValue
      );
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).equals(fieldValue);
    });
    it("should return failure for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSetValue-fail-non-existing-doctype");
      const resp = await renovation.model.setValue({
        doctype: "NON EXISTING",
        docname: "Item A",
        docfield: fieldName,
        value: fieldValue
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should return failure for non-existing document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSetValue-fail-non-existing-document");
      const resp = await renovation.model.setValue({
        doctype: "Item",
        docname: "non_existing",
        docfield: fieldName,
        value: fieldValue
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return undefined data if response is empty", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSetValue-success-empty-response");
      const resp = await renovation.model.setValue({
        doctype: "Item",
        docname: "Item A",
        docfield: fieldName,
        value: fieldValue
      });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data).to.be.equal("");
    });
    it("should return failure for non-existing field", async function() {
      // FIXME: Should return false for non-existing field. Currently returns true
      // const { completeRecording } = await setupRecorder({
      //   mode: TestManager.testMode
      // })("frappeSetValue-fail-non-existing-field");
      // const resp = await renovation.model.setValue(
      //   "Item",
      //   "Item A",
      //   "non_existing",
      //   fieldValue
      // );
      // completeRecording();
      // expect(resp.success).equals(false);
      // expect(resp.httpCode).to.be.equal(400);
    });
  });

  describe("saveDoc", function() {
    it("should save document successfully and add to cache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveDoc-success");
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_code = "Item B";
      newDoc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });
      completeRecording();
      expect(savedDoc.success).to.be.true;
      // @ts-ignore
      expect(renovation.model.locals.Item["Item B"]).to.not.be.undefined;
    });
    it("should save document successfully and add to cache [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveDoc-success");
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_code = "Item B";
      newDoc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc(newDoc);
      completeRecording();
      expect(savedDoc.success).to.be.true;
      // @ts-ignore
      expect(renovation.model.locals.Item["Item B"]).to.not.be.undefined;
    });

    it("should fail if duplicated", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveDoc-fail-duplicate");
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_code = "Item B";
      newDoc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });
      completeRecording();
      expect(savedDoc.success).to.be.false;
      expect(savedDoc.httpCode).to.be.equal(409);
      expect(savedDoc.error.title).to.be.equal("Duplicate document found");
    });
    it("should fail if response is undefined", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveDoc-fail-response-undefined");
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_code = "Item B";
      newDoc.item_group = "Products";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });
      completeRecording();
      expect(savedDoc.success).to.be.false;
      expect(savedDoc.error.title).to.be.equal(
        RenovationController.GENERIC_ERROR_TITLE
      );
    });
  });

  describe("submitDoc", function() {
    it("should submit a submittable document successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSubmitDoc-success");
      const salesInvoice = await renovation.model.getDoc({
        doctype: "Sales Invoice",
        docname: "ACC-SINV-2019-00006"
      });
      const submitDoc = await renovation.model.submitDoc({
        doc: salesInvoice.data
      });
      completeRecording();

      expect(submitDoc.success).to.be.true;
      expect(submitDoc.data.name).to.be.equal("ACC-SINV-2019-00006");
      expect(renovation.model.locals["Sales Invoice"]).has.key(
        "ACC-SINV-2019-00006"
      );
      expect(submitDoc.data.__islocal).to.be.equal(0);
      expect(submitDoc.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSubmitDoc-fail-non-existing-doctype");
      const submitDoc = await renovation.model.submitDoc({ doc: newDoc });
      completeRecording();

      expect(submitDoc.success).to.be.false;
      expect(submitDoc.httpCode).to.be.equal(404);
      expect(submitDoc.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });

      newDoc.due_date = "2019-09-20";

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSubmitDoc-fail-non-existing-document");
      const submitDoc = await renovation.model.submitDoc({ doc: newDoc });
      completeRecording();

      expect(submitDoc.success).to.be.false;
      expect(submitDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-submittable document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSubmitDoc-fail-non-submittable-document");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "Item A"
      });
      const submitDoc = await renovation.model.submitDoc({ doc: getDoc.data });
      completeRecording();

      expect(submitDoc.success).to.be.false;
      expect(submitDoc.httpCode).to.be.equal(400);
    });
  });
  describe("saveSubmitDoc", function() {
    it("should create and submit Sales Invoice", async function() {
      const d = await renovation.model.newDoc({ doctype: "Sales Invoice" });
      d.items = [
        {
          item_code: "Item A",
          qty: 2,
          rate: 20
        }
      ];
      d.customer = "Customer A";
      d.cost_center = "Main - TC";
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveSubmitDoc-success");
      const r = await renovation.model.saveSubmitDoc({ doc: d });
      completeRecording();
      expect(r.success).to.be.true;
      expect(d.docstatus).to.be.equal(1);
      expect(renovation.model.locals["Sales Invoice"]["ACC-SINV-2019-00007"]).to
        .be.not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it("should create and submit Sales Invoice [deprecated]", async function() {
      const d = await renovation.model.newDoc({ doctype: "Sales Invoice" });
      d.items = [
        {
          item_code: "Item A",
          qty: 2,
          rate: 20
        }
      ];
      d.customer = "Customer A";
      d.cost_center = "Main - TC";
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveSubmitDoc-success");
      const r = await renovation.model.saveSubmitDoc(d);
      completeRecording();
      expect(r.success).to.be.true;
      expect(d.docstatus).to.be.equal(1);
      expect(renovation.model.locals["Sales Invoice"]["ACC-SINV-2019-00007"]).to
        .be.not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveSubmitDoc-fail-non-existing-doctype");
      const saveSubmitDoc = await renovation.model.saveSubmitDoc({
        doc: newDoc
      });
      completeRecording();

      expect(saveSubmitDoc.success).to.be.false;
      expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveSubmitDoc-fail-non-existing-document");
      const saveSubmitDoc = await renovation.model.saveSubmitDoc({
        doc: newDoc
      });
      completeRecording();

      expect(saveSubmitDoc.success).to.be.false;
      expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-submittable document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSaveSubmitDoc-fail-non-submittable-document");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "Item ABC"
      });
      const saveSubmitDoc = await renovation.model.saveSubmitDoc({
        doc: getDoc.data
      });
      completeRecording();

      expect(saveSubmitDoc.success).to.be.false;
      expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });
  });

  describe("cancelDoc", function() {
    it("should cancel a submitted document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeCancelDoc-success");
      const getDoc = await renovation.model.getDoc({
        doctype: "Sales Invoice",
        docname: "ACC-SINV-2019-00007"
      });
      const r = await renovation.model.cancelDoc(getDoc.data);
      completeRecording();
      expect(r.success).to.be.true;
      expect(r.data.docstatus).to.be.equal(2);
      expect(renovation.model.locals["Sales Invoice"]["ACC-SINV-2019-00007"]).to
        .be.not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeCancelDoc-fail-non-existing-doctype");
      const cancelDoc = await renovation.model.cancelDoc({ doc: newDoc });
      completeRecording();

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeCancelDoc-fail-non-existing-document");
      const cancelDoc = await renovation.model.cancelDoc({ doc: newDoc });
      completeRecording();

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-submittable document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeCancelDoc-fail-non-submittable-document");
      const getDoc = await renovation.model.getDoc({
        doctype: "Item",
        docname: "Item A"
      });
      const cancelDoc = await renovation.model.cancelDoc({ doc: getDoc.data });
      completeRecording();

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
  });

  describe("searchLink", function() {
    it("should get results for Item with Item Group 'Products'", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSearchLink-success");
      const searchResult = await renovation.model.searchLink({
        doctype: "Item",
        txt: "Products"
      });
      completeRecording();
      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(1);
    });

    it("should get results for Item with Item Group 'Products' [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSearchLink-success");
      const searchResult = await renovation.model.searchLink(
        "Item",
        "Products"
      );
      completeRecording();
      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(1);
    });

    it("should fail for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSearchLink-fail-non-existing-doctype");
      const searchResult = await renovation.model.searchLink({
        doctype: "NON-EXISTING",
        txt: "Products"
      });
      completeRecording();

      expect(searchResult.success).to.be.false;
      expect(searchResult.httpCode).to.be.equal(404);
      expect(searchResult.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });

    it("should return success with empty array", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSearchLink-success-empty-array");
      const searchResult = await renovation.model.searchLink({
        doctype: "Item",
        txt: "non-existing"
      });
      completeRecording();

      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(0);
    });

    it("should return undefined data as ''", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeSearchLink-empty-response");
      const searchResult = await renovation.model.searchLink({
        doctype: "Item",
        txt: "non-existing"
      });
      completeRecording();

      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.equal("");
    });
  });

  describe("addTag", function() {
    it("should add a tag to a document Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-success");
      const addTag = await renovation.model.addTag({
        doctype: "Item",
        docname: "Item A",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.true;
      expect(addTag.data).to.be.equal("tag-1");
    });

    it("should add a tag to a document Item [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-success");
      const addTag = await renovation.model.addTag("Item", "Item A", "tag-1");
      completeRecording();

      expect(addTag.success).to.be.true;
      expect(addTag.data).to.be.equal("tag-1");
    });
    it("should fail for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-fail-non-existing-doctype");
      const addTag = await renovation.model.addTag({
        doctype: "non-existing",
        docname: "Item A",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.false;
      expect(addTag.httpCode).to.be.equal(404);
      expect(addTag.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should fail for non-existing document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-fail-non-existing-document");
      const addTag = await renovation.model.addTag({
        doctype: "Item",
        docname: "non_existing",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.false;
      expect(addTag.httpCode).to.be.equal(404);
      expect(addTag.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
    it("should not fail for duplicate tag", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-success-duplicate-tag");
      const addTag = await renovation.model.addTag({
        doctype: "Item",
        docname: "Item A",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.true;
    });
    it("should not fail for empty string", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAddTag-fail-empty-tag");
      const addTag = await renovation.model.addTag({
        doctype: "Item",
        docname: "Item A",
        tag: ""
      });
      completeRecording();
      // TODO: Add check for empty string
      expect(addTag.success).to.be.true;
    });
  });
  describe("removeTag", function() {
    it("should remove a tag from a document Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeRemoveTag-success");
      const addTag = await renovation.model.removeTag({
        doctype: "Item",
        docname: "Item A",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.true;
      expect(addTag.data).to.be.deep.equal({});
    });

    it("should remove a tag from a document Item [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeRemoveTag-success");
      const addTag = await renovation.model.removeTag(
        "Item",
        "Item A",
        "tag-1"
      );
      completeRecording();

      expect(addTag.success).to.be.true;
      expect(addTag.data).to.be.deep.equal({});
    });
    it("should fail for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeRemoveTag-fail-non-existing-doctype");
      const addTag = await renovation.model.removeTag({
        doctype: "non-existing",
        docname: "Item A",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.false;
      expect(addTag.httpCode).to.be.equal(404);
      expect(addTag.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should fail for non-existing document", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeRemoveTag-fail-non-existing-document");
      const addTag = await renovation.model.removeTag({
        doctype: "Item",
        docname: "non_existing",
        tag: "tag-1"
      });
      completeRecording();

      expect(addTag.success).to.be.false;
      expect(addTag.httpCode).to.be.equal(404);
      expect(addTag.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
    it("should not fail for non-existing tag", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeRemoveTag-success-non-existing-tag");
      const addTag = await renovation.model.removeTag({
        doctype: "Item",
        docname: "Item A",
        tag: "tag-non-existing"
      });
      completeRecording();

      expect(addTag.success).to.be.true;
    });
  });

  describe("getTaggedDocs", function() {
    it("should get 2 document names with tag 'tag-2'", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTaggedDocs-success");
      const getTaggedDocs = await renovation.model.getTaggedDocs({
        doctype: "Item",
        tag: "tag-2"
      });
      completeRecording();

      expect(getTaggedDocs.success).to.be.true;
      expect(getTaggedDocs.data).to.an.instanceOf(Array);
      expect(getTaggedDocs.data.length).to.be.equal(2);
    });

    it("should get 2 document names with tag 'tag-2 [deprecated]'", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTaggedDocs-success");
      const getTaggedDocs = await renovation.model.getTaggedDocs(
        "Item",
        "tag-2"
      );
      completeRecording();

      expect(getTaggedDocs.success).to.be.true;
      expect(getTaggedDocs.data).to.an.instanceOf(Array);
      expect(getTaggedDocs.data.length).to.be.equal(2);
    });
    it("should fail for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTaggedDocs-fail-non-existing-doctype");
      const getTaggedDocs = await renovation.model.getTaggedDocs({
        doctype: "non-existing",
        tag: "tag-2"
      });
      completeRecording();

      expect(getTaggedDocs.success).to.be.false;
      expect(getTaggedDocs.httpCode).to.be.equal(404);
      expect(getTaggedDocs.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should return empty array non-existing tag", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTaggedDocs-fail-non-existing-tag");
      const getTaggedDocs = await renovation.model.getTaggedDocs({
        doctype: "Item",
        tag: "non-existing"
      });
      completeRecording();

      expect(getTaggedDocs.success).to.be.true;

      expect(getTaggedDocs.data).to.an.instanceOf(Array);
      expect(getTaggedDocs.data.length).to.be.equal(0);
    });
  });

  describe("getTags", function() {
    it("should get 3 tags for the doctype Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-success");
      const getTags = await renovation.model.getTags({ doctype: "Item" });
      completeRecording();

      expect(getTags.success).to.be.true;
      expect(getTags.data).to.an.instanceOf(Array);
      expect(getTags.data.length).to.be.equal(3);
    });
    it("should get 3 tags for the doctype Item [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-success");
      const getTags = await renovation.model.getTags("Item");
      completeRecording();

      expect(getTags.success).to.be.true;
      expect(getTags.data).to.an.instanceOf(Array);
      expect(getTags.data.length).to.be.equal(3);
    });
    it("should return empty array for doctype without tags", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-success-empty");
      const getTags = await renovation.model.getTags({
        doctype: "Sales Invoice"
      });
      completeRecording();

      expect(getTags.success).to.be.true;

      expect(getTags.data).to.an.instanceOf(Array);
      expect(getTags.data.length).to.be.equal(0);
    });

    it("should return 2 tags using LIKE tag-", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-success-like-param");
      const getTags = await renovation.model.getTags({
        doctype: "Item",
        likeTag: "tag-"
      });
      completeRecording();

      expect(getTags.success).to.be.true;

      expect(getTags.data).to.an.instanceOf(Array);
      expect(getTags.data.length).to.be.equal(2);
    });
    it("should return empty array for non-existing tag", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-success-empty-like");
      const getTags = await renovation.model.getTags({
        doctype: "Item",
        likeTag: "non-existing"
      });
      completeRecording();

      expect(getTags.success).to.be.true;

      expect(getTags.data).to.an.instanceOf(Array);
      expect(getTags.data.length).to.be.equal(0);
    });
    it("should fail for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeGetTags-fail-non-existing-doctype");
      const getTags = await renovation.model.getTags({
        doctype: "non-existing"
      });
      completeRecording();

      expect(getTags.success).to.be.false;
      expect(getTags.httpCode).to.be.equal(404);
      expect(getTags.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
  });

  describe("Assigning Docs to User", async function() {
    describe("Assign Doc", function() {
      it("should assign Item A to Test User", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-assign-item-to-user");
        const r = await renovation.model.assignDoc({
          assignTo: TestManager.getTestUserCredentials().email,
          doctype: "Item",
          docname: "Item A",
          description: "Test Assign",
          priority: "High",
          dueDate: "2050-12-31"
        });
        completeRecording();
        expect(r.success).to.be.true;
      });

      it("should fail assigning Item A to Test User since already assigned", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-assign-item-to-user-duplicate");
        const r = await renovation.model.assignDoc({
          assignTo: TestManager.getTestUserCredentials().email,
          doctype: "Item",
          docname: "A",
          description: "Test Assign",
          priority: "High",
          dueDate: "2050-12-31"
        });
        completeRecording();

        expect(r.success).to.be.false;
      });
    });

    describe("Unassign Doc", function() {
      it("should unassign Item A from Test User", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-assign-item-to-user-for-unassigning");
        const r = await renovation.model.unAssignDoc({
          unAssignFrom: TestManager.getTestUserCredentials().email,
          doctype: "Item",
          docname: "Item A"
        });
        completeRecording();
        expect(r.success).to.be.true;
      });
      it("should throw error while unassigning Item A from Test User again", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-assign-item-to-user-again-expected-to-throw");
        const r = await renovation.model.unAssignDoc({
          unAssignFrom: TestManager.getTestUserCredentials().email,
          doctype: "Item",
          docname: "Item A"
        });
        completeRecording();
        expect(r.success).to.be.false;
        expect(r.data.exc).to.be.exist;
      });
    });

    describe("Bulk Assigment", function() {
      it("lets bulk assign some Items to Test User and Admin for futher tests", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-bulk-assign-item");
        const r1 = await renovation.model.assignDoc({
          assignTo: TestManager.getTestUserCredentials().email,
          doctype: "Item",
          docnames: ["Item A", "Item B"],
          bulkAssign: true
        });
        const r2 = await renovation.model.assignDoc({
          assignTo: "Administrator",
          doctype: "Item",
          docnames: ["Item A", "Item B"],
          bulkAssign: true
        });
        completeRecording();
        expect(r1.success).to.be.true;
        expect(r2.success).to.be.true;
      });
      it("lets bulk assign some Customers to Test User and Admin for futher tests", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-bulk-assign-customer");
        const r1 = await renovation.model.assignDoc({
          assignTo: TestManager.getTestUserCredentials().email,
          doctype: "Customer",
          docnames: ["Test Customer", "Customer A"],
          bulkAssign: true
        });
        const r2 = await renovation.model.assignDoc({
          assignTo: "Administrator",
          doctype: "Customer",
          docnames: ["Test Customer", "Customer A"],
          bulkAssign: true
        });
        completeRecording();
        expect(r1.success).to.be.true;
        expect(r2.success).to.be.true;
      });
    });

    describe("getDocsAssignedToUser", function() {
      it("should list Item A and Item B in the list of docs assigned to test user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-getDocsAssignedToUser-list-docs");
        const r = await renovation.model.getDocsAssignedToUser({
          assignedTo: TestManager.getTestUserCredentials().email
        });
        completeRecording();
        expect(r.success).to.be.true;
        expect(r.data.length).greaterThan(0);
        expect(
          r.data.filter(
            todo =>
              todo.doctype === "Item" &&
              (todo.docname === "Item A" || todo.docname === "Item B")
          ).length
        ).to.be.equal(2);
      });
      it(
        "should list Test Customer and Customer A and not items" +
          " in the list of docs assigned to test user with doctype filter set",
        async function() {
          const { completeRecording } = await setupRecorder({
            mode: TestManager.testMode
          })("frappeAssignDoc-getDocsAssignedToUser-list-docs-customer");
          const r = await renovation.model.getDocsAssignedToUser({
            assignedTo: TestManager.getTestUserCredentials().email,
            doctype: "Customer"
          });
          completeRecording();
          expect(r.success).to.be.true;
          expect(r.data.length).greaterThan(0);
          expect(
            r.data.filter(
              todo =>
                todo.doctype === "Customer" &&
                (todo.docname === "Test Customer" ||
                  todo.docname === "Customer A")
            ).length
          ).to.be.greaterThan(1);
          expect(r.data.some(todo => todo.doctype === "Item")).to.be.false;
        }
      );
    });
    describe("getUsersAssignedToDoc", function() {
      it("should have Test User & Admin in the list of Users assigned to Item A", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-getUsersAssignedToDoc-list-user-ItemA");
        const r = await renovation.model.getUsersAssignedToDoc({
          doctype: "Item",
          docname: "Item A"
        });
        completeRecording();
        expect(r.success).to.be.true;
        expect(r.data.length).greaterThan(0);
        expect(
          r.data.filter(
            todo =>
              todo.assignedTo === TestManager.getTestUserCredentials().email ||
              todo.assignedTo === "Administrator"
          ).length
        ).to.be.greaterThan(1);
      });
      it("should have Test User & Admin in the list of Users assigned to Customer A", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-getUsersAssignedToDoc-list-user-CustomerA");
        const r = await renovation.model.getUsersAssignedToDoc({
          doctype: "Customer",
          docname: "Customer A"
        });
        completeRecording();
        expect(r.success).to.be.true;
        expect(r.data.length).greaterThan(0);
        expect(
          r.data.filter(
            todo =>
              todo.assignedTo === TestManager.getTestUserCredentials().email ||
              todo.assignedTo === "Administrator"
          ).length
        ).to.be.greaterThan(1);
      });
    });
    describe("completeDocAssignment", function() {
      this.timeout(20000);
      it("Complete Item Assignments", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-completeDocAssignment-item");
        const promises = [];
        for (const user of [
          TestManager.getTestUserCredentials().email,
          "Administrator"
        ]) {
          for (const name of ["Item A", "Item B"]) {
            promises.push(
              renovation.model.completeDocAssignment({
                assignedTo: user,
                doctype: "Item",
                docname: name
              })
            );
          }
        }
        const responses = await Promise.all(promises);
        completeRecording();
        for (const r of responses) {
          expect(r.success).to.be.true;
        }
      });
      it("Complete Customer Assignments", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("frappeAssignDoc-completeDocAssignment-customer");
        const promises = [];
        for (const user of [
          TestManager.getTestUserCredentials().email,
          "Administrator"
        ]) {
          for (const name of ["Customer A", "Test Customer"]) {
            promises.push(
              renovation.model.completeDocAssignment({
                assignedTo: user,
                doctype: "Customer",
                docname: name
              })
            );
          }
        }
        const responses = await Promise.all(promises);
        completeRecording();
        for (const r of responses) {
          expect(r.success).to.be.true;
        }
      });
    });

    after("Clean ToDos", async function() {
      this.timeout(30000);
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeAssignDoc-clean");
      const testTodos = await renovation.model.getList({
        doctype: "ToDo",
        filters: {
          reference_type: ["IN", ["Item", "Customer"]],
          owner: [
            "IN",
            ["Administrator", TestManager.getTestUserCredentials().email]
          ]
        }
      });
      if (!testTodos.success) {
        return;
      }
      const promises = [];
      for (const todo of testTodos.data) {
        promises.push(
          renovation.model.deleteDoc({
            doctype: "ToDo",
            docname: todo.name as string
          })
        );
      }
      await Promise.all(promises);
      completeRecording();
    });
  });

  describe("Export Report", function() {
    it("should return the octet stream successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("frappeExportReport-Success");
      const params: GetExportReportParams = {
        includeIndentation: 0,
        visibleIDX: [1, 2, 3, 4, 5, 6],
        reportName: "Items Valuation Rate",
        fileFormatType: "Excel"
      };
      const exportedReport = await renovation.model.exportReport(params);

      completeRecording();

      expect(exportedReport.success).to.be.true;
    });
  });
});
