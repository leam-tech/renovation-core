import { onBrowser } from "../utils/request";
import {
  getBase64FromBuffer,
  getBase64FromFilePath,
  getBufferFromFilePath
} from "./file.utils";

import { expect } from "chai";
import fs from "fs";
import path from "path";

describe("File Utils", function() {
  describe("getBase64FromFileObject", function() {
    // TODO: Browser testing
  });

  describe("getBase64FromFilePath", function() {
    it("should return null data if on browser", async function() {
      // @ts-ignore
      onBrowser = true; // Simulating a a browser

      const fileResult = await getBase64FromFilePath(
        path.join(__dirname, "..", "tests", "sample.txt")
      );

      expect(fileResult).to.be.null;

      // @ts-ignore
      onBrowser = false; // Reset to NodeJS process
    });
  });
  it("should return the data successfully ", async function() {
    const fileResult = await getBase64FromFilePath(
      path.join(__dirname, "..", "tests", "sample.txt")
    );
    expect(fileResult.fileName).to.be.equal("sample.txt");
    expect(fileResult.fileSize).to.be.equal(27);
  });

  describe("getBase64FromBuffer", function() {
    it("should return null data if on browser", async function() {
      // @ts-ignore
      onBrowser = true; // Simulating a a browser
      const buffer = fs.readFileSync(
        path.join(__dirname, "..", "tests", "sample.txt")
      );
      const fileResult = await getBase64FromBuffer(buffer, "sample.txt");

      expect(fileResult).to.be.null;

      // @ts-ignore
      onBrowser = false; // Reset to NodeJS process
    });

    it("should return the data successfully", async function() {
      const buffer = fs.readFileSync(
        path.join(__dirname, "..", "tests", "sample.txt")
      );
      const fileResult = await getBase64FromBuffer(buffer, "sample.txt");

      expect(fileResult.fileName).to.be.equal("sample.txt");
      expect(fileResult.fileSize).to.be.equal(27);
    });
  });

  describe("getArrayBufferFromFileBlob", function() {
    // TODO: Browser testing
  });

  describe("getBufferFromFilePath", function() {
    it("should return null data if on browser", async function() {
      // @ts-ignore
      onBrowser = true; // Simulating a a browser
      const fileResult = await getBufferFromFilePath(
        path.join(__dirname, "..", "tests", "sample.txt")
      );

      expect(fileResult).to.be.null;

      // @ts-ignore
      onBrowser = false; // Reset to NodeJS process
    });

    it("should return the data successfully", async function() {
      const fileResult = await getBufferFromFilePath(
        path.join(__dirname, "..", "tests", "sample.txt")
      );

      expect(fileResult.fileName).to.be.equal("sample.txt");
      expect(fileResult.fileSize).to.be.equal(25);
    });
  });
});
