import { expect } from "chai";
import { Subject } from "rxjs";
import FrappeAuthController from "./auth/frappe.auth.controller";
import { RenovationConfig } from "./config";
import FrappeDefaultsController from "./defaults/frappe.defaults.controller";
import Frappe from "./lib/frappe";
import { MessageBus } from "./lib/message.bus";
import ScriptManager from "./lib/script.manager";
import FrappeMetaController from "./meta/frappe.meta.controller";
import FrappeModelController from "./model/frappe.model.controller";
import ModelController from "./model/model.controller";
import FrappePermissionController from "./perm/frappe.perm.controller";
import { Renovation } from "./renovation";
import FrappeStorageController from "./storage/frappe.storage.controller";
import { TestManager } from "./tests";
import FrappeTranslationController from "./translation/frappe.translation.controller";
import FrappeUIController from "./ui/frappe.ui.controller";

describe("Renovation", function() {
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("init", function() {
    it("should have all the properties initialized if backend is frappe", function() {
      expect(renovation.auth).to.be.instanceOf(FrappeAuthController);
      expect(renovation.defaults).to.be.instanceOf(FrappeDefaultsController);
      expect(renovation.model).to.be.instanceOf(FrappeModelController);
      expect(renovation.meta).to.be.instanceOf(FrappeMetaController);
      expect(renovation.perm).to.be.instanceOf(FrappePermissionController);
      expect(renovation.storage).to.be.instanceOf(FrappeStorageController);
      expect(renovation.ui).to.be.instanceOf(FrappeUIController);
      expect(renovation.scriptManager).to.be.instanceOf(ScriptManager);
      expect(renovation.config).to.be.instanceOf(RenovationConfig);
      expect(renovation.frappe).to.be.instanceOf(Frappe);
      expect(renovation.translate).to.be.instanceOf(
        FrappeTranslationController
      );
      expect(renovation.bus).to.be.instanceOf(MessageBus);

      expect(renovation.utils).to.have.keys(["getJSON", "datetime"]);
      // @ts-ignore
      expect(renovation.utils.datetime).to.have.keys([
        "getToday",
        "addDays",
        "addMonths",
        "format",
        "distanceInWordsToNow"
      ]);

      expect(renovation.messages).to.be.instanceOf(Subject);
    });

    it("should not initialize the method some controllers if the backend is not frappe", async function() {
      TestManager.renovation = null;

      renovation = await TestManager.init("firebase");

      expect(renovation.auth).to.be.undefined;
      expect(renovation.defaults).to.be.undefined;
      expect(renovation.model).to.be.undefined;
      expect(renovation.meta).to.be.undefined;
      expect(renovation.perm).to.be.undefined;
      expect(renovation.storage).to.be.undefined;
      expect(renovation.ui).to.be.undefined;
      expect(renovation.frappe).to.be.undefined;
      expect(renovation.translate).to.be.undefined;

      expect(renovation.scriptManager).to.be.instanceOf(ScriptManager);
      expect(renovation.config).to.be.instanceOf(RenovationConfig);
      expect(renovation.bus).to.be.instanceOf(MessageBus);
      // Reset to frappe as backend
      TestManager.renovation = null;
      renovation = await TestManager.init("frappe");
    });
  });

  describe("clearCache", function() {
    it("should clear cache of the renovation controllers", function() {
      renovation.clearCache();

      expect(renovation.meta.docTypeCache).to.be.deep.equal({});
      expect(renovation.model.locals).to.be.deep.equal({});
      expect(ModelController.newNameCount).to.be.deep.equal({});
    });
  });
});
