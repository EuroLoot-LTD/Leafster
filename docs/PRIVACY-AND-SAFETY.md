# Privacy, safety and legal readiness

Research date: 15 November 2026. This is an engineering and operational readiness assessment, not legal advice, a compliance certification or permission to launch. See `POLICY-DRAFTS.md` for unpublished starting text. No claim is made that EuroLoot is incorporated or registered as a nonprofit.

## Present operating boundary

Public registration must remain closed. The intended initial environment is restricted staging for expressly allowlisted adult testers. An age declaration and Google login do not verify age. Restricting registrations also does not protect publicly accessible content: the hosting access gate must cover pages, API routes and media. Do not collect identity documents or biometrics as an improvised workaround.

Before any outside testers supply personal data, confirm the responsible controller, actual deployment, privacy notice, contact route, approved processors and retention process. Testing on a developer computer still involves data-protection responsibilities where real people participate.

## Applicable regimes and decisions requiring review

### GDPR and Irish data protection

Identify the controller by its real legal identity and address. Document a purpose and lawful basis for each use of data rather than relying on a single blanket consent. Necessary account/content services, proportionate security processing and optional features can require different bases. A legitimate-interest basis requires an assessment of the impact on people. [European Commission: legal grounds](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en).

The notice must identify the controller/contact, purposes and bases, recipients, international transfers, retention and rights. Missing operator/contact details are a launch blocker. [DPC: transparency](https://www.dataprotection.ie/en/individuals/know-your-rights/right-be-informed-transparency-article-13-14-gdpr).

Complete a documented DPIA screening now, and a full DPIA before any likely high-risk processing. Particular concerns include children, public UGC, inferred interests, abuse detection, reviewer reputation and moderation of potentially sensitive material. If residual high risk cannot be mitigated, obtain the required prior consultation. [DPC: DPIAs](https://www.dataprotection.ie/en/organisations/know-your-obligations/data-protection-impact-assessments).

Maintain a processor/subprocessor inventory, contracts, access permissions, data locations and transfer safeguards. Choosing an EU storage region alone does not settle all access or transfer questions. [DPC self-assessment: transfers](https://www.dataprotection.ie/en/organisations/resources-organisations/self-assessment-checklist).

### Children and age assurance

The DPC's child-oriented principles concern people under 18 and favour a floor of protection unless a justified risk-based age approach distinguishes users. Treat minimisation, understandable information and protective defaults as platform-wide design requirements. [DPC Fundamentals](https://www.dataprotection.ie/en/dpc-guidance/fundamentals-child-oriented-approach-data-processing).

Ireland's digital consent threshold is 16 for the Article 8 situation where an information-society service relies on a child's consent; it is not a general statement that every service is lawful for every 16-year-old or unlawful below 16 regardless of basis. Obtain specific advice before admitting minors. [DPC guidance on legal bases](https://www.dataprotection.ie/sites/default/files/uploads/2019-12/Guidance%20on%20Legal%20Bases_Dec19_1.pdf).

The Commission's 2025 DSA guidelines address grooming, harmful content, cyberbullying and addictive behaviour, including appropriate age assurance and private defaults. These are a relevant design reference, with scope/exemptions to assess; implementing recommendations does not guarantee compliance. [Commission guidelines](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors), [status of guidelines](https://digital-strategy.ec.europa.eu/en/policies/dsa-guidelines).

Before a youth-accessible launch: choose the service's eligibility policy, assess likely access by children, use proportionate privacy-preserving age assurance, provide effective protections for those entitled to participate, and commission independent safeguarding review. Terms saying “18+” alone are insufficient evidence of effective exclusion.

### Irish video-platform safety framework

Leafster's central video-sharing purpose makes Irish VSPS classification a material issue requiring advice from a qualified professional and, where appropriate, engagement with Coimisiún na Meán. Its Code addresses illegal/harmful content, reporting, terms, age assurance, parental controls where appropriate and media literacy. Do not assume that being new, free or community-funded removes these duties. [CnaM Online Safety Code](https://www.cnam.ie/industry-and-professionals/online-safety-framework/online-safety-code/), [application/designation framework](https://www.cnam.ie/industry-and-professionals/online-safety-framework/online-safety-code/designations-and-online-safety-code-application/).

### Digital Services Act

Assess whether Leafster is an intermediary, hosting service and online platform, and record the outcome. Baseline preparation includes regulator/user contact points, clear moderation terms, a notice-and-action mechanism, notifications of decisions and a process for suspected serious offences. Additional online-platform duties and small/micro-enterprise exceptions require individual review; they are not a blanket exemption. [CnaM obligations](https://www.cnam.ie/industry-and-professionals/online-safety-framework/digital-services-act/what-are-the-obligations-for-service-providers/).

A report button restricted to logged-in users is not a complete mechanism for all individuals/entities to submit an illegal-content notice. A moderator decision needs a specific reason and a record. Article 18 addresses suspected offences threatening life or safety; establish trained escalation, not public disclosure or volunteer investigation. [DSA text, Articles 16–18](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32022R2065).

### Copyright

Determine whether Leafster falls within Ireland's online content-sharing service rules, including the Article 17 framework, before relying on a conventional hosting model. A simple takedown form does not resolve rights-clearance duties. Startup qualifications and proportionate requirements are specific statutory tests. Copyright exceptions and effective human complaint/redress must be respected. [Irish implementing Regulations, S.I. 567/2021](https://www.irishstatutebook.ie/eli/2021/si/567/made/en/print), [Irish Government overview](https://enterprise.gov.ie/en/what-we-do/innovation-research-development/intellectual-property/copyright/eu-copyright-reform/).

Creators retain ownership; Leafster needs a limited, appropriately drafted hosting/distribution licence. Verify all included asset/dependency licences. YouTube migration must use creator originals/lawful exports and separately authorised permissible metadata, never an unapproved downloader.

### Accessibility

Assess whether the specific service falls within the European Accessibility Act/Irish implementing rules and any applicable exemption. CnaM's audiovisual-access guidance explains its remit and the June 2025 application date. Independently of classification, target usable keyboard navigation, named controls, focus visibility, contrast, captions and tested playback. Do not claim WCAG conformance from a successful build. [CnaM audiovisual accessibility](https://www.cnam.ie/industry-and-professionals/broadcasting-on-demand-digital/accessibility-of-audiovisual-media-services/).

## Required operational controls

| Control | Required evidence before broader use |
| --- | --- |
| Confidential reports | Role checks, least-privilege moderator access, no reporter identity in public responses, access audit |
| Public interactions | Rate limits, block enforcement, creator comment settings, reported-content review and repeat-abuse handling |
| Contact exposure | Warnings/review for contact details and risky links; context and behaviour review rather than word lists alone |
| Emergency safeguarding | Named accountable lead, trained escalation, restricted evidence handling, lawful authority-contact procedure |
| Decisions/appeals | Specific reason, affected content/action, time and responsible reviewer, independent reconsideration where feasible |
| Community Notes | Sources, duplicate/abuse prevention, eligibility and reliability controls, human moderation; votes alone never establish truth |
| Data requests | Authenticated export plus an accessible request route, third-party privacy review, tracked deadlines |
| Deletion | Database, originals, derivatives, logs, backups and processor propagation tested; legal holds separately justified |
| Recovery | Tested backup/restore and migration rollback; defined recovery owner |
| Incidents | Containment, decision log and notification assessment; no tokens or reported abuse material in ordinary logs |

Rights requests normally require action/information within one month, with limited extensions communicated within that month. Portability has conditions and must respect others' rights; a basic JSON export is useful but not proof of complete compliance. [DPC deadlines](https://www.dataprotection.ie/en/individuals/exercising-your-rights/how-long-will-it-take), [DPC portability](https://www.dataprotection.ie/en/individuals/know-your-rights/right-data-portability-article-20-gdpr).

Assess personal-data breaches promptly. Notify the competent authority where required without undue delay and, where feasible, within 72 hours; high-risk cases can require notification to affected people. Keep a documented decision even if notification is unnecessary. [DPC breach guidance](https://www.dataprotection.ie/en/faqs/responsibilities-data-controllers/what-do-i-do-if-there-security-breach).

## Retention and tracking

Approve a purpose-specific retention schedule and implement cleanup/backup expiry before making fixed retention promises. GDPR does not prescribe one universal period. In particular, a Story disappearing after 24 hours is not proof that its stored media, logs or backups have been erased. [DPC retention guidance](https://dataprotection.ie/en/faqs/responsibilities-data-controllers/how-long-should-personal-data-be-held-meet-obligations-imposed-gdpr).

Keep advertisements and nonessential trackers absent. Inventory session/OAuth cookies, preferences and local storage with names and lifetimes. Strictly necessary storage may be exempt from cookie consent; analytics is not automatically necessary merely because it helps the operator. Add a valid consent mechanism before nonessential storage/tracking is introduced. [DPC cookies guidance](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies), [DPC storage disclosure](https://www.dataprotection.ie/en/faqs/cookies/do-i-need-provide-information-about-names-and-duration-cookies-and-other-storage).

## Launch blockers requiring an accountable owner

1. Verify controller identity, address, ownership and monitored privacy/safety/copyright contact routes; none is supplied in the brief.
2. Obtain legal review of classification, lawful bases, terms/licence, notices, regulatory contacts, age policy and territorial availability.
3. Complete privacy/safeguarding assessments and implement required age assurance before admitting minors or opening public registration.
4. Staff moderation, urgent escalation and appeals; test the process using synthetic cases without illegal media.
5. Configure and verify real Google credentials, organisational hosting, storage controls and end-to-end account/media deletion.
6. Validate access control, abuse prevention, player accessibility, backup restoration and incident handling in the actual hosted environment.

Keep staging closed while these remain unresolved. The implementation status report is authoritative about what was actually built/tested; this document lists requirements and proposed controls, not claims that all controls already operate.
