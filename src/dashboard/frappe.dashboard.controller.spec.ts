import { expect } from "chai";
import { RenovationError } from "..";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { asyncSleep } from "../utils";

describe("Frappe Dashboard Controller", function() {
  this.timeout(10000);
  let renovation: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  before(async function() {
    renovation = await TestManager.init("frappe");

    await renovation.auth.login({
      email: validUser,
      password: validPwd
    });
  });

  describe("getAllDashboardsMeta", function() {
    it("should get all dashboards from the backend", async function() {
      const dashboards = await renovation.dashboard.getAllDashboardsMeta();

      expect(dashboards.success).to.be.true;
      expect(dashboards.data.length).to.be.gte(1);
    });
  });

  describe("getDashboardMeta", function() {
    it("should get a single dashboard from the backend", async function() {
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "TEST"
      });

      expect(dashboard.success).to.be.true;
      expect(dashboard.data.name).to.be.equal("TEST");
    });

    it("should get failure for non-existing dashboard", async function() {
      const dashboard = await renovation.dashboard.getDashboardMeta({
        dashboardName: "NON EXISTING"
      });

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
        dashboardName: "TEST"
      });
      expect(dashboardData.success).to.be.not.null;
    });

    it("should get undefined for dashboards not in the cache of dashboardData", async function() {
      const dashboardData = await renovation.dashboard.getDashboardData({
        dashboardName: "Non-Existing Dashboard"
      });

      expect(dashboardData.success).to.be.false;
      expect(dashboardData.httpCode).to.be.equal(404);
      expect(dashboardData.error.type).to.be.equal(
        RenovationError.NotFoundError
      );
    });
  });

  describe("clearCache", function() {
    it("should clear the cache of dashboard and dashboardData", async function() {
      await renovation.dashboard.getAllDashboardsMeta();

      expect(renovation.dashboard.dashboardMetaCache).to.be.not.deep.equal({});

      renovation.dashboard.clearCache();

      expect(renovation.dashboard.dashboardMetaCache).to.be.deep.equal({});
      expect(renovation.dashboard.getAllDashboardData()).to.be.deep.equal({});
    });
  });

  describe("refreshData", function() {
    it("should refresh data for a single dashboard", async function() {
      await renovation.dashboard.getAllDashboardsMeta();

      // wait until the data is loaded
      await asyncSleep(2000);

      const r = await renovation.dashboard.refreshData({
        dashboardName: "TEST"
      });

      expect(r.success).to.be.true;
      expect(r.data).to.be.null;
    });
    it("should refresh data for all dashboards", async function() {
      await renovation.dashboard.getAllDashboardsMeta();

      // wait until the data is loaded
      await asyncSleep(2000);

      const r = await renovation.dashboard.refreshData();

      expect(r.success).to.be.true;
      expect(r.data).to.be.null;
    });
  });

  describe("getDashboardLayout", function() {
    it("should return a default layout with no params", async function() {
      const r = await renovation.dashboard.getDashboardLayout();

      expect(r.success).to.be.true;
      expect(r.data.dashboards.length).gte(1);
    });
  });

  describe("getAvailableLayouts", function() {
    it("should return some available layouts, with metas", async function() {
      const r = await renovation.dashboard.getAvailableLayouts();

      expect(r.success).to.be.true;
      expect(r.data.length).gte(1);
    });
  });
});
