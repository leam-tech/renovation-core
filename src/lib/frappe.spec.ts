import { expect } from "chai";
import { setupRecorder } from "nock-record";

import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { onBrowser, setClientId } from "../utils/request";
import Frappe from "./frappe";

describe("Frappe", function() {
  let renovation!: Renovation;
  this.timeout(10000);

  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  describe("waitForBootInfo", function() {
    it("should return with null always ", async function() {
      const waitForBootInfo = await renovation.frappe.waitForBootInfo();
      expect(waitForBootInfo).to.be.null;
    });
  });

  describe("updateClientId", function() {
    it("should return success with the id if it is already set", async function() {
      const clientId = await renovation.frappe.updateClientId();
      expect(clientId.success).to.be.true;
      expect(clientId.data).to.be.equal(TestManager.clientId);
    });

    it("should return success and validate if the id set in the browser", async function() {
      // @ts-ignore
      onBrowser = true;
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("updateClientId-browser-set");
      const clientId = await renovation.frappe.updateClientId();
      completeRecording();
      expect(clientId.success).to.be.true;
      expect(clientId.data).to.be.equal(TestManager.clientId);
    });
    it("should fetch the id if not set on browser", async function() {
      setClientId(null);
      // @ts-ignore
      onBrowser = true;
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("updateClientId-success");
      const clientId = await renovation.frappe.updateClientId();
      completeRecording();
      expect(clientId.success).to.be.true;
      expect(clientId.data).to.be.equal(TestManager.clientId);
    });

    it("should return failure if not on a browser and clientId is not set", async function() {
      setClientId(null);
      // @ts-ignore
      onBrowser = false;

      const clientId = await renovation.frappe.updateClientId();

      expect(clientId.success).to.be.false;
      expect(clientId.data).to.be.equal("Please define client id");
      expect(clientId.error.title).to.be.equal("Client ID Verification Error");
    });
  });
});
