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

async function fixture(t:test.TestContext) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leafster-access-"));
  const site = createApp({ dataDir });
  await new Promise(resolve => setImmediate(resolve));
  t.after(() => { site.close(); fs.rmSync(dataDir, { recursive: true, force: true }); });
  return site;
}

test("anonymous visitors can browse and watch public videos while private content and community tools remain protected", async t => {
  const site = await fixture(t), guest = supertest.agent(site.app);
  const uid=crypto.randomUUID(), channel=crypto.randomUUID(), vid=crypto.randomUUID(), timestamp=new Date().toISOString();
  site.db.prepare("INSERT INTO users(id,email,name,handle,adult_confirmed_at,created_at) VALUES(?,?,?,?,?,?)").run(uid,"fixture@example.test","Fixture creator","fixture_creator",timestamp,timestamp);
  site.db.prepare("INSERT INTO channels(id,user_id,name,created_at) VALUES(?,?,?,?)").run(channel,uid,"Fixture creator",timestamp);
  const media=path.join(site.dataDir,"media",`${vid}.mp4`),thumb=path.join(site.dataDir,"media",`${vid}.jpg`);
  fs.writeFileSync(media,"bounded access-policy test media");fs.writeFileSync(thumb,Buffer.from([255,216,255,217]));
  site.db.prepare("INSERT INTO videos(id,channel_id,title,description,visibility,status,media_path,thumbnail_path,source_hash,bytes,duration,created_at,published_at) VALUES(?,?,?,?,?,'ready',?,?,?,?,?,?,?)").run(vid,channel,"Public fixture video","Access-control fixture","public",media,thumb,vid,32,15,timestamp,timestamp);
  site.db.prepare("INSERT INTO leaves(id,user_id,body,created_at) VALUES(?,?,?,?)").run(crypto.randomUUID(),uid,"A members-only creator update",timestamp);
  for(const route of ["/api/videos","/api/videos?q=fixture","/api/videos?feed=trending","/api/videos?feed=fresh","/API/videos","/api/videos/"])await guest.get(route).expect(200);
  assert.equal((await guest.get(`/api/videos/${vid}`)).body.video.id,vid);
  await guest.get(`/api/media/${vid}/video`).set("Range","bytes=0-3").expect(206).expect("Content-Type",/video\/mp4/);
  await guest.head(`/api/media/${vid}/video`).expect(200);
  await guest.get(`/API/media/${vid}/video/`).expect(200);
  await guest.get(`/api/media/${vid}/thumbnail`).expect(200);
  const profile=(await guest.get("/api/channels/fixture_creator").expect(200)).body;
  assert.equal(profile.videos.length,1);assert.deepEqual(profile.leaves,[]);
  site.db.prepare("UPDATE videos SET visibility='unlisted' WHERE id=?").run(vid);
  assert.equal((await guest.get("/api/videos")).body.videos.length,0);
  await guest.get(`/api/videos/${vid}`).expect(200);await guest.get(`/api/media/${vid}/video`).expect(200);
  site.db.prepare("UPDATE videos SET visibility='private' WHERE id=?").run(vid);
  await guest.get(`/api/videos/${vid}`).expect(404);await guest.get(`/api/media/${vid}/video`).expect(404);await guest.get(`/api/media/${vid}/thumbnail`).expect(404);
  site.db.prepare("UPDATE videos SET visibility='public',status='removed' WHERE id=?").run(vid);
  await guest.get(`/api/videos/${vid}`).expect(404);
  site.db.prepare("UPDATE videos SET status='ready' WHERE id=?").run(vid);site.db.prepare("UPDATE users SET status='suspended' WHERE id=?").run(uid);
  await guest.get(`/api/media/${vid}/video`).expect(404);await guest.get("/api/channels/fixture_creator").expect(404);
  for (const route of ["/api/leaves","/API/leaves/","/api/stories","/api/story-media/known-story","/api/playlists/known-public-playlist","/api/history","/api/studio","/api/settings","/api/notifications","/api/moderation","/api/account/export","/api/videos/known-video/reaction"]) {
    const response = await guest.get(route).expect(401);
    assert.match(response.body.error,/Sign in/);assert.match(response.headers["cache-control"],/no-store/);
  }
  assert.equal((site.db.prepare("SELECT count(*) n FROM sessions").get() as any).n,0);
  const session = await guest.get("/api/session").expect(200);
  await guest.post(`/api/videos/${vid}/reaction`).set("x-csrf-token",session.body.csrfToken).send({value:1}).expect(401);
  await guest.post("/api/leaves").set("x-csrf-token",session.body.csrfToken).send({body:"Unauthenticated publication attempt"}).expect(401);
  await guest.get("/api/health").expect(200);
  const notice=await guest.post("/api/legal/notices").set("x-csrf-token",session.body.csrfToken).send({category:"copyright",url:"https://leafster.example/watch/report-target",reason:"I am the rights holder and request a confidential review.",goodFaith:true}).expect(201);
  assert.ok(notice.body.id);
});

test("incomplete profiles can browse videos but complete adult onboarding before publishing", async t => {
  const site=await fixture(t),tester=supertest.agent(site.app),guest=await tester.get("/api/session");
  const signed=await tester.post("/api/test/login").set("x-csrf-token",guest.body.csrfToken).send({email:"onboarding@example.test"}).expect(200);
  await tester.get("/api/videos").expect(200);
  await tester.post("/api/leaves").set("x-csrf-token",signed.body.csrfToken).send({body:"Not onboarded yet"}).expect(403);
  await tester.get("/api/studio").expect(403);
  await tester.post("/api/onboarding").set("x-csrf-token",signed.body.csrfToken).send({handle:"adult_tester",name:"Adult tester",adultConfirmed:true}).expect(200);
  await tester.get("/api/studio").expect(200);
  await tester.post("/api/auth/logout").set("x-csrf-token",signed.body.csrfToken).send({}).expect(200);
  await tester.get("/api/videos").expect(200);await tester.get("/api/leaves").expect(401);
});
