import { BehaviorSubject } from "rxjs";
import { isBrowser, RequestResponse } from "..";
import RenovationDocument from "../model/document";
import RenovationController from "../renovation.controller";

export interface ReadFileResult {
  fileData?: any;
  fileSize: number;
  fileName: string;
  type?: string;
}

type Buffer = any;

export interface UploadFileParams {
  file?: File;
  filePath?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  isPrivate?: boolean;
  folder?: string;
  doctype?: string;
  docname?: string;
  docfield?: string;
  doc?: RenovationDocument;
}

// tslint:disable-next-line: interface-name
export interface UploadFileResponse {
  file_name: string;
  file_url: string;
  is_private: boolean;
  name: string;
}

export interface UploadFileStatus {
  fileName?: string;
  hasProgress?: boolean;
  progress?: number;
  status: "uploading" | "completed" | "error";
  requestResponse?: RequestResponse<UploadFileResponse>;
}

/**
 * Class containing properties and  methods dealing with Upload of files.
 */
export default abstract class StorageController extends RenovationController {
  /**
   * Validate the files/buffer/filename
   *
   * If any error exists, an error is thrown
   *
   * If the `UploadFileParams` contain a doctype or a docname, the folder is set to `undefined`
   * @param uploadFileParams
   */
  protected static validateUploadFileArgs(uploadFileParams: UploadFileParams) {
    if (isBrowser()) {
      if (uploadFileParams.fileName) {
        throw new Error("Cant do filename upload in Browser");
      }
    }

    if (uploadFileParams.fileBuffer && !uploadFileParams.fileName) {
      throw new Error("Please provide fileName along with buffer");
    }

    if (uploadFileParams.doctype || uploadFileParams.docname) {
      uploadFileParams.folder = undefined;
    }
  }
  /**
   * Clears the cache. Currently empty method
   */
  // tslint:disable-next-line:no-empty
  public clearCache() {}
  /**
   * Upload file using the interface `UploadFilArgs`. Preference is socket.io, fallback is regular HTTP upload
   *
   * @param uploadFileArgs
   * @returns {BehaviorSubject<UploadFileStatus>} The upload response as a BehaviorSubject of `UploadFileStatus`
   */
  public uploadFile(
    uploadFileArgs: UploadFileParams
  ): BehaviorSubject<UploadFileStatus>;
  /**
   * Upload file using the file name or `File` object
   *
   * @param file The file string or `File` object
   * @param isPrivate Whether the file is private to the uploader or accessed by anyone
   * @param folder The folder to upload the file to.
   * @returns {BehaviorSubject<UploadFileStatus>} The upload response as a BehaviorSubject of `UploadFileStatus`
   * @deprecated
   */
  public uploadFile(
    file: File | string,
    isPrivate?: boolean,
    folder?: string
  ): BehaviorSubject<UploadFileStatus>;
  /**
   * Upload file using the file name or `File` object and specifying the doctype and/or docname
   *
   * @param file The file string or `File` object
   * @param isPrivate Whether the file is private to the uploader or accessed by anyone
   * @param doctype The doctype it belongs to
   * @param docname The docname it belongs to
   * @param docfield The docfield it belongs to
   * @returns {BehaviorSubject<UploadFileStatus>} The upload response as a BehaviorSubject of `UploadFileStatus`
   * @deprecated
   */
  public uploadFile(
    file: File | string,
    isPrivate?: boolean,
    doctype?: string,
    docname?: string,
    // tslint:disable-next-line:unified-signatures
    docfield?: string
  ): BehaviorSubject<UploadFileStatus>;
  public uploadFile(
    uploadFileArgs: UploadFileParams | any,
    ...args2: any[]
  ): BehaviorSubject<UploadFileStatus> {
    return new BehaviorSubject({
      status: "error" as any
    });
  }

  /**
   * Appends proper nginx access urls
   * @param ref The path to a resource
   * @returns {string} The access URL
   */
  public abstract getUrl(ref: string): string;

  /**
   * Creates a folder in the backend
   *
   * @param folderName The name of the folder
   * @param parentFolder The folder where the new folder is to be created
   * @returns {Promise<RequestResponse<any>>} The created folder within `RequestResponse`
   */
  public abstract async createFolder(
    folderName: string,
    parentFolder?: string
  ): Promise<RequestResponse<any>>;

  /**
   * Checks if a folder exists
   *
   * @param folderDir The name of the folder's path
   * @returns {Promise<RequestResponse<any>>} Boolean response within `RequestResponse`
   */
  public abstract async checkFolderExists(
    folderDir: string
  ): Promise<RequestResponse<boolean>>;
}
