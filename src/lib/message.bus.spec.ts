import { expect } from "chai";
import "mocha";
import { asyncSleep } from "../utils";

import { MessageBus } from "./message.bus";

describe("Message Bus", function() {
  this.timeout(10000);
  const bus = new MessageBus();

  it("should return Subject for getBus", function() {
    const sub = bus.getSubject({ id: "test1" });
    expect(typeof sub.subscribe).equals("function");
  });

  it("should return Subject for getBus [deprecated]", function() {
    const sub = bus.getSubject("test1");
    expect(typeof sub.subscribe).equals("function");
  });

  it("should post to the receivers", function(done) {
    bus.getSubject({ id: "test1" }).subscribe(data => {
      // @ts-ignore
      expect(data.data).equals("Hi");
      done();
    });

    bus.post({ id: "test1", data: { data: "Hi" } });
  });

  it("should post to the receivers [deprecated]", function(done) {
    bus.getSubject({ id: "test3" }).subscribe(data => {
      // @ts-ignore
      expect(data.data).equals("Hi");
      done();
    });

    bus.post("test3", { data: "Hi" });
  });

  it("should not post if the bus id is not defined", async function() {
    bus.post({ id: "test2", data: { data: "Hello, World" } });
    const subjectHasValue = false;
    // tslint:disable-next-line:no-empty
    bus.getSubject({ id: "test2" }).subscribe(() => {});

    await asyncSleep(100);
    expect(subjectHasValue).to.be.false;
  });
});
