import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import DocType from "./doctype";

describe("DocType", function() {
  this.timeout(10000);
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("Initialization", function() {
    it("should be initialized by checking 'doctype' property", function() {
      const docField = new DocType("Item");

      expect(docField.doctype).to.be.equal("Item");
    });
  });
  describe("fromFrappeDocType", function() {
    it("should return parsed doctype", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("fromFrappeDocType-success");

      const docMeta = await renovation.call({
        cmd: "renovation_core.utils.meta.get_bundle",
        doctype: "Item"
      });
      completeRecording();

      const parsedDocType = DocType.fromFrappeDocType(
        docMeta.data.message.metas[0]
      );

      expect(parsedDocType.titleField).to.be.equal("item_name");
      expect(parsedDocType.isSingle).to.be.a("boolean");
      expect(parsedDocType.isSingle).to.be.false;
      expect(parsedDocType.permissions.length).to.be.gte(0);
    });
  });
});
