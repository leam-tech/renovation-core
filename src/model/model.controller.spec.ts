import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import RenovationDocument from "./document";
import ModelController from "./model.controller";

describe("ModelController", function() {
  this.timeout(10000);
  let renovation: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const testDoctype = "Renovation User Agreement";

  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  afterEach(function() {
    renovation.model.clearCache();
  });
  describe("Initializing", function() {
    it("should be initialized with its properties", function() {
      expect(ModelController.newNameCount).to.be.deep.equal({});
      expect(renovation.model.locals).to.be.deep.equal({});
    });
  });

  describe("newDoc", function() {
    it("should create a new RenovationDocument", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation User Agreement"
      });
      expect(newDoc.doctype).to.be.equal(testDoctype);
      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(newDoc.docstatus).to.be.equal(0);
      expect(newDoc.__islocal).to.be.equal(1);
      expect(newDoc.__unsaved).to.be.equal(1);
      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 1`]
      ).to.be.deep.equal(newDoc);
    });

    it("should create a new RenovationDocument [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc("Renovation User Agreement");
      expect(newDoc.doctype).to.be.equal(testDoctype);
      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(newDoc.docstatus).to.be.equal(0);
      expect(newDoc.__islocal).to.be.equal(1);
      expect(newDoc.__unsaved).to.be.equal(1);
      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 1`]
      ).to.be.deep.equal(newDoc);
    });
  });

  describe("getNewName", function() {
    it("should return a new RenovationDocument", async function() {
      const newName = await renovation.model.getNewName({
        doctype: testDoctype
      });
      expect(newName).to.be.equal(`New ${testDoctype} 1`);
      expect(ModelController.newNameCount[testDoctype]).to.be.equal(1);
    });
    it("should return a new RenovationDocument [deprecated]", async function() {
      const newName = await renovation.model.getNewName(testDoctype);
      expect(newName).to.be.equal(`New ${testDoctype} 1`);
      expect(ModelController.newNameCount[testDoctype]).to.be.equal(1);
    });
    it("should return a new RenovationDocument with a number 4", async function() {
      ModelController.newNameCount[testDoctype] = 3;
      const newName = await renovation.model.getNewName({
        doctype: testDoctype
      });
      expect(newName).to.be.equal(`New ${testDoctype} 4`);
      expect(ModelController.newNameCount[testDoctype]).to.be.equal(4);
    });
  });

  describe("copyDoc", function() {
    it("should clone the document with new name", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING COPY DOC";

      const copiedDoc = await renovation.model.copyDoc({ doc: newDoc });

      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(copiedDoc.name).to.be.equal(`New ${testDoctype} 2`);
      expect(newDoc.title).to.be.equal(copiedDoc.title);
    });

    it("should clone the document with new name", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      newDoc.title = "TESTING COPY DOC DEPRECATED";

      const copiedDoc = await renovation.model.copyDoc(newDoc);

      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(copiedDoc.name).to.be.equal(`New ${testDoctype} 2`);
      expect(newDoc.title).to.be.equal(copiedDoc.title);
    });
  });

  describe("amendDoc", function() {
    it("should clone and add amended_from to the cloned document", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });

      const amendedDoc = await renovation.model.amendDoc({ doc: newDoc });

      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(amendedDoc.name).to.be.equal(`New ${testDoctype} 2`);
      expect(amendedDoc.amended_from).to.be.equal(`New ${testDoctype} 1`);
    });
    it("should clone and add amended_from to the cloned document [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });

      const amendedDoc = await renovation.model.amendDoc(newDoc);

      expect(newDoc.name).to.be.equal(`New ${testDoctype} 1`);
      expect(amendedDoc.name).to.be.equal(`New ${testDoctype} 2`);
      expect(amendedDoc.amended_from).to.be.equal(`New ${testDoctype} 1`);
    });
  });

  describe("addChildDoc", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );
    it("should fail on non-existing doctype", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "NON-EXISTING" });

      expect(
        async () =>
          await renovation.model.addChildDoc({
            doc: newDoc,
            field: "non-existing"
          })
      ).to.throw;
    });

    it("should fail on non-existing field", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: testDoctype
      });

      expect(
        async () =>
          await renovation.model.addChildDoc({
            doc: newDoc,
            field: "non-existing"
          })
      ).to.throw;
    });
    it("should successfully get child doc when it's not defined in the input RenovationDocument", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation Review"
      });

      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: "reviews"
      });

      expect(childDoc.parent).to.be.equal("New Renovation Review 1");
      expect(childDoc.parenttype).to.be.equal("Renovation Review");
      expect(childDoc.idx).to.be.equal(1);
      expect(newDoc.reviews).to.be.a("Array");
      expect(newDoc.reviews.length).to.be.equal(1);
      expect(newDoc.reviews[0].name).to.be.equal(
        "New Renovation Review Item 1"
      );
    });

    it("should successfully get child doc when the field is predefined in the input RenovationDocument", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation Review"
      });
      const predefinedChildDoc = await renovation.model.newDoc({
        doctype: "Renovation Review Item"
      });
      newDoc.reviews = [predefinedChildDoc];

      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: "reviews"
      });

      expect(childDoc.parent).to.be.equal("New Renovation Review 1");
      expect(childDoc.parenttype).to.be.equal("Renovation Review");
      expect(childDoc.idx).to.be.equal(2);
      expect(newDoc.reviews).to.be.a("Array");
      expect(newDoc.reviews.length).to.be.equal(2);
      expect(newDoc.reviews[0].name).to.be.equal(
        "New Renovation Review Item 1"
      );
    });

    it("should successfully get child doc when the field is predefined in the input RenovationDocument [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation Review"
      });
      const predefinedChildDoc = await renovation.model.newDoc({
        doctype: "Renovation Review Item"
      });
      newDoc.reviews = [predefinedChildDoc];

      const childDoc = await renovation.model.addChildDoc(newDoc, "reviews");

      expect(childDoc.parent).to.be.equal("New Renovation Review 1");
      expect(childDoc.parenttype).to.be.equal("Renovation Review");
      expect(childDoc.idx).to.be.equal(2);
      expect(newDoc.reviews).to.be.a("Array");
      expect(newDoc.reviews.length).to.be.equal(2);
      expect(newDoc.reviews[0].name).to.be.equal(
        "New Renovation Review Item 1"
      );
    });

    it("should return a childDoc with DocField as input for field", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation Review"
      });
      const docMeta = await renovation.meta.getDocMeta({
        doctype: "Renovation Review"
      });

      const reviewsField = docMeta.data.fields.find(
        field => field.fieldname === "reviews"
      );

      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: reviewsField
      });

      expect(childDoc.parent).to.be.equal("New Renovation Review 1");
      expect(childDoc.parenttype).to.be.equal("Renovation Review");
      expect(childDoc.idx).to.be.equal(1);
      expect(newDoc.reviews).to.be.a("Array");
      expect(newDoc.reviews.length).to.be.equal(1);
      expect(newDoc.reviews[0].name).to.be.equal(
        "New Renovation Review Item 1"
      );
    });
  });

  describe("getDoc", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );
    it("should return the RenovationDocument if the input is an object", async function() {
      const getDocument = await renovation.model.getDoc({
        doctype: testDoctype
      });
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });
    it("should return failure if the input is a doctype string and name and isn't defined in locals", async function() {
      const getDocument = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: "non-existing"
      });
      expect(getDocument.success).to.be.false;
      expect(getDocument.httpCode).to.be.equal(404);
    });
    it("should return RenovationDocument if the input is a doctype string and name and is defined in locals", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });

      const getDocument = await renovation.model.getDoc({
        doctype: testDoctype,
        docname: `New ${testDoctype} 1`
      });
      expect(getDocument.success).to.be.true;
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });

    // tslint:disable-next-line:max-line-length
    it("should return RenovationDocument if the input is a doctype string and name and is defined in locals [deprecated]", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });

      const getDocument = await renovation.model.getDoc(
        testDoctype,
        `New ${testDoctype} 1`
      );
      expect(getDocument.success).to.be.true;
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });
  });

  describe("setLocalValue", function() {
    it("should throw error if the doctype is not in the local cache", function() {
      expect(() =>
        renovation.model.setLocalValue({
          doctype: testDoctype,
          docname: "TEST SET LOCAL VALUE",
          docfield: "reviewed_by",
          value: "test"
        })
      ).to.throw(`Cache doc not found: ${testDoctype}:TEST SET LOCAL VALUE`);
    });
    it("should throw error if the document is not in the local cache", function() {
      renovation.model.locals[testDoctype] = {};
      expect(() =>
        renovation.model.setLocalValue({
          doctype: testDoctype,
          docname: "TEST SET LOCAL VALUE",
          docfield: "reviewed_by",
          value: "test"
        })
      ).to.throw(`Cache doc not found: ${testDoctype}:TEST SET LOCAL VALUE`);
    });
    it("should set the value for the local document", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });
      renovation.model.setLocalValue({
        doctype: testDoctype,
        docname: `New ${testDoctype} 1`,
        docfield: "reviewed_by",
        value: "test"
      });

      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 1`].reviewed_by
      ).to.be.equal("test");
    });
    it("should set the value for the local document [deprecated]", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });
      renovation.model.setLocalValue(
        testDoctype,
        `New ${testDoctype} 1`,
        "reviewed_by",
        "test"
      );

      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 1`].reviewed_by
      ).to.be.equal("test");
    });
  });

  describe("addToLocals", function() {
    it("should add if the cache doesn't have the doctype", async function() {
      expect(renovation.model.locals[testDoctype]).to.be.undefined;
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      renovation.model.addToLocals({ doc: newDoc });

      expect(renovation.model.locals[testDoctype]).has.key(
        `New ${testDoctype} 1`
      );
    });

    it("should add if the cache doesn't have the doctype [deprecated]", async function() {
      expect(renovation.model.locals[testDoctype]).to.be.undefined;
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      renovation.model.addToLocals(newDoc);

      expect(renovation.model.locals[testDoctype]).has.key(
        `New ${testDoctype} 1`
      );
    });

    it("should add and create a new name if no name is provided", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: testDoctype });
      delete newDoc.name;
      renovation.model.addToLocals({ doc: newDoc });

      expect(renovation.model.locals[testDoctype][`New ${testDoctype} 2`]).to.be
        .not.undefined;

      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 2`].docstatus
      ).to.be.equal(0);
      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 2`].__islocal
      ).to.be.equal(1);

      expect(
        renovation.model.locals[testDoctype][`New ${testDoctype} 2`].__unsaved
      ).to.be.equal(1);
    });

    it("should add child docs to cache", async function() {
      renovation.model.locals = {};
      const newDoc = await renovation.model.newDoc({
        doctype: "Renovation Review"
      });

      const childDoc = await renovation.model.addChildDoc(newDoc, "reviews");

      renovation.model.addToLocals({ doc: newDoc });

      expect(
        renovation.model.locals["Renovation Review"]["New Renovation Review 1"]
      ).to.be.not.undefined;

      expect(
        renovation.model.locals["Renovation Review Item"][
          "New Renovation Review Item 1"
        ]
      ).to.be.not.undefined;
    });
  });

  describe("getFromLocals", function() {
    it("should return null if the doctype doesn't exist in the local cache", function() {
      const localDoc = renovation.model.getFromLocals({
        doctype: testDoctype,
        docname: "TEST GET FROM LOCALS"
      });

      expect(localDoc).to.be.null;
    });
    it("should return null if the doctype doesn't exist in the local cache [deprecated]", function() {
      const localDoc = renovation.model.getFromLocals(
        testDoctype,
        "TEST GET FROM LOCALS"
      );

      expect(localDoc).to.be.null;
    });
    it("should return null if the docname doesn't exist in the local cache", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });
      const localDoc = renovation.model.getFromLocals({
        doctype: testDoctype,
        docname: "TEST GET FROM LOCALS"
      });
      expect(localDoc).to.be.null;
    });

    it("should return the document if it exists in the local cache", async function() {
      await renovation.model.newDoc({ doctype: testDoctype });
      const localDoc = renovation.model.getFromLocals({
        doctype: testDoctype,
        docname: `New ${testDoctype} 1`
      });
      expect(localDoc).to.not.be.null;
    });
  });

  after(function() {
    // Clear the locals cache
    renovation.model.clearCache();
  });
});
