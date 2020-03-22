import { expect } from "chai";

import { setupRecorder } from "nock-record";
import { RenovationError, SessionStatus } from "..";
import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { TestManager } from "../tests";

describe("Frappe Auth Controller", function() {
  this.timeout(10000);
  let renovation!: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  const creds = TestManager.getTestUserCredentials();

  describe("with Incorrect Credentials", function() {
    it("should not login successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-incorrect-credentials");
      const login = await renovation.auth.login({
        email: creds.email,
        password: "some random wrong password"
      });
      completeRecording();
      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
    });

    it("should not login successfully [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-incorrect-credentials");
      const login = await renovation.auth.login(
        creds.email,
        "some random wrong password"
      );
      completeRecording();
      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
    });

    it("should not login successfully for non-existing user", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-non-existing-user");
      const login = await renovation.auth.login({
        email: "random-email",
        password: "some random wrong password"
      });
      completeRecording();
      expect(login.httpCode).to.be.equal(404);
      expect(login.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(login.data.message).to.be.equal("User disabled or missing");
    });

    it("still should logout properly", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("logout-after-incorrect-credentials");
      const status = await renovation.auth.logout();
      completeRecording();
      expect(status.success).to.be.true;
      expect(status.httpCode).to.be.equal(200);
    });
  });

  describe("with Correct Credentials", function() {
    it("should login successfully for test account", async function() {
      // this.slow(2000); // login is slow if it takes 1 second
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-success");
      const login = await renovation.auth.login({
        email: creds.email,
        password: creds.password
      });
      completeRecording();
      expect(login.data.full_name).to.be.equal(creds.full_name);
    });

    it("should login successfully for test account [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-success-deprecated");
      const login = await renovation.auth.login(creds.email, creds.password);
      completeRecording();
      expect(login.data.full_name).to.be.equal(creds.full_name);
    });

    it("should verify login status for test account", async function() {
      // this.slow(500);
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("checkLogin-success");
      const status: any = await renovation.auth.checkLogin();
      completeRecording();

      expect(status.data.user).equals(creds.email);
      expect(status.data.message).equals("Logged In");
    });

    it("should logout properly", async function() {
      // this.slow(500);
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("logout-success");
      const logout = await renovation.auth.logout();
      completeRecording();

      expect(logout.httpCode).to.be.equal(200);
      expect(logout.success).to.be.true;
    });

    it("lets log back in for other tests", async function() {
      // this.slow(2000); // login is slow if it takes 1 second
      // this.timeout(10000);

      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("login-success");
      const login = await renovation.auth.login({
        email: creds.email,
        password: creds.password
      });
      completeRecording();
      expect(login.data.full_name).to.contain("Test");
    });
  });

  describe("with sendOTP", function() {
    it("should generate new OTP for correct mobile", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("sendOTP-success");

      const generatedOTP = await renovation.auth.sendOTP({
        mobile: "<mobile_number>",
        newOTP: true
      });
      completeRecording();

      expect(generatedOTP.success).to.be.true;
      expect(generatedOTP.data.status).to.be.equal("success");
      expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
    });
    it("should generate new OTP using smsLoginGeneratePIN", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("sendOTP-success-deprecated");

      const generatedOTP = await renovation.auth.smsLoginGeneratePIN(
        "<mobile_number>",
        true
      );
      completeRecording();
      expect(generatedOTP.success).to.be.true;
      expect(generatedOTP.data.status).to.be.equal("success");
      expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
    });
    it("should generate the existing OTP for correct mobile", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("sendOTP-success-generateExisting");

      const generatedOTPExisting = await renovation.auth.sendOTP({
        mobile: "<mobile_number>",
        newOTP: false
      });
      completeRecording();
      expect(generatedOTPExisting.success).to.be.true;
      expect(generatedOTPExisting.data.status).to.be.equal("success");
      expect(generatedOTPExisting.data.mobile).to.be.equal("<mobile_number>");
    });

    it("should generate the existing OTP for correct mobile using smsLoginGeneratePIN", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("sendOTP-success-deprecated-generateExisting");

      const generatedOTP = await renovation.auth.smsLoginGeneratePIN(
        "<mobile_number>"
      );
      completeRecording();
      expect(generatedOTP.success).to.be.true;
      expect(generatedOTP.data.status).to.be.equal("success");
      expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
    });
  });

  describe("with verifyOTP", function() {
    it("should verify OTP successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-success");

      const verifiedOTP = await renovation.auth.verifyOTP({
        mobile: "<mobile_number>",
        OTP: "<OTP>",
        loginToUser: false
      });
      completeRecording();
      expect(verifiedOTP.success).to.be.true;
      expect(verifiedOTP.data.status).to.be.equal("verified");
      expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
    });
    it("should verify OTP successfully using smsLoginVerifyPIN", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-success-deprecated");

      const verifiedOTP = await renovation.auth.smsLoginVerifyPIN(
        "<mobile_number>",
        "<OTP>",
        false
      );
      completeRecording();
      expect(verifiedOTP.success).to.be.true;
      expect(verifiedOTP.data.status).to.be.equal("verified");
      expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
    });
    it("should return invalid_pin for invalid OTP", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-invalid-pin");

      const verifiedOTP = await renovation.auth.verifyOTP({
        mobile: "<mobile_number>",
        OTP: "<OTP>",
        loginToUser: false
      });
      completeRecording();
      expect(verifiedOTP.success).to.be.false;
      expect(verifiedOTP.httpCode).to.be.equal(401);
      expect(verifiedOTP.data.status).to.be.equal("invalid_pin");
      expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
      expect(verifiedOTP.error.type).to.be.equal(
        RenovationError.AuthenticationError
      );
      expect(verifiedOTP.error.title).to.be.equal("Wrong OTP");
    });

    it("should fail for non-existing user", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-fail-login");

      const verifiedOTP = await renovation.auth.verifyOTP({
        mobile: "<mobile_number>",
        OTP: "<OTP>",
        loginToUser: true
      });
      completeRecording();
      expect(verifiedOTP.success).to.be.false;
      expect(verifiedOTP.httpCode).to.be.equal(404);
      expect(verifiedOTP.data.status).to.be.equal("user_not_found");
      expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
      expect(verifiedOTP.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(verifiedOTP.error.title).to.be.equal("User not found");
    });

    it("should successfully verify but not login for non-linked user", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-success-login-not-linked");

      const verifiedOTP = await renovation.auth.verifyOTP({
        mobile: "<mobile_number>",
        OTP: "<OTP>",
        loginToUser: true
      });
      completeRecording();
      expect(verifiedOTP.success).to.be.false;
      expect(verifiedOTP.httpCode).to.be.equal(404);
      expect(verifiedOTP.data.status).to.be.equal("no_linked_user");
      expect(verifiedOTP.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(verifiedOTP.error.title).to.be.equal("User not found");
    });

    it("should successfully verify and login", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("verifyOTP-success-login");

      const verifiedOTP = await renovation.auth.verifyOTP({
        mobile: "<mobile_number>",
        OTP: "<OTP>",
        loginToUser: true
      });
      completeRecording();
      expect(verifiedOTP.success).to.be.true;
      expect(verifiedOTP.httpCode).to.be.equal(200);
      expect(SessionStatus.getValue().customer).to.be.equal(
        "TEST REGISTER CUSTOMER"
      );
    });
  });
  describe("pinLogin", async function() {
    it("should login successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("pinLogin-success");

      const login = await renovation.auth.pinLogin({
        user: "<mobile_number>@example.com",
        pin: "<OTP>"
      });
      completeRecording();

      expect(login.success).to.be.true;
      expect(login.data.user).to.be.equal("<mobile_number>@example.com");
    });
    it("should login successfully [deprecated]", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("pinLogin-success");

      const login = await renovation.auth.pinLogin(
        "<mobile_number>@example.com",
        "<OTP>"
      );
      completeRecording();

      expect(login.success).to.be.true;
      expect(login.data.user).to.be.equal("<mobile_number>@example.com");
    });

    it("should fail for incorrect password successfully", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("pinLogin-fail-incorrect-password");

      const login = await renovation.auth.pinLogin({
        user: "<mobile_number>@example.com",
        pin: "<OTP>"
      });
      completeRecording();

      expect(login.success).to.be.false;
      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
      expect(login.error.type).to.be.equal(RenovationError.AuthenticationError);
      expect(login.error.title).to.be.equal("Incorrect Pin");
    });
  });

  describe("getCurrentUserRoles", function() {
    it("should get the current user roles", async function() {
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getCurrentUserRoles-success");
      const currentUserRoles = await renovation.auth.getCurrentUserRoles();
      completeRecording();
      expect(currentUserRoles.success).to.be.true;
      expect(currentUserRoles.data).to.be.an("array");
      expect(currentUserRoles.data.length).to.be.greaterThan(0);
    });
    it("should get the Guest user roles if logged out", async function() {
      await renovation.auth.logout();
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getCurrentUserRoles-success-guest");
      const currentUserRoles = await renovation.auth.getCurrentUserRoles();
      completeRecording();
      expect(currentUserRoles.success).to.be.true;
      expect(currentUserRoles.data).to.be.deep.equal(["Guest"]);
      await renovation.auth.login({
        email: TestManager.getTestUserCredentials().email,
        password: TestManager.getTestUserCredentials().password
      });
    });

    it("should return failure for error in response", async function() {
      await renovation.auth.logout();
      const { completeRecording } = await setupRecorder({
        mode: TestManager.testMode
      })("getCurrentUserRoles-fail");
      const currentUserRoles = await renovation.auth.getCurrentUserRoles();
      completeRecording();
      expect(currentUserRoles.success).to.be.false;
      expect(currentUserRoles.error.type).to.be.equal(
        RenovationError.GenericError
      );
      expect(currentUserRoles.error.title).to.be.equal(
        RenovationController.GENERIC_ERROR_TITLE
      );
    });
  });

  describe("setUserLanguage", function() {
    //TODO: Add tests
  });

  after(async function() {
    await renovation.auth.login({
      email: TestManager.getTestUserCredentials().email,
      password: TestManager.getTestUserCredentials().password
    });
  });
});
