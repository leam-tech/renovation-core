import { expect } from "chai";
import { setupRecorder } from "nock-record";
import { Renovation } from "../";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";
import { PermissionType } from "./perm.model";

describe("FrappePermController", function() {
  this.timeout(10000);
  let renovation: Renovation;

  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("getPerm", function() {
    it("should get permissions of current user", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getPerm-success");
      const perms = await renovation.perm.getPerm({ doctype: "Item" });
      completeRecording();
      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
    });
    it("should get permissions of current user [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getPerm-success");
      const perms = await renovation.perm.getPerm("Item");
      completeRecording();
      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
    });

    it("should fail for non-existing doctype", async function() {
      // TODO: Return failure?
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getPerm-fail-non-existing-doctype");
      const perms = await renovation.perm.getPerm({ doctype: "NON-EXISTING" });
      completeRecording();
      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
      expect(perms.data.length).to.be.equal(1);
      expect(Object.keys(perms.data[0]).length).to.be.equal(2);
      expect(perms.data[0]).to.have.keys(["read", "_ifOwner"]);
    });
  });

  describe("hasPerm", function() {
    it("should get true for read permission of Sales Order", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-success-read");
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "Sales Order",
        ptype: PermissionType.read
      });
      completeRecording();
      expect(hasPermission).to.be.true;
    });
    it("should get true for read permission of Sales Order [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-success-read");
      const hasPermission = await renovation.perm.hasPerm(
        "Sales Order",
        PermissionType.read
      );
      completeRecording();
      expect(hasPermission).to.be.true;
    });

    it("should get false for delete permission of Sales Order", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-fail-delete");
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "Sales Order",
        ptype: PermissionType.delete,
        permLevel: 1
      });
      completeRecording();

      expect(hasPermission).to.be.false;
    });

    it("should get true for create permission of Customer with a docname", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-success-submit-docname");
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "Customer",
        ptype: PermissionType.create,
        permLevel: 0,
        docname: "Test Customer"
      });
      completeRecording();

      expect(hasPermission).to.be.true;
    });

    it("should get false for recursive_delete permission of Sales Invoice with a docname", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-fail-recursive_delete-docname");
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "Sales Invoice",
        ptype: PermissionType.recursive_delete,
        permLevel: 0,
        docname: "ACC-SINV-2019-00006"
      });
      completeRecording();

      expect(hasPermission).to.be.false;
    });

    it("should get false for non-existing DocType", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerm-fail-non-existing-doctype");
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "NON-EXISTING",
        ptype: PermissionType.submit
      });
      completeRecording();

      expect(hasPermission).to.be.false;
    });
  });

  describe("hasPerms", function() {
    it("should return true for all true permissions", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerms-success");
      const hasPermissions = await renovation.perm.hasPerms({
        doctype: "Customer",
        ptypes: [
          PermissionType.read,
          PermissionType.write,
          PermissionType.create
        ]
      });
      completeRecording();
      expect(hasPermissions).to.be.true;
    });
    it("should return true for all true permissions [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerms-success");
      const hasPermissions = await renovation.perm.hasPerms("Customer", [
        PermissionType.read,
        PermissionType.write,
        PermissionType.create
      ]);
      completeRecording();
      expect(hasPermissions).to.be.true;
    });
    it("should return false if at least one permission is false", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("hasPerms-fail");
      const hasPermissions = await renovation.perm.hasPerms({
        doctype: "Customer",
        ptypes: [
          PermissionType.read,
          PermissionType.write,
          PermissionType.recursive_delete
        ]
      });
      completeRecording();
      expect(hasPermissions).to.be.false;
    });
  });

  describe("Basic Params", function() {
    describe("canCreate", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canCreate-success");
        const canCreate = await renovation.perm.canCreate({ doctype: "Item" });
        completeRecording();
        expect(canCreate).to.be.true;
      });

      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canCreate-success");
        const canCreate = await renovation.perm.canCreate("Item");
        completeRecording();
        expect(canCreate).to.be.true;
      });
    });
    describe("canRead", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canRead-success");
        const canRead = await renovation.perm.canRead({ doctype: "Item" });
        completeRecording();
        expect(canRead).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canRead-success");
        const canRead = await renovation.perm.canRead("Item");
        completeRecording();
        expect(canRead).to.be.true;
      });
    });
    describe("canWrite", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canWrite-success");
        const canWrite = await renovation.perm.canWrite({ doctype: "Item" });
        completeRecording();
        expect(canWrite).to.be.true;
      });

      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canWrite-success");
        const canWrite = await renovation.perm.canWrite("Item");
        completeRecording();
        expect(canWrite).to.be.true;
      });
    });
    describe("canCancel", function() {
      it("should return false for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canCancel-success");
        const canCancel = await renovation.perm.canCancel({ doctype: "Item" });
        completeRecording();
        expect(canCancel).to.be.false;
      });
      it("should return false for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canCancel-success");
        const canCancel = await renovation.perm.canCancel("Item");
        completeRecording();
        expect(canCancel).to.be.false;
      });
    });
    describe("canDelete", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canDelete-success");
        const canDelete = await renovation.perm.canDelete({ doctype: "Item" });
        completeRecording();
        expect(canDelete).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canDelete-success");
        const canDelete = await renovation.perm.canDelete("Item");
        completeRecording();
        expect(canDelete).to.be.true;
      });
    });
    describe("canImport", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canImport-success");
        const canImport = await renovation.perm.canImport({ doctype: "Item" });
        completeRecording();
        expect(canImport).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canImport-success");
        const canImport = await renovation.perm.canImport("Item");
        completeRecording();
        expect(canImport).to.be.true;
      });
    });
    describe("canExport", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canExport-success");
        const canExport = await renovation.perm.canExport({ doctype: "Item" });
        completeRecording();
        expect(canExport).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canExport-success");
        const canExport = await renovation.perm.canExport("Item");
        completeRecording();
        expect(canExport).to.be.true;
      });
    });
    describe("canPrint", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canPrint-success");
        const canPrint = await renovation.perm.canPrint({ doctype: "Item" });
        completeRecording();
        expect(canPrint).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canPrint-success");
        const canPrint = await renovation.perm.canPrint("Item");
        completeRecording();
        expect(canPrint).to.be.true;
      });
    });
    describe("canEmail", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canEmail-success");
        const canEmail = await renovation.perm.canEmail({ doctype: "Item" });
        completeRecording();
        expect(canEmail).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canEmail-success");
        const canEmail = await renovation.perm.canEmail("Item");
        completeRecording();
        expect(canEmail).to.be.true;
      });
    });
    describe("canSearch", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canSearch-success");
        const canSearch = await renovation.perm.canSearch({ doctype: "Item" });
        completeRecording();
        expect(canSearch).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canSearch-success");
        const canSearch = await renovation.perm.canSearch("Item");
        completeRecording();
        expect(canSearch).to.be.true;
      });
    });
    describe("canGetReport", function() {
      it("should return true for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canGetReport-success");
        const canGetReport = await renovation.perm.canGetReport({
          doctype: "Item"
        });
        completeRecording();
        expect(canGetReport).to.be.true;
      });
      it("should return true for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canGetReport-success");
        const canGetReport = await renovation.perm.canGetReport("Item");
        completeRecording();
        expect(canGetReport).to.be.true;
      });
    });
    describe("canSetUserPermissions", function() {
      it("should return false for the current user", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canSetUserPermissions-success");
        const canSetUserPermissions = await renovation.perm.canSetUserPermissions(
          { doctype: "Item" }
        );
        completeRecording();
        expect(canSetUserPermissions).to.be.false;
      });
      it("should return false for the current user [deprecated]", async function() {
        const { completeRecording } = await setupRecorder({
          mode: TestManager.testMode
        })("canSetUserPermissions-success");
        const canSetUserPermissions = await renovation.perm.canSetUserPermissions(
          "Item"
        );
        completeRecording();
        expect(canSetUserPermissions).to.be.false;
      });
    });
    describe("canSubmit", function() {
      it("should return false for the current user", async function() {
        const canSubmit = await renovation.perm.canSubmit({ doctype: "Item" });

        expect(canSubmit).to.be.false;
      });
      it("should return false for the current user [deprecated]", async function() {
        const canSubmit = await renovation.perm.canSubmit("Item");

        expect(canSubmit).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canSubmit = await renovation.perm.canSubmit({ doctype: "Item" });

        expect(canSubmit).to.be.false;
        await renovation.auth.login({
          email: TestManager.getTestUserCredentials().email,
          password: TestManager.getTestUserCredentials().password
        });
      });
    });
    describe("canAmend", function() {
      it("should return false for the current user", async function() {
        await renovation.perm.getPerm({ doctype: "Item" });
        const canAmend = await renovation.perm.canAmend({ doctype: "Item" });

        expect(canAmend).to.be.false;
      });

      it("should return false for the current user [deprecated]", async function() {
        await renovation.perm.getPerm({ doctype: "Item" });
        const canAmend = await renovation.perm.canAmend("Item");

        expect(canAmend).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canAmend = await renovation.perm.canAmend({ doctype: "Item" });

        expect(canAmend).to.be.false;
        await renovation.auth.login({
          email: TestManager.getTestUserCredentials().email,
          password: TestManager.getTestUserCredentials().password
        });
      });
    });
    describe("canRecursiveDelete", function() {
      it("should return false for the current user", async function() {
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete({
          doctype: "Item"
        });

        expect(canRecursiveDelete).to.be.false;
      });

      it("should return false for the current user [deprecated]", async function() {
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete(
          "Item"
        );

        expect(canRecursiveDelete).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete({
          doctype: "Item"
        });

        expect(canRecursiveDelete).to.be.false;
        await renovation.auth.login({
          email: TestManager.getTestUserCredentials().email,
          password: TestManager.getTestUserCredentials().password
        });
      });
    });
  });

  describe("loadBasicPerms", function() {
    it("should set the basic params and get the basic params of the current user", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("loadBasicPerms-success");
      const basicPerms = await renovation.perm.loadBasicPerms();
      completeRecording();
      expect(basicPerms.success).to.be.true;
    });
    it("should return failure if failed from the backend", async function() {
      renovation.perm.clearCache();
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("loadBasicPerms-fail");
      const basicPerms = await renovation.perm.loadBasicPerms();
      completeRecording();
      expect(basicPerms.success).to.be.false;
      expect(basicPerms.error.title).to.be.equal(
        RenovationController.GENERIC_ERROR_TITLE
      );
    });
  });
});
