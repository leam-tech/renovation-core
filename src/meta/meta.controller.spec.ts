import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import FrappeMetaController from "./frappe.meta.controller";

/**
 * Tests for methods implemented as part of the abstract class
 */

describe("Meta Controller", function() {
  let renovation!: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const testDoctype = "Blogger";

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
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it(`should get the field label of short_name of doctype ${testDoctype}`, async function() {
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype: testDoctype,
        fieldname: "short_name"
      });

      expect(fieldLabel).to.be.equal("Short Name");
    });

    it(`should get the standard field for doctype ${testDoctype}`, async function() {
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype: testDoctype,
        fieldname: "name"
      });

      expect(fieldLabel).to.be.equal("Name");
    });

    it("should fail to get the fields from the backend", async function() {
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype: "NON-EXISTING DOCTYPE",
        fieldname: "result_field"
      });

      expect(fieldLabel).to.be.equal("result_field");
    });

    it("should get a non-existing field in uppercase", async function() {
      const fieldLabel = await renovation.meta.getFieldLabel({
        doctype: testDoctype,
        fieldname: "non_existing_name"
      });

      expect(fieldLabel).to.be.equal("Non_existing_name");
    });
  });
  describe("getDocMeta", function() {
    it("should get the meta of doc not in the cache", async function() {
      renovation.meta.clearCache();

      const meta = await renovation.meta.getDocMeta({
        doctype: testDoctype
      });

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal(testDoctype);
      expect(renovation.meta.docTypeCache[testDoctype].doctype).to.be.equal(
        testDoctype
      );
    });
  });

  describe("clearCache", function() {
    it("should reset the docTypeCache", async function() {
      const meta = await renovation.meta.getDocMeta({
        doctype: testDoctype
      });

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal(testDoctype);
      expect(renovation.meta.docTypeCache[testDoctype].doctype).to.be.equal(
        testDoctype
      );

      renovation.meta.clearCache();
      expect(renovation.meta.docTypeCache).to.be.deep.equal({});
    });
  });
  describe("loadDocType [deprecated]", function() {
    it("should return with success if the doctype is in the cache", async function() {
      const meta = await renovation.meta.getDocMeta({
        doctype: testDoctype
      });

      expect(meta.success).to.be.true;
      expect(meta.data.doctype).to.be.equal(testDoctype);
      expect(renovation.meta.docTypeCache[testDoctype].doctype).to.be.equal(
        testDoctype
      );

      const metaController = new FrappeMetaController(renovation.config);
      // Simulating having a doctype in cache
      metaController.docTypeCache = { testDoctype: meta.data };

      const loadResponse = await metaController.loadDocType(testDoctype);

      expect(loadResponse.success).to.be.true;
      expect(loadResponse.data).to.be.deep.equal(meta.data);
    });
  });
});
