import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import DocField from "./docfield";

describe("DocField", function() {
  this.timeout(10000);
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("Initialization", function() {
    it("should be initialized by checking 'reqd' property", function() {
      const docField = new DocField();
      //
      expect(docField.reqd).to.be.false;
    });
  });
  describe("fromFrappeDocField", function() {
    it("should return parsed docfield", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success");
      const response = await renovation.call({
        cmd: "renovation_core.utils.meta.get_bundle",
        doctype: "Item"
      });
      completeRecording();

      const parsedField = DocField.fromFrappeDocField(
        response.data.message.metas[0].fields[0]
      );
      expect(parsedField.readOnly).to.be.not.null;
      expect(parsedField.readOnly).to.be.a("boolean");
      expect(parsedField.readOnly).to.be.false;
    });
    it("should return parsed docfield [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDocMeta-success");
      const response = await renovation.call({
        cmd: "renovation_core.utils.meta.get_bundle",
        doctype: "Item"
      });
      completeRecording();

      const parsedField = DocField.fromFrappeDocField(
        response.data.message.metas[0].fields[0]
      );
      expect(parsedField.readOnly).to.be.not.null;
      expect(parsedField.readOnly).to.be.a("boolean");
      expect(parsedField.readOnly).to.be.false;
    });
  });
});
