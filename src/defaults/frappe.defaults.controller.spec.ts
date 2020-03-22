import { expect } from "chai";
import { setupRecorder } from "nock-record";

import { Renovation } from "../renovation";
import { TestManager } from "../tests";

describe("Frappe Defaults Controller", function() {
  let renovation: Renovation;
  this.timeout(10000);
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("setDefault", function() {
    it("should Set disableSubmission: false", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("setDefault-success-renovation");
      const response = await renovation.defaults.setDefault({
        key: "disableSubmission",
        value: false
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("false");
    });

    it("should Set disableSubmission: false [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("setDefault-success-renovation-deprecated");
      const response = await renovation.defaults.setDefault(
        "disableSubmission",
        false
      );
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("false");
    });

    it("should Set MyNumber = 23", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("setDefault-success");
      const response = await renovation.defaults.setDefault({
        key: "MyNumber",
        value: 23
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("23");
    });

    it("should set an object successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("setDefault-success-object");
      const response = await renovation.defaults.setDefault({
        key: "objectData",
        value: {
          name: "test"
        }
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal(
        JSON.stringify({
          name: "test"
        })
      );
    });
  });

  describe("getDefault", function() {
    it("should get disableSubmission: false", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDefault-success-renovation");
      const response = await renovation.defaults.getDefault({
        key: "disableSubmission"
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.false; // value should be pakka false
    });

    it("should get disableSubmission: false [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDefault-success-renovation-deprecated");
      const response = await renovation.defaults.getDefault(
        "disableSubmission"
      );
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.false; // value should be pakka false
    });

    it("should get MyNumber as 23", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDefault-success");
      const response = await renovation.defaults.getDefault({
        key: "MyNumber"
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal(23);
    });
    it("should return undefined key for non_existing key", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDefault-fail-non-existing");
      const response = await renovation.defaults.getDefault({
        key: "non_existing"
      });
      completeRecording();
      expect(response.success).to.be.true;
      expect(response.data).to.be.undefined;
    });
  });
});
