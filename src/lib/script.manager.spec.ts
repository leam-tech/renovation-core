import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";

describe("Script Manager", function() {
  this.timeout(10000);
  let renovation!: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  const docType = "Test Doctype";

  describe("Script Manager object", function() {
    it("should be initialized", async function() {
      expect(renovation.scriptManager).to.be.not.null;
    });
  });

  describe("loadScripts", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );
    /**
     * This will load a test script that will change the `disableSubmission` to be `true`
     */
    it("should load Test Script", async function() {
      const scriptLoaded = await renovation.scriptManager.loadScripts({
        doctype: "Broadcast Message"
      });

      expect(scriptLoaded.success).to.be.true;
      expect(scriptLoaded.data).to.be.true;
    });

    it("should load Test Script [deprecated]", async function() {
      const scriptLoaded = await renovation.scriptManager.loadScripts(
        "Broadcast Message"
      );

      expect(scriptLoaded.success).to.be.true;
      expect(scriptLoaded.data).to.be.true;
    });

    it("should return for existing script in events", async function() {
      await renovation.scriptManager.loadScripts({
        doctype: "Broadcast Message"
      });

      const scriptLoadedAfterLoaded = await renovation.scriptManager.loadScripts(
        { doctype: "Broadcast Message" }
      );

      expect(scriptLoadedAfterLoaded.success).to.be.true;
      expect(scriptLoadedAfterLoaded.data).to.be.true;
    });

    it("should return for existing script in events [deprecated]", async function() {
      await renovation.scriptManager.loadScripts("Broadcast Message");

      const scriptLoadedAfterLoaded = await renovation.scriptManager.loadScripts(
        "Broadcast Message"
      );

      expect(scriptLoadedAfterLoaded.success).to.be.true;
      expect(scriptLoadedAfterLoaded.data).to.be.true;
    });
  });

  describe("addScript", function() {
    it("should run a code", function() {
      renovation.scriptManager.addScript({
        doctype: docType,
        code:
          "(core) =>{  " +
          "console.info('IF YOU SEE THIS MESSAGE, TEST IS SUCCESSFUL');" +
          "}",

        name: "Test Script"
      });
    });
    it("should print warning message", function() {
      renovation.scriptManager.addScript({
        doctype: docType,
        code:
          "(core) =>{  " +
          "console.inf('IF YOU SEE THIS MESSAGE, TEST IS SUCCESSFUL');" +
          "}",

        name: "Test Script"
      });
    });
  });

  describe("addEvent & trigger", function() {
    it("should add event for a non-existing doctype", function() {
      renovation.scriptManager.events = {};

      const eventName = "Event 1";
      const eventFunction = () => console.log("Event 1 Triggered");
      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: eventFunction
      });

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(1);
      renovation.scriptManager.trigger(docType, null, "Event 1");
    });

    it("should add event for a non-existing doctype [deprecated]", function() {
      renovation.scriptManager.events = {};

      const eventName = "Event 1";
      const eventFunction = () => console.log("Event 1 Triggered");
      renovation.scriptManager.addEvent(docType, eventName, eventFunction);

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(1);
      renovation.scriptManager.trigger(docType, null, "Event 1");
    });

    it("should add event for an existing doctype", function() {
      renovation.scriptManager.events[docType] = {};

      const eventName = "Event 2";
      const eventFunction = () => console.log("Event 2 Triggered");
      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: eventFunction
      });

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(1);
      renovation.scriptManager.trigger(docType, null, "Event 2");
    });

    it("should add an event function for an existing event", function() {
      const eventName = "Event 3";
      const eventFunction = (core, doc) => console.log("Event 3 Triggered");
      renovation.scriptManager.events[docType] = {};
      renovation.scriptManager.events[docType][eventName] = [eventFunction];
      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: eventFunction
      });

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(2);
      renovation.scriptManager.trigger(docType, null, "Event 3");
    });

    it("should trigger the event", function() {
      renovation.scriptManager.events = {};

      const eventName = "Event 1";
      const eventFunction = () => console.log("Event 1 Triggered");
      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: eventFunction
      });

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(1);
      renovation.scriptManager.trigger({
        doctype: docType,
        docname: "TEST",
        event: "Event 1"
      });
    });

    it("should trigger the event [deprecated]", function() {
      renovation.scriptManager.events = {};

      const eventName = "Event 1";
      const eventFunction = () => console.log("Event 1 Triggered");
      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: eventFunction
      });

      expect(renovation.scriptManager.events[docType]).to.be.not.null;
      expect(renovation.scriptManager.events[docType]).has.key(eventName);
      expect(
        renovation.scriptManager.events[docType][eventName].length
      ).to.be.equal(1);
      renovation.scriptManager.trigger("Test Doctype", "", "Event 1");
    });

    it("should not trigger the event when the docname isn't available", async function() {
      renovation.scriptManager.events = {};
      await renovation.model.newDoc({ doctype: "Test Doctype" });
      const eventName = "Event 1";

      renovation.scriptManager.addEvent({
        doctype: docType,
        event: eventName,
        fn: null
      });

      renovation.scriptManager.trigger({
        doctype: "Test Doctype",
        docname: "non_existing",
        event: "Event 1"
      });
    });
    it("should not trigger the event when the doctype is not in the event", async function() {
      renovation.scriptManager.events = {};
      renovation.scriptManager.trigger({
        doctype: "Test Doctype",
        docname: "non_existing",
        event: "Event 1"
      });
    });
  });
  describe("addEvents", function() {
    it("should add a list of events", function() {
      renovation.scriptManager.events = {};

      const events = {
        "Event 4": () => console.log("Event 4 triggered"),
        "Event 5": () => console.log("Event 5 triggered")
      };

      renovation.scriptManager.addEvents(docType, events);

      expect(renovation.scriptManager.events).has.key(docType);
      expect(
        Object.keys(renovation.scriptManager.events[docType]).length
      ).to.be.equal(2);

      renovation.scriptManager.trigger({
        doctype: docType,
        docname: "",
        event: "Event 4"
      });
      renovation.scriptManager.trigger({
        doctype: docType,
        docname: "",
        event: "Event 5"
      });
    });
    it("should add a list of events [deprecated]", function() {
      renovation.scriptManager.events = {};

      const events = {
        "Event 4": () => console.log("Event 4 triggered"),
        "Event 5": () => console.log("Event 5 triggered")
      };

      renovation.scriptManager.addEvents(docType, events);

      expect(renovation.scriptManager.events).has.key(docType);
      expect(
        Object.keys(renovation.scriptManager.events[docType]).length
      ).to.be.equal(2);

      renovation.scriptManager.trigger(docType, "", "Event 4");
      renovation.scriptManager.trigger(docType, "", "Event 5");
    });
  });

  // TODO: Devise a way to test the events
  // describe("Trigger Events", function() {
  //   it("should not trigger if doctype is not present in events object", function() {
  //     renovation.scriptManager.events = {};
  //     renovation.scriptManager.trigger(docType, "doc-name", "Event 1");
  //   });
  // });
});
