import { expect } from "chai";
import { deepCloneObject, deepCompare, getJSON } from "./json";

describe("JSON", function() {
  describe("getJSON", function() {
    it("should return null if the input is null", function() {
      const parsedJSON = getJSON(null);

      expect(parsedJSON).to.be.null;
    });

    it("should return object as-is if the input is an object", function() {
      const parsedJSON = getJSON({ name: "test" } as any);

      expect(parsedJSON).to.be.deep.equal({ name: "test" });
    });

    it("should return null if the string is not a stringified JSON", function() {
      const parsedJSON = getJSON("{'name':'test'");
      expect(parsedJSON).to.be.null;
    });

    it("should return object parsed from string", function() {
      const parsedJSON = getJSON(`{"name":"test"}`);
      expect(parsedJSON).to.be.deep.equal({ name: "test" });
    });
  });

  describe("deepCloneObject", function() {
    it("should return empty object if the input is null", function() {
      const clonedObject = deepCloneObject(null);
      expect(clonedObject).to.be.deep.equal(null);
    });

    it("should return the cloned object as-is by value", function() {
      const sampleObject = {
        name: "test",
        properties: { type: "type-1", color: "black", serial: 123 }
      };
      const clonedObject = deepCloneObject(sampleObject);
      expect(clonedObject).to.be.deep.equal(sampleObject);
      expect(clonedObject).to.be.not.equal(sampleObject);
    });

    it("should clone arrays of objects", function() {
      const sampleObject = {
        name: "test",
        properties: { type: "type-1", color: "black", serial: 123 },
        items: [
          { name: "name-1", variants: ["variant-1", "variant-2"] },
          { name: "name-2" }
        ]
      };
      const clonedObject = deepCloneObject(sampleObject);
      expect(clonedObject).to.be.deep.equal(sampleObject);
      expect(clonedObject).to.be.not.equal(sampleObject);
    });
  });

  describe("deepCompareObjects", function() {
    it("should return false for non-equal objects", function() {
      const obj1 = { a: "", b: { c: [] }, d: 11 };
      const obj2 = { a: "", b: { c: {} }, d: 11 };
      const compareObj = deepCompare(obj1, obj2);

      expect(compareObj).to.be.false;
    });
    it("should return true for equal objects", function() {
      const obj1 = { a: "", b: { c: [] }, d: 11 };
      const obj2 = { a: "", b: { c: [] }, d: 11 };
      const compareObj = deepCompare(obj1, obj2);

      expect(compareObj).to.be.true;
    });

    it("should return true no arguments given", function() {
      const compareObj = deepCompare();

      expect(compareObj).to.be.true;
    });
  });
});
