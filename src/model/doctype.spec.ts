import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import DocType from "./doctype";

describe("DocType", function() {
  this.timeout(10000);
  let renovation: Renovation;

  const validUser = TestManager.primaryUser;
  const validPwd = TestManager.primaryUserPwd;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });
  describe("Initialization", function() {
    it("should be initialized by checking 'doctype' property", function() {
      const docField = new DocType("User");

      expect(docField.doctype).to.be.equal("User");
    });
  });
  describe("fromFrappeDocType", function() {
    before(
      async () =>
        await renovation.auth.login({
          email: validUser,
          password: validPwd
        })
    );

    it("should return parsed doctype", async function() {
      const docMeta = await renovation.call({
        cmd: "renovation_core.utils.meta.get_bundle",
        doctype: "User"
      });

      const parsedDocType = DocType.fromFrappeDocType(
        docMeta.data.message.metas[0]
      );

      expect(parsedDocType.titleField).to.be.equal("full_name");
      expect(parsedDocType.isSingle).to.be.a("boolean");
      expect(parsedDocType.isSingle).to.be.false;
      expect(parsedDocType.permissions.length).to.be.gte(0);
    });
  });
});
