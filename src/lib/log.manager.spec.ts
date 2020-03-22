import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { RequestResponse } from "../utils/request";
import { LogResponse } from "./interfaces";

// Tested on arsa-dev-backend.leam.ae
// Updated both hostUrl and client-id in test manager

describe("Log Manager", function() {
  let renovation!: Renovation;
  this.timeout(10000);

  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  describe("info", async function() {
    it("Basic Logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-info-basic");
      const r0 = await renovation.log.info("Test");
      const r1 = await renovation.log.info({
        content: "Test"
      });
      completeRecording();
      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.content).equals("Test");
        expect(r.data.type).equals("Info");
      }
    });

    it("title & tags should work in basic logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-info-basic-title-tags");
      const r0 = await renovation.log.info(
        "Test Info 2",
        ["TAG1", "TAG2"],
        "TitleA"
      );
      const r1 = await renovation.log.info({
        content: "Test Info 2",
        tags: ["TAG1", "TAG2"],
        title: "TitleA"
      });
      completeRecording();

      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.content).equals("Test Info 2");
        expect(r.data.tags).contains("TAG1");
        expect(r.data.tags).contains("TAG2");
        expect(r.data.title).equals("TitleA");
        expect(r.data.type).equals("Info");
      }
    });
  });

  describe("warning", async function() {
    it("Basic Logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-warning-basic");
      const r0 = await renovation.log.warning("Test");
      const r1 = await renovation.log.warning({
        content: "Test"
      });
      completeRecording();
      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.type).equals("Warning");
        expect(r.data.content).equals("Test");
      }
    });

    it("title & tags should work in basic logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-warning-basic-title-tags");
      const r0 = await renovation.log.warning(
        "Test warning 2",
        ["TAG1", "TAG2"],
        "TitleA"
      );
      const r1 = await renovation.log.warning({
        content: "Test warning 2",
        tags: ["TAG1", "TAG2"],
        title: "TitleA"
      });
      completeRecording();

      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.content).equals("Test warning 2");
        expect(r.data.tags).contains("TAG1");
        expect(r.data.tags).contains("TAG2");
        expect(r.data.title).equals("TitleA");
        expect(r.data.type).equals("Warning");
      }
    });
  });

  describe("error", async function() {
    it("Basic Logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-error-basic");
      const r0 = await renovation.log.error("Test");
      const r1 = await renovation.log.error({
        content: "Test"
      });
      completeRecording();
      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.type).equals("Error");
        expect(r.data.content).equals("Test");
      }
    });

    it("title & tags should work in basic logging", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-error-basic-title-tags");
      const r0 = await renovation.log.error(
        "Test error 2",
        ["TAG1", "TAG2"],
        "TitleA"
      );
      const r1 = await renovation.log.error({
        content: "Test error 2",
        tags: ["TAG1", "TAG2"],
        title: "TitleA"
      });
      completeRecording();

      for (const r of [r0, r1]) {
        expect(r.success).to.be.true;
        expect(r.data.content).equals("Test error 2");
        expect(r.data.tags).contains("TAG1");
        expect(r.data.tags).contains("TAG2");
        expect(r.data.title).equals("TitleA");
        expect(r.data.type).equals("Error");
      }
    });
  });

  describe("logRequest", async function() {
    let r: RequestResponse<LogResponse> = null;
    it("should be successfull", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-request-ping");
      const r0 = await renovation.call({
        cmd: "ping"
      });
      // hack
      // nock-record drops request header details...
      r0._.request._header = null;
      r = await renovation.log.logRequest(r0);
      completeRecording();
      expect(r.success).to.be.true;
    });
    it("type should be 'Request'", function() {
      expect(r.data.type).equals("Request");
    });
    it("request & response should be set", function() {
      expect(r.data.request).to.exist;
      expect(r.data.response).to.exist;
    });
    it("request should have header and body details", function() {});
  });

  describe("setDefaultTags", function() {
    it("should reflect in logs", async function() {
      renovation.log.setDefaultTags(["TEST-DEFAULT-TAG"]);
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("log-setDefaultTags");
      const r0 = await renovation.log.info("TEST1");
      const r1 = await renovation.log.warning("TEST1");
      const r2 = await renovation.log.error("TEST1");
      completeRecording();

      for (const r of [r0, r1, r2]) {
        expect(r.success).to.be.true;
        expect(r.data.tags).contains("TEST-DEFAULT-TAG");
        expect(r.data.tags).not.contains("TEST-DEFAULT-TAG1");
      }
    });
  });
});
