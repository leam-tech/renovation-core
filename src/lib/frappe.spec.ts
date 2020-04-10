import { expect } from "chai";

import { Renovation } from "../renovation";
import { ENV_VARIABLES, TestManager } from "../tests";
import { onBrowser, setClientId } from "../utils/request";
import Frappe from "./frappe";

describe("Frappe", function() {
  let renovation!: Renovation;
  this.timeout(10000);

  const clientID = TestManager.getVariables(ENV_VARIABLES.ClientID);

  before(async function() {
    renovation = await TestManager.init(
      "frappe",
      true,
      TestManager.getVariables(ENV_VARIABLES.SecondaryHostUrl),
      clientID
    );
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
      expect(clientId.data).to.be.equal(clientID);
    });

    it("should return success and validate if the id set in the browser", async function() {
      // @ts-ignore
      onBrowser = true;

      const clientId = await renovation.frappe.updateClientId();

      expect(clientId.success).to.be.true;
      expect(clientId.data).to.be.equal(clientID);
    });
    it("should fetch the id if not set on browser", async function() {
      setClientId(null);
      // @ts-ignore
      onBrowser = true;

      const clientId = await renovation.frappe.updateClientId();

      expect(clientId.success).to.be.true;
      expect(clientId.data).to.be.equal(clientID);
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

  after(
    async () =>
      await TestManager.init(
        "frappe",
        true,
        TestManager.getVariables(ENV_VARIABLES.HostURL)
      )
  );
});
