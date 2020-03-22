import { expect } from "chai";
import { Renovation } from "./renovation";
import { TestManager } from "./tests";

describe("RenovationConfig", function() {
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("getCore", function() {
    it("should return the instance of the core instance", function() {
      expect(renovation.model.getCore()).to.be.deep.equal(
        renovation.config.coreInstance
      );
    });
  });
  describe("getHostURL", function() {
    it("should return the hostURL", function() {
      expect(renovation.model.getHostUrl()).to.be.equal(
        renovation.config.hostUrl
      );
    });
  });
});
