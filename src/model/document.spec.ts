import { expect } from "chai";
import RenovationDocument from "./document";

describe("RenovationDocument", function() {
  describe("Creating object", function() {
    it("should create an empty object if no arguments are specified", function() {
      const renovationDocument = new RenovationDocument();

      expect(renovationDocument).to.deep.equal({});
    });

    it("should throw an error if the argument doesn't contain 'doctype' property", function() {
      expect(() => new RenovationDocument({})).to.throw(
        "Invalid object for doctype"
      );
    });

    it("should add properties for each original property", function() {
      const document = { name: "TEST DOCUMENT", doctype: "User" };

      const renovationDocument = new RenovationDocument(document);

      expect(renovationDocument.doctype).to.be.equal("User");
      expect(renovationDocument.name).to.be.equal("TEST DOCUMENT");
    });
  });
});
