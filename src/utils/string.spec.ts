import { expect } from "chai";
import { toTitleCase, underScoreToCamel, underScoreToTitle } from "./string";

describe("String", function() {
  describe("toTitleCase", function() {
    it("should convert a lowerCase to TitleCase without a space", function() {
      const lowerCaseString = "item_name";
      const titleCase = toTitleCase(lowerCaseString);
      expect(titleCase).to.be.equal("Item_name");
    });
    it("should convert a lowerCase to TitleCase with a space and title case each word", function() {
      const lowerCaseString = "item name";
      const titleCase = toTitleCase(lowerCaseString);
      expect(titleCase).to.be.equal("Item Name");
    });
    it("should not convert an already TitleCase", function() {
      const lowerCaseString = "Item_name";
      const titleCase = toTitleCase(lowerCaseString);
      expect(titleCase).to.be.equal("Item_name");
    });
    it("should not convert an already TitleCase", function() {
      const lowerCaseString = "Item Name";
      const titleCase = toTitleCase(lowerCaseString);
      expect(titleCase).to.be.equal("Item Name");
    });
    it("should throw fail for null input", function() {
      expect(() => toTitleCase(null)).to.throw;
    });
  });

  describe("underScoreToCamel", function() {
    it("should convert an underscore to camelCase with one underscore", function() {
      const underScoreString = "item_name";
      const camelCaseString = underScoreToCamel(underScoreString);
      expect(camelCaseString).to.be.equal("itemName");
    });
    it("should convert an underscore to camelCase with two underscores", function() {
      const underScoreString = "item_name_ar";
      const camelCaseString = underScoreToCamel(underScoreString);
      expect(camelCaseString).to.be.equal("itemNameAr");
    });
    it("should not convert an already camelCase", function() {
      const alreadyCamelCase = "itemName";
      const camelCase = underScoreToCamel(alreadyCamelCase);
      expect(camelCase).to.be.equal("itemName");
    });

    it("should throw fail for null input", function() {
      expect(() => underScoreToCamel(null)).to.throw;
    });
  });

  describe("underScoreToTitle", function() {
    it("should convert an underscore to TitleCase with one underscore", function() {
      const underScoreString = "item_name";
      const titleCase = underScoreToTitle(underScoreString);
      expect(titleCase).to.be.equal("Item Name");
    });
    it("should convert an underscore to TitleCase with two underscores", function() {
      const underScoreString = "item_name_ar";
      const titleCase = underScoreToTitle(underScoreString);
      expect(titleCase).to.be.equal("Item Name Ar");
    });
    it("should not convert an already TitleCase", function() {
      const alreadyTitleCase = "Item Name";
      const titleCase = underScoreToTitle(alreadyTitleCase);
      expect(titleCase).to.be.equal("Item Name");
    });

    it("should throw fail for null input", function() {
      expect(() => underScoreToTitle(null)).to.throw;
    });
  });
});
