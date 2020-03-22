import { expect } from "chai";
import { Renovation } from "../renovation";
import { TestManager } from "../tests";
import { asyncSleep } from "../utils";

TestManager.getTestType(true)("SocketIO", function() {
  this.timeout(10000);
  let renovation: Renovation;
  before(async function() {
    renovation = await TestManager.init("frappe");
  });

  describe("Initializing", function() {
    it("should have socket as null", function() {
      expect(renovation.socketio.getSocket()).to.be.null;
    });
  });
  describe("isConnected", function() {
    it("should return false if not connected", async function() {
      const isConnected = await renovation.socketio.isConnected;
      expect(isConnected).to.be.false;
    });
    it("should return true if connected", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      const isConnected = await renovation.socketio.isConnected;
      expect(isConnected).to.be.true;
    });
  });
  describe("getSocket", function() {
    it("should get the socket if defined", function() {
      expect(renovation.socketio.getSocket()).to.be.not.null;
    });

    it("should get null if the socket is null", function() {
      renovation.socketio.disconnect();
      expect(renovation.socketio.getSocket()).to.be.null;
    });

    it("should set logError to true and print error to console", function() {
      renovation.socketio.disconnect();
      const socket = renovation.socketio.getSocket();
      expect(socket).to.be.null;
    });
    it("should not print to console if not set to true", function() {
      renovation.socketio.disconnect();
      const socket = renovation.socketio.getSocket({ logError: false });
      expect(socket).to.be.null;
    });
  });

  describe("emit", function() {
    it("should return false is socket is not connected", function() {
      renovation.socketio.disconnect();
      const emitted = renovation.socketio.emit({ event: "random", data: [] });
      expect(emitted).to.be.false;
    });

    it("should return true if socket is connected", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      const emitted = renovation.socketio.emit({
        event: "upload-accept-slice",
        data: []
      });
      expect(emitted).to.be.true;
    });

    it("should return true if socket is connected [deprecated]", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      const emitted = renovation.socketio.emit("upload-accept-slice", []);
      expect(emitted).to.be.true;
    });

    it("should successfully emit when the data null", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      const emitted = renovation.socketio.emit({
        event: "upload-accept-slice",
        data: null
      });
      expect(emitted).to.be.true;
    });

    it("should successfully emit when the data is not an array", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      const emitted = renovation.socketio.emit({
        event: "upload-accept-slice",
        data: {} as any
      });
      expect(emitted).to.be.true;
    });
  });

  describe("on", function() {
    it("should register event listener successfully", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      renovation.socketio.on({
        event: "test-event",
        callback: data => {
          console.log(data);
        }
      });
      const callback = renovation.socketio.getSocket().listeners("test-event");
      expect(callback).to.be.not.null;
      expect(callback.length).to.be.equal(1);
    });

    it("should register event listener successfully [deprecated]", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      renovation.socketio.on("test-event", data => {
        console.log(data);
      });
      const callback = renovation.socketio.getSocket().listeners("test-event");
      expect(callback).to.be.not.null;
      expect(callback.length).to.be.equal(1);
    });
  });

  describe("off", function() {
    it("should unregister event listener successfully", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      renovation.socketio.on({
        event: "test-event",
        callback: data => {
          console.log(data);
        }
      });
      const callback = renovation.socketio.getSocket().listeners("test-event");
      expect(callback).to.be.not.null;
      expect(callback.length).to.be.equal(1);

      renovation.socketio.off({ event: "test-event" });
      const callback2 = renovation.socketio.getSocket().listeners("test-event");
      expect(callback2).to.be.not.null;
      expect(callback2.length).to.be.equal(0);
    });
    it("should unregister event listener successfully [deprecated]", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      renovation.socketio.on({
        event: "test-event",
        callback: data => {
          console.log(data);
        }
      });
      const callback = renovation.socketio.getSocket().listeners("test-event");
      expect(callback).to.be.not.null;
      expect(callback.length).to.be.equal(1);

      renovation.socketio.off("test-event");
      const callback2 = renovation.socketio.getSocket().listeners("test-event");
      expect(callback2).to.be.not.null;
      expect(callback2.length).to.be.equal(0);
    });
  });

  describe("disconnect", function() {
    it("should disconnect a connected socket and set the object to null", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);

      renovation.socketio.disconnect();
      expect(renovation.socketio.isConnected).to.be.false;
      expect(renovation.socketio.getSocket()).to.be.null;
    });

    it("should  set the socket object to null if disconnected", async function() {
      renovation.socketio.disconnect();
      expect(renovation.socketio.isConnected).to.be.false;
      expect(renovation.socketio.getSocket()).to.be.null;
    });
  });

  describe("connect", function() {
    it("should connect successfully", async function() {
      renovation.socketio.connect();
      await asyncSleep(1000);
      expect(renovation.socketio.isConnected).to.be.true;
      expect(renovation.config.hostUrl).to.contain(
        renovation.socketio.getSocket().io.opts.hostname
      );
      expect(renovation.socketio.getSocket().io.opts.path).to.be.equal(
        "/socket.io"
      );
    });

    it("should not connect successfully for wrong params", async function() {
      renovation.socketio.connect({ path: "non-existing", url: "wrong-url" });
      await asyncSleep(1000);
      expect(renovation.socketio.isConnected).to.be.false;
    });

    it("should not connect successfully for wrong params [deprecated]", async function() {
      renovation.socketio.connect("non-existing", "wrong-url");
      await asyncSleep(1000);
      expect(renovation.socketio.isConnected).to.be.false;
    });

    it("should disconnect if called while connected", async function() {
      renovation.socketio.connect();
      expect(renovation.socketio.isConnected).to.be.false;
      await asyncSleep(1000);
      expect(renovation.socketio.isConnected).to.be.true;
    });
  });
});
