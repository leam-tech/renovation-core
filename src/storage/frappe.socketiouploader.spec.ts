import { expect } from "chai";
import fs from "fs";
import path from "path";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { renovationLog } from "../utils";
import FrappeSocketIOUploader from "./frappe.socketiouploader";

describe("Frappe SocketIOUploader", function() {
  this.timeout(10000);
  let renovation: Renovation;
  let frappeSocketIO: FrappeSocketIOUploader;
  before(async function() {
    renovation = await TestManager.init("frappe");
    frappeSocketIO = new FrappeSocketIOUploader(renovation);
  });

  // TODO: Test browser files
  describe("upload", function() {
    it("should upload file successfully as buffer", function(done) {
      frappeSocketIO.uploadStatus.subscribe(
        status => {
          switch (status.status) {
            case "uploading":
              expect(status.hasProgress).to.be.true;
              break;
            case "completed":
              expect(status.progress).to.be.equal(100);
              break;
            default:
          }
        },
        err => renovationLog(JSON.stringify(err)),
        () => done()
      );
      frappeSocketIO.upload({
        fileBuffer: fs.readFileSync(
          path.join(__dirname, "..", "tests", "sample.txt")
        ),
        fileName: "sample.txt"
      });
    });

    it("should upload file successfully as filePath", function(done) {
      frappeSocketIO.uploadStatus.subscribe(
        status => {
          switch (status.status) {
            case "uploading":
              expect(status.hasProgress).to.be.true;
              break;
            case "completed":
              expect(status.progress).to.be.equal(100);
              break;
            default:
          }
        },
        err => renovationLog(JSON.stringify(err)),
        () => done()
      );
      frappeSocketIO.upload({
        filePath: path.join(__dirname, "..", "tests", "sample.txt")
      });
    });
    it("should throw failure for invalid upload args", async function() {
      expect(async () => await frappeSocketIO.upload({ filePath: null })).to
        .throw;
    });
  });
});
