import { expect } from "chai";
import { differenceInSeconds } from "date-fns";
import { asyncSleep } from "./functions";

describe("Functions", function() {
  this.timeout(3000);
  describe("asyncSleep", function() {
    it("should wait for 2s", async function() {
      const start = new Date().getTime();
      await asyncSleep(2000);
      expect(differenceInSeconds(new Date().getTime(), start)).to.be.equal(2);
    });
    it("not wait when a negative value is passed", async function() {
      const start = new Date().getTime();
      await asyncSleep(-100);
      expect(differenceInSeconds(new Date().getTime(), start)).to.be.equal(0);
    });
  });
});
