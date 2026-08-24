#!/usr/bin/env python3
"""Assembles the static pages from a shared shell so nav/footer never drift."""
import pathlib, datetime

HERE = pathlib.Path(__file__).parent
UPDATED = "24 August 2026"

NAV_LINKS = [
    ("index.html#gate", "Why it matters"),
    ("index.html#check", "Check eligibility"),
    ("index.html#work", "What we do"),
    ("faq.html", "FAQ"),
]

BRAND_SVG = '''<svg class="brand-mark" viewBox="0 0 34 34" aria-hidden="true">
        <path d="M17 2.5 4 26.5h7.4L17 16.2l5.6 10.3H30L17 2.5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>
        <path d="M18.2 9.5 12 21h4.3l-1 6.5L21.6 16h-4.4l1-6.5Z" fill="currentColor"/>
      </svg>'''


def shell(slug, title, desc, body, cta=("apply.html", "Start your application")):
    links = "\n      ".join(f'<a href="{h}">{t}</a>' for h, t in NAV_LINKS)
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Aesir Solar</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://aesirsolar.co.uk/{slug}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#07090C">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aesir Solar">
<meta property="og:title" content="{title} — Aesir Solar">
<meta property="og:description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body class="inner">

<a class="skip" href="#main">Skip to content</a>

<header class="nav stuck solid">
  <div class="wrap nav-in">
    <a class="brand" href="index.html" aria-label="Aesir Solar home">
      {BRAND_SVG}
      <span class="brand-txt">AESIR<em>SOLAR</em></span>
    </a>
    <nav class="nav-links" aria-label="Primary">
      {links}
    </nav>
    <a class="btn btn-sm" href="{cta[0]}">{cta[1]}</a>
  </div>
</header>

<main id="main" class="page">
  <div class="wrap">
{body}
  </div>
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-brand">
      <span class="brand-txt">AESIR<em>SOLAR</em></span>
      <p>G99 connection applications, prepared and submitted for UK solar and storage installers.</p>
    </div>
    <div class="foot-col">
      <h4>Service</h4>
      <a href="index.html#gate">Why it matters</a>
      <a href="index.html#check">Check eligibility</a>
      <a href="index.html#work">What we do</a>
      <a href="faq.html">FAQ</a>
    </div>
    <div class="foot-col">
      <h4>Contact</h4>
      <a href="contact.html">Contact us</a>
      <a href="mailto:hello@aesirsolar.co.uk">hello@aesirsolar.co.uk</a>
      <a href="https://aesirsolar.co.uk/my-account/">Your orders</a>
    </div>
    <div class="foot-col">
      <h4>Legal</h4>
      <a href="terms.html">Terms of service</a>
      <a href="privacy.html">Privacy policy</a>
      <a href="refunds.html">Refund policy</a>
    </div>
  </div>
  <div class="wrap foot-legal">
    <p><span class="todo">Company no. — · VAT no. —</span> &nbsp;·&nbsp; Aesir Solar is an application service. We are not a DNO, and we are not affiliated with or endorsed by the Energy Networks Association.</p>
    <p class="cr">© <span id="yr">2026</span> Aesir Solar. Guidance reflects ENA EREC G99 Issue&nbsp;2 (10 March 2025).</p>
  </div>
</footer>

<script src="app.js"></script>
</body>
</html>
'''


# ----------------------------------------------------------------- TERMS
TERMS = f'''    <p class="eyebrow">Legal</p>
    <h1 class="display h2">Terms of service</h1>
    <p class="updated">Last updated {UPDATED}</p>

    <div class="prose">
      <div class="callout">
        <p><strong>In short:</strong> you pay us £250 + VAT to prepare and submit one G99 Form A1-2
        application to your network operator, and to deal with them until they reach a decision. We
        can't make the DNO say yes, and we don't do the electrical work.</p>
      </div>

      <h2>1. Who we are</h2>
      <p>These terms are between you and Aesir Solar (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
      <span class="todo">Registered company number and registered office to be inserted.</span>
      You can reach us at <a href="mailto:hello@aesirsolar.co.uk">hello@aesirsolar.co.uk</a>.</p>

      <h2>2. What you're buying</h2>
      <p>A single connection application service, comprising:</p>
      <ul>
        <li>assessing whether your installation falls within the Small Generation Installation procedures of ENA Engineering Recommendation G99 Issue 2;</li>
        <li>checking the relevant inverter entries on the ENA register and identifying the current type-test reference;</li>
        <li>preparing Form A1-2, together with a single-line diagram and a written description of the G100 export limitation scheme where one is required;</li>
        <li>submitting the application to the correct Distribution Network Operator or Independent Distribution Network Operator in your name;</li>
        <li>corresponding with that operator until they reach a decision; and</li>
        <li>submitting the Form A3-2 commissioning notification after installation, where you tell us the commissioning has taken place.</li>
      </ul>
      <p>The fee covers <strong>one application for one installation</strong>. A materially different
      system, a second site, or a fresh application after you change the design is a new instruction
      and a new fee.</p>

      <h2>3. What we are not</h2>
      <p>We are not a Distribution Network Operator, and we are not affiliated with or endorsed by the
      Energy Networks Association. We do not hold MCS, NICEIC, NAPIT or any electrical contracting
      accreditation, and we do not carry out electrical work, design or commissioning.</p>
      <p>The application is made <strong>in your name and under your accreditation</strong>. You remain
      the installer or generator for all regulatory purposes, including your duties under the
      Electricity Safety, Quality and Continuity Regulations 2002.</p>

      <h2>4. What we need from you</h2>
      <p>We can only work from what you give us. You agree that the information you provide — including
      the MPAN, inverter make and model, ratings, phase configuration, storage capacity and export
      limitation details — is accurate and complete to the best of your knowledge.</p>
      <p>If the information turns out to be wrong or incomplete and the application has to be corrected
      or resubmitted as a result, we'll tell you, and we may charge for the additional work.</p>

      <h2>5. What we can and can't promise</h2>
      <p>We will prepare and submit your application with reasonable skill and care, in line with the
      published requirements of G99 Issue 2 and the receiving operator.</p>
      <p>We cannot promise that:</p>
      <ul>
        <li>the operator will approve the application;</li>
        <li>the operator will respond within any particular period, including their published target of ten working days;</li>
        <li>the operator will keep your application on the fast-track route rather than escalating it to a full assessment; or</li>
        <li>no connection or reinforcement charges will arise. Any such charges are payable by you to the operator, not to us.</li>
      </ul>
      <p>Those decisions belong to the network operator alone.</p>

      <h2>6. Resubmission</h2>
      <p>If an application we prepared is returned because of an error or omission on our part, we will
      correct and resubmit it at no further charge. If it's returned because the information you gave
      us was wrong, or because you changed the system after submission, the resubmission is chargeable.</p>

      <h2>7. Price and payment</h2>
      <p>The fee is <strong>£250.00 plus VAT at 20%, being £300.00 in total</strong>, payable in advance.
      Card payments are processed by Tyl by NatWest. We do not see or store your card details.</p>

      <h2>8. Cancellation and refunds</h2>
      <p>Set out in full in our <a href="refunds.html">refund policy</a>, which forms part of these terms.</p>

      <h2>9. Our liability</h2>
      <p>Nothing in these terms limits our liability for death or personal injury caused by negligence,
      for fraud, or for anything else that cannot lawfully be limited.</p>
      <p>Subject to that, our total liability arising out of any application is limited to the fee you
      paid for it. We are not liable for loss of profit, loss of contracts, or delay costs arising from
      a network operator's decision or timescale.</p>
      <p>If you are buying as a business, these terms are the entire agreement between us, and you
      confirm you are not relying on any statement not set out in them.</p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the law of England and Wales, and the courts of England and Wales
      have exclusive jurisdiction — except that if you live in Scotland or Northern Ireland you may
      also bring proceedings in your own courts.</p>

      <h2>11. Changes</h2>
      <p>We may update these terms. The version that applies to your application is the one published
      when you paid.</p>
    </div>
'''

# --------------------------------------------------------------- PRIVACY
PRIVACY = f'''    <p class="eyebrow">Legal</p>
    <h1 class="display h2">Privacy policy</h1>
    <p class="updated">Last updated {UPDATED}</p>

    <div class="prose">
      <div class="callout">
        <p><strong>The short version:</strong> we collect what Form A1-2 requires, we share it with your
        network operator because that is the entire point of the service, and we don't sell it to anyone.</p>
      </div>

      <h2>Who controls your data</h2>
      <p>Aesir Solar is the data controller for the information described here.
      <span class="todo">Registered company number, registered office and ICO registration number to be inserted.</span>
      For any privacy question, email <a href="mailto:hello@aesirsolar.co.uk">hello@aesirsolar.co.uk</a>.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>About you:</strong> name, company, email address, telephone number and your installer accreditation or qualification.</li>
        <li><strong>About the site:</strong> installation address, postcode and MPAN.</li>
        <li><strong>About the system:</strong> inverter make and model, ENA type-test reference, output rating, phase configuration, storage capacity, export limitation details and target commissioning date.</li>
        <li><strong>About the transaction:</strong> the fact and amount of your payment, and the order reference. Card details are handled by Tyl by NatWest and never reach us.</li>
      </ul>

      <h2>Why we use it, and on what basis</h2>
      <ul>
        <li><strong>To perform our contract with you</strong> — preparing, submitting and progressing your application, and keeping you updated.</li>
        <li><strong>To comply with legal obligations</strong> — keeping records for tax and accounting.</li>
        <li><strong>For our legitimate interests</strong> — keeping records of applications we have made so we can answer later queries, and protecting against fraud.</li>
      </ul>

      <h2>Who we share it with</h2>
      <ul>
        <li><strong>Your Distribution Network Operator or Independent Distribution Network Operator.</strong> This is unavoidable and is the purpose of the service — the application cannot be made without it.</li>
        <li><strong>Tyl by NatWest</strong>, who process the card payment.</li>
        <li><strong>Our professional advisers</strong> — accountants and, if ever needed, lawyers.</li>
      </ul>
      <p>We do not sell your data, and we do not share it for anyone else's marketing.</p>

      <h2>How long we keep it</h2>
      <p>Application records are kept for six years from the end of the tax year in which you paid,
      which matches the period we must retain financial records and comfortably covers the life of a
      connection record. After that they are deleted.</p>

      <h2>Your rights</h2>
      <p>Under UK GDPR you can ask us for a copy of your data, ask us to correct it, ask us to delete
      it, ask us to restrict how we use it, object to processing based on legitimate interests, or ask
      for it in a portable format. Email us and we'll respond within one month.</p>
      <p>Note that once an application has been submitted to a network operator, we cannot retrieve or
      delete the copy they hold — that's their record, governed by their own privacy notice.</p>
      <p>If you think we've handled your data badly, please tell us first. You also have the right to
      complain to the Information Commissioner's Office at
      <a href="https://ico.org.uk/" rel="noopener">ico.org.uk</a> or on 0303 123 1113.</p>

      <h2>Cookies</h2>
      <p>This site sets no advertising or analytics cookies. Your answers on the application form are
      held in your own browser's local storage so nothing is lost if the page reloads, and they are
      sent to us only when you submit the form. Clearing your browser data removes them.</p>
      <p>The payment step is hosted on a separate system, which sets its own strictly necessary
      cookies to keep your order and session together.</p>

      <h2>Where your data is held</h2>
      <p>Within the UK and European Economic Area. If that ever changes we will update this policy and
      ensure an appropriate safeguard is in place.</p>
    </div>
'''

# --------------------------------------------------------------- REFUNDS
REFUNDS = f'''    <p class="eyebrow">Legal</p>
    <h1 class="display h2">Refund policy</h1>
    <p class="updated">Last updated {UPDATED}</p>

    <div class="prose">
      <div class="callout">
        <p><strong>The rule we hold ourselves to:</strong> if we haven't submitted your application yet,
        you get your money back. If we've told you that you don't need us, you get your money back.
        What we can't refund is the network operator saying no.</p>
      </div>

      <h2>If we decide you don't need us</h2>
      <p>Part of what you're paying for is an honest eligibility check. If that check shows your
      installation sits at or below 16&nbsp;A per phase and can be handled under the notification route,
      or that it needs a different application entirely, we will tell you and
      <strong>refund the full £300.00</strong>. We would rather do that than submit something you didn't need.</p>

      <h2>If you change your mind before we submit</h2>
      <p>Ask us to stop at any point before the application goes to the network operator and we will
      refund the fee in full, less any work already done at your request.</p>

      <h2>Your statutory cancellation right</h2>
      <p>If you are buying as a consumer rather than in the course of a business, the Consumer Contracts
      (Information, Cancellation and Additional Charges) Regulations 2013 give you 14 days from entering
      the contract to cancel and receive a refund.</p>
      <p>Because most people want us to start straight away, we ask you to confirm at checkout that you
      want the service to begin within that 14-day period. Where you do, and we complete the service
      inside it, you lose the right to cancel — and where we have partly performed, we may keep a
      proportionate amount reflecting the work done. Statutory rights are unaffected if you'd prefer to
      wait out the 14 days before we start; just tell us.</p>

      <h2>If the application is returned</h2>
      <p>If it comes back because of an error or omission on our part, we correct and resubmit it at no
      charge. If it comes back because the information you gave us was inaccurate, or because you
      changed the system after submission, the resubmission is chargeable — but we will always tell you
      what changed and what it will cost before doing the work.</p>

      <h2>What we can't refund</h2>
      <ul>
        <li>The network operator refusing the connection, or approving it on terms you don't like.</li>
        <li>The operator escalating your application off the fast track to a full assessment.</li>
        <li>The operator taking longer than their published target to respond.</li>
        <li>Connection or reinforcement charges the operator asks you for. Those are payable to them, not to us, and are outside our control.</li>
      </ul>
      <p>We are paid to make the application properly, not to guarantee the answer. A refused application
      that was correctly prepared and properly argued is still the service you bought.</p>

      <h2>How to ask</h2>
      <p>Email <a href="mailto:hello@aesirsolar.co.uk">hello@aesirsolar.co.uk</a> with your order
      reference. Approved refunds go back to the card you paid with, normally within five working days
      and always within 14.</p>
    </div>
'''

# --------------------------------------------------------------- CONTACT
CONTACT = '''    <p class="eyebrow">Get in touch</p>
    <h1 class="display h2">Talk to us before you pay.</h1>
    <p class="lede">If you're not sure whether your installation needs a G99 application at all, ask
    first. It costs you nothing and it saves us both a refund.</p>

    <div class="contact-grid">
      <div>
        <div class="contact-card">
          <h3>Email</h3>
          <p>The fastest way to reach us. Include the postcode and the inverter model and we can usually
          tell you which procedure you're in on the first reply.</p>
          <p><a href="mailto:hello@aesirsolar.co.uk">hello@aesirsolar.co.uk</a></p>
        </div>
        <div class="contact-card" style="margin-top:20px">
          <h3>Phone</h3>
          <p><span class="todo">Telephone number to be inserted.</span></p>
          <p>Monday to Friday, <span class="todo">office hours to be confirmed</span>.</p>
        </div>
        <div class="contact-card" style="margin-top:20px">
          <h3>Registered address</h3>
          <p><span class="todo">Registered office address, company number and VAT number to be inserted.</span></p>
        </div>
      </div>

      <div>
        <div class="contact-card">
          <h3>Already applied?</h3>
          <p>If you've paid and want to check on an application, reply to your order confirmation email
          with the order reference, or view it in your account.</p>
          <p><a href="https://aesirsolar.co.uk/my-account/">View your orders</a></p>
        </div>
        <div class="contact-card" style="margin-top:20px">
          <h3>Not sure you need us?</h3>
          <p>Use the eligibility check on the homepage. It'll tell you which procedure you're in — and
          if you're at or below 16&nbsp;A per phase it will tell you that you probably don't need us.</p>
          <p><a href="index.html#check">Check your eligibility</a></p>
        </div>
        <div class="contact-card" style="margin-top:20px">
          <h3>Power cut?</h3>
          <p>We're an application service, not a network operator. If your power is off, call
          <strong>105</strong> free from any phone to reach your local network operator.</p>
        </div>
      </div>
    </div>
'''

# ------------------------------------------------------------------- FAQ
FAQS = [
    ("Do I actually need a G99 application?",
     """<p>If your installation exports more than 16&nbsp;A per phase, yes — you need the network
     operator's agreement <em>before</em> you connect. That's Regulation 22 of the Electricity Safety,
     Quality and Continuity Regulations 2002, not an industry preference.</p>
     <p>At or below 16&nbsp;A per phase (3.68&nbsp;kW single-phase, 11.04&nbsp;kW three-phase) you can
     normally connect first and notify afterwards under G98. Our
     <a href="index.html#check">eligibility check</a> will tell you which side of the line you're on.</p>"""),

    ("Isn't Form A1-2 only for 16 to 32 A per phase?",
     """<p>That was the old wording, and a lot of sites still quote it. Under <strong>G99 Issue 2</strong>,
     published 10 March 2025, Form A1-2 covers both procedure SGI-2 (aggregate up to 32&nbsp;A per phase)
     and SGI-3 (aggregate up to 60&nbsp;A per phase) — roughly 13.8&nbsp;kW single-phase or 41.4&nbsp;kW
     three-phase.</p>
     <p>It isn't purely about amps, though. A1-2 also requires every inverter to be fully type-tested,
     each unit's intrinsic design capacity to be 32&nbsp;A or less, and a G100 export limitation scheme
     where the procedure calls for one.</p>"""),

    ("How long does it take?",
     """<p>The published target for a fast-track application is <strong>ten working days</strong> from
     submission. The Energy Networks Association's own guidance notes that a form completed correctly
     first time can cut processing from roughly 45 days to 10.</p>
     <p>We can't guarantee it. The operator can escalate your application to a full assessment if the
     network needs studying, and then it moves to their standard timescales. If that happens we'll tell
     you straight away.</p>"""),

    ("Whose name goes on the application?",
     """<p>Yours. Form A1-2 has a mandatory installer block covering your name, accreditation and
     contact details, and that's what we complete. We prepare and lodge the application on your behalf —
     we don't replace you on it, and your accreditation still stands behind the work.</p>"""),

    ("What if my system can run in backup / island mode?",
     """<p>Tell us. The ENA's connection guide says systems designed to operate in island mode during an
     outage fall outside the fast-track process, which means the standard G99 route applies instead.</p>
     <p>Plenty of hybrid inverters ship with backup capability now, and it catches people out. It's one
     of the first things we check.</p>"""),

    ("What happens if the DNO says no?",
     """<p>Sometimes they do, or they approve on terms you weren't expecting — a lower export limit, or a
     contribution towards reinforcement. That decision is theirs alone and we can't overturn it.</p>
     <p>What we can do is make sure the refusal isn't caused by the paperwork, and explain what your
     options are. If the application was returned because of an error on our side, we correct and
     resubmit at no charge. See the <a href="refunds.html">refund policy</a>.</p>"""),

    ("Why is the ENA type-test reference such a big deal?",
     """<p>Because it's the single most common omission network operators complain about, and because
     the references change. When a manufacturer's certification is updated, applications quoting the
     superseded version get returned — even though the inverter on the roof hasn't changed.</p>
     <p>We check the current entry on the ENA register before submitting, rather than copying whatever
     reference was on the last job.</p>"""),

    ("What's an IDNO, and does it matter?",
     """<p>An Independent Distribution Network Operator owns a smaller network embedded inside a regional
     operator's area — typically a new-build estate, business park or logistics site. If the property is
     on one, the application goes to <em>them</em>, not the regional DNO.</p>
     <p>Sending it to the wrong operator can lose you weeks. We read the distributor ID from the MPAN to
     work out where it actually belongs.</p>"""),

    ("Do you cover Northern Ireland?",
     """<p>Not currently. Northern Ireland sits outside the GB framework — NIE Networks is the sole
     operator and uses its own G99/NI variant, with a different process. We cover the 14 GB licence
     areas and independent networks within them.</p>"""),

    ("What does the £250 include?",
     """<p>£250 plus VAT at 20%, so <strong>£300.00 in total</strong>, once, per application. It covers
     the eligibility assessment, the ENA register check, preparing and submitting Form A1-2, the
     single-line diagram and G100 evidence, dealing with the operator until there's a decision, and the
     A3-2 commissioning notification afterwards.</p>
     <p>It doesn't cover any connection or reinforcement charge the operator asks you for. That's paid
     to them, not to us.</p>"""),

    ("How do I pay, and is it secure?",
     """<p>By debit or credit card at the end of the application form. Payment is processed off-site by
     <strong>Tyl by NatWest</strong> — your card details go to them, not to us, and we never see or
     store them.</p>"""),

    ("Can I get a refund?",
     """<p>Yes, in the circumstances set out in our <a href="refunds.html">refund policy</a>. The
     headline: if we haven't submitted yet, or if our eligibility check shows you didn't need us, you
     get your money back in full.</p>"""),
]


def faq_page():
    items = []
    for q, a in FAQS:
        items.append(f'''      <details>
        <summary>{q}</summary>
        <div class="a">{a}</div>
      </details>''')
    body = "\n".join(items)
    schema_qs = ",".join(
        '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
        % (_json(q), _json(_strip(a))) for q, a in FAQS)
    return f'''    <p class="eyebrow">Questions</p>
    <h1 class="display h2">The things people ask before paying.</h1>
    <p class="lede">If yours isn't here, <a href="contact.html" style="color:var(--gold)">just ask us</a> — we'd rather answer it than take money for something you don't need.</p>

    <div class="faq">
{body}
    </div>

<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{schema_qs}]}}
</script>
'''


def _strip(html):
    import re
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def _json(s):
    import json
    return json.dumps(s)


PAGES = [
    ("terms.html", "Terms of service",
     "The terms on which Aesir Solar prepares and submits your G99 Form A1-2 application.", TERMS),
    ("privacy.html", "Privacy policy",
     "What data Aesir Solar collects for a G99 application, why, and who it is shared with.", PRIVACY),
    ("refunds.html", "Refund policy",
     "When Aesir Solar refunds the £250 + VAT application fee, and when it doesn't.", REFUNDS),
    ("contact.html", "Contact",
     "Get in touch with Aesir Solar about a G99 connection application.", CONTACT),
    ("faq.html", "Frequently asked questions",
     "Common questions about G99 Form A1-2, DNO approval, timescales and our fee.", faq_page()),
]

if __name__ == "__main__":
    for slug, title, desc, body in PAGES:
        (HERE / slug).write_text(shell(slug, title, desc, body), encoding="utf-8")
        print(f"built {slug}")
