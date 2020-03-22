import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";

describe("TranslationController", function() {
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("getMessage", function() {
    it("should get null if the input is null", function() {
      const message = renovation.translate.getMessage(null);
      expect(message).to.be.null;
    });
    it("should get return value as-is if not string", function() {
      // @ts-ignore
      const message = renovation.translate.getMessage({ test: "test" });
      expect(message).to.be.not.null;
      expect(message.test).to.be.equal("test");
    });
    it("should get return value as-is if string but not defined in the dictionary", function() {
      const message = renovation.translate.getMessage({ txt: "test" });
      expect(message).to.be.equal("test");
    });
    it("should get return value of the message", function() {
      // @ts-ignore
      renovation.translate.setMessagesDict({ test: { test: "test" } });
      const message = renovation.translate.getMessage({ txt: "test" });
      expect(message.test).to.be.equal("test");
      // Reset
      renovation.translate.setMessagesDict({ dict: {} });
    });
  });
  describe("getMessage [deprecated]", function() {
    it("should get return value as-is if not string", function() {
      // @ts-ignore
      const message = renovation.translate.getMessage({ test: "test" });
      expect(message).to.be.not.null;
      expect(message.test).to.be.equal("test");
    });
    it("should get return value as-is if string but not defined in the dictionary", function() {
      const message = renovation.translate.getMessage("test");
      expect(message).to.be.equal("test");
    });
    it("should get return value of the message", function() {
      // @ts-ignore
      renovation.translate.setMessagesDict({ test: { test: "test" } });
      const message = renovation.translate.getMessage("test");
      expect(message.test).to.be.equal("test");
      // Reset
      renovation.translate.setMessagesDict({});
    });
  });
  describe("setMessageDict", function() {
    it("should set the dictionary successfully", function() {
      renovation.translate.setMessagesDict({ dict: { test: "test1" } });
      const message = renovation.translate.getMessage({ txt: "test" });
      expect(message).to.be.equal("test1");
      renovation.translate.setMessagesDict({ dict: {} });
    });
    it("should set the dictionary successfully [deprecated]", function() {
      renovation.translate.setMessagesDict({ test: "test1" });
      const message = renovation.translate.getMessage("test");
      expect(message).to.be.equal("test1");
      renovation.translate.setMessagesDict({});
    });
  });
  describe("extendDictionary", function() {
    it("should append dict successfully to a defined message dictionary", function() {
      renovation.translate.setMessagesDict({ dict: { testa: "test-a" } });
      renovation.translate.extendDictionary({ dict: { testb: "test-b" } });
      const message = renovation.translate.getMessage({ txt: "testa" });
      expect(message).to.be.equal("test-a");
      const message2 = renovation.translate.getMessage({ txt: "testb" });
      expect(message2).to.be.equal("testb");
    });
    it("should append dict successfully to a defined message dictionary [deprecated]", function() {
      renovation.translate.setMessagesDict({ test: "test1" });
      renovation.translate.extendDictionary({ test2: "test-b" });
      const message = renovation.translate.getMessage("test");
      expect(message).to.be.equal("test1");
      const message2 = renovation.translate.getMessage("test2");
      expect(message2).to.be.equal("test-b");
    });
  });

  describe("setCurrentLanguage & getCurrentLanguage", function() {
    it("should set the current language to Arabic", function() {
      renovation.translate.setCurrentLanguage({ lang: "ar" });
      expect(renovation.translate.getCurrentLanguage()).to.be.equal("ar");
    });
  });
});
