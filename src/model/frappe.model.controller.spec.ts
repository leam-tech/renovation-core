import { expect } from "chai";
import { ENV_VARIABLES, RenovationError } from "..";

import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";
import RenovationDocument from "./document";
import { GetExportReportParams } from "./interfaces";

describe("Frappe Model Controller", function() {
  let renovation: Renovation;
  this.timeout(30000);

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const validSecondUser = TestManager.secondaryUser;

  const testDoctype = "TEST DOCTYPE";

  before(async function() {
    renovation = await TestManager.init("frappe");
    await renovation.auth.login({
      email: validUser,
      password: validPwd
    });
  });

  afterEach(function() {
    renovation.model.clearCache();
  });

  describe("getDoc", function() {
    it("should return RenovationDocument when proper object is passed", async function() {
      const testDocument = await renovation.model.getDoc({
        doctype: "Test Doctype",
        name: "TD-00001"
      });

      expect(testDocument.success).to.be.true;
      expect(testDocument.data.name).to.equal("TD-00001");
    });

    it("should return RenovationDocument when proper object is passed [deprecated]", async function() {
      const testDocument = await renovation.model.getDoc("User", validUser);

      expect(testDocument.data.name).to.equal(validUser);
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
      const getDoc = await renovation.model.getDoc({
        doctype: "User",
        docname: "NON-EXISTING"
      });

      expect(getDoc.success).to.be.false;
      expect(getDoc.httpCode).to.be.equal(404);
      expect(getDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return RenovationDocument for User", async function() {
      const docResponse = await renovation.model.getDoc({
        doctype: "User",
        docname: validUser
      });

      expect(docResponse.data.name).to.equal(validUser);
    });

    it("should return the document from cache when the document is in locals", async function() {
      await renovation.model.newDoc({ doctype: "User" });
      const cacheDoc = await renovation.model.getDoc({
        doctype: "User",
        docname: "New User 1"
      });
      expect(cacheDoc.success).to.be.true;
      expect(cacheDoc.data).to.be.instanceOf(RenovationDocument);
      expect(cacheDoc.data.name).to.be.equal("New User 1");
    });

    it("should return the document if it's new and not in cache", async function() {
      await renovation.model.newDoc({ doctype: "User" });
      renovation.model.clearCache();
      const cacheDoc = await renovation.model.getDoc({
        doctype: "User",
        docname: "New User 1"
      });
      expect(cacheDoc.success).to.be.true;
      expect(cacheDoc.data).to.be.instanceOf(RenovationDocument);
      expect(cacheDoc.data.name).to.be.equal("New User 1");
    });
  });

  describe("getList", function() {
    it("should return just names of Users for no fields specified", async function() {
      const docResponse = await renovation.model.getList({
        doctype: "User"
      });

      expect(docResponse.success).to.be.true;
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(1);
    });
    it("should return just names of Users for no fields specified [deprecated]", async function() {
      const docResponse = await renovation.model.getList("User");

      expect(docResponse.success).to.be.true;
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(1);
    });

    it("should return name + email for the fields passed in", async function() {
      const docResponse = await renovation.model.getList({
        doctype: "User",
        fields: ["name", "email"]
      });

      expect(docResponse.success).to.equals(true);
      expect(Object.keys(docResponse.data[0]).length).to.be.equal(2);
    });

    it("should return only return 2 users on pagination", async function() {
      const docResponse = await renovation.model.getList({
        doctype: "User",
        filters: [],
        orderBy: "",
        limitPageStart: 0,
        limitPageLength: 2
      });

      expect(docResponse.success).to.equals(true);
      expect(docResponse.data.length).to.be.equal(2);
    });

    it("should return tableField details", async function() {
      const docResponse = await renovation.model.getList({
        doctype: "User",
        tableFields: {
          roles: ["*"]
        }
      });
      expect(docResponse.success).to.equals(true);
      expect(docResponse.data.length).greaterThan(0);
      expect(
        docResponse.data.some(user => (user.roles as [{}]).length > 0)
      ).to.equals(true);
    });

    it("should return all fields", async function() {
      const docResponse = await renovation.model.getList({
        doctype: "User",
        fields: ["*"]
      });
      expect(docResponse.success).to.equals(true);
      expect(docResponse.data[0]).to.be.instanceOf(RenovationDocument);
      expect(Object.keys(docResponse.data[0]).length).to.be.greaterThan(1);
    });
  });

  describe("deleteDoc", async function() {
    it(`should delete a ${testDoctype} successfully`, async function() {
      const doc = await renovation.model.newDoc({
        doctype: testDoctype
      });
      doc.title = "TESTING DELETION";

      const savedDoc = await renovation.model.saveDoc({ doc });
      expect(savedDoc.success).equals(true);
      const deletedDoc = await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: savedDoc.data.name
      });
      expect(deletedDoc.success).to.be.true;
    });

    it(`should delete a ${testDoctype} successfully [deprecated]`, async function() {
      const doc = await renovation.model.newDoc({ doctype: testDoctype });

      doc.title = "TESTING DELETION";
      const savedDoc = await renovation.model.saveDoc({ doc });
      expect(savedDoc.success).equals(true);
      const deletedDoc = await renovation.model.deleteDoc(
        testDoctype,
        savedDoc.data.name
      );
      expect(deletedDoc.success).to.be.true;
    });

    it("should verify doc was deleted from cache too", async function() {
      const doc = await renovation.model.newDoc({
        doctype: testDoctype
      });
      doc.title = "TESTING DELETION";

      const savedDoc = await renovation.model.saveDoc({ doc });
      expect(savedDoc.success).equals(true);
      const docInCache = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: savedDoc.data.name
      });
      expect(docInCache.success).to.be.true;

      const deletedDoc = await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: savedDoc.data.name
      });
      expect(deletedDoc.success).to.be.true;

      // try getDoc after deletion
      const docCache = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: savedDoc.data.name
      });
      expect(docCache.success).to.be.false; // verifies deleted from cache
    });

    it("should fail to delete an doc that doesn't exist", async function() {
      const deletedDoc = await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "non_existing"
      });
      expect(deletedDoc.success).to.be.false;
      expect(deletedDoc.httpCode).to.be.equal(404);
      expect(deletedDoc.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
  });

  describe("getValue", function() {
    const fieldName = "email";
    const fieldValue = TestManager.getVariables(ENV_VARIABLES.PrimaryUserEmail);

    it("should read same email from Primary User", async function() {
      const resp = await renovation.model.getValue({
        doctype: "User",
        docname: validUser,
        docfield: fieldName
      });

      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).to.be.equal(fieldValue);
    });
    it("should read same email from Primary User [deprecated]", async function() {
      const resp = await renovation.model.getValue(
        "User",
        validUser,
        fieldName
      );

      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).to.be.equal(fieldValue);
    });

    it("should return null for non-existing doctype", async function() {
      const resp = await renovation.model.getValue({
        doctype: "NON-EXISTING",
        docname: "non_existing",
        docfield: fieldName
      });

      expect(resp.success).to.be.true;
      expect(resp.data).to.be.undefined;
    });
    it("should return null data for non-existing document", async function() {
      const resp = await renovation.model.getValue({
        doctype: "User",
        docname: "non_existing",
        docfield: fieldName
      });

      expect(resp.success).to.be.true;
      expect(resp.data).to.be.undefined;
    });
    it("should return failure for non-existing field", async function() {
      const resp = await renovation.model.getValue({
        doctype: "User",
        docname: validUser,
        docfield: "non_existing"
      });
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.type).to.be.equal(RenovationError.NotFoundError);
    });
  });

  describe("getReport", function() {
    it("should get report successfully for TEST", async function() {
      const report = await renovation.model.getReport({
        report: "TEST",
        filters: {},
        user: null
      });
      expect(report.success).to.be.true;
    });

    it("should get report successfully for TEST [deprecated]", async function() {
      const report = await renovation.model.getReport("TEST");
      expect(report.success).to.be.true;
    });

    it("should get failure for non-existing report", async function() {
      const report = await renovation.model.getReport({
        report: "NON EXISTING REPORT",
        filters: {}
      });

      expect(report.success).to.be.false;
      expect(report.httpCode).to.be.equal(404);
      expect(report.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });
  });

  describe("setValue", function() {
    const fieldName = "middle_name";
    const fieldValue = Math.random() * 10 + "";
    it("should set middle_name value successfully for Secondary User", async function() {
      const resp = await renovation.model.setValue({
        doctype: "User",
        docname: validSecondUser,
        docfield: fieldName,
        value: fieldValue
      });
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).equals(fieldValue);
    });
    it("should set middle_name value successfully for Secondary User [deprecated]", async function() {
      const resp = await renovation.model.setValue(
        "User",
        validSecondUser,
        fieldName,
        fieldValue
      );
      expect(resp.success).to.be.true;
      expect(resp.data[fieldName]).equals(fieldValue);
    });
    it("should return failure for non-existing doctype", async function() {
      const resp = await renovation.model.setValue({
        doctype: "NON EXISTING",
        docname: validSecondUser,
        docfield: fieldName,
        value: fieldValue
      });
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should return failure for non-existing document", async function() {
      const resp = await renovation.model.setValue({
        doctype: "User",
        docname: "non_existing",
        docfield: fieldName,
        value: fieldValue
      });
      expect(resp.success).to.be.false;
      expect(resp.httpCode).to.be.equal(404);
      expect(resp.error.title).to.be.equal(
        RenovationController.DOCNAME_NOT_EXIST_TITLE
      );
    });

    it("should return failure for non-existing field", async function() {
      const resp = await renovation.model.setValue({
        doctype: "User",
        docname: "non_existing",
        docfield: fieldName,
        value: fieldValue
      });
      expect(resp.success).equals(false);
      expect(resp.httpCode).to.be.equal(404);
    });
  });

  describe("saveDoc", function() {
    before(async () => {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING SAVE DUPLICATE";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });
    });

    it("should save document successfully and add to cache", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING SAVE";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });
      expect(savedDoc.success).to.be.true;
      expect(renovation.model.locals[testDoctype][savedDoc.data.name]).to.not.be
        .undefined;
    });
    it("should save document successfully and add to cache [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING SAVE 2";
      const savedDoc = await renovation.model.saveDoc(newDoc);
      expect(savedDoc.success).to.be.true;
      expect(renovation.model.locals[testDoctype][savedDoc.data.name]).to.not.be
        .undefined;
    });

    it("should fail if duplicated", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING SAVE DUPLICATE";
      const savedDoc = await renovation.model.saveDoc({ doc: newDoc });

      expect(savedDoc.success).to.be.false;
      expect(savedDoc.httpCode).to.be.equal(409);
      expect(savedDoc.error.title).to.be.equal("Duplicate document found");
    });
    after(async () => {
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SAVE"
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SAVE 2"
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SAVE DUPLICATE"
      });
    });
  });

  describe("submitDoc", function() {
    before(async () => {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "EXISTING TESTING SUBMISSION";
      await renovation.model.submitDoc({ doc: newDoc });

      const newDoc2 = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc2.title = "TESTING SUBMISSION";
      await renovation.model.saveDoc({ doc: newDoc2 });
    });

    it("should submit a submittable document successfully", async function() {
      const response = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "TESTING SUBMISSION"
      });
      const submitDoc = await renovation.model.submitDoc({
        doc: response.data
      });

      expect(submitDoc.success).to.be.true;
      expect(submitDoc.data.name).to.be.equal("TESTING SUBMISSION");
      expect(renovation.model.locals[testDoctype]["TESTING SUBMISSION"]).to.not
        .be.undefined;
      expect(submitDoc.data.__islocal).to.be.equal(0);
      expect(submitDoc.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const submitDoc = await renovation.model.submitDoc({ doc: newDoc });

      expect(submitDoc.success).to.be.false;
      expect(submitDoc.httpCode).to.be.equal(404);
      expect(submitDoc.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: testDoctype
      });

      newDoc.title = "TESTING SUBMISSION";

      const submitDoc = await renovation.model.submitDoc({ doc: newDoc });

      expect(submitDoc.success).to.be.false;
      expect(submitDoc.httpCode).to.be.equal(400);
    });

    // FIXME: Fix validation for non-submittable docs
    it("should fail for non-submittable document", async function() {
      // const getDoc = await renovation.model.getDoc({
      //   doctype: "User",
      //   docname: validSecondUser
      // });
      // const submitDoc = await renovation.model.submitDoc({ doc: getDoc.data });
      //
      // expect(submitDoc.success).to.be.false;
      // expect(submitDoc.httpCode).to.be.equal(400);
    });

    after(async () => {
      const firstDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "TESTING SUBMISSION"
      });
      await renovation.model.cancelDoc({
        doc: firstDoc.data
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SUBMISSION"
      });

      const secondDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "EXISTING TESTING SUBMISSION"
      });
      await renovation.model.cancelDoc({
        doc: secondDoc.data
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "EXISTING TESTING SUBMISSION"
      });
    });
  });

  describe("saveSubmitDoc", function() {
    before(async () => {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "EXISTING TESTING SAVING AND SUBMISSION";
      await renovation.model.submitDoc({ doc: newDoc });
    });

    it(`should create and submit ${testDoctype}`, async function() {
      const d = await renovation.model.newDoc({ doctype: testDoctype });
      d.title = "TESTING SAVING AND SUBMISSION";
      const r = await renovation.model.saveSubmitDoc({ doc: d });

      expect(r.success).to.be.true;
      expect(d.docstatus).to.be.equal(1);
      expect(
        renovation.model.locals[testDoctype]["TESTING SAVING AND SUBMISSION"]
      ).to.be.not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it(`should create and submit ${testDoctype} [deprecated]`, async function() {
      const d = await renovation.model.newDoc({ doctype: testDoctype });
      d.title = "TESTING SAVING AND SUBMISSION 2";
      const r = await renovation.model.saveSubmitDoc(d);

      expect(r.success).to.be.true;
      expect(d.docstatus).to.be.equal(1);
      expect(
        renovation.model.locals[testDoctype]["TESTING SAVING AND SUBMISSION 2"]
      ).to.be.not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const saveSubmitDoc = await renovation.model.saveSubmitDoc({
        doc: newDoc
      });

      expect(saveSubmitDoc.success).to.be.false;
      expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: testDoctype
      });

      const saveSubmitDoc = await renovation.model.saveSubmitDoc({
        doc: newDoc
      });

      expect(saveSubmitDoc.success).to.be.false;
      expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });

    // FIXME: Fix validation for non-submittable docs
    it("should fail for non-submittable document", async function() {
      // const getDoc = await renovation.model.getDoc({
      //   doctype: "User",
      //   docname: validSecondUser
      // });
      // const saveSubmitDoc = await renovation.model.saveSubmitDoc({
      //   doc: getDoc.data
      // });
      //
      // expect(saveSubmitDoc.success).to.be.false;
      // expect(saveSubmitDoc.httpCode).to.be.equal(400);
    });

    after(async () => {
      const firstDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "TESTING SAVING AND SUBMISSION"
      });
      await renovation.model.cancelDoc({
        doc: firstDoc.data
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SAVING AND SUBMISSION"
      });

      const secondDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "EXISTING TESTING SAVING AND SUBMISSION"
      });
      await renovation.model.cancelDoc({
        doc: secondDoc.data
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "EXISTING TESTING SAVING AND SUBMISSION"
      });

      const thirdDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "TESTING SAVING AND SUBMISSION 2"
      });
      await renovation.model.cancelDoc({
        doc: thirdDoc.data
      });
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING SAVING AND SUBMISSION 2"
      });
    });
  });

  describe("cancelDoc", function() {
    before(async () => {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING CANCELLATION";
      await renovation.model.submitDoc({ doc: newDoc });

      const newDoc2 = await renovation.model.newDoc({ doctype: "User" });
      newDoc.email = "cancel@cancel.cancel";
      newDoc.first_name = "TESTING CANCELLATION";
      await renovation.model.saveDoc({ doc: newDoc2 });
    });
    it("should cancel a submitted document", async function() {
      const getDoc = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "TESTING CANCELLATION"
      });
      const r = await renovation.model.cancelDoc({ doc: getDoc.data });

      expect(r.success).to.be.true;
      expect(r.data.docstatus).to.be.equal(2);
      expect(renovation.model.locals[testDoctype]["TESTING CANCELLATION"]).to.be
        .not.undefined;
      expect(r.data.__islocal).to.be.equal(0);
      expect(r.data.__unsaved).to.be.equal(0);
    });

    it("should fail for non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "non-existing" });

      const cancelDoc = await renovation.model.cancelDoc({ doc: newDoc });

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-existing document", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: testDoctype
      });

      const cancelDoc = await renovation.model.cancelDoc({ doc: newDoc });

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
    it("should fail for non-submittable document", async function() {
      const getDoc = await renovation.model.getDoc({
        doctype: "User",
        docname: "cancel@cancel.cancel"
      });
      const cancelDoc = await renovation.model.cancelDoc({ doc: getDoc.data });

      expect(cancelDoc.success).to.be.false;
      expect(cancelDoc.httpCode).to.be.equal(400);
    });
    after(async () => {
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: "TESTING CANCELLATION"
      });
      await renovation.model.deleteDoc({
        doctype: "User",
        docname: "cancel@cancel.cancel"
      });
    });
  });

  describe("searchLink", function() {
    it("should get results for User", async function() {
      const searchResult = await renovation.model.searchLink({
        doctype: "User",
        txt: validUser.substring(0, 3)
      });
      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(1);
    });

    it("should get results for User [deprecated]", async function() {
      const searchResult = await renovation.model.searchLink(
        "User",
        validUser.substring(0, 3)
      );

      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(1);
    });

    it("should fail for non-existing doctype", async function() {
      const searchResult = await renovation.model.searchLink({
        doctype: "NON-EXISTING",
        txt: validUser
      });

      expect(searchResult.success).to.be.false;
      expect(searchResult.httpCode).to.be.equal(404);
      expect(searchResult.error.title).to.be.equal(
        RenovationController.DOCTYPE_NOT_EXIST_TITLE
      );
    });

    it("should return success with empty array", async function() {
      const searchResult = await renovation.model.searchLink({
        doctype: "User",
        txt: "non-existing"
      });

      expect(searchResult.success).to.be.true;
      expect(searchResult.data).to.be.instanceOf(Array);
      expect(searchResult.data.length).to.be.equal(0);
    });
  });

  describe("Tags", function() {
    before(async () => await renovation.frappe.loadAppVersions());
    describe("addTag", function() {
      before(async () => {
        await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "DUPLICATE TAG"
        });
      });
      it("should add a tag to a document User", async function() {
        const addTag = await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST TAG"
        });

        expect(addTag.success).to.be.true;
        expect(addTag.data).to.be.equal("TEST TAG");
      });

      it("should add a tag to a document User [deprecated]", async function() {
        const addTag = await renovation.model.addTag(
          "User",
          validSecondUser,
          "TEST TAG 2"
        );

        expect(addTag.success).to.be.true;
        expect(addTag.data).to.be.equal("TEST TAG 2");
      });

      it("should fail for non-existing doctype", async function() {
        const addTag = await renovation.model.addTag({
          doctype: "non-existing",
          docname: validSecondUser,
          tag: "TEST TAG"
        });

        expect(addTag.success).to.be.false;
        expect(addTag.httpCode).to.be.equal(404);
        expect(addTag.error.title).to.be.equal(
          RenovationController.DOCTYPE_NOT_EXIST_TITLE
        );
      });
      it("should fail for non-existing document", async function() {
        const addTag = await renovation.model.addTag({
          doctype: "User",
          docname: "non_existing",
          tag: "TEST TAG"
        });

        expect(addTag.success).to.be.false;
        expect(addTag.httpCode).to.be.equal(404);
        expect(addTag.error.title).to.be.equal(
          RenovationController.DOCNAME_NOT_EXIST_TITLE
        );
      });
      it("should not fail for duplicate tag", async function() {
        const addTag = await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "DUPLICATE TAG"
        });

        expect(addTag.success).to.be.true;
      });
      it("should not fail for empty string", async function() {
        const addTag = await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: ""
        });
        expect(addTag.success).to.be.true;
      });

      after(async () => {
        await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST TAG"
        });

        await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST TAG 2"
        });

        await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "DUPLICATE TAG"
        });

        await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: ""
        });
      });
    });

    describe("removeTag", function() {
      before(async () => {
        await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST REMOVE TAG"
        });

        await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST REMOVE TAG 2"
        });
      });

      it("should remove a tag from a document User", async function() {
        const addTag = await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST REMOVE TAG"
        });

        expect(addTag.success).to.be.true;
        // response.data can have _debug_messages
        // expect(addTag.data).to.be.deep.equal({});
      });

      it("should remove a tag from a document User [deprecated]", async function() {
        const addTag = await renovation.model.removeTag(
          "User",
          validSecondUser,
          "TEST REMOVE TAG 2"
        );

        expect(addTag.success).to.be.true;
        // response.data can have _debug_messages
        // expect(addTag.data).to.be.deep.equal({});
      });
      it("should fail for non-existing doctype", async function() {
        const addTag = await renovation.model.removeTag({
          doctype: "non-existing",
          docname: validSecondUser,
          tag: "TEST REMOVE TAG"
        });

        expect(addTag.success).to.be.false;
        expect(addTag.httpCode).to.be.equal(404);
        expect(addTag.error.title).to.be.equal(
          RenovationController.DOCTYPE_NOT_EXIST_TITLE
        );
      });
      it("should fail for non-existing document", async function() {
        const addTag = await renovation.model.removeTag({
          doctype: "User",
          docname: "non_existing",
          tag: "TEST REMOVE TAG"
        });

        expect(addTag.success).to.be.false;
        expect(addTag.httpCode).to.be.equal(404);
        expect(addTag.error.title).to.be.equal(
          RenovationController.DOCNAME_NOT_EXIST_TITLE
        );
      });
      it("should not fail for non-existing tag", async function() {
        const addTag = await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "tag-non-existing"
        });

        expect(addTag.success).to.be.true;
      });
    });

    describe("getTaggedDocs", function() {
      before(async () => {
        await renovation.model.addTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST GET DOCS"
        });

        await renovation.model.addTag({
          doctype: "User",
          docname: validUser,
          tag: "TEST GET DOCS"
        });
      });

      it("should get 2 document names with tag 'TEST GET DOCS'", async function() {
        const getTaggedDocs = await renovation.model.getTaggedDocs({
          doctype: "User",
          tag: "TEST GET DOCS"
        });

        expect(getTaggedDocs.success).to.be.true;
        expect(getTaggedDocs.data).to.an.instanceOf(Array);
        expect(getTaggedDocs.data.length).to.be.equal(2);
      });

      it("should get 2 document names with tag 'TEST GET DOCS' [deprecated]'", async function() {
        const getTaggedDocs = await renovation.model.getTaggedDocs(
          "User",
          "TEST GET DOCS"
        );

        expect(getTaggedDocs.success).to.be.true;
        expect(getTaggedDocs.data).to.an.instanceOf(Array);
        expect(getTaggedDocs.data.length).to.be.equal(2);
      });
      it("should fail for non-existing doctype", async function() {
        const getTaggedDocs = await renovation.model.getTaggedDocs({
          doctype: "non-existing",
          tag: "TEST GET DOCS"
        });

        expect(getTaggedDocs.success).to.be.false;
        expect(getTaggedDocs.httpCode).to.be.equal(400);
      });
      it("should return empty array non-existing tag", async function() {
        const getTaggedDocs = await renovation.model.getTaggedDocs({
          doctype: "User",
          tag: "non-existing"
        });

        expect(getTaggedDocs.success).to.be.true;

        expect(getTaggedDocs.data).to.an.instanceOf(Array);
        expect(getTaggedDocs.data.length).to.be.equal(0);
      });
      after(async () => {
        await renovation.model.removeTag({
          doctype: "User",
          docname: validUser,
          tag: "TEST GET DOCS"
        });

        await renovation.model.removeTag({
          doctype: "User",
          docname: validSecondUser,
          tag: "TEST GET DOCS"
        });
      });
    });

    describe("getTags", function() {
      const tags = ["FIRST TAG", "SECOND TAG", "THIRD TAG"];
      before(async () => {
        for (const t of tags) {
          await renovation.model.addTag({
            doctype: "User",
            docname: validSecondUser,
            tag: t
          });
        }
      });

      it("should get 3 tags for the doctype User", async function() {
        const getTags = await renovation.model.getTags({ doctype: "User" });

        expect(getTags.success).to.be.true;
        expect(getTags.data).to.an.instanceOf(Array);
        expect(tags.every(x => getTags.data.includes(x))).to.be.true;
      });
      it("should get 3 tags for the doctype User [deprecated]", async function() {
        const getTags = await renovation.model.getTags("User");

        expect(getTags.success).to.be.true;
        expect(getTags.data).to.an.instanceOf(Array);
        expect(tags.every(x => getTags.data.includes(x))).to.be.true;
      });
      it("should return empty array for doctype without tags", async function() {
        const getTags = await renovation.model.getTags({
          doctype: testDoctype
        });

        expect(getTags.success).to.be.true;

        expect(getTags.data).to.an.instanceOf(Array);
        // TODO: update this after frappe fixes get_tags
        // expect(getTags.data.length).to.be.equal(0);
      });

      it("should return 1 tag using LIKE SEC", async function() {
        const getTags = await renovation.model.getTags({
          doctype: "User",
          likeTag: "SEC"
        });

        expect(getTags.success).to.be.true;

        expect(getTags.data).to.an.instanceOf(Array);
        expect(getTags.data.length).to.be.equal(1);
      });
      it("should return empty array for non-existing tag", async function() {
        const getTags = await renovation.model.getTags({
          doctype: "User",
          likeTag: "non-existing"
        });

        expect(getTags.success).to.be.true;

        expect(getTags.data).to.an.instanceOf(Array);
        expect(getTags.data.length).to.be.equal(0);
      });

      after(async () => {
        for (const t of tags) {
          await renovation.model.removeTag({
            doctype: "User",
            docname: validSecondUser,
            tag: t
          });
        }
      });
    });
  });

  describe("Assigning Docs to User", async function() {
    const testDocName = "TEST-ASSIGN-DOC";
    before(async () => {
      // make testDocType document
      const testDoc = await renovation.model.newDoc({ doctype: testDoctype });
      testDoc.title = testDocName;
      await renovation.model.saveDoc({ doc: testDoc });
    });

    const cleanUpFn = async () => {
      this.timeout(30000);

      const testTodos = await renovation.model.getList({
        doctype: "ToDo"
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
    };

    describe("Assign Doc", function() {
      before(
        async () =>
          await renovation.model.assignDoc({
            assignTo: null,
            myself: true,
            doctype: testDoctype,
            docname: testDocName,
            description: "TESTING ASSIGN DUPLICATE",
            priority: "High",
            dueDate: "2050-12-31"
          })
      );
      it(`should assign ${testDoctype} to Secondary User`, async function() {
        const r = await renovation.model.assignDoc({
          assignTo: validSecondUser,
          doctype: testDoctype,
          docname: testDocName,
          description: "TESTING ASSIGN",
          priority: "High",
          dueDate: "2050-12-31"
        });

        expect(r.success).to.be.true;
      });

      // v13 - doesnt throw error now. It just prints message that the user is assigned already
      // it("should fail assigning same doc to a User since already assigned", async function() {
      //   const r = await renovation.model.assignDoc({
      //     assignTo: null,
      //     myself: true,
      //     doctype: testDoctype,
      //     docname: testDocName,
      //     description: "TESTING ASSIGN DUPLICATE",
      //     priority: "High",
      //     dueDate: "2050-12-31"
      //   });
      //   expect(r.success).to.be.false;
      // });
      after(async () => await cleanUpFn());
    });

    describe("Unassign Doc", function() {
      before(
        async () =>
          await renovation.model.assignDoc({
            assignTo: null,
            myself: true,
            doctype: "User",
            docname: validSecondUser,
            description: "TESTING UNASSIGN",
            priority: "High",
            dueDate: "2050-12-31"
          })
      );

      it("should unassign Primary User", async function() {
        const r = await renovation.model.unAssignDoc({
          unAssignFrom: validUser,
          doctype: "User",
          docname: validSecondUser
        });

        expect(r.success).to.be.true;
      });
      it("should throw error while unassigning a non-existing ToDo", async function() {
        const r = await renovation.model.unAssignDoc({
          unAssignFrom: validUser,
          doctype: "User",
          docname: "Non-existing"
        });

        expect(r.success).to.be.false;
        expect(r.data.exc).to.be.exist;
      });
      after(async () => await cleanUpFn());
    });

    describe("Bulk Assigment", function() {
      it("lets bulk assign some documents to Primary and Secondary User", async function() {
        const r1 = await renovation.model.assignDoc({
          assignTo: null,
          myself: true,
          doctype: "User",
          docnames: [validUser, validSecondUser],
          bulkAssign: true
        });
        const r2 = await renovation.model.assignDoc({
          assignTo: validSecondUser,
          doctype: "User",
          docnames: [validUser, validSecondUser],
          bulkAssign: true
        });

        expect(r1.success).to.be.true;
        expect(r2.success).to.be.true;
      });

      after(async () => await cleanUpFn());
    });

    describe("getDocsAssignedToUser", function() {
      before(async () => {
        await renovation.model.assignDoc({
          assignTo: null,
          myself: true,
          doctype: "User",
          docnames: [validUser, validSecondUser],
          description: "TESTING GET DOCS",
          priority: "High",
          dueDate: "2050-12-31",
          bulkAssign: true
        });
      });

      it("should list Primary User and Secondary User in the list of docs assigned to primary user", async function() {
        const r = await renovation.model.getDocsAssignedToUser({
          assignedTo: validUser
        });

        expect(r.success).to.be.true;
        expect(r.data.length).greaterThan(0);
        expect(
          r.data.filter(
            todo =>
              todo.doctype === "User" &&
              (todo.docname === validUser || todo.docname === validSecondUser)
          ).length
        ).to.be.equal(2);
      });
    });
    describe("getUsersAssignedToDoc", function() {
      before(async () => {
        await renovation.model.assignDoc({
          assignTo: null,
          myself: true,
          doctype: testDoctype,
          docname: testDocName,
          description: "TESTING GET ASSIGNED",
          priority: "High",
          dueDate: "2050-12-31"
        });
        await renovation.model.assignDoc({
          assignTo: validSecondUser,
          doctype: testDoctype,
          docname: testDocName,
          description: "TESTING GET ASSIGNED",
          priority: "High",
          dueDate: "2050-12-31"
        });
      });
      it(`should have Primary & Secondary User in the list of Users assigned to ${testDoctype} ${testDocName}`, async function() {
        const r = await renovation.model.getUsersAssignedToDoc({
          doctype: testDoctype,
          docname: testDocName
        });

        expect(r.success).to.be.true;
        expect(r.data.length).greaterThan(0);
        expect(
          r.data.filter(
            todo =>
              todo.assignedTo === validUser ||
              todo.assignedTo === validSecondUser
          ).length
        ).to.be.greaterThan(1);
      });
      after(async () => await cleanUpFn());
    });
    describe("completeDocAssignment", function() {
      before(async () => {
        await renovation.model.assignDoc({
          assignTo: null,
          myself: true,
          doctype: testDoctype,
          docname: testDocName,
          description: "TESTING COMPLETED",
          priority: "High",
          dueDate: "2050-12-31"
        });
        await renovation.model.assignDoc({
          assignTo: validSecondUser,
          doctype: testDoctype,
          docname: testDocName,
          description: "TESTING COMPLETED",
          priority: "High",
          dueDate: "2050-12-31"
        });
      });
      this.timeout(20000);
      it(`Complete ${testDoctype} Assignments`, async function() {
        const promises = [];
        for (const user of [validUser, validSecondUser]) {
          promises.push(
            renovation.model.completeDocAssignment({
              assignedTo: user,
              doctype: testDoctype,
              docname: testDocName
            })
          );
        }
        const responses = await Promise.all(promises);
        for (const r of responses) {
          expect(r.success).to.be.true;
        }
      });
      after(async () => await cleanUpFn());
    });

    after(async () => {
      await renovation.model.deleteDoc({
        doctype: testDoctype,
        docname: testDocName
      });
    });
  });

  describe("Export Report", function() {
    it("should return the octet stream successfully", async function() {
      const params: GetExportReportParams = {
        includeIndentation: 0,
        visibleIDX: [1, 2, 3, 4, 5, 6],
        reportName: "TEST",
        fileFormatType: "Excel"
      };
      const exportedReport = await renovation.model.exportReport(params);

      expect(exportedReport.success).to.be.true;
    });
  });
});
