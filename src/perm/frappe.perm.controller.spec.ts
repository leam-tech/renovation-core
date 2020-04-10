import { expect } from "chai";
import { Renovation } from "../";
import { TestManager } from "../tests";
import { PermissionType } from "./perm.model";

describe("FrappePermController", function() {
  this.timeout(10000);
  let renovation: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const secondUser = TestManager.secondaryUser;
  const secondUserPwd = TestManager.secondaryUserPwd;

  before(async function() {
    this.timeout(20000);
    renovation = await TestManager.init("frappe");

    await renovation.auth.login({
      email: validUser,
      password: validPwd
    });
  });
  describe("getPerm", function() {
    it("should get permissions of current user", async function() {
      const perms = await renovation.perm.getPerm({ doctype: "User" });

      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
    });
    it("should get permissions of current user [deprecated]", async function() {
      const perms = await renovation.perm.getPerm("User");

      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
    });

    it("should fail for non-existing doctype", async function() {
      // TODO: Return failure?

      const perms = await renovation.perm.getPerm({ doctype: "NON-EXISTING" });

      expect(perms.success).to.be.true;
      expect(perms.data).to.be.an("array");
      expect(perms.data.length).to.be.equal(1);
      expect(Object.keys(perms.data[0]).length).to.be.equal(2);
      expect(perms.data[0]).to.have.keys(["read", "_ifOwner"]);
    });
  });

  describe("hasPerm", function() {
    it("should get true for read permission of User", async function() {
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "User",
        ptype: PermissionType.read
      });

      expect(hasPermission).to.be.true;
    });
    it("should get true for read permission of User [deprecated]", async function() {
      const hasPermission = await renovation.perm.hasPerm(
        "User",
        PermissionType.read
      );

      expect(hasPermission).to.be.true;
    });

    it("should get false for setting user permissions permission of User", async function() {
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "User",
        ptype: PermissionType.setUserPermissions
      });

      expect(hasPermission).to.be.false;
    });

    it("should get true for create permission of User with a docname", async function() {
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "User",
        ptype: PermissionType.create,
        permLevel: 0,
        docname: secondUser
      });

      expect(hasPermission).to.be.true;
    });

    it("should get false for create permission of User with a docname with permlevel 1", async function() {
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "User",
        ptype: PermissionType.create,
        permLevel: 1,
        docname: secondUser
      });

      expect(hasPermission).to.be.false;
    });

    it("should get false for non-existing DocType", async function() {
      const hasPermission = await renovation.perm.hasPerm({
        doctype: "NON-EXISTING",
        ptype: PermissionType.submit
      });

      expect(hasPermission).to.be.false;
    });
  });

  describe("hasPerms", function() {
    it("should return true for all true permissions", async function() {
      const hasPermissions = await renovation.perm.hasPerms({
        doctype: "User",
        ptypes: [
          PermissionType.read,
          PermissionType.write,
          PermissionType.create
        ]
      });

      expect(hasPermissions).to.be.true;
    });
    it("should return true for all true permissions [deprecated]", async function() {
      const hasPermissions = await renovation.perm.hasPerms("User", [
        PermissionType.read,
        PermissionType.write,
        PermissionType.create
      ]);

      expect(hasPermissions).to.be.true;
    });
    it("should return false if at least one permission is false", async function() {
      const hasPermissions = await renovation.perm.hasPerms({
        doctype: "User",
        ptypes: [
          PermissionType.read,
          PermissionType.write,
          PermissionType.setUserPermissions
        ]
      });

      expect(hasPermissions).to.be.false;
    });
  });

  describe("Basic Params", function() {
    const loginPrimary = async () =>
      await renovation.auth.login({
        email: validUser,
        password: validPwd
      });

    const loginSecondary = async () =>
      await renovation.auth.login({
        email: secondUser,
        password: secondUserPwd
      });

    describe("canCreate", function() {
      it("should return true for a System Manager user", async function() {
        const canCreate = await renovation.perm.canCreate({ doctype: "User" });

        expect(canCreate).to.be.true;
      });

      it("should return true for a System Manager user [deprecated]", async function() {
        const canCreate = await renovation.perm.canCreate("User");

        expect(canCreate).to.be.true;
      });

      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canCreate = await renovation.perm.canCreate({ doctype: "User" });
        expect(canCreate).to.be.false;
      });

      after(async () => await loginPrimary());
    });
    describe("canRead", function() {
      it("should return true for a System Manager user", async function() {
        const canRead = await renovation.perm.canRead({
          doctype: "System Settings"
        });

        expect(canRead).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canRead = await renovation.perm.canRead("System Settings");
        expect(canRead).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canRead = await renovation.perm.canRead({
          doctype: "System Settings"
        });

        expect(canRead).to.be.false;
      });

      after(async () => await loginPrimary());
    });
    describe("canWrite", function() {
      it("should return true for a System Manager user", async function() {
        const canWrite = await renovation.perm.canWrite({
          doctype: "System Settings"
        });

        expect(canWrite).to.be.true;
      });

      it("should return true for a System Manager user [deprecated]", async function() {
        const canWrite = await renovation.perm.canWrite("System Settings");

        expect(canWrite).to.be.true;
      });

      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canWrite = await renovation.perm.canWrite({
          doctype: "System Settings"
        });

        expect(canWrite).to.be.false;
      });

      after(async () => await loginPrimary());
    });
    describe("canCancel", function() {
      it("should return true for a System Manager user", async function() {
        const canCancel = await renovation.perm.canCancel({
          doctype: "Renovation User Agreement"
        });

        expect(canCancel).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canCancel = await renovation.perm.canCancel(
          "Renovation User Agreement"
        );

        expect(canCancel).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canCancel = await renovation.perm.canCancel({
          doctype: "Renovation User Agreement"
        });

        expect(canCancel).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canDelete", function() {
      it("should return true for a System Manager user", async function() {
        const canDelete = await renovation.perm.canDelete({ doctype: "User" });

        expect(canDelete).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canDelete = await renovation.perm.canDelete("User");

        expect(canDelete).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canDelete = await renovation.perm.canDelete({ doctype: "User" });

        expect(canDelete).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canImport", function() {
      it("should return true for a System Manager user", async function() {
        const canImport = await renovation.perm.canImport({ doctype: "User" });

        expect(canImport).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canImport = await renovation.perm.canImport("User");

        expect(canImport).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canImport = await renovation.perm.canImport({ doctype: "User" });

        expect(canImport).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canExport", function() {
      it("should return true for a System Manager user", async function() {
        const canExport = await renovation.perm.canExport({
          doctype: "Renovation User Agreement"
        });

        expect(canExport).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canExport = await renovation.perm.canExport(
          "Renovation User Agreement"
        );

        expect(canExport).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canExport = await renovation.perm.canExport({
          doctype: "Renovation User Agreement"
        });

        expect(canExport).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canPrint", function() {
      it("should return true for a System Manager user", async function() {
        const canPrint = await renovation.perm.canPrint({
          doctype: "Renovation User Agreement"
        });

        expect(canPrint).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canPrint = await renovation.perm.canPrint(
          "Renovation User Agreement"
        );

        expect(canPrint).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canPrint = await renovation.perm.canPrint({
          doctype: "Renovation User Agreement"
        });

        expect(canPrint).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canEmail", function() {
      it("should return true for a System Manager user", async function() {
        const canEmail = await renovation.perm.canEmail({ doctype: "User" });

        expect(canEmail).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canEmail = await renovation.perm.canEmail("User");

        expect(canEmail).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canEmail = await renovation.perm.canEmail({ doctype: "User" });

        expect(canEmail).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canSearch", function() {
      it("should return true for a System Manager user", async function() {
        const canSearch = await renovation.perm.canSearch({
          doctype: "Bank"
        });

        expect(canSearch).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canSearch = await renovation.perm.canSearch("Bank");

        expect(canSearch).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canSearch = await renovation.perm.canSearch({
          doctype: "Bank"
        });

        expect(canSearch).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canGetReport", function() {
      it("should return true for a System Manager user", async function() {
        const canGetReport = await renovation.perm.canGetReport({
          doctype: "Renovation User Agreement"
        });

        expect(canGetReport).to.be.true;
      });
      it("should return true for a System Manager user [deprecated]", async function() {
        const canGetReport = await renovation.perm.canGetReport(
          "Renovation User Agreement"
        );

        expect(canGetReport).to.be.true;
      });
      it("should return false for a non System Manager user", async function() {
        await loginSecondary();
        const canGetReport = await renovation.perm.canGetReport({
          doctype: "Renovation User Agreement"
        });

        expect(canGetReport).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canSetUserPermissions", function() {
      it("should return false for a System Manager user", async function() {
        const canSetUserPermissions = await renovation.perm.canSetUserPermissions(
          { doctype: "User" }
        );

        expect(canSetUserPermissions).to.be.false;
      });
      it("should return false for a System Manager user [deprecated]", async function() {
        const canSetUserPermissions = await renovation.perm.canSetUserPermissions(
          "User"
        );

        expect(canSetUserPermissions).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canSubmit", function() {
      it("should return false for a System Manager user", async function() {
        const canSubmit = await renovation.perm.canSubmit({
          doctype: "Renovation User Agreement"
        });

        expect(canSubmit).to.be.false;
      });
      it("should return false for a System Manager user [deprecated]", async function() {
        const canSubmit = await renovation.perm.canSubmit(
          "Renovation User Agreement"
        );

        expect(canSubmit).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canSubmit = await renovation.perm.canSubmit({
          doctype: "Renovation User Agreement"
        });

        expect(canSubmit).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canAmend", function() {
      it("should return false for a System Manager user", async function() {
        const canAmend = await renovation.perm.canAmend({
          doctype: "Renovation User Agreement"
        });

        expect(canAmend).to.be.false;
      });

      it("should return false for a System Manager user [deprecated]", async function() {
        const canAmend = await renovation.perm.canAmend(
          "Renovation User Agreement"
        );

        expect(canAmend).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canAmend = await renovation.perm.canAmend({
          doctype: "Renovation User Agreement"
        });

        expect(canAmend).to.be.false;
      });
      after(async () => await loginPrimary());
    });
    describe("canRecursiveDelete", function() {
      it("should return false for a System Manager user", async function() {
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete({
          doctype: "Renovation User Agreement"
        });

        expect(canRecursiveDelete).to.be.false;
      });

      it("should return false for a System Manager user [deprecated]", async function() {
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete(
          "Renovation User Agreement"
        );

        expect(canRecursiveDelete).to.be.false;
      });
      it("should return false for logged out user", async function() {
        await renovation.auth.logout();
        const canRecursiveDelete = await renovation.perm.canRecursiveDelete({
          doctype: "Renovation User Agreement"
        });

        expect(canRecursiveDelete).to.be.false;
      });
      after(async () => await loginPrimary());
    });
  });

  describe("loadBasicPerms", function() {
    it("should set the basic params and get the basic params of the current user", async function() {
      const basicPerms = await renovation.perm.loadBasicPerms();

      expect(basicPerms.success).to.be.true;
    });
  });
});
