import { BehaviorSubject } from "rxjs";
import { RequestResponse } from "..";
import { Renovation } from "../renovation";
import RenovationController from "../renovation.controller";
import { asyncSleep } from "../utils";
import { ErrorDetail, IErrorHandler } from "../utils/error";
import {
  getArrayBufferFromFileBlob,
  getBufferFromFilePath
} from "./file.utils";
import {
  ReadFileResult,
  UploadFileParams,
  UploadFileResponse
} from "./storage.controller";

/**
 * The following is the client side logic of frappe's socket io upload implementation
 * It has to fallback to normal method when something goes wrong (base64 encoded data over http)
 *
 * Procedure:
 * 1. Validate filename
 * filename: IMG_20160429_075059.jpg
 * cmd: frappe.utils.file_manager.validate_filename
 *
 * 2. Assign the obtained name to the file we are uploading
 *
 * 3. Emit: upload-accept-slice with chunk
 * 4. Server will emit upload-request-slice asking for next chunk, do the loop
 *
 * 5. on upload-end:
 *  Call frappe.handler.uploadfile with from_form: 1 and file_url obtained with upload-end
 *
 * 6. on upload-error:
 *
 * 7. on disconnect:
 */

export interface FrappeSocketIOUploadStatus {
  status: "ready" | "uploading" | "completed" | "error" | "detail-error";
  hasProgress?: boolean;
  progress?: number;
  error?:
    | "no-socketio"
    | "disconnected"
    | "upload-error"
    | "name-error"
    | "socket-timeout";
  filename?: string;
  r?: RequestResponse<UploadFileResponse>;
}

/**
 * Class handling socket.io uploading
 */
export default class FrappeSocketIOUploader implements IErrorHandler {
  /**
   * The subject to subscribe updates about the upload
   */
  public uploadStatus: BehaviorSubject<
    FrappeSocketIOUploadStatus
  > = new BehaviorSubject({ status: "ready" as any });
  /**
   * The file as a buffer being uploaded
   */
  private file: Buffer | ArrayBuffer;
  /**
   * The type of the file
   */
  private fileType: string;
  /**
   * The size of the file
   */
  private fileSize: number;
  /**
   * The size of the chunck (Set constant)
   */
  private chunkSize = 24576;
  /**
   * Object holding the events and their handlers
   */
  private socketIOCallbacks: { [x: string]: Array<(...args) => void> };
  /**
   * The arguments of the file to be uploaded
   */
  private args: UploadFileParams;
  /**
   * Holds the reference to the keep-alive timeout
   */
  private keepAliveTimeout;
  /**
   * Flag to hold whether the upload is started
   */
  private started = false;

  constructor(private core: Renovation) {}
  public generateError(): ErrorDetail {
    throw new Error("Method not implemented.");
  }

  /**
   * Upload the file using socket.io
   *
   * - The arguments are first parsed using the file.utils functions
   * - Check for socket.io connection
   * - Setup the listeners
   * - Validate the name of the file in the backend
   * - Start upload
   * @param uploadFileParams
   */
  public async upload(uploadFileParams: UploadFileParams) {
    this.args = uploadFileParams;
    let readData: ReadFileResult = null;
    if (uploadFileParams.file) {
      readData = await getArrayBufferFromFileBlob(uploadFileParams.file);
    } else if (uploadFileParams.filePath) {
      readData = await getBufferFromFilePath(uploadFileParams.filePath);
    } else if (uploadFileParams.fileBuffer) {
      readData = {
        fileData: uploadFileParams.fileBuffer,
        fileName: uploadFileParams.fileName,
        fileSize: uploadFileParams.fileBuffer.length
      };
    }
    if (!readData) {
      throw new Error("Invalid upload args");
    }
    this.file = readData.fileData;
    this.fileSize = readData.fileSize;
    this.fileType = readData.type;
    this.args.fileName = readData.fileName;

    // verify socketio
    if (!this.getCore().socketio.isConnected) {
      this.getCore().socketio.connect();
      await asyncSleep(3000);
      // if still not connected, error out
      if (!this.getCore().socketio.isConnected) {
        this.onError("no-socketio");
        return;
      }
    }
    this.setupListeners();

    const r = await this.validateFileName();
    if (!r.success) {
      console.warn(r);
      this.onError("name-error");
      return;
    }
    this.args.fileName = r.data;

    this.started = false;
    this.sendNextChunk(0);
  }

  /**
   * Called after an error event or on completion
   *
   * Removes the listeners of the socket
   */
  public destroy() {
    this.stripListeners();
  }

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    let err = {} as ErrorDetail;

    switch (errorId) {
      case "on_complete":
      default:
        err = RenovationController.genericError(error);
    }

    return err;
  }

  /**
   * Sends the chunk to the socket in the backend after it emits the `upload-request-slice` event
   * @param currentSlice The slice to be sent (starts at zero), Subsequent slice numbers supplied by the socket server
   */
  private sendNextChunk(currentSlice: number) {
    if (!this.file.slice) {
      throw new Error("Invalid File type");
    }
    // (ArrayBuffer<browser> | Buffer<nodejs>) both has common function, slice
    const data = this.file.slice(
      currentSlice * this.chunkSize,
      currentSlice * this.chunkSize + this.chunkSize
    );
    this.emit("upload-accept-slice", {
      is_private: this.args.isPrivate,
      name: this.args.fileName,
      type: this.fileType,
      size: this.fileSize,
      data
    } as FrappeUploadAcceptSlice);
    if (currentSlice > 0) {
      this.uploadStatus.next({
        status: "uploading",
        filename: this.args.fileName,
        progress: Math.round(
          ((currentSlice * this.chunkSize) / this.fileSize) * 100
        ),
        hasProgress: true
      });
    }

    this.keepAlive();
  }

  /**
   * Sets up the listeners of all the events emitted by the socket.io server
   */
  private setupListeners() {
    if (
      this.socketIOCallbacks &&
      Object.keys(this.socketIOCallbacks).length > 0
    ) {
      // setup done already perhaps;
      return;
    }
    this.addIOListener(
      "upload-request-slice",
      (data: FrappeUploadRequestSlice) => {
        this.started = true;
        this.sendNextChunk(data.currentSlice);
      }
    );

    this.addIOListener("upload-end", (data: FrappeUploadEnd) => {
      if (data.file_url.substr(0, 7) === "/public") {
        data.file_url = data.file_url.substr(7);
      }
      this.onComplete(data);
    });

    this.addIOListener("upload-error", () => {
      this.onError("upload-error");
    });

    this.addIOListener("disconnect", () => {
      this.onError("disconnected");
    });
  }

  /**
   * Emit an event to the `uploadStatus` with status error followed by destroying the socket listeners
   * @param event The name of the event emitted
   */
  private onError(
    event:
      | "upload-error"
      | "disconnected"
      | "no-socketio"
      | "name-error"
      | "socket-timeout"
  ) {
    this.uploadStatus.next({
      status: "error",
      error: event
    });
    console.warn("LTS-Renovation-Core FrappeSocketIOUploader Error", event);
    this.destroy();
  }

  /**
   * Handler of when the upload is complete
   *
   * Get the full details of the uploaded file (HTTP handler)
   *
   * In the end, call the `destroy` method
   *
   * @param frappeUploadEnd {FrappeUploadEnd} The object holding the file URL after successful upload
   */
  private async onComplete(frappeUploadEnd: FrappeUploadEnd) {
    if (this.keepAliveTimeout) {
      clearTimeout(this.keepAliveTimeout);
    }
    // finally, make a call to http uploadfile handler to get full details
    let r = await this.getCore().call({
      cmd: "renovation_core.handler.uploadfile",
      from_form: 1,
      file_url: frappeUploadEnd.file_url,
      is_private: this.args.isPrivate ? 1 : 0,
      doctype: this.args.doctype || null,
      docname: this.args.docname || null,
      docfield: this.args.docfield || null,
      folder: this.args.folder || "Home",
      filename: this.args.fileName
    });

    let data = r.data;
    if (r.success) {
      data = data.message || data;
      const params: UploadFileParams = this.args;
      if (params.doc && params.docfield) {
        params.doc[params.docfield] = data.file_url;
      }
      r = RequestResponse.success(data);
    } else {
      r = RequestResponse.fail(this.handleError("on_complete", r.error));
      r.data.file_url = frappeUploadEnd.file_url;
    }
    this.uploadStatus.next({
      status: r.success ? "completed" : "detail-error",
      progress: 100,
      filename: this.args.fileName,
      r
    });
    this.uploadStatus.complete();
    this.destroy();
  }

  /**
   * Adds the event listeners to an array to easily manage destroying, modifying them
   * @param event The name of the event
   * @param handler The callback on occurrence of the event
   */
  private addIOListener(event: string, handler: (...args) => void) {
    if (!this.socketIOCallbacks) {
      this.socketIOCallbacks = {};
    }
    if (!this.socketIOCallbacks[event]) {
      this.socketIOCallbacks[event] = [];
    }

    if (this.socketIOCallbacks[event].indexOf(handler) >= 0) {
      // attached already, return
      return;
    }

    this.socketIOCallbacks[event].push(handler);
    this.getCore().socketio.on({ event, callback: handler });
  }

  /**
   * Removes the listeners and resets `socketIOCallbacks`
   */
  private stripListeners() {
    // tslint:disable-next-line: forin
    for (const event in this.socketIOCallbacks || {}) {
      const handlers = this.socketIOCallbacks[event] || [];
      for (const handler of handlers) {
        this.getCore().socketio.off({ event, callback: handler });
      }
    }
    this.socketIOCallbacks = {};
  }

  /**
   * Helper method to emit an event with its data
   * @param event The name of the event
   * @param data The payload of the event, if any
   */
  private emit(event: string, data: any) {
    this.getCore().socketio.emit({ event, data });
  }

  /**
   * Validates the file name in the backend
   *
   * @returns {Promise<RequestResponse<any>>} Returns success if validated, otherwise, failure
   */
  private async validateFileName(): Promise<RequestResponse<any>> {
    const r = await this.getCore().call({
      cmd: "frappe.utils.file_manager.validate_filename",
      filename: this.args.fileName
    });

    if (r.success) {
      r.data = r.data.message;
    }
    return r;
  }

  /**
   * Check for the socket.io connection
   *
   * If the socket times out, an event is emitted "socket-timeout"
   */
  private keepAlive() {
    if (this.keepAliveTimeout) {
      clearTimeout(this.keepAliveTimeout);
    }
    this.keepAliveTimeout = setTimeout(() => {
      this.onError("socket-timeout");
    }, 10000); // we could give 10seconds before timing out, since the upload has already started
  }

  /**
   * Getter for the core instance
   */
  private getCore() {
    return this.core;
  }
}

// Server response
interface FrappeUploadRequestSlice {
  currentSlice: number;
}

// Our request
interface FrappeUploadAcceptSlice {
  is_private: boolean;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | Buffer;
}

// payload of upload-end IO event sent by server
interface FrappeUploadEnd {
  file_url: string;
}

export interface FrappeUploadProgress {
  filename: string;
  /** 0-100 */
  progress: number;
}

export interface FrappeUploadError {
  filename: string;
}
