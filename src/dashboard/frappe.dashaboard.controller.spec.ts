import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { RenovationError } from "..";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { asyncSleep } from "../utils";

describe("Frappe Dashboard Controller", function() {
  this.timeout(10000);
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  describe("getAllDashboardsMeta", function() {
    it("should get all dashboards from the backend", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getAllDashboardsMeta-success");
      const dashboards = await renovation.dashboard.getAllDashboardsMeta();
      completeRecording();
      expect(dashboards.success).to.be.true;
      expect(dashboards.data.length).to.be.gte(1);
    });

    it("should get all dashboards from the cache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getAllDashboardsMeta-success-cache");
      const dashboards = await renovation.dashboard.getAllDashboardsMeta();
      completeRecording();
      expect(dashboards.success).to.be.true;
      expect(dashboards.data.length).to.be.gte(1);
    });
  });

  describe("getDashboardMeta", function() {
    it("should get a single dashboard from the backend", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardMeta-success");
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "Sales Balance"
      });
      completeRecording();

      expect(dashboard.success).to.be.true;
      expect(dashboard.data.name).to.be.equal("Sales Balance");
    });

    it("should get a single dashboard from the cache", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardMeta-success-cache");
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "Sales Balance"
      });
      completeRecording();

      expect(dashboard.success).to.be.true;
      expect(dashboard.data.name).to.be.equal("Sales Balance");
    });

    it("should get a single dashboard from the cache with params", async function() {
      renovation.dashboard.clearCache();
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardMeta-success-cache-params");
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "Sales Balance"
      });
      completeRecording();

      expect(dashboard.success).to.be.true;
      expect(dashboard.data.name).to.be.equal("Sales Balance");
      // Sales Balance doesnt have a param at the moment; making changes for testing purposes in the meta
      expect(dashboard.data.params.length).to.be.equal(1);
    });
    it("should get failure for non-existing dashboard", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardMeta-fail");
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "Sales Balance 1"
      });
      completeRecording();

      expect(dashboard.success).to.be.false;
      expect(dashboard.httpCode).to.be.equal(404);
      expect(dashboard.error.type).to.be.equal(RenovationError.NotFoundError);
    });
  });

  // TODO: To be able to fix cached data independently of other tests
  // describe("getAllDashboardData", function() {
  //   before(async function() {
  //     await renovation.dashboard.getDashboardData({
  //       dashboardName: "Sales Return"
  //     });
  //     await asyncSleep(1000);
  //   });
  //   it("should get data of all dashboards stored in the cache", async function() {
  //     await asyncSleep(1000); // Adding waiting since the data could not be loaded
  //     const dashboardsData = renovation.dashboard.getAllDashboardData();
  //
  //     expect(Object.keys(dashboardsData).length).to.be.gt(0);
  //     expect(dashboardsData["Sales Return"].success).to.be.not.null;
  //   });
  // });

  describe("getDashboardData", function() {
    it("should get data of a dashboard from cache", async function() {
      await asyncSleep(500); // Adding waiting since the data could not be loaded
      const dashboardData = await renovation.dashboard.getDashboardData({
        dashboardName: "Sales Return"
      });
      expect(dashboardData.success).to.be.not.null;
    });

    it("should get undefined for dashboards not in the cache of dashboardData", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardData-undefined");
      const dashboardData = await renovation.dashboard.getDashboardData({
        dashboardName: "Non-Existing Dashboard"
      });
      completeRecording();
      expect(dashboardData.success).to.be.false;
      expect(dashboardData.httpCode).to.be.equal(404);
      expect(dashboardData.error.type).to.be.equal(
        RenovationError.NotFoundError
      );
    });
  });

  describe("clearCache", function() {
    it("should clear the cache of dashboard and dashboardData", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("clearCache-success");
      await renovation.dashboard.getAllDashboardsMeta();
      completeRecording();
      expect(renovation.dashboard.dashboardMetaCache).to.be.not.deep.equal({});

      renovation.dashboard.clearCache();

      expect(renovation.dashboard.dashboardMetaCache).to.be.deep.equal({});
      expect(renovation.dashboard.getAllDashboardData()).to.be.deep.equal({});
    });
  });

  describe("refreshData", function() {
    it("should refresh data for a single dashboard", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("refreshData-success-single");

      await renovation.dashboard.getAllDashboardsMeta();

      // wait until the data is loaded
      await asyncSleep(2000);

      const r = await renovation.dashboard.refreshData({
        dashboardName: "Sales Balance"
      });
      completeRecording();

      expect(r.success).to.be.true;
      expect(r.data).to.be.null;
    });
    it("should refresh data for all dashboards", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("refreshData-success-all");
      await renovation.dashboard.getAllDashboardsMeta();

      // wait until the data is loaded
      await asyncSleep(2000);

      const r = await renovation.dashboard.refreshData();

      completeRecording();

      expect(r.success).to.be.true;
      expect(r.data).to.be.null;
    });
  });

  describe("getDashboardLayout", function() {
    it("should return a default layout with no params", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getDashboardLayout-success");
      const r = await renovation.dashboard.getDashboardLayout();
      completeRecording();
      expect(r.success).to.be.true;
      expect(r.data.dashboards.length).gte(1);
    });
  });

  describe("getAvailableLayouts", function() {
    it("should return some available layouts, with metas", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getAvailableLayouts-success");
      const r = await renovation.dashboard.getAvailableLayouts();
      completeRecording();
      expect(r.success).to.be.true;
      expect(r.data.length).gte(1);
    });
  });
});
