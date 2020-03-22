import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { RenovationError } from "..";

import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";

describe("Frappe Meta Controller", function() {
  let renovation: Renovation;
  this.timeout(10000);

  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("getDocCount", function() {
    it("should return some count for Item", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocCount-success");
      const resp = await renovation.meta.getDocCount({ doctype: "Item" });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data).greaterThan(0);
    });

    it("should return some count for Item [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocCount-success");
      const resp = await renovation.meta.getDocCount("Item");
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data).greaterThan(0);
    });

    it("should only return count = 1 for item with name filter", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocCount-success-one-item");
      const resp = await renovation.meta.getDocCount({
        doctype: "Item",
        filters: {
          name: ["=", "Item A"]
        }
      });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data).equals(1);
    });

    it("should only return count = 1 for item with name filter [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocCount-success-one-item");
      const resp = await renovation.meta.getDocCount("Item", {
        name: ["=", "Item A"]
      });
      completeRecording();
      expect(resp.success).to.be.true;
      expect(resp.data).equals(1);
    });

    it("should return with failure if the doctype doesn't exist", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocCount-non-existing-doctype");
      const resp = await renovation.meta.getDocCount({
        doctype: "NON EXISTING"
      });
      completeRecording();
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
  });

  describe("getDocMeta", function() {
    it("should return DocType Obj for Sales Invoice", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocType-success");

      const docResponse = await renovation.meta.getDocMeta({
        doctype: "Sales Invoice"
      });
      completeRecording();
      expect(docResponse.data.doctype).equals("Sales Invoice");
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return DocType Obj for Sales Invoice [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocType-success");

      const docResponse = await renovation.meta.getDocMeta("Sales Invoice");
      completeRecording();
      expect(docResponse.data.doctype).equals("Sales Invoice");
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return DocType Obj for Sales Invoice [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocType-success");

      const docResponse = await renovation.meta.loadDocType("Sales Invoice");
      completeRecording();
      expect(docResponse.data.doctype).equals("Sales Invoice");
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return a failure for a non-existing DocType", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocType-non-existing-doctype");

      const docResponse = await renovation.meta.getDocMeta({
        doctype: "NON EXISTING"
      });
      completeRecording();
      expect(docResponse.success).to.be.false;
      expect(docResponse.httpCode).to.be.equal(404);
      expect(docResponse.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(docResponse.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
  });

  describe("getDocInfo", function() {
    it("should return DocInfo with infos like attachments", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocInfo-success");
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "Item",
        docname: "Item A"
      });

      completeRecording();
      expect(dInfoResponse.success).to.be.true;
      expect(dInfoResponse.httpCode).to.be.equal(200);
      expect(dInfoResponse.data.attachments).length.greaterThan(-1);
    });

    it("should return DocInfo with infos like attachments [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocInfo-success");
      const dInfoResponse = await renovation.meta.getDocInfo("Item", "Item A");

      completeRecording();
      expect(dInfoResponse.success).to.be.true;
      expect(dInfoResponse.httpCode).to.be.equal(200);
      expect(dInfoResponse.data.attachments).length.greaterThan(-1);
    });

    it("should return a failure for non-existing doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocInfo-non-existing-doctype");
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "NON EXISTING",
        docname: "NON EXISTING"
      });

      completeRecording();
      expect(dInfoResponse.success).to.be.false;
      expect(dInfoResponse.httpCode).to.be.equal(404);
      expect(dInfoResponse.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });

    it("should return a failure for non-existing docname", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocInfo-non-existing-docname");
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "Item",
        docname: "NON EXISTING"
      });

      completeRecording();
      expect(dInfoResponse.success).to.be.false;
      expect(dInfoResponse.httpCode).to.be.equal(404);
      expect(dInfoResponse.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return a failure for doctype without docinfo", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocInfo-success-without-docinfo");
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "Item",
        docname: "Item A"
      });

      completeRecording();
      expect(dInfoResponse.success).to.be.false;
      expect(dInfoResponse.httpCode).to.be.equal(404);
      expect(dInfoResponse.error.title).to.be.equal("DocInfo Not Found");
    });
  });

  describe("getReportMeta", function() {
    it("should get the report's meta [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getReportMeta-success");
      const reportMeta = await renovation.meta.getReportMeta("General Ledger");
      completeRecording();
      expect(reportMeta.success).to.be.true;
      expect(reportMeta.data.doctype).to.be.equal("Renovation Report");
      expect(reportMeta.data.name).to.be.equal("General Ledger");
    });
    it("should get the report's meta", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getReportMeta-success");
      const reportMeta = await renovation.meta.getReportMeta({
        report: "General Ledger"
      });
      completeRecording();
      expect(reportMeta.success).to.be.true;
      expect(reportMeta.data.doctype).to.be.equal("Renovation Report");
      expect(reportMeta.data.name).to.be.equal("General Ledger");
    });

    it("should not get the report's meta of non-existing", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getReportMeta-fail-non-existing");
      const reportMeta = await renovation.meta.getReportMeta({
        report: "NON-EXISTING"
      });
      completeRecording();
      expect(reportMeta.success).to.be.false;
      expect(reportMeta.httpCode).to.be.equal(404);
      expect(reportMeta.error.title).to.be.equal(
        "Renovation Report does not exist"
      );
    });
  });
});
