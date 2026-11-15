import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import supertest from "supertest";
import { createApp } from "../server/app.js";
process.env.NODE_ENV = "test";
process.env.LEAFSTER_TEST_AUTH = "true";

test("signed-out visitors cannot discover community content or bypass sign-in through media URLs", async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-access-"));
  const site = createApp({ dataDir });
  await new Promise((resolve) => setImmediate(resolve));
  t.after(() => {
    site.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
  const guest = supertest.agent(site.app);
  for (const route of [
    "/api/videos",
    "/api/videos?feed=trending",
    "/api/videos/known-video",
    "/api/media/known-video/video",
    "/api/media/known-video/thumbnail",
    "/API/videos",
    "/API/media/known-video/video",
    "/api/videos/",
    "/api/channels/known_creator",
    "/api/leaves",
    "/api/stories",
    "/api/story-media/known-story",
    "/api/playlists/known-public-playlist",
    "/api/history",
    "/api/studio",
    "/api/settings",
    "/api/notifications",
    "/api/moderation",
    "/api/account/export",
  ]) {
    const response = await guest.get(route).expect(401);
    assert.match(response.body.error, /Sign in/);
    assert.match(response.headers["cache-control"], /no-store/);
  }
  assert.equal(
    (site.db.prepare("SELECT count(*) n FROM sessions").get() as any).n,
    0,
  );
  const session = await guest.get("/api/session").expect(200);
  assert.equal(session.body.user, null);
  await guest.get("/api/videos").expect(401); // An anonymous cookie is not an account.
  await guest.get("/api/health").expect(200);
  const notice = await guest
    .post("/api/legal/notices")
    .set("x-csrf-token", session.body.csrfToken)
    .send({
      category: "copyright",
      url: "https://leafster.example/watch/report-target",
      reason: "I am the rights holder and request a confidential review.",
      goodFaith: true,
    })
    .expect(201);
  assert.ok(notice.body.id);
  await guest.get("/api/moderation").expect(401);
});

test("new signed-in accounts complete adult-only onboarding before reading content", async (t) => {
  const dataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "leafster-onboarding-access-"),
  );
  const site = createApp({ dataDir });
  await new Promise((resolve) => setImmediate(resolve));
  t.after(() => {
    site.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });
  const tester = supertest.agent(site.app),
    guest = await tester.get("/api/session");
  const signed = await tester
    .post("/api/test/login")
    .set("x-csrf-token", guest.body.csrfToken)
    .send({ email: "onboarding@example.test" })
    .expect(200);
  await tester.get("/api/videos").expect(403);
  await tester
    .post("/api/onboarding")
    .set("x-csrf-token", signed.body.csrfToken)
    .send({
      handle: "adult_tester",
      name: "Adult tester",
      adultConfirmed: true,
    })
    .expect(200);
  await tester.get("/api/videos").expect(200);
  await tester
    .post("/api/auth/logout")
    .set("x-csrf-token", signed.body.csrfToken)
    .send({})
    .expect(200);
  await tester.get("/api/videos").expect(401);
  await tester.get("/api/media/known-video/video").expect(401);
});
