import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import FrappeMetaController from "./frappe.meta.controller";

/**
 * Tests for methods implemented as part of the abstract class
 */

describe("Meta Controller", function() {
  let renovation!: Renovation;
  before(async function() {
    this.timeout(10000);
    renovation = await TestManager.init("frappe");
  });

  describe("docTypeCache", function() {
    it("should be empty on initializing", function() {
      const meta = new FrappeMetaController(renovation.config);
      expect(meta.docTypeCache).to.be.deep.equal({});
    });
    it("should be set to an empty object if set to null", function() {
      renovation.meta.docTypeCache = null;
      expect(renovation.meta.docTypeCache).to.be.deep.equal({});
    });
  });

  describe("getFieldLabel", function() {
    const doctype = "Item";
    it("should get the field label of item_name of doctype Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getFieldLabel-success-item_name");
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype,
        fieldname: "item_name"
      });
      completeRecording();

      expect(fieldLabel).to.be.equal("Item Name");
    });

    it("should get the standard field for doctype Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getFieldLabel-success-standardFields");
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype,
        fieldname: "name"
      });
      completeRecording();

      expect(fieldLabel).to.be.equal("Name");
    });

    it("should fail to get the fields from the backend", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getFieldLabel-fail");
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype: "NON-EXISTING DOCTYPE",
        fieldname: "result_field"
      });
      completeRecording();

      expect(fieldLabel).to.be.equal("result_field");
    });

    it("should get a non-existing field in uppercase", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getFieldLabel-success-non-existing-fields");
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype,
        fieldname: "non_existing_name"
      });
      completeRecording();

      expect(fieldLabel).to.be.equal("Non_existing_name");
    });
  });
  describe("getDocMeta", function() {
    it("should get the meta of doc not in the cache", async function() {
      renovation.meta.clearCache();
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success-not-in-cache");

      const meta = await renovation.meta.getDocMeta({ doctype: "Item" });
      completeRecording();

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal("Item");
      expect(renovation.meta.docTypeCache.Item.doctype).to.be.equal("Item");
    });
  });

  describe("clearCache", function() {
    it("should reset the docTypeCache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success-not-in-cache");

      const meta = await renovation.meta.getDocMeta({ doctype: "Item" });
      completeRecording();

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal("Item");
      expect(renovation.meta.docTypeCache.Item.doctype).to.be.equal("Item");

      renovation.meta.clearCache();
      expect(renovation.meta.docTypeCache).to.be.deep.equal({});
    });
  });
  describe("Unimplemented methods", function() {
    describe("getDocCount", function() {
      it("should return failed RequestResponse always", async function() {
        const metaController = new FrappeMetaController(renovation.config);
        const docInfo = await metaController.getDocCount({ doctype: "Item" });

        expect(docInfo.success).to.be.false;
        expect(docInfo.httpCode).to.be.equal(400);
      });
    });
    describe("getDocInfo", function() {
      it("should return failed RequestResponse always", async function() {
        const metaController = new FrappeMetaController(renovation.config);
        const docInfo = await metaController.getDocInfo({
          doctype: "Item",
          docname: "random name"
        });

        expect(docInfo.success).to.be.false;
        expect(docInfo.httpCode).to.be.equal(400);
      });
    });
    describe("getReportMeta", function() {
      it("should return failed RequestResponse always", async function() {
        const metaController = new FrappeMetaController(renovation.config);
        const docInfo = await metaController.getReportMeta({ report: "Item" });

        expect(docInfo.success).to.be.false;
        expect(docInfo.httpCode).to.be.equal(400);
      });
    });
  });
  describe("loadDocType [deprecated]", function() {
    it("should return with success if the doctype is in the cache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success-not-in-cache");

      const meta = await renovation.meta.getDocMeta({ doctype: "Item" });
      completeRecording();

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal("Item");
      expect(renovation.meta.docTypeCache.Item.doctype).to.be.equal("Item");

      const metaController = new FrappeMetaController(renovation.config);
      // Simulating having a doctype in cache
      metaController.docTypeCache = { Item: meta.data };

      const loadResponse = await metaController.loadDocType("Item");

      expect(loadResponse.success).to.be.true;
      expect(loadResponse.data).to.be.deep.equal(meta.data);
    });
  });
});
