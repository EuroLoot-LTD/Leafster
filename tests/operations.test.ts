import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import supertest from "supertest";
import { createApp } from "../server/app.js";
process.env.NODE_ENV = "test";
process.env.LEAFSTER_TEST_AUTH = "true";

async function account(
  site: ReturnType<typeof createApp>,
  email: string,
  handle: string,
) {
  const agent = supertest.agent(site.app);
  const session = await agent.get("/api/session").expect(200);
  const login = await agent
    .post("/api/test/login")
    .set("x-csrf-token", session.body.csrfToken)
    .send({ email })
    .expect(200);
  await agent
    .post("/api/onboarding")
    .set("x-csrf-token", login.body.csrfToken)
    .send({ handle, name: handle, adultConfirmed: true })
    .expect(200);
  return {
    agent,
    csrf: login.body.csrfToken,
    user: login.body.user,
    cookie: login.headers["set-cookie"],
  };
}

test("non-members can lodge legal notices but confidential reports require a moderator", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-notices-")),
    site = createApp({ dataDir: dir });
  try {
    const anonymous = supertest.agent(site.app),
      session = await anonymous.get("/api/session");
    const notice = {
      category: "copyright",
      url: "http://localhost/watch/example",
      reason: "Rights-holder notice concerning this specific test URL.",
      contact: "notice@example.test",
      goodFaith: true,
    };
    await anonymous.post("/api/legal/notices").send(notice).expect(403);
    await anonymous
      .post("/api/legal/notices")
      .set("x-csrf-token", session.body.csrfToken)
      .send({ ...notice, goodFaith: false })
      .expect(400);
    const receipt = await anonymous
      .post("/api/legal/notices")
      .set("x-csrf-token", session.body.csrfToken)
      .send(notice)
      .expect(201);
    assert.ok(receipt.body.id);
    assert.equal(receipt.body.contact, undefined);
    await anonymous.get("/api/moderation").expect(401);
    const ordinary = await account(
      site,
      "ordinary@example.test",
      "ordinary_tester",
    );
    await ordinary.agent.get("/api/moderation").expect(403);
    site.db
      .prepare("UPDATE users SET role='moderator' WHERE id=?")
      .run(ordinary.user.id);
    const queue = await ordinary.agent.get("/api/moderation").expect(200);
    assert.equal(queue.body.reports[0].id, receipt.body.id);
    assert.equal(
      JSON.parse(queue.body.reports[0].details).contact,
      notice.contact,
    );
  } finally {
    site.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("profiles, secure sessions and Leaves survive a server restart", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-restart-"));
  let site = createApp({ dataDir: dir });
  try {
    const u = await account(site, "restart@example.test", "restart_tester");
    await u.agent
      .post("/api/leaves")
      .set("x-csrf-token", u.csrf)
      .send({ body: "Persistent public update for the restart test." })
      .expect(201);
    const cookie = (u.cookie as unknown as string[])
      .map((c) => c.split(";")[0])
      .join("; ");
    site.close();
    site = createApp({ dataDir: dir });
    const session = await supertest(site.app)
      .get("/api/session")
      .set("Cookie", cookie)
      .expect(200);
    assert.equal(session.body.user.handle, "restart_tester");
    const leaves = await supertest(site.app)
      .get("/api/leaves")
      .set("Cookie", cookie)
      .expect(200);
    assert.equal(
      leaves.body.leaves[0].body,
      "Persistent public update for the restart test.",
    );
  } finally {
    site.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("production refuses HTTP and any enabled test-auth flag", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(
      () => createApp({ origin: "http://localhost:3001" }),
      /HTTPS/,
    );
    assert.throws(
      () => createApp({ origin: "https://staging.example.test" }),
      /test authentication|test auth|disabled/i,
    );
  } finally {
    process.env.NODE_ENV = previous;
  }
});
