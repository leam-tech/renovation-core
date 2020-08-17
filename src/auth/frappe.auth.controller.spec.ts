import { expect } from "chai";
import { ENV_VARIABLES, RenovationError, SessionStatus } from "..";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";

describe("Frappe Auth Controller", function() {
  this.timeout(10000);
  let renovation!: Renovation;

  const validUser = TestManager.secondaryUser;
  const validPwd = TestManager.secondaryUserPwd;
  const validUserName = TestManager.secondaryUserName;
  const validPin = TestManager.getVariables(ENV_VARIABLES.PinNumber);

  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  describe("with Incorrect Credentials", function() {
    it("should not login successfully", async function() {
      const login = await renovation.auth.login({
        email: validUser,
        password: "some random wrong password"
      });
      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
    });

    it("should not login successfully [deprecated]", async function() {
      const login = await renovation.auth.login(
        validUser,
        "some random wrong password"
      );

      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
    });

    it("should not login successfully for non-existing user", async function() {
      const login = await renovation.auth.login({
        email: "random-email",
        password: "some random wrong password"
      });

      expect(login.httpCode).to.be.equal(404);
      expect(login.error.type).to.be.equal(RenovationError.NotFoundError);
      expect(login.data.message).to.be.equal("User disabled or missing");
    });

    it("still should logout properly", async function() {
      const status = await renovation.auth.logout();

      expect(status.success).to.be.true;
      expect(status.httpCode).to.be.equal(200);
    });
  });

  describe("with Correct Credentials", function() {
    it("should login successfully for test account", async function() {
      const login = await renovation.auth.login({
        email: validUser,
        password: validPwd
      });
      expect(login.data.full_name).to.be.equal(validUserName);
    });

    it("should login successfully for test account [deprecated]", async function() {
      const login = await renovation.auth.login(validUser, validPwd);

      expect(login.data.full_name).to.be.equal(validUserName);
    });

    it("should verify login status for test account", async function() {
      const status: any = await renovation.auth.checkLogin();

      expect(status.data.user).equals(validUser);
      expect(status.data.message).equals("Logged In");
    });

    it("should logout properly", async function() {
      const logout = await renovation.auth.logout();

      expect(logout.httpCode).to.be.equal(200);
      expect(logout.success).to.be.true;
    });

    after(() => renovation.auth.logout());
  });

  // describe("with sendOTP", function() {
  //   it("should generate new OTP for correct mobile", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("sendOTP-success");
  //
  //     const generatedOTP = await renovation.auth.sendOTP({
  //       mobile: "<mobile_number>",
  //       newOTP: true
  //     });
  //     completeRecording();
  //
  //     expect(generatedOTP.success).to.be.true;
  //     expect(generatedOTP.data.status).to.be.equal("success");
  //     expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
  //   });
  //   it("should generate new OTP using smsLoginGeneratePIN", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("sendOTP-success-deprecated");
  //
  //     const generatedOTP = await renovation.auth.smsLoginGeneratePIN(
  //       "<mobile_number>",
  //       true
  //     );
  //     completeRecording();
  //     expect(generatedOTP.success).to.be.true;
  //     expect(generatedOTP.data.status).to.be.equal("success");
  //     expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
  //   });
  //   it("should generate the existing OTP for correct mobile", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("sendOTP-success-generateExisting");
  //
  //     const generatedOTPExisting = await renovation.auth.sendOTP({
  //       mobile: "<mobile_number>",
  //       newOTP: false
  //     });
  //     completeRecording();
  //     expect(generatedOTPExisting.success).to.be.true;
  //     expect(generatedOTPExisting.data.status).to.be.equal("success");
  //     expect(generatedOTPExisting.data.mobile).to.be.equal("<mobile_number>");
  //   });
  //
  //   it("should generate the existing OTP for correct mobile using smsLoginGeneratePIN", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("sendOTP-success-deprecated-generateExisting");
  //
  //     const generatedOTP = await renovation.auth.smsLoginGeneratePIN(
  //       "<mobile_number>"
  //     );
  //     completeRecording();
  //     expect(generatedOTP.success).to.be.true;
  //     expect(generatedOTP.data.status).to.be.equal("success");
  //     expect(generatedOTP.data.mobile).to.be.equal("<mobile_number>");
  //   });
  // });

  // describe("with verifyOTP", function() {
  //   it("should verify OTP successfully", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-success");
  //
  //     const verifiedOTP = await renovation.auth.verifyOTP({
  //       mobile: "<mobile_number>",
  //       OTP: "<OTP>",
  //       loginToUser: false
  //     });
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.true;
  //     expect(verifiedOTP.data.status).to.be.equal("verified");
  //     expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
  //   });
  //   it("should verify OTP successfully using smsLoginVerifyPIN", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-success-deprecated");
  //
  //     const verifiedOTP = await renovation.auth.smsLoginVerifyPIN(
  //       "<mobile_number>",
  //       "<OTP>",
  //       false
  //     );
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.true;
  //     expect(verifiedOTP.data.status).to.be.equal("verified");
  //     expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
  //   });
  //   it("should return invalid_pin for invalid OTP", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-invalid-pin");
  //
  //     const verifiedOTP = await renovation.auth.verifyOTP({
  //       mobile: "<mobile_number>",
  //       OTP: "<OTP>",
  //       loginToUser: false
  //     });
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.false;
  //     expect(verifiedOTP.httpCode).to.be.equal(401);
  //     expect(verifiedOTP.data.status).to.be.equal("invalid_pin");
  //     expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
  //     expect(verifiedOTP.error.type).to.be.equal(
  //       RenovationError.AuthenticationError
  //     );
  //     expect(verifiedOTP.error.title).to.be.equal("Wrong OTP");
  //   });
  //
  //   it("should fail for non-existing user", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-fail-login");
  //
  //     const verifiedOTP = await renovation.auth.verifyOTP({
  //       mobile: "<mobile_number>",
  //       OTP: "<OTP>",
  //       loginToUser: true
  //     });
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.false;
  //     expect(verifiedOTP.httpCode).to.be.equal(404);
  //     expect(verifiedOTP.data.status).to.be.equal("user_not_found");
  //     expect(verifiedOTP.data.mobile).to.be.equal("<mobile_number>");
  //     expect(verifiedOTP.error.type).to.be.equal(RenovationError.NotFoundError);
  //     expect(verifiedOTP.error.title).to.be.equal("User not found");
  //   });
  //
  //   it("should successfully verify but not login for non-linked user", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-success-login-not-linked");
  //
  //     const verifiedOTP = await renovation.auth.verifyOTP({
  //       mobile: "<mobile_number>",
  //       OTP: "<OTP>",
  //       loginToUser: true
  //     });
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.false;
  //     expect(verifiedOTP.httpCode).to.be.equal(404);
  //     expect(verifiedOTP.data.status).to.be.equal("no_linked_user");
  //     expect(verifiedOTP.error.type).to.be.equal(RenovationError.NotFoundError);
  //     expect(verifiedOTP.error.title).to.be.equal("User not found");
  //   });
  //
  //   it("should successfully verify and login", async function() {
  //     const { completeRecording } = await setupRecorder({
  //       mode: TestManager.testMode
  //     })("verifyOTP-success-login");
  //
  //     const verifiedOTP = await renovation.auth.verifyOTP({
  //       mobile: "<mobile_number>",
  //       OTP: "<OTP>",
  //       loginToUser: true
  //     });
  //     completeRecording();
  //     expect(verifiedOTP.success).to.be.true;
  //     expect(verifiedOTP.httpCode).to.be.equal(200);
  //     expect(SessionStatus.getValue().customer).to.be.equal(
  //       "TEST REGISTER CUSTOMER"
  //     );
  //   });
  // });
  describe("pinLogin", async function() {
    it("should login successfully", async function() {
      const login = await renovation.auth.pinLogin({
        user: validUser,
        pin: validPin
      });

      expect(login.success).to.be.true;
      expect(login.data.user).to.be.equal(validUser);
    });
    it("should login successfully [deprecated]", async function() {
      const login = await renovation.auth.pinLogin(validUser, validPin);

      expect(login.success).to.be.true;
      expect(login.data.user).to.be.equal(validUser);
    });

    it("should fail for incorrect pin successfully", async function() {
      const login = await renovation.auth.pinLogin({
        user: validUser,
        pin: "0000"
      });

      expect(login.success).to.be.false;
      expect(login.httpCode).to.be.equal(401);
      expect(login.data.message).to.be.equal("Incorrect password");
      expect(login.error.type).to.be.equal(RenovationError.AuthenticationError);
      expect(login.error.title).to.be.equal("Incorrect Pin");
    });

    after(() => renovation.auth.logout());
  });

  describe("getCurrentUserRoles", function() {
    it("should get the current user roles", async function() {
      await renovation.auth.login({ email: validUser, password: validPwd });
      const currentUserRoles = await renovation.auth.getCurrentUserRoles();
      expect(currentUserRoles.success).to.be.true;
      expect(currentUserRoles.data).to.be.an("array");
      expect(currentUserRoles.data.length).to.be.greaterThan(0);
      await renovation.auth.getCurrentUserRoles();
    });

    // FIXME: bug in the backend.
    // it("should get the Guest user roles if logged out", async function() {
    //   await renovation.auth.logout();
    //   await asyncSleep(1000);
    //   const currentUserRoles = await renovation.auth.getCurrentUserRoles();
    //   expect(currentUserRoles.success).to.be.true;
    //   expect(currentUserRoles.data).to.be.deep.equal(["Guest"]);
    // });

    after(() => renovation.auth.logout());
  });

  describe("setUserLanguage", function() {
    beforeEach(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it("should successfully change the language of current user", async function() {
      await renovation.auth.login({
        email: validUser,
        password: validPwd
      });
      const response = await renovation.auth.setUserLanguage("ar");
      expect(response).to.be.true;
      expect(SessionStatus.value.lang, "ar");
    });

    it("should throw an Error if the user is not logged in", async function() {
      await renovation.auth.logout();
      expect(async () => await renovation.auth.setUserLanguage("ar")).to.throw;
    });

    it("should throw an Error if the language is incorrect", async function() {
      expect(async () => await renovation.auth.setUserLanguage("ar")).to.throw;
    });

    after(() => renovation.auth.logout());
  });

  describe("estimatePassword", function() {
    describe("Estimate password only", function() {
      it("with score 0", function() {
        let result = renovation.auth.estimatePassword({
          password: "1qaz2wsx3edc"
        });
        expect(result.score === 0);
      });
      it("with score 1", function() {
        let result = renovation.auth.estimatePassword({
          password: "temppass22"
        });
        expect(result.score === 1);
      });
      it("with score 2", function() {
        let result = renovation.auth.estimatePassword({
          password: "qwER43@!"
        });
        expect(result.score === 2);
      });
      it("with score 3", function() {
        let result = renovation.auth.estimatePassword({
          password: "ryanhunter2000"
        });
        expect(result.score === 3);
      });
      it("with score 4", function() {
        let result = renovation.auth.estimatePassword({
          password: "erlineVANDERMARK"
        });
        expect(result.score === 4);
      });
    });

    describe("Estimate password with custom inputs", function() {
      it("With first name parameter", function() {
        let result = renovation.auth.estimatePassword({
          password: "temppass22",
          user_inputs: { firstName: "temp" }
        });
        expect(result.score === 1);
      });

      it("With email parameter", function() {
        let result = renovation.auth.estimatePassword({
          password: "qwER43@!",
          user_inputs: { email: "er43@gmail.com" }
        });
        expect(result.score === 2);
      });

      it("With last name parameter", function() {
        let result = renovation.auth.estimatePassword({
          password: "ryanhunter2000",
          user_inputs: { firstName: "ryanhunter" }
        });
        expect(result.score === 1);
      });

      it("With first name parameter", function() {
        let result = renovation.auth.estimatePassword({
          password: "verlineVANDERMARK",
          user_inputs: { otherInputs: ["VANDERMARK"] }
        });
        expect(result.score === 1);
      });
    });
  });
});
