import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import supertest from "supertest";
import { createApp } from "../server/app.js";
process.env.NODE_ENV = "test";
process.env.LEAFSTER_TEST_AUTH = "true";

test("liked, subscriptions, trending and Fresh Finds apply real distinct eligibility and ordering", async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-feeds-")),
    site = createApp({ dataDir });
  const a = supertest.agent(site.app),
    b = supertest.agent(site.app),
    c = supertest.agent(site.app),
    anon = supertest.agent(site.app);
  const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  async function account(agent: any, handle: string) {
    let s = await agent.get("/api/session");
    let l = await agent
      .post("/api/test/login")
      .set("x-csrf-token", s.body.csrfToken)
      .send({ email: handle + "@example.test" });
    await agent
      .post("/api/onboarding")
      .set("x-csrf-token", l.body.csrfToken)
      .send({ handle, name: handle, adultConfirmed: true });
    return {
      user: l.body.user.id,
      csrf: l.body.csrfToken,
      channel: (
        site.db
          .prepare("SELECT id FROM channels WHERE user_id=?")
          .get(l.body.user.id) as any
      ).id,
    };
  }
  const ua = await account(a, "small_creator"),
    ub = await account(b, "viewer_creator"),
    uc = await account(c, "popular_creator");
  function video(
    channel: string,
    title: string,
    days: number,
    visibility = "public",
  ) {
    const vid = crypto.randomUUID();
    site.db
      .prepare(
        "INSERT INTO videos(id,channel_id,title,description,visibility,status,source_hash,bytes,duration,created_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        vid,
        channel,
        title,
        "Feed test fixture",
        visibility,
        "ready",
        vid,
        1,
        120,
        day(days),
        day(days),
      );
    return vid;
  }
  const older = video(ua.channel, "Older small-channel video", 2),
    newer = video(ua.channel, "Newest small-channel video", 0),
    unlisted = video(ua.channel, "Unlisted liked video", 0, "unlisted"),
    privateOther = video(
      ua.channel,
      "Another creator private video",
      0,
      "private",
    ),
    privateOwn = video(ub.channel, "Own private liked video", 0, "private");
  const old = video(ub.channel, "Outside Fresh Finds age window", 31),
    popular = video(uc.channel, "Larger channel new upload", 0);
  site.db.exec("BEGIN");
  for (let n = 0; n < 1000; n++) {
    const uid = `subscriber-${n}`;
    site.db
      .prepare("INSERT INTO users(id,email,name,created_at) VALUES(?,?,?,?)")
      .run(uid, `${uid}@example.test`, uid, day(1));
    site.db
      .prepare("INSERT INTO subscriptions VALUES(?,?,?)")
      .run(uid, uc.channel, day(1));
  }
  site.db.exec("COMMIT");
  for (const v of [newer, unlisted, privateOther, privateOwn])
    site.db.prepare("INSERT INTO reactions VALUES(?,?,?)").run(ub.user, v, 1);
  site.db
    .prepare("INSERT INTO reactions VALUES(?,?,?)")
    .run(ub.user, older, -1);
  const liked = (
    await b.get("/api/videos?feed=liked").expect(200)
  ).body.videos.map((v: any) => v.id);
  assert.deepEqual(new Set(liked), new Set([newer, unlisted, privateOwn]));
  await anon.get("/api/videos?feed=liked").expect(401);
  await b
    .post(`/api/channels/${ua.channel}/subscribe`)
    .set("x-csrf-token", ub.csrf)
    .send({})
    .expect(200);
  const subscriptions = (
    await b.get("/api/videos?feed=subscriptions").expect(200)
  ).body.videos.map((v: any) => v.id);
  assert.deepEqual(new Set(subscriptions), new Set([older, newer]));
  await anon.get("/api/videos?feed=subscriptions").expect(401);
  const fresh = (await b.get("/api/videos?feed=fresh").expect(200)).body;
  assert.deepEqual(
    fresh.videos.map((v: any) => v.id),
    [newer],
  );
  assert.match(fresh.feedInfo.criteria, /1,000 subscribers/);
  const view = (v: string, uid: string, days: number) =>
    site.db
      .prepare("INSERT INTO video_views VALUES(?,?,?,?,?,?)")
      .run(crypto.randomUUID(), v, uid, day(days).slice(0, 10), 10, day(days));
  view(older, ua.user, 1);
  view(older, ub.user, 1);
  view(newer, ub.user, 0);
  view(popular, ua.user, 8);
  view(old, ua.user, 20);
  const trending = (await b.get("/api/videos?feed=trending").expect(200)).body;
  assert.deepEqual(
    trending.videos.map((v: any) => v.id),
    [older, newer],
  );
  assert.match(trending.feedInfo.label, /week/);
  await b.get("/api/videos?feed=imaginary").expect(400);
  await b.get("/api/videos?category=music").expect(400);
  site.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
