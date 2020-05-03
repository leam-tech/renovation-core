import { BehaviorSubject } from "rxjs";
import { RenovationConfig } from "../config";
import RenovationController from "../renovation.controller";
import { getJSON, renovationLog, renovationWarn } from "../utils";
import { ErrorDetail } from "../utils/error";
import {
  contentType,
  FrappeRequestOptions,
  httpMethod,
  RenovationError,
  Request,
  RequestResponse
} from "../utils/request";
import {
  getBase64FromBuffer,
  getBase64FromFileObject,
  getBase64FromFilePath
} from "./file.utils";
import FrappeSocketIOUploader from "./frappe.socketiouploader";
import StorageController, {
  UploadFileParams,
  UploadFileResponse,
  UploadFileStatus
} from "./storage.controller";

/**
 * Class responsible for the operations of uploading files to the backend and attaching to a docname/docfield
 */
export default class FrappeStorageController extends StorageController {
  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      case "create_folder":
        if (error.info.httpCode === 412) {
          err = this.handleError("invalid_foldername_forward_slash", error);
        } else if (error.info.httpCode === 409) {
          err = {
            ...error,
            title: "Folder with same name exists",
            type: RenovationError.DuplicateEntryError,
            info: {
              ...error.info,
              httpCode: 409,
              cause: "A folder with same name exists",
              suggestion:
                "Choose a new name for the folder or remove the existing one"
            }
          };
        } else {
          err = this.handleError(null, error);
        }
        break;

      case "invalid_foldername_forward_slash":
        err = {
          ...error,
          title: "Invalid Folder Name",
          info: {
            httpCode: 412,
            cause: "Invalid folder name: contains forward slash",
            suggestion: "Remove the forward slash from the name"
          }
        };
        break;
      case "uploadViaHttp":
      case "checkFolderExists":
      default:
        err = RenovationController.genericError(error);
    }

    return err;
  }
  /**
   * Upload file using the interface `UploadFilArgs`.
   *
   * Preference is socket.io, fallback is regular HTTP upload
   *
   * @param uploadFileParams
   * @returns {BehaviorSubject<UploadFileStatus>} The upload response as a BehaviorSubject of `UploadFileStatus`
   */
  public uploadFile(
    uploadFileParams: UploadFileParams
  ): BehaviorSubject<UploadFileStatus>;
  /**
   * Upload file using the file name or `File` object
   *
   * Preference is socket.io, fallback is regular HTTP upload
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
   * Preference is socket.io, fallback is regular HTTP upload
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
    uploadFileParams: UploadFileParams | any,
    ...args1: any[]
  ): BehaviorSubject<UploadFileStatus> {
    if (args1.length > 0) {
      renovationWarn("Deprecated uploadFile signature, please update");
      // compatibility
      const newArgs: UploadFileParams = {};
      if (typeof uploadFileParams === "string") {
        newArgs.filePath = uploadFileParams;
      } else {
        newArgs.file = uploadFileParams as File;
      }
      newArgs.isPrivate = args1[0] || false;
      if (args1.length === 2) {
        // isPrivate, folder
        newArgs.folder = args1[1];
      } else if (args1.length > 2) {
        // isPrivate, doctype, docname, docfield?
        newArgs.doctype = args1[1];
        newArgs.docname = args1[2];
        if (args1.length > 3) {
          newArgs.docfield = args1[3];
        }
      }
      return this.uploadFile(newArgs);
    }

    StorageController.validateUploadFileArgs(uploadFileParams);
    const obs = new BehaviorSubject({
      status: "uploading" as any,
      hasProgress: true
    } as UploadFileStatus);
    const realtimeUploader = new FrappeSocketIOUploader(this.getCore());
    realtimeUploader.uploadStatus.subscribe(uploadStatus => {
      switch (uploadStatus.status) {
        case "ready":
          break;
        case "error":
          renovationWarn(
            "LTS-Renovation-Core",
            "Frappe SocketIO Upload error",
            uploadStatus.error
          );
          // revert to http upload
          obs.next({
            status: "uploading",
            hasProgress: false,
            fileName: uploadFileParams.file ? uploadFileParams.file.name : ""
          } as UploadFileStatus);
          this.uploadViaHTTP(uploadFileParams).then(r => {
            obs.next({
              status: r.success ? "completed" : "error",
              requestResponse: r
            } as UploadFileStatus);
            obs.complete();
          });
          break;
        case "uploading":
          renovationLog("Upload Progress", uploadStatus.progress);
          obs.next({
            fileName: uploadStatus.filename,
            status: "uploading",
            hasProgress: true,
            progress: uploadStatus.progress
          });
          break;
        case "completed":
          obs.next({
            fileName: uploadStatus.filename,
            status: "completed",
            hasProgress: true,
            progress: 100,
            requestResponse: uploadStatus.r
          });
          obs.complete();
          break;
        case "detail-error":
        default:
          obs.next({
            status: "error",
            requestResponse: uploadStatus.r
              ? uploadStatus.r
              : RequestResponse.failed(
                  400,
                  "Something wrong happened while uploading"
                )
          });
          obs.complete();
      }
    });
    realtimeUploader.upload(uploadFileParams);

    // try socketio upload first
    return obs;
  }

  /**
   * Appends proper nginx access urls
   * @param ref The path to a resource
   * @returns {string} The access URL
   *
   * Returns null if null or undefined is passed
   *
   */
  public getUrl(ref: string): string {
    if (!ref) {
      return ref;
    }
    if (ref.indexOf("http") >= 0) {
      // already a well formed url, return it
      return ref;
    }
    return `${RenovationConfig.instance.hostUrl}${ref}`;
  }

  /**
   * Creates a folder in the backend
   *
   * Returns failed `RequestResponse` if the folder name includes `/` forward slash
   *
   * @param folderName The name of the folder
   * @param parentFolder The folder where the new folder is to be created. Defaults to "Home"
   * @returns {Promise<RequestResponse<any>>} The created folder within `RequestResponse`
   */
  public async createFolder(
    folderName: string,
    parentFolder: string = "Home"
  ): Promise<RequestResponse<any>> {
    // TODO: Add more validations?
    if (folderName.indexOf("/") > -1) {
      return RequestResponse.fail(
        this.handleError("invalid_foldername_forward_slash", {
          info: { httpCode: 412 }
        })
      );
    }

    const r = await Request(
      RenovationConfig.instance.hostUrl,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: {
          cmd: "frappe.core.doctype.file.file.create_new_folder",
          file_name: folderName,
          folder: parentFolder
        }
      }
    );
    return r.success
      ? r
      : RequestResponse.fail(this.handleError("create_folder", r.error));
  }

  /**
   * Checks if a folder exists
   *
   * @param folderDir The name of the folder's path
   * @returns {Promise<RequestResponse<any>>} Boolean response within `RequestResponse`
   */
  public async checkFolderExists(
    folderDir: string
  ): Promise<RequestResponse<boolean>> {
    const response = await this.config.coreInstance.model.getList({
      doctype: "File",
      fields: ["name"],
      filters: { is_folder: 1, name: folderDir }
    });
    if (response.success) {
      return RequestResponse.success(response.data.length > 0);
    } else {
      return RequestResponse.fail(
        this.handleError("checkFolderExists", response.error)
      );
    }
  }

  /**
   * Converts data to base64 encoding and sends as HTTP
   *
   * This method is called when the Socket.IO methods fails
   * @param uploadFileParams UploadFileParams
   * @returns {Promise<RequestResponse<UploadFileParams>>} The upload response enclosed in `UploadFileResponse`
   */
  private async uploadViaHTTP(
    uploadFileParams: UploadFileParams
  ): Promise<RequestResponse<UploadFileResponse>> {
    await this.getCore().frappe.checkRenovationCoreInstalled();
    let readFilePromise = null;
    if (uploadFileParams.file) {
      readFilePromise = getBase64FromFileObject(uploadFileParams.file);
    } else if (uploadFileParams.fileBuffer) {
      readFilePromise = getBase64FromBuffer(
        uploadFileParams.fileBuffer,
        uploadFileParams.fileName
      );
    } else if (uploadFileParams.filePath) {
      readFilePromise = getBase64FromFilePath(uploadFileParams.filePath);
    }
    // @ts-ignore
    const r = await readFilePromise;

    const d = {
      cmd: "renovation_core.handler.uploadfile",
      from_form: 1,
      file_url: null,
      is_private: uploadFileParams.isPrivate ? 1 : 0,
      doctype: uploadFileParams.doctype || null,
      docname: uploadFileParams.docname || null,
      docfield: uploadFileParams.docfield || null,
      folder: uploadFileParams.folder || "Home",
      filename: r.fileName.split(" ").join("_"),
      filedata: r.fileData,
      file_size: r.fileSize
    };
    const response = await Request(
      RenovationConfig.instance.hostUrl,
      httpMethod.POST,
      FrappeRequestOptions.headers,
      {
        contentType: contentType["application/x-www-form-urlencoded"],
        data: d
      }
    );

    let data = getJSON(response.data) || response.data;
    if (response.success) {
      data = data.message || data;
      const params: UploadFileParams = uploadFileParams;
      if (params.doc && params.docfield) {
        params.doc[params.docfield] = data.file_url;
      }
      return RequestResponse.success(data);
    } else {
      return RequestResponse.fail(
        this.handleError("uploadViaHttp", response.error)
      );
    }
  }
}
