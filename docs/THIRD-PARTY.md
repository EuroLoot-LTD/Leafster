# Third-party and originality record

Leafster application code is newly written for this project. SlopTube was inspected read-only for product and architectural research outside the application checkout. Its source, art, styles, content, screenshots and sample database were not incorporated. YouTube interface screenshots were reference material only; no YouTube brand assets or code are included.

The brief attachment contained no logo file. The existing Leafster logo was located in the user’s open Canva design, “Leafester Logo Wording and Icon” (design DAHa_jWRWF4). Its unchanged transparent 2250×500 PNG export is included as public/brand/leafster-logo.png, preserving its proportions and colours. The favicon is a scaled crop of its leaf icon. No original Canva design was edited. Confirm the included Canva illustration/font asset licences and branding ownership before release; existing access alone is not independent legal verification of those rights. No external thumbnail library, stock footage, invented creators, invented counters or seed activity is shipped. Tests generate their own simple audiovisual fixture with FFmpeg.

Direct application dependencies: React, React DOM, React Router, Express, Multer and Helmet (MIT); Google Auth Library (Apache-2.0); Lucide React (ISC). Preserve the notices in their packages. The machine-readable inventory records installed package versions and declared licences; declarations are not a legal clearance or a complete vulnerability audit.

## FFmpeg and FFprobe

The server invokes separate FFmpeg/FFprobe executables; it does not link their libraries into the client or application. Convenience development packages download binaries: ffmpeg-static declares GPL-3.0-or-later; ffprobe-static's wrapper is MIT but that does not relicense its FFprobe binary. These packages are development dependencies and no binary/node_modules is committed or included in the source delivery. Production should point FFMPEG_PATH/FFPROBE_PATH at separately managed, maintained executables. Builds may use GPL components such as libx264. Do not describe FFmpeg as proprietary or assume permissive wrapper licensing covers a downloaded binary.

Hosting a separate unmodified executable and redistributing a binary/container are different cases. Before distributing an image or binary, review exact configure flags, copyright notices, complete corresponding source requirements, codec patents and applicable licence obligations with counsel. A separate subprocess architecture is intended to preserve the proprietary application boundary; this document is not a legal determination that every distribution method is cleared. No image or FFmpeg binary was publicly distributed in this task.

Sources: [FFmpeg legal guidance](https://ffmpeg.org/legal.html), [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static), [ffprobe-static](https://github.com/joshwnj/ffprobe-static), package licence files in node_modules (not committed).
