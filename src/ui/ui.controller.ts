import RenovationController from "../renovation.controller";
import { renovationWarn } from "../utils";
import { ErrorDetail } from "../utils/error";
import IBindTargetInterface from "./bind.target.interface";

export default class UIController extends RenovationController {
  //
  // Primarily for lts-renovation
  // setVisibility(true | false)
  //

  private fieldsDict = {};
  private linkQueryOptions = {};

  public handleError(errorId: string, error: ErrorDetail): ErrorDetail {
    throw new Error("Method not implemented.");
  }

  /**
   * Show or hide a field
   * @param doctype The Form in which to change
   * @param fieldname The fieldname to change
   * @param show true or false
   */
  public setVisibility(doctype, fieldname, show) {
    if (!this._checkFieldRegistered(doctype, fieldname)) {
      return;
    }
    this.fieldsDict[doctype][fieldname].hidden = show ? 0 : 1;
    this.refreshField(doctype, fieldname);
  }

  public setLinkQueryOptions(
    doctype: string,
    fieldname: string,
    options: {
      query?: string;
      filters?: (core, doc) => {};
    },
    parentfield?: string
  ) {
    const key = `${doctype}:${fieldname}${
      parentfield ? `:${parentfield}` : ""
    }`;
    this.linkQueryOptions[key] = options;
  }

  public getLinkQueryOptions(
    doctype: string,
    fieldname: string,
    parentfield?: string
  ) {
    const key = `${doctype}:${fieldname}${
      parentfield ? `:${parentfield}` : ""
    }`;
    return this.linkQueryOptions[key];
  }

  /**
   * Set a field readonly or not
   * @param doctype DocType
   * @param fieldname Fieldname
   * @param readOnly readOnly
   */
  public setReadOnly(doctype, fieldname, readOnly) {
    if (!this._checkFieldRegistered(doctype, fieldname)) {
      return;
    }
    this.fieldsDict[doctype][fieldname].read_only = readOnly ? 1 : 0;
    this.refreshField(doctype, fieldname);
  }

  public addUiObj(doctype, fieldname, obj: IBindTargetInterface) {
    if (!this._checkFieldRegistered(doctype, fieldname)) {
      renovationWarn("Add UI Obj failed. Field isnt registered");
      return;
    }

    const fieldObj = this.fieldsDict[doctype][fieldname];

    // only one guy at a time.
    // keep this design unitl it prohibhits any use case in the future
    fieldObj.__bindTarget = obj;
    this.addFieldRefreshHook(doctype, fieldname, () => {
      if (obj.refresh && typeof obj.refresh === "function") {
        obj.refresh();
      }
    });
  }

  public addFieldRefreshHook(doctype, fieldname, fn) {
    if (!this._checkFieldRegistered(doctype, fieldname)) {
      renovationWarn("Refresh Hook registration failed. Field isnt registered");
      return;
    }
    const fieldObj = this.fieldsDict[doctype][fieldname];
    if (!fieldObj.refresh) {
      fieldObj.refresh = [];
    }
    if (typeof fn !== "function") {
      throw new Error("Invalid refresh function");
    }
    fieldObj.refresh.push(fn);
  }

  public refreshField(doctype, field) {
    const fieldname = this._getFieldName(field);
    if (!this._checkFieldRegistered(doctype, field)) {
      renovationWarn(`${doctype}:${fieldname} is not registered`);
      return;
    }
    const fieldObj = this.fieldsDict[doctype][fieldname];
    if (fieldObj.refresh) {
      for (const fn of fieldObj.refresh) {
        fn();
      }
    } else {
      renovationWarn("No Refresh function attached to field");
    }
  }

  public checkDisplayDependsOn(doctype, field) {
    const fieldname = this._getFieldName(field);
    if (!this._checkFieldRegistered(doctype, fieldname)) {
      renovationWarn(`${doctype}:${fieldname} is not registered`);
      return;
    }

    const fieldObj = this.fieldsDict[doctype][fieldname];
    if (fieldObj.dependsOn && fieldObj.__bindTarget) {
      fieldObj.has_dependency = true;
      let visible = false;

      // format once
      fieldObj.dependsOn = this.formatDisplayDependsOn(fieldObj.dependsOn);
      let script = fieldObj.dependsOn;
      const doc = fieldObj.__bindTarget.doc;
      const parent = doc.parent
        ? this.config.coreInstance.model.getFromLocals({
            doctype: doc.parenttype,
            docname: doc.parent
          })
        : null;
      if (script.indexOf("eval:") >= 0) {
        // remove eval:
        // move this to frappeuicontroller when applicable
        script = script.replace("eval:", "");
        try {
          // tslint:disable-next-line:no-eval
          if (eval(script)) {
            visible = true;
          }
        } catch (e) {
          renovationWarn(
            `Invalid Display depends on for ${doctype}:${fieldname}\n${script}`
          );
        }
      } else {
        // no eval:, just fieldname
        if (doc[script]) {
          visible = true;
        }
      }
      this.fieldsDict[doctype][fieldname].hidden_due_to_dependency = !visible;
      this.refreshField(doctype, fieldname);
    } else if (fieldObj.__bindTarget.isReadOnlyHidden) {
      this.refreshField(doctype, fieldname);
    }
  }

  public checkDisplayDependsOnAll(doctype) {
    if (!this.fieldsDict[doctype]) {
      return;
    }

    const fieldnames = Object.keys(this.fieldsDict[doctype]);
    const fn = () => {
      // execute in batch of 20
      const fs = fieldnames.splice(0, 50);
      for (const f of fs) {
        this.checkDisplayDependsOn(doctype, f);
      }

      if (fieldnames.length > 0) {
        setTimeout(fn, 1);
      }
    };
    fn();
  }

  public refreshFields(doctype) {
    if (!this.fieldsDict[doctype]) {
      return;
    }

    for (const field in this.fieldsDict[doctype]) {
      if (this.fieldsDict[doctype].hasOwnProperty(field)) {
        this.refreshField(doctype, field);
      }
    }
  }

  public _getFieldName(field) {
    if (typeof field === "string") {
      return field;
    }
    return field.fieldname || "";
  }

  // tslint:disable-next-line:variable-name
  public registerField(doctype, field, __bindTarget) {
    if (!this.fieldsDict[doctype]) {
      this.fieldsDict[doctype] = {};
    }
    const fieldname = this._getFieldName(field);
    this.fieldsDict[doctype][fieldname] = field;

    this.addUiObj(doctype, fieldname, __bindTarget);

    this.checkDisplayDependsOn(doctype, fieldname);
  }

  // tslint:disable-next-line:no-empty
  public clearCache() {}

  private _checkFieldRegistered(doctype, field) {
    const fieldname = this._getFieldName(field);
    return this.fieldsDict[doctype] && this.fieldsDict[doctype][fieldname];
  }

  private formatDisplayDependsOn(script: string) {
    if (script.indexOf("in_list") >= 0) {
      /*
      eval:(in_list(["Receive", "Pay"], doc.type) || doc.party)
      non-greedy
      */
      const exp = /in_list\((\[.*\]),(.*?)\)/gm;
      const m = exp.exec(script);
      if (!m) {
        return script; // error in script
      }
      return script.replace(exp, `${m[1]}.includes(${m[2].trim()})`);
    }
    return script;
  }
}
