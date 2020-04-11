import { expect } from "chai";

import { Renovation } from "../renovation";
import { TestManager } from "../tests";

describe("Frappe Defaults Controller", function() {
  let renovation: Renovation;
  this.timeout(10000);

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("setDefault", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );
    it("should Set disableSubmission: false", async function() {
      const response = await renovation.defaults.setDefault({
        key: "disableSubmission",
        value: false
      });

      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("false");
    });

    it("should Set disableSubmission: false [deprecated]", async function() {
      const response = await renovation.defaults.setDefault(
        "disableSubmission",
        false
      );
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("false");
    });

    it("should Set MyNumber = 23", async function() {
      const response = await renovation.defaults.setDefault({
        key: "MyNumber",
        value: 23
      });

      expect(response.success).to.be.true;
      expect(response.data).to.be.equal("23");
    });

    it("should set an object successfully", async function() {
      const response = await renovation.defaults.setDefault({
        key: "objectData",
        value: {
          name: "test"
        }
      });

      expect(response.success).to.be.true;
      expect(response.data).to.be.equal(
        JSON.stringify({
          name: "test"
        })
      );
    });
  });

  describe("getDefault", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );
    it("should get disableSubmission: false", async function() {
      const response = await renovation.defaults.getDefault({
        key: "disableSubmission"
      });

      expect(response.success).to.be.true;
      expect(response.data).to.be.false; // value should be pakka false
    });

    it("should get disableSubmission: false [deprecated]", async function() {
      const response = await renovation.defaults.getDefault(
        "disableSubmission"
      );

      expect(response.success).to.be.true;
      expect(response.data).to.be.false; // value should be pakka false
    });

    it("should get MyNumber as 23", async function() {
      const response = await renovation.defaults.getDefault({
        key: "MyNumber"
      });
      expect(response.success).to.be.true;
      expect(response.data).to.be.equal(23);
    });
    it("should return undefined key for non_existing key", async function() {
      const response = await renovation.defaults.getDefault({
        key: "non_existing"
      });

      expect(response.success).to.be.true;
      expect(response.data).to.be.undefined;
    });
  });
});
