import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { RenovationConfig } from "../config";
import { Renovation } from "../renovation";
import { ENV_VARIABLES, TestManager } from "../tests";
import { renovationError, renovationLog } from "../utils";
import { onBrowser } from "../utils/request";

describe("Frappe Storage Controller", function() {
  let renovation: Renovation;
  this.timeout(20000);

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;

  const existingFolder = TestManager.getVariables(ENV_VARIABLES.ExistingFolder);

  before(async function() {
    renovation = await TestManager.init("frappe");
    await renovation.auth.login({
      email: validUser,
      password: validPwd
    });
  });
  describe("getUrl", function() {
    it("should return null if the input is null", function() {
      const getUrl = renovation.storage.getUrl(null);
      expect(getUrl).to.be.null;
    });
    it("should return the appended path if a string is passed", function() {
      const getUrl = renovation.storage.getUrl("/files/file-1.jpg");
      expect(getUrl).to.be.equal(
        RenovationConfig.instance.hostUrl + "/files/file-1.jpg"
      );
    });
  });

  describe("uploadFile", function() {
    describe("uploadFile - UploadFileParams", function() {
      describe("Buffer as input", function() {
        it("should upload successfully using socket.io", function(done) {
          const buffer = readFileSync(
            path.join(__dirname, "..", "tests", "sample.txt"),
            { encoding: "utf-8" }
          );
          renovation.storage
            .uploadFile({
              fileBuffer: buffer,
              fileName: "sample.txt"
            })
            .subscribe(
              status => {
                switch (status.status) {
                  case "uploading":
                    expect(status.hasProgress).to.be.true;
                    expect(status.requestResponse).to.be.undefined;
                    break;
                  case "completed":
                    expect(status.hasProgress).to.be.true;
                    expect(status.progress).to.be.equal(100);
                    expect(status.requestResponse.success).to.be.true;
                    break;
                  default:
                }
              },
              err => renovationError(err),
              () => done()
            );
        });
        it("should throw error if the file doesn't exist", async function() {
          expect(() =>
            renovation.storage.uploadFile({
              filePath: "non_existing.txt"
            })
          ).to.throw;
        });
        it("should throw error if the filename isn't specified", async function() {
          const buffer = readFileSync(
            path.join(__dirname, "..", "tests", "sample.txt"),
            { encoding: "utf-8" }
          );

          expect(() =>
            renovation.storage.uploadFile({
              fileBuffer: buffer
            })
          ).to.throw("Please provide fileName along with buffer");
        });
        it("should fail if it's on the browser", async function() {
          const buffer = readFileSync(
            path.join(__dirname, "..", "tests", "sample.txt"),
            { encoding: "utf-8" }
          );
          // @ts-ignore
          onBrowser = true;

          expect(() =>
            renovation.storage.uploadFile({
              fileBuffer: buffer,
              fileName: "sample.txt"
            })
          ).to.throw("Cant do filename upload in Browser");

          // @ts-ignore
          onBrowser = false;
        });
      });
    });
    describe("uploadFile - folder - deprecated", function() {
      // TODO: Simulate a browser since File API is a browser API
    });
    describe("uploadFile - folder - filepath [deprecated]", function() {
      it("should successfully upload a file from the filepath", function(done) {
        renovation.storage
          .uploadFile(
            path.join(__dirname, "..", "tests", "sample.txt"),
            false,
            "Home"
          )
          .subscribe(
            status => {
              switch (status.status) {
                case "uploading":
                  expect(status.hasProgress).to.be.true;
                  expect(status.requestResponse).to.be.undefined;
                  break;
                case "completed":
                  expect(status.hasProgress).to.be.true;
                  expect(status.progress).to.be.equal(100);
                  expect(status.requestResponse.success).to.be.true;
                  break;
                default:
              }
            },
            err => renovationLog(err),
            () => done()
          );
      });

      it("should fail if file isn't existing", function() {
        expect(() => {
          renovation.storage.uploadFile({
            filePath: "non_existing.txt",
            isPrivate: false,
            folder: "Home"
          });
        }).to.throw;
      });

      it("should throw error if on Browser", function() {
        // @ts-ignore
        onBrowser = true;

        expect(() => {
          renovation.storage.uploadFile({
            fileName: path.join(__dirname, "..", "tests", "sample.txt"),
            isPrivate: false,
            folder: "Home"
          });
        }).to.throw("Cant do filename upload in Browser");

        // @ts-ignore
        onBrowser = false;
      });
    });
    describe("uploadFile - doctype - deprecated", function() {
      it("should successfully upload a file from the filepath and specifying the doctype", function(done) {
        renovation.storage
          .uploadFile(
            path.join(__dirname, "..", "tests", "sample.txt"),
            false,
            "User",
            validUser
          )
          .subscribe(
            status => {
              switch (status.status) {
                case "uploading":
                  expect(status.hasProgress).to.be.true;
                  expect(status.requestResponse).to.be.undefined;
                  break;
                case "completed":
                  expect(status.hasProgress).to.be.true;
                  expect(status.progress).to.be.equal(100);
                  expect(status.requestResponse.success).to.be.true;
                  break;
                default:
              }
            },
            err => renovationLog(err),
            () => done()
          );
      });
      it("should successfully upload a file from the filepath and specifying the docfield", function(done) {
        renovation.storage
          .uploadFile(
            path.join(__dirname, "..", "tests", "sample.txt"),
            false,
            "User",
            validUser,
            "image"
          )
          .subscribe(
            status => {
              switch (status.status) {
                case "uploading":
                  expect(status.hasProgress).to.be.true;
                  expect(status.requestResponse).to.be.undefined;
                  break;
                case "completed":
                  expect(status.hasProgress).to.be.true;
                  expect(status.progress).to.be.equal(100);
                  expect(status.requestResponse.success).to.be.true;
                  break;
                default:
              }
            },
            err => renovationLog(err),
            () => done()
          );
      });
    });
  });

  describe("createFolder", function() {
    it("should return a failure if the folder name includes a forward slash", async function() {
      const createFolder = await renovation.storage.createFolder(
        "main/subdirectory"
      );
      expect(createFolder.success).to.be.false;
      expect(createFolder.httpCode).to.be.equal(412);
      expect(createFolder.error.title).to.be.equal("Invalid Folder Name");
    });

    it("should create folder successfully in backend with empty data", async function() {
      const createFolder = await renovation.storage.createFolder("New Folder");

      expect(createFolder.success).to.be.true;
      expect(createFolder.data).to.be.deep.equal({});
    });

    it("should return failure for duplicate folder name", async function() {
      const createFolder = await renovation.storage.createFolder(
        existingFolder
      );

      expect(createFolder.success).to.be.false;
      expect(createFolder.httpCode).to.be.equal(409);
      expect(createFolder.error.title).to.be.equal(
        "Folder with same name exists"
      );
    });
    after(async () => {
      await renovation.call({
        cmd: "frappe.desk.reportview.delete_items",
        doctype: "File",
        items: JSON.stringify(["Home/New Folder"])
      });
    });
  });

  describe("HTTP Fallback", function() {
    it("should fail in socket-io and proceed with HTTP successfully", function(done) {
      const buffer = readFileSync(
        path.join(__dirname, "..", "tests", "sample-large.txt"),
        { encoding: "utf-8" }
      );
      let counter = 0;
      renovation.storage
        .uploadFile({
          fileBuffer: buffer,
          fileName: "sample.txt"
        })
        .subscribe(
          status => {
            switch (status.status) {
              case "uploading":
                counter === 0
                  ? expect(status.hasProgress).to.be.true // Socket IO upload
                  : expect(status.hasProgress).to.be.false; // HTTP upload
                counter++;
                break;
              case "completed":
                expect(status.requestResponse.success).to.be.true;
                break;
              default:
            }
          },
          err => renovationError(err),
          () => done()
        );
      // Force upload via HTTP
      renovation.socketio.disconnect();
    });
  });

  describe("checkFolderExists", function() {
    it("should return success and true value for data for existing folder", async function() {
      const createFolder = await renovation.storage.checkFolderExists(
        "Home/" + existingFolder
      );

      expect(createFolder.success).to.be.true;
      expect(createFolder.data).to.be.equal(true);
    });
    it("should return success and false value for data for non-existing folder", async function() {
      const createFolder = await renovation.storage.checkFolderExists(
        "Home/non-existing"
      );

      expect(createFolder.success).to.be.true;
      expect(createFolder.data).to.be.equal(false);
    });
  });
});
