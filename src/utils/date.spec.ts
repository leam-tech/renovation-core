import { expect } from "chai";
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format
} from "date-fns";
import { addDays, addMonths, getToday } from "./date";

describe("Date", function() {
  describe("getToday", function() {
    it("should get today's date in the set format", function() {
      expect(getToday()).to.be.a("string");
      expect(getToday()).to.be.equal(format(new Date(), "YYYY-MM-DD"));
    });
  });

  describe("addDays", function() {
    it("should add 2 days to the current date", function() {
      const todayDate = getToday();

      const addedDays = addDays(todayDate, 2);

      expect(addedDays).to.be.a("string");
      expect(
        differenceInCalendarDays(new Date(addedDays), new Date(todayDate))
      ).to.be.equal(2);
    });
  });

  describe("addDays", function() {
    it("should add 3 months to the current date", function() {
      const todayDate = getToday();

      const addedMonths = addMonths(todayDate, 3);

      expect(addedMonths).to.be.a("string");
      expect(
        differenceInCalendarMonths(new Date(addedMonths), new Date(todayDate))
      ).to.be.equal(3);
    });
  });
});
