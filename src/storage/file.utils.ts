import { isBrowser } from "..";
import { ReadFileResult } from "./storage.controller";

/**
 * Returns base64 from file object
 * @param file {File} The file object
 * @returns The file data encapsulated in ReadFileResult
 */
export async function getBase64FromFileObject(
  file: File
): Promise<ReadFileResult> {
  return new Promise(res => {
    const freader = new FileReader();
    const result: ReadFileResult = {
      fileData: null,
      fileSize: file.size,
      fileName: file.name,
      type: file.type
    };
    freader.onload = function() {
      if (freader.result != null) {
        result.fileData = (freader.result as string).split(",")[1];
      }
      res(result);
    };
    freader.readAsDataURL(file);
  });
}

/**
 * Returns base64 from file path
 * @param filepath The path of the file
 * @returns The file data encapsulated in ReadFileResult
 *
 * If the method is called in a browser, ReadFileResult is returned with null values and the file name from the path
 */
export async function getBase64FromFilePath(
  filepath: string
): Promise<ReadFileResult> {
  return new Promise(res => {
    if (isBrowser()) {
      res(null);
      return;
    }
    // require('fs') breaks webpack; this is by far the most easy soln
    // tslint:disable-next-line: no-eval
    const fs = eval("require('fs')");
    // tslint:disable-next-line: no-eval
    const path = eval("require('path')");
    let result: ReadFileResult = {
      fileData: null,
      fileSize: null,
      fileName: path.basename(filepath)
    };
    try {
      const bitmap = fs.readFileSync(filepath);
      result.fileData = Buffer.from(bitmap).toString("base64");
      result.fileSize = (result.fileData.length * 6) / 8;
    } catch (e) {
      result = null;
      console.error(e);
    }
    res(result);
  });
}

/**
 * Returns base 64 from file buffer
 * @param buffer
 * @param fileName
 *
 * @returns The file data encapsulated in ReadFileResult
 *
 * If the method is called in a browser, ReadFileResult is returned with null values with the filename
 */
export async function getBase64FromBuffer(
  buffer: Buffer,
  fileName?: string
): Promise<ReadFileResult> {
  return new Promise(res => {
    if (isBrowser()) {
      res(null);
      return;
    }
    let result: ReadFileResult = {
      fileData: null,
      fileSize: null,
      fileName: fileName || "file1"
    };
    try {
      result.fileData = buffer.toString("base64");
      result.fileSize = (result.fileData.length * 6) / 8;
    } catch (e) {
      console.error(e);
      result = null;
    }
    res(result);
  });
}

/**
 * Returns ArrayBuffer from file/blob
 * @param file The file object (browser)
 * @returns The file data encapsulated in ReadFileResult
 */
export async function getArrayBufferFromFileBlob(
  file: File
): Promise<ReadFileResult> {
  return new Promise(res => {
    const freader = new FileReader();
    const result: ReadFileResult = {
      fileData: null,
      fileSize: file.size,
      fileName: file.name,
      type: file.type
    };
    freader.onload = function() {
      if (freader.result != null) {
        result.fileData = freader.result;
      }
      res(result);
    };
    freader.readAsArrayBuffer(file);
  });
}

/**
 * Returns Buffer from file path
 * @param filepath The filepath
 * @returns The file data encapsulated in ReadFileResult
 */
export async function getBufferFromFilePath(
  filepath: string
): Promise<ReadFileResult> {
  return new Promise(res => {
    if (isBrowser()) {
      res(null);
      return;
    }
    // require('fs') breaks webpack; this is by far the most easy soln
    // tslint:disable-next-line: no-eval
    const fs = eval("require('fs')");
    // tslint:disable-next-line: no-eval
    const path = eval("require('path')");
    let result: ReadFileResult = {
      fileData: null,
      fileSize: null,
      fileName: path.basename(filepath)
    };
    try {
      const bitmap = fs.readFileSync(filepath);
      result.fileData = Buffer.from(bitmap);
      result.fileSize = result.fileData.length;
    } catch (e) {
      console.error(e);
      result = null;
    }
    res(result);
  });
}
