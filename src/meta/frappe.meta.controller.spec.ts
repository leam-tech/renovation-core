import { expect } from "chai";
import { RenovationError } from "..";

import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";

describe("Frappe Meta Controller", function() {
  let renovation: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const testDoctype = "Renovation Dashboard";

  this.timeout(10000);

  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("getDocCount", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it("should return some count for User", async function() {
      const resp = await renovation.meta.getDocCount({ doctype: "User" });

      expect(resp.success).to.be.true;
      expect(resp.data).greaterThan(0);
    });

    it("should return some count for User [deprecated]", async function() {
      const resp = await renovation.meta.getDocCount("User");

      expect(resp.success).to.be.true;
      expect(resp.data).greaterThan(0);
    });

    it("should only return count = 1 for item with name filter", async function() {
      const resp = await renovation.meta.getDocCount({
        doctype: "Chat Profile",
        filters: {
          name: ["LIKE", validUser]
        }
      });

      expect(resp.success).to.be.true;
      expect(resp.data).equals(1);
    });

    it("should only return count = 1 for item with name filter [deprecated]", async function() {
      const resp = await renovation.meta.getDocCount("User", {
        name: ["LIKE", validUser]
      });

      expect(resp.success).to.be.true;
      expect(resp.data).equals(1);
    });

    it("should return with failure if the doctype doesn't exist", async function() {
      const resp = await renovation.meta.getDocCount({
        doctype: "NON EXISTING"
      });

      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
  });

  describe("getDocMeta", function() {
    it("should return DocType Obj for Renovation Review", async function() {
      const docResponse = await renovation.meta.getDocMeta({
        doctype: testDoctype
      });

      expect(docResponse.data.doctype).equals(testDoctype);
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return DocType Obj for Renovation Review [deprecated]", async function() {
      const docResponse = await renovation.meta.getDocMeta(testDoctype);

      expect(docResponse.data.doctype).equals(testDoctype);
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return DocType Obj for Renovation Review [deprecated]", async function() {
      const docResponse = await renovation.meta.loadDocType(testDoctype);

      expect(docResponse.data.doctype).equals(testDoctype);
      expect(docResponse.data.fields).length.gte(0);
    });

    it("should return a failure for a non-existing DocType", async function() {
      const docResponse = await renovation.meta.getDocMeta({
        doctype: "NON EXISTING"
      });
      expect(docResponse.success).to.be.false;
      expect(docResponse.httpCode).to.be.equal(404);
      expect(docResponse.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(docResponse.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
  });

  describe("getDocInfo", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it("should return DocInfo with infos like attachments", async function() {
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "User",
        docname: validUser
      });

      expect(dInfoResponse.success).to.be.true;
      expect(dInfoResponse.httpCode).to.be.equal(200);
      expect(dInfoResponse.data.attachments).length.greaterThan(-1);
    });

    it("should return DocInfo with infos like attachments [deprecated]", async function() {
      const dInfoResponse = await renovation.meta.getDocInfo("User", validUser);

      expect(dInfoResponse.success).to.be.true;
      expect(dInfoResponse.httpCode).to.be.equal(200);
      expect(dInfoResponse.data.attachments).length.greaterThan(-1);
    });

    it("should return a failure for non-existing doctype", async function() {
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "NON EXISTING",
        docname: "NON EXISTING"
      });

      expect(dInfoResponse.success).to.be.false;
      expect(dInfoResponse.httpCode).to.be.equal(404);
      expect(dInfoResponse.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });

    it("should return a failure for non-existing docname", async function() {
      const dInfoResponse = await renovation.meta.getDocInfo({
        doctype: "User",
        docname: "NON EXISTING"
      });

      expect(dInfoResponse.success).to.be.false;
      expect(dInfoResponse.httpCode).to.be.equal(404);
      expect(dInfoResponse.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
  });

  describe("getReportMeta", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it("should get the report's meta", async function() {
      const reportMeta = await renovation.meta.getReportMeta({
        report: "TEST"
      });

      expect(reportMeta.success).to.be.true;
      expect(reportMeta.data.doctype).to.be.equal("Renovation Report");
      expect(reportMeta.data.name).to.be.equal("TEST");
    });

    it("should get the report's meta [deprecated]", async function() {
      const reportMeta = await renovation.meta.getReportMeta("TEST");

      expect(reportMeta.success).to.be.true;
      expect(reportMeta.data.doctype).to.be.equal("Renovation Report");
      expect(reportMeta.data.name).to.be.equal("TEST");
    });

    it("should not get the report's meta of non-existing", async function() {
      const reportMeta = await renovation.meta.getReportMeta({
        report: "NON-EXISTING"
      });

      expect(reportMeta.success).to.be.false;
      expect(reportMeta.httpCode).to.be.equal(404);
      expect(reportMeta.error.title).to.be.equal(
        "Renovation Report does not exist"
      );
    });
  });
});
