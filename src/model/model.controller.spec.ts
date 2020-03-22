import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import RenovationDocument from "./document";
import ModelController from "./model.controller";

describe("ModelController", function() {
  this.timeout(10000);
  let renovation: Renovation;
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
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      expect(newDoc.doctype).to.be.equal("Item");
      expect(newDoc.name).to.be.equal("New Item 1");
      expect(newDoc.docstatus).to.be.equal(0);
      expect(newDoc.__islocal).to.be.equal(1);
      expect(newDoc.__unsaved).to.be.equal(1);
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 1"]).to.be.deep.equal(
        newDoc
      );
    });

    it("should create a new RenovationDocument [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      expect(newDoc.doctype).to.be.equal("Item");
      expect(newDoc.name).to.be.equal("New Item 1");
      expect(newDoc.docstatus).to.be.equal(0);
      expect(newDoc.__islocal).to.be.equal(1);
      expect(newDoc.__unsaved).to.be.equal(1);
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 1"]).to.be.deep.equal(
        newDoc
      );
    });
  });

  describe("getNewName", function() {
    it("should return a new RenovationDocument", async function() {
      const newName = await renovation.model.getNewName({ doctype: "Item" });
      expect(newName).to.be.equal("New Item 1");
      expect(ModelController.newNameCount.Item).to.be.equal(1);
    });
    it("should return a new RenovationDocument [deprecated]", async function() {
      const newName = await renovation.model.getNewName("Item");
      expect(newName).to.be.equal("New Item 1");
      expect(ModelController.newNameCount.Item).to.be.equal(1);
    });
    it("should return a new RenovationDocument with a number 4", async function() {
      ModelController.newNameCount.Item = 3;
      const newName = await renovation.model.getNewName({ doctype: "Item" });
      expect(newName).to.be.equal("New Item 4");
      expect(ModelController.newNameCount.Item).to.be.equal(4);
    });
  });

  describe("copyDoc", function() {
    it("should clone the document with new name", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_name = "ITEM A";

      const copiedDoc = await renovation.model.copyDoc({ doc: newDoc });

      expect(newDoc.name).to.be.equal("New Item 1");
      expect(copiedDoc.name).to.be.equal("New Item 2");
      expect(newDoc.item_name).to.be.equal(copiedDoc.item_name);
    });

    it("should clone the document with new name [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      newDoc.item_name = "ITEM A";

      const copiedDoc = await renovation.model.copyDoc(newDoc);

      expect(newDoc.name).to.be.equal("New Item 1");
      expect(copiedDoc.name).to.be.equal("New Item 2");
      expect(newDoc.item_name).to.be.equal(copiedDoc.item_name);
    });
  });

  describe("amendDoc", function() {
    it("should clone and add amended_from to the cloned document", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });

      const amendedDoc = await renovation.model.amendDoc({ doc: newDoc });

      expect(newDoc.name).to.be.equal("New Item 1");
      expect(amendedDoc.name).to.be.equal("New Item 2");
      expect(amendedDoc.amended_from).to.be.equal("New Item 1");
    });
    it("should clone and add amended_from to the cloned document [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });

      const amendedDoc = await renovation.model.amendDoc(newDoc);

      expect(newDoc.name).to.be.equal("New Item 1");
      expect(amendedDoc.name).to.be.equal("New Item 2");
      expect(amendedDoc.amended_from).to.be.equal("New Item 1");
    });
  });

  describe("addChildDoc", function() {
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
        doctype: "Sales Invoice"
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
        doctype: "Sales Invoice"
      });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("addChildDoc-success");

      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: "items"
      });

      completeRecording();

      expect(childDoc.parent).to.be.equal("New Sales Invoice 1");
      expect(childDoc.parenttype).to.be.equal("Sales Invoice");
      expect(childDoc.idx).to.be.equal(1);
      expect(newDoc.items).to.be.a("Array");
      expect(newDoc.items.length).to.be.equal(1);
      expect(newDoc.items[0].name).to.be.equal("New Sales Invoice Item 1");
    });

    it("should successfully get child doc when the field is predefined in the input RenovationDocument", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });
      const predefinedChildDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice Item"
      });
      newDoc.items = [predefinedChildDoc];

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("addChildDoc-success-child-predefined");

      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: "items"
      });

      completeRecording();

      expect(childDoc.parent).to.be.equal("New Sales Invoice 1");
      expect(childDoc.parenttype).to.be.equal("Sales Invoice");
      expect(childDoc.idx).to.be.equal(2);
      expect(newDoc.items).to.be.a("Array");
      expect(newDoc.items.length).to.be.equal(2);
      expect(newDoc.items[0].name).to.be.equal("New Sales Invoice Item 1");
    });

    it("should successfully get child doc when the field is predefined in the input RenovationDocument [deprecated]", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });
      const predefinedChildDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice Item"
      });
      newDoc.items = [predefinedChildDoc];

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("addChildDoc-success-child-predefined");

      const childDoc = await renovation.model.addChildDoc(newDoc, "items");

      completeRecording();

      expect(childDoc.parent).to.be.equal("New Sales Invoice 1");
      expect(childDoc.parenttype).to.be.equal("Sales Invoice");
      expect(childDoc.idx).to.be.equal(2);
      expect(newDoc.items).to.be.a("Array");
      expect(newDoc.items.length).to.be.equal(2);
      expect(newDoc.items[0].name).to.be.equal("New Sales Invoice Item 1");
    });

    it("should return a childDoc with DocField as input for field", async function() {
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success-sales-invoice");
      const docMeta = await renovation.meta.getDocMeta({
        doctype: "Sales Invoice"
      });
      completeRecording();

      const itemsField = docMeta.data.fields.find(
        field => field.fieldname === "items"
      );

      const recorder = await setupRecorder({
        mode: TestManager.testMode
      })("addChildDoc-success");
      const childDoc = await renovation.model.addChildDoc({
        doc: newDoc,
        field: itemsField
      });
      recorder.completeRecording();
      expect(childDoc.parent).to.be.equal("New Sales Invoice 1");
      expect(childDoc.parenttype).to.be.equal("Sales Invoice");
      expect(childDoc.idx).to.be.equal(1);
      expect(newDoc.items).to.be.a("Array");
      expect(newDoc.items.length).to.be.equal(1);
      expect(newDoc.items[0].name).to.be.equal("New Sales Invoice Item 1");
    });
  });

  describe("getDoc", function() {
    it("should return the RenovationDocument if the input is an object", async function() {
      const getDocument = await renovation.model.getDoc({ doctype: "Item" });
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });
    it("should return failure if the input is a doctype string and name and isn't defined in locals", async function() {
      const getDocument = await renovation.model.getDoc({
        doctype: "Item",
        docname: "Item A"
      });
      expect(getDocument.success).to.be.false;
      expect(getDocument.httpCode).to.be.equal(400);
    });
    it("should return RenovationDocument if the input is a doctype string and name and is defined in locals", async function() {
      await renovation.model.newDoc({ doctype: "Item" });

      const getDocument = await renovation.model.getDoc({
        doctype: "Item",
        docname: "New Item 1"
      });
      expect(getDocument.success).to.be.true;
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });

    // tslint:disable-next-line:max-line-length
    it("should return RenovationDocument if the input is a doctype string and name and is defined in locals [deprecated]", async function() {
      await renovation.model.newDoc({ doctype: "Item" });

      const getDocument = await renovation.model.getDoc("Item", "New Item 1");
      expect(getDocument.success).to.be.true;
      expect(getDocument.data).to.be.instanceOf(RenovationDocument);
    });
  });

  describe("setLocalValue", function() {
    it("should throw error if the doctype is not in the local cache", function() {
      expect(() =>
        renovation.model.setLocalValue({
          doctype: "Item",
          docname: "Item A",
          docfield: "item_name",
          value: "name"
        })
      ).to.throw("Cache doc not found: Item:Item A");
    });
    it("should throw error if the document is not in the local cache", function() {
      // @ts-ignore
      renovation.model.locals.Item = {};
      expect(() =>
        renovation.model.setLocalValue({
          doctype: "Item",
          docname: "Item A",
          docfield: "item_name",
          value: "name"
        })
      ).to.throw("Cache doc not found: Item:Item A");
    });
    it("should set the value for the local document", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      renovation.model.setLocalValue({
        doctype: "Item",
        docname: "New Item 1",
        docfield: "item_name",
        value: "Item A"
      });
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 1"].item_name).to.be.equal(
        "Item A"
      );
    });
    it("should set the value for the local document [deprecated]", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      renovation.model.setLocalValue(
        "Item",
        "New Item 1",
        "item_name",
        "Item A"
      );
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 1"].item_name).to.be.equal(
        "Item A"
      );
    });
  });

  describe("addToLocals", function() {
    it("should add if the cache doesn't have the doctype", async function() {
      // @ts-ignore
      expect(renovation.model.locals.Item).to.be.undefined;
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      renovation.model.addToLocals({ doc: newDoc });
      // @ts-ignore
      expect(renovation.model.locals.Item).has.key("New Item 1");
    });

    it("should add if the cache doesn't have the doctype [deprecated]", async function() {
      // @ts-ignore
      expect(renovation.model.locals.Item).to.be.undefined;
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      renovation.model.addToLocals(newDoc);
      // @ts-ignore
      expect(renovation.model.locals.Item).has.key("New Item 1");
    });

    it("should add and create a new name if no name is provided", async function() {
      const newDoc = await renovation.model.newDoc({ doctype: "Item" });
      delete newDoc.name;
      renovation.model.addToLocals({ doc: newDoc });
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 2"]).to.be.not.undefined;
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 2"].docstatus).to.be.equal(
        0
      );
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 2"].__islocal).to.be.equal(
        1
      );
      // @ts-ignore
      expect(renovation.model.locals.Item["New Item 2"].__unsaved).to.be.equal(
        1
      );
    });

    it("should add child docs to cache", async function() {
      renovation.model.locals = {};
      const newDoc = await renovation.model.newDoc({
        doctype: "Sales Invoice"
      });

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("addChildDoc-success");
      const childDoc = await renovation.model.addChildDoc(newDoc, "items");
      completeRecording();

      renovation.model.addToLocals({ doc: newDoc });

      // @ts-ignore
      expect(renovation.model.locals["Sales Invoice"]["New Sales Invoice 1"]).to
        .be.not.undefined;
      // @ts-ignore
      expect(
        renovation.model.locals["Sales Invoice Item"][
          "New Sales Invoice Item 1"
        ]
      ).to.be.not.undefined;
    });
  });

  describe("getFromLocals", function() {
    it("should return null if the doctype doesn't exist in the local cache", function() {
      const localDoc = renovation.model.getFromLocals({
        doctype: "Item",
        docname: "Item A"
      });

      expect(localDoc).to.be.null;
    });
    it("should return null if the doctype doesn't exist in the local cache [deprecated]", function() {
      const localDoc = renovation.model.getFromLocals("Item", "Item A");

      expect(localDoc).to.be.null;
    });
    it("should return null if the docname doesn't exist in the local cache", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      const localDoc = renovation.model.getFromLocals({
        doctype: "Item",
        docname: "Item A"
      });
      expect(localDoc).to.be.null;
    });

    it("should return the document if it exists in the local cache", async function() {
      await renovation.model.newDoc({ doctype: "Item" });
      const localDoc = renovation.model.getFromLocals({
        doctype: "Item",
        docname: "New Item 1"
      });
      expect(localDoc).to.not.be.null;
    });
  });

  after(function() {
    // Clear the locals cache
    renovation.model.clearCache();
  });
});
