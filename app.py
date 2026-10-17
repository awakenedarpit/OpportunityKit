from __future__ import annotations

import base64
from datetime import date
from pathlib import Path

import streamlit as st

from src.data_loader import load_opportunities
from src.eligibility import check_eligibility
from src.matching import calculate_relevance
from src.models import Opportunity, StudentProfile
from src.ollama_client import generate_fit_report
from src.storage import Storage

ROOT = Path(__file__).parent
LOGO_LIGHT_DATA = "data:image/svg+xml;base64," + base64.b64encode((ROOT / "assets" / "opportunitykit-logo-light.svg").read_bytes()).decode()
CATEGORIES = ["Internship", "Scholarship", "Hackathon", "Competition", "Fellowship"]
STATUSES = ["Interested", "Planning", "Applied", "Completed"]
NAV_ITEMS = ["Overview", "Discover", "Saved opportunities", "Application tracker", "Student profile", "About"]

st.set_page_config(page_title="OpportunityKit · Discover your next opportunity", page_icon=str(ROOT / "assets" / "favicon.svg"), layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
 :root { --ink:#0b1933; --ink-2:#263858; --muted:#65738c; --line:#dfe5eb; --surface:#fff; --canvas:#f7f7f2; --brand:#168b79; --brand-dark:#0f665a; --brand-soft:#e3f7f0; --violet:#7666d8; --violet-soft:#eeeaff; --green:#13795b; --green-soft:#e5f5ef; --amber:#9a6200; --amber-soft:#fff4d9; --red:#a23b45; --red-soft:#fdebed; }
html, body, [class*="css"] { font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); }
.stApp { background:var(--canvas); }
.block-container { max-width:1280px; padding:2.25rem 3rem 4rem; }
[data-testid="stSidebar"] { background:#fff; border-right:1px solid var(--line); }
[data-testid="stSidebar"] > div:first-child { padding:1.7rem 1.1rem; }
[data-testid="stSidebar"] .stRadio > div { gap:.3rem; }
[data-testid="stSidebar"] label { border-radius:10px; padding:.55rem .65rem; color:var(--ink-2); font-weight:600; }
[data-testid="stSidebar"] label:hover { background:var(--brand-soft); }
h1,h2,h3,h4 { font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); letter-spacing:-.025em; }
h1 { font-size:2.35rem !important; line-height:1.1; margin:.25rem 0 .55rem; }
h2 { font-size:1.55rem !important; margin:0; }
h3 { font-size:1.05rem !important; line-height:1.3; }
p { line-height:1.55; }
small, .muted { color:var(--muted); }
.stButton > button, .stDownloadButton > button { border-radius:9px; min-height:2.55rem; font-weight:700; border:1px solid var(--line); color:var(--ink); background:#fff; }
.stButton > button:hover { border-color:var(--brand); color:var(--brand-dark); box-shadow:0 0 0 3px rgba(22,139,121,.10); }
.stButton > button[kind="primary"] { background:var(--ink); border-color:var(--ink); color:#fff; }
.stButton > button[kind="primary"]:hover { background:#162b50; color:#fff; }
.stTextInput input, .stTextArea textarea, .stSelectbox div[data-baseweb="select"] > div, .stNumberInput input { border-radius:9px; border-color:#dfe3ec; }
.stTextInput input:focus, .stTextArea textarea:focus { border-color:var(--brand); box-shadow:0 0 0 1px var(--brand); }
.brand { display:flex; align-items:center; gap:.65rem; margin-bottom:2rem; }
.brand img { width:178px; height:auto; display:block; }
.brand-name { font-weight:800; font-size:1.05rem; letter-spacing:-.03em; }
.brand-sub { color:var(--muted); font-size:.72rem; margin-top:.1rem; }
.sidebar-note { margin-top:2rem; padding:.85rem; background:var(--canvas); border:1px solid var(--line); border-radius:10px; font-size:.75rem; color:var(--muted); line-height:1.5; }
.eyebrow { color:var(--brand); text-transform:uppercase; letter-spacing:.12em; font-size:.68rem; font-weight:800; margin-bottom:.45rem; }
.page-intro { margin-bottom:1.6rem; }
.page-intro p { color:var(--muted); margin-top:.25rem; max-width:700px; }
.hero { background:var(--ink); color:#fff; border-radius:18px; padding:2.35rem 2.5rem; margin-bottom:1.5rem; box-shadow:0 14px 30px rgba(11,25,51,.16); position:relative; overflow:hidden; }
.hero:after { content:""; position:absolute; width:260px; height:260px; right:-90px; top:-110px; border:1px solid rgba(117,230,196,.35); border-radius:50%; box-shadow:0 0 0 28px rgba(117,230,196,.06), 0 0 0 56px rgba(200,183,255,.06); }
.hero h1 { color:#fff; max-width:680px; }
.hero p { color:#bac5dc; max-width:680px; }
.hero-kicker { color:#75e6c4; text-transform:uppercase; letter-spacing:.14em; font-size:.68rem; font-weight:800; margin-bottom:.45rem; }
.hero-actions { display:flex; gap:.65rem; align-items:center; margin-top:1.1rem; }
.hero .stTextInput input { background:#fff; }
.surface { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:1.2rem; box-shadow:0 4px 14px rgba(29,44,75,.03); }
.metric-card { background:#fff; border:1px solid var(--line); border-radius:13px; padding:1rem 1.15rem; min-height:106px; }
.metric-label { color:var(--muted); font-size:.76rem; font-weight:600; }
.metric-value { font-family: Inter, ui-sans-serif, sans-serif; color:var(--ink); font-size:1.75rem; font-weight:800; margin-top:.4rem; }
.metric-hint { color:var(--muted); font-size:.72rem; margin-top:.15rem; }
.section-head { display:flex; justify-content:space-between; align-items:center; margin:1.7rem 0 .85rem; }
.section-head h2 { font-size:1.15rem !important; }
.section-head span { color:var(--muted); font-size:.8rem; }
.opp-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:1.15rem; min-height:248px; box-shadow:0 4px 14px rgba(29,44,75,.03); }
.opp-card h3 { margin:.7rem 0 .35rem; min-height:2.65rem; }
.opp-card p { font-size:.82rem; color:var(--muted); margin:.35rem 0; }
.card-footer { border-top:1px solid var(--line); margin-top:1rem; padding-top:.75rem; }
.badge { display:inline-block; border-radius:5px; padding:.27rem .5rem; font-size:.68rem; font-weight:800; background:var(--brand-soft); color:var(--brand-dark); margin-right:.25rem; }
.badge.demo { background:#f1f2f5; color:#657087; }
.status { display:inline-block; border-radius:999px; padding:.27rem .62rem; font-size:.7rem; font-weight:800; }
.status.eligible { background:var(--green-soft); color:var(--green); }
.status.possibly { background:var(--amber-soft); color:var(--amber); }
.status.not { background:var(--red-soft); color:var(--red); }
.status.neutral { background:#eff1f5; color:var(--ink-2); }
.score { font-family:'Plus Jakarta Sans'; color:var(--brand-dark); font-weight:800; }
.detail-hero { background:#fff; border:1px solid var(--line); border-radius:16px; padding:1.55rem; margin-bottom:1.1rem; }
.detail-hero h1 { font-size:1.8rem !important; }
.detail-meta { color:var(--muted); font-size:.82rem; }
.rule-box { border-radius:12px; padding:1rem; border:1px solid var(--line); background:#fff; }
.rule-box.green { background:var(--green-soft); border-color:#c9ecdf; }
.rule-box.amber { background:var(--amber-soft); border-color:#f3dfab; }
.rule-box.red { background:var(--red-soft); border-color:#f4cbd0; }
.report-panel { background:#fff; border:1px solid var(--line); border-radius:14px; padding:1.3rem; margin-bottom:1rem; }
.report-panel h3 { margin-top:0; }
.report-score { display:flex; align-items:center; gap:1.1rem; padding:1rem 0 .35rem; }
.score-number { font-family: Inter, ui-sans-serif, sans-serif; font-size:2.8rem; font-weight:800; color:var(--brand); letter-spacing:-.06em; }
.empty { text-align:center; padding:2.5rem 1rem; background:#fff; border:1px dashed #cfd5e2; border-radius:14px; }
.empty h3 { margin:.4rem 0; }
.progress-line { height:.38rem; background:#eaecf3; border-radius:99px; overflow:hidden; }
.progress-line > div { height:100%; background:var(--brand); border-radius:99px; }
.feature-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:.8rem; margin:1.35rem 0 1.7rem; }
.feature-card { background:#fff; border:1px solid var(--line); border-radius:12px; padding:1rem; min-height:112px; }
.feature-card .feature-icon { color:var(--brand); font-size:1.2rem; font-weight:900; }
.feature-card h3 { margin:.45rem 0 .25rem; font-size:.9rem !important; }
.feature-card p { color:var(--muted); font-size:.75rem; margin:0; line-height:1.45; }
.footer-note { border-top:1px solid var(--line); margin-top:2rem; padding-top:1rem; color:var(--muted); font-size:.76rem; }
@media (prefers-reduced-motion: reduce) { *, *:before, *:after { scroll-behavior:auto !important; transition:none !important; animation:none !important; } }
@media (max-width: 800px) { .block-container { padding:1.25rem 1rem 3rem; } h1 { font-size:1.8rem !important; } .hero { padding:1.4rem; } .opp-card { min-height:0; } .feature-strip { grid-template-columns:repeat(2,1fr); } }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def get_opportunities() -> list[Opportunity]:
    return load_opportunities(ROOT / "data" / "opportunities.json")


def status_class(status: str) -> str:
    if status.startswith("Eligible"): return "eligible"
    if status.startswith("Possibly"): return "possibly"
    if status.startswith("Not"): return "not"
    return "neutral"


def rule_class(status: str) -> str:
    return {"eligible": "green", "possibly": "amber", "not": "red"}.get(status_class(status), "")


def status_html(status: str) -> str:
    return f'<span class="status {status_class(status)}">{status}</span>'


def metric(label: str, value: str | int, hint: str = "") -> None:
    st.markdown(f'<div class="metric-card"><div class="metric-label">{label}</div><div class="metric-value">{value}</div><div class="metric-hint">{hint}</div></div>', unsafe_allow_html=True)


def page_intro(eyebrow: str, title: str, body: str) -> None:
    st.markdown(f'<div class="page-intro"><div class="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{body}</p></div>', unsafe_allow_html=True)


def go(page: str, opportunity_id: str | None = None) -> None:
    st.session_state["page"] = page
    if opportunity_id:
        st.session_state["selected_opp"] = opportunity_id
    st.rerun()


storage = Storage(ROOT / "opportunitykit.db")
opportunities = get_opportunities()
profile = storage.load_profile() or StudentProfile()
saved = storage.saved_items()
page = st.session_state.get("page", "Overview")

with st.sidebar:
    st.markdown(f'<div class="brand"><img src="{LOGO_LIGHT_DATA}" alt="OpportunityKit logo" /></div>', unsafe_allow_html=True)
    choice = st.radio("Workspace", NAV_ITEMS, index=NAV_ITEMS.index(page) if page in NAV_ITEMS else 0, label_visibility="collapsed")
    if choice != page:
        st.session_state["page"] = choice
        page = choice
    st.markdown('<div class="sidebar-note"><b>Local-first by design</b><br>Your profile and saved opportunities stay on this device. Fit Reports use Gemma through Ollama when available.</div>', unsafe_allow_html=True)
    st.caption("OpportunityKit · demo build")

# OVERVIEW
if page == "Overview":
    greeting = f"Welcome back, {profile.name}." if profile.name else "Make your next opportunity easier to find."
    st.markdown(f'<div class="hero"><div class="hero-kicker">Discover your next opportunity</div><h1>{greeting}</h1><p>Find internships, scholarships, hackathons and more. Understand your fit, see what is missing, and take the next step with confidence.</p><div class="hero-actions"><span class="badge" style="background:#75e6c4;color:#0b1933">Local-first</span><span style="color:#bac5dc;font-size:.78rem">Rules you can inspect. AI that stays grounded.</span></div></div>', unsafe_allow_html=True)
    search = st.text_input("Search your next opportunity", placeholder="Search by skill, category, or organization", label_visibility="collapsed")
    if search:
        st.session_state["search_query"] = search
        go("Discover")
    st.markdown('<div class="feature-strip"><div class="feature-card"><div class="feature-icon">⌕</div><h3>Discover clearly</h3><p>Search a curated catalogue with transparent relevance scores.</p></div><div class="feature-card"><div class="feature-icon">✓</div><h3>Know your fit</h3><p>Deterministic Python rules show eligible, unknown and conflicting requirements.</p></div><div class="feature-card"><div class="feature-icon">↗</div><h3>Move forward</h3><p>Save ideas, track application status and keep next steps visible.</p></div><div class="feature-card"><div class="feature-icon">✦</div><h3>Get context</h3><p>Use local Gemma for a grounded Fit Report, with a useful offline fallback.</p></div></div>', unsafe_allow_html=True)
    if not profile.education_level or not profile.skills:
        st.markdown('<div class="surface"><div class="eyebrow">START HERE</div><h2>Complete your profile to unlock better matches</h2><p class="muted">Add your education, skills, and interests once. OpportunityKit will use them to explain which listings deserve your attention.</p></div>', unsafe_allow_html=True)
        if st.button("Build my profile", type="primary"): go("Student profile")
    upcoming = sorted([o for o in opportunities if o.deadline_date and o.deadline_date >= date.today()], key=lambda o: o.deadline)[:3]
    applied = sum(1 for item in saved.values() if item["status"] in {"Planning", "Applied"})
    st.markdown('<div class="section-head"><h2>Your workspace</h2><span>Based on your local activity</span></div>', unsafe_allow_html=True)
    cols = st.columns(3)
    with cols[0]: metric("Saved opportunities", len(saved), "Keep the ones worth revisiting")
    with cols[1]: metric("In progress", applied, "Planning or applied")
    with cols[2]: metric("Upcoming deadlines", len(upcoming), "In the current demo dataset")
    ranked = sorted([(o, calculate_relevance(profile, o), check_eligibility(profile, o)) for o in opportunities], key=lambda x: x[1].score, reverse=True)[:3]
    st.markdown('<div class="section-head"><h2>Recommended for you</h2><span>Transparent relevance, not a selection guarantee</span></div>', unsafe_allow_html=True)
    if not profile.skills and not profile.interests:
        st.markdown('<div class="empty"><h3>Your recommendations start with your profile</h3><p class="muted">Add a few skills and interests to see relevant opportunities here.</p></div>', unsafe_allow_html=True)
    else:
        cols = st.columns(3)
        for col, (opp, relevance, eligibility) in zip(cols, ranked):
            with col:
                st.markdown(f'<div class="opp-card"><span class="badge">{opp.category}</span><span class="badge demo">Demo data</span><h3>{opp.title}</h3><p><b>{opp.organization}</b> · {opp.location}</p><p>Deadline <b>{opp.deadline}</b></p><div class="card-footer"><span class="score">{relevance.score}/100</span> <span class="muted">profile relevance</span></div></div>', unsafe_allow_html=True)
                if st.button("View opportunity", key=f"overview-{opp.id}", use_container_width=True): go("Opportunity details", opp.id)
    st.markdown('<div class="section-head"><h2>Upcoming deadlines</h2><span>Always verify details at the source</span></div>', unsafe_allow_html=True)
    for opp in upcoming:
        c1, c2, c3 = st.columns([4, 2, 1])
        c1.markdown(f"**{opp.title}**  \n<span class='muted'>{opp.organization} · {opp.category}</span>", unsafe_allow_html=True)
        c2.markdown(f"Deadline **{opp.deadline}**")
        if c3.button("View", key=f"deadline-{opp.id}"): go("Opportunity details", opp.id)
    st.markdown('<div class="footer-note">OpportunityKit is a local-first demo. Listings are fictional demo data; always verify deadlines and requirements at the official source.</div>', unsafe_allow_html=True)

# DISCOVER
elif page == "Discover":
    page_intro("DISCOVER", "Find opportunities worth your attention.", "Search the demo catalogue, filter by what matters to you, and compare listings without losing the context behind each match.")
    query = st.text_input("Search", value=st.session_state.get("search_query", ""), placeholder="Try Python, climate, scholarship, or a team event")
    f1, f2, f3, f4 = st.columns([1.2, 1.2, 1.2, 1.2])
    category = f1.multiselect("Category", CATEGORIES, placeholder="All categories")
    location = f2.selectbox("Location", ["Any location", "Remote", "India", "Bengaluru", "New Delhi", "Mumbai", "Pune", "Hyderabad"])
    eligibility_filter = f3.selectbox("Eligibility", ["All statuses", "Eligible", "Needs verification", "Known conflict"])
    sort = f4.selectbox("Sort", ["Relevance", "Deadline soonest", "Recently verified"])
    filtered = []
    for opp in opportunities:
        eligibility = check_eligibility(profile, opp)
        haystack = f"{opp.title} {opp.organization} {opp.description} {opp.location} {' '.join(opp.required_skills)}".lower()
        if query.lower() not in haystack: continue
        if category and opp.category not in category: continue
        if location != "Any location" and location.lower() not in opp.location.lower() and not (location == "Remote" and "remote" in opp.location.lower()): continue
        if eligibility_filter == "Eligible" and not eligibility.status.startswith("Eligible"): continue
        if eligibility_filter == "Needs verification" and not eligibility.status.startswith("Possibly"): continue
        if eligibility_filter == "Known conflict" and not eligibility.status.startswith("Not"): continue
        filtered.append((opp, calculate_relevance(profile, opp), eligibility))
    if sort == "Relevance": filtered.sort(key=lambda x: x[1].score, reverse=True)
    elif sort == "Deadline soonest": filtered.sort(key=lambda x: x[0].deadline)
    else: filtered.sort(key=lambda x: x[0].last_verified, reverse=True)
    st.markdown(f'<div class="section-head"><h2>{len(filtered)} opportunities</h2><span>All listings are clearly marked demo data</span></div>', unsafe_allow_html=True)
    if not filtered:
        st.markdown('<div class="empty"><div class="eyebrow">NO MATCHES</div><h3>Try a broader search</h3><p class="muted">Remove a filter or search for a broader skill, category, or location.</p></div>', unsafe_allow_html=True)
    else:
        for start in range(0, len(filtered), 3):
            cols = st.columns(3)
            for col, (opp, relevance, eligibility) in zip(cols, filtered[start:start+3]):
                with col:
                    st.markdown(f'<div class="opp-card"><span class="badge">{opp.category}</span><span class="badge demo">Demo data</span><h3>{opp.title}</h3><p><b>{opp.organization}</b> · {opp.location}</p><p>{opp.description}</p><p>Deadline <b>{opp.deadline}</b></p><div>{status_html(eligibility.status)} <span class="score" style="float:right">{relevance.score}/100</span></div></div>', unsafe_allow_html=True)
                    b1, b2 = st.columns(2)
                    if b1.button("Details", key=f"detail-{opp.id}", use_container_width=True): go("Opportunity details", opp.id)
                    if b2.button("Saved" if opp.id in saved else "Save", key=f"save-{opp.id}", use_container_width=True):
                        storage.set_saved(opp.id, opp.id not in saved); st.rerun()

# DETAIL
elif page == "Opportunity details":
    options = {o.id: o for o in opportunities}
    selected = st.session_state.get("selected_opp")
    if selected not in options:
        selected = next(iter(options))
    opp = options[selected]
    eligibility = check_eligibility(profile, opp)
    relevance = calculate_relevance(profile, opp)
    st.button("← Back to discover", on_click=lambda: st.session_state.update(page="Discover"))
    st.markdown(f'<div class="detail-hero"><span class="badge">{opp.category}</span><span class="badge demo">Demo data · {opp.verification_status}</span><h1>{opp.title}</h1><div class="detail-meta">{opp.organization} · {opp.location} · Deadline {opp.deadline}</div></div>', unsafe_allow_html=True)
    left, right = st.columns([1.75, 1])
    with left:
        st.markdown('<div class="surface"><div class="eyebrow">ABOUT THE OPPORTUNITY</div><h2>Overview</h2>', unsafe_allow_html=True)
        st.write(opp.description)
        st.markdown("**Required skills**")
        st.write(" · ".join(opp.required_skills) if opp.required_skills else "No specific skills listed")
        st.markdown("**Eligibility requirements**")
        for key, value in opp.eligibility.items(): st.write(f"• {key.replace('_', ' ').title()}: {value}")
        st.markdown('</div>', unsafe_allow_html=True)
    with right:
        st.markdown(f'<div class="rule-box {rule_class(eligibility.status)}"><div class="eyebrow">RULE-BASED ASSESSMENT</div><h3>{eligibility.status}</h3><p class="muted">This assessment uses the information in your profile and the listing requirements.</p></div>', unsafe_allow_html=True)
        st.markdown(f'<div class="surface" style="margin-top:1rem"><div class="eyebrow">PROFILE RELEVANCE</div><div class="score-number">{relevance.score}<span style="font-size:1rem">/100</span></div><p class="muted">Relevance is not selection probability.</p><div class="progress-line"><div style="width:{relevance.score}%"></div></div></div>', unsafe_allow_html=True)
    st.markdown('<div class="section-head"><h2>Before you apply</h2><span>Facts to verify at the source</span></div>', unsafe_allow_html=True)
    st.markdown(f'<div class="surface"><b>Last verified:</b> {opp.last_verified}<br><b>Source:</b> <a href="{opp.source_url}" target="_blank">{opp.source_url}</a><br><span class="muted">This is fictional demo data. Do not use this placeholder as a real application link.</span></div>', unsafe_allow_html=True)
    a, b = st.columns(2)
    with a:
        if st.button("Remove from saved" if opp.id in saved else "Save opportunity", type="primary", use_container_width=True): storage.set_saved(opp.id, opp.id not in saved); st.rerun()
    with b:
        if st.button("Create Fit Report", use_container_width=True): go("Fit Report", opp.id)

# FIT REPORT
elif page == "Fit Report":
    options = {o.id: o for o in opportunities}
    selected = st.session_state.get("selected_opp")
    selected = st.selectbox("Opportunity", list(options), format_func=lambda x: options[x].title, index=list(options).index(selected) if selected in options else 0)
    st.session_state["selected_opp"] = selected
    opp = options[selected]; eligibility = check_eligibility(profile, opp); relevance = calculate_relevance(profile, opp)
    page_intro("FIT REPORT", "A clearer path from interest to action.", "This report combines transparent rule-based assessment with a grounded local AI explanation. It never guarantees eligibility, selection, or success.")
    st.markdown(f'<div class="report-panel"><div class="eyebrow">OVERALL FIT SUMMARY</div><div class="report-score"><div class="score-number">{relevance.score}<span style="font-size:1rem">/100</span></div><div><h3>{opp.title}</h3><p class="muted">Profile relevance based on skills, interests, education, location, and deadline suitability.</p></div></div><div class="progress-line"><div style="width:{relevance.score}%"></div></div></div>', unsafe_allow_html=True)
    c1, c2 = st.columns([1, 1])
    with c1:
        st.markdown(f'<div class="rule-box {rule_class(eligibility.status)}"><div class="eyebrow">ELIGIBILITY ASSESSMENT</div><h3>{eligibility.status}</h3></div>', unsafe_allow_html=True)
        if eligibility.reasons:
            st.markdown("**What supports this assessment**")
            for reason in eligibility.reasons: st.write("✓ " + reason)
        if eligibility.missing_information:
            st.markdown("**Information to verify**")
            for missing in eligibility.missing_information: st.write("• " + missing)
    with c2:
        st.markdown('<div class="surface"><div class="eyebrow">SCORE BREAKDOWN</div>', unsafe_allow_html=True)
        for label, value in relevance.components.items(): st.write(f"{label} · **{value}**"); st.progress(value / (45 if label == "Skills overlap" else 20 if label == "Interest/category" else 15 if label == "Education alignment" else 10))
        st.markdown('</div>', unsafe_allow_html=True)
    if st.button("Generate grounded Fit Report", type="primary"):
        with st.spinner("Checking local Gemma through Ollama…"):
            st.session_state["report"] = generate_fit_report(profile, opp, eligibility)
    report = st.session_state.get("report")
    if report:
        st.caption(f"Explanation source: {report.source}")
        panels = [("Why this matches you", report.why_match), ("Your strengths", report.strengths), ("Gaps to address", report.gaps), ("Recommended next steps", report.next_steps)]
        for heading, items in panels:
            st.markdown(f'<div class="report-panel"><h3>{heading}</h3>', unsafe_allow_html=True)
            for item in items: st.write("• " + item)
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('<div class="report-panel"><h3>Before applying</h3>', unsafe_allow_html=True)
        for item in report.before_applying: st.write("• " + item)
        st.markdown(f"<p class='muted'>Source: <a href='{opp.source_url}' target='_blank'>{opp.source_url}</a> · Last verified {opp.last_verified} · Demo data</p></div>", unsafe_allow_html=True)
    else:
        st.markdown('<div class="empty"><h3>Your evidence-based report is ready when you are</h3><p class="muted">Generate a grounded explanation using local Gemma, or continue with the deterministic assessment above.</p></div>', unsafe_allow_html=True)

# SAVED
elif page in {"Saved opportunities", "Application tracker"}:
    tracker = page == "Application tracker"
    page_intro("TRACK YOUR PROGRESS" if tracker else "SAVED", "Keep your applications moving.", "A simple workspace for the opportunities you want to revisit, the steps you plan to take, and the deadlines you should verify.")
    current = storage.saved_items()
    if tracker:
        status_filter = st.selectbox("Show status", ["All statuses"] + STATUSES)
        records = [(o, current[o.id]) for o in opportunities if o.id in current and (status_filter == "All statuses" or current[o.id]["status"] == status_filter)]
    else:
        records = [(o, current[o.id]) for o in opportunities if o.id in current]
    if not records:
        st.markdown('<div class="empty"><div class="eyebrow">A QUIET START</div><h3>No saved opportunities yet</h3><p class="muted">Save a listing from Discover when it feels worth a closer look.</p></div>', unsafe_allow_html=True)
        if st.button("Browse opportunities", type="primary"): go("Discover")
    else:
        st.caption(f"{len(records)} saved {('application' if tracker else 'opportunity')}{'' if len(records) == 1 else 'ies'}")
        for opp, record in sorted(records, key=lambda x: x[0].deadline):
            eligibility = check_eligibility(profile, opp)
            with st.container(border=True):
                c1, c2, c3, c4 = st.columns([3, 1.2, 1.6, 1.2])
                c1.markdown(f"**{opp.title}**  \n<span class='muted'>{opp.organization} · {opp.category} · Deadline {opp.deadline}</span>", unsafe_allow_html=True)
                c2.markdown(status_html(eligibility.status), unsafe_allow_html=True)
                new_status = c3.selectbox("Status", STATUSES, index=STATUSES.index(record["status"]), key=f"status-{opp.id}", label_visibility="collapsed")
                if new_status != record["status"]: storage.update_status(opp.id, new_status); st.rerun()
                if c4.button("Open", key=f"open-saved-{opp.id}"): go("Opportunity details", opp.id)
                tasks = st.text_input("Preparation checklist · comma separated", ", ".join(record["tasks"]), key=f"tasks-{opp.id}")
                parsed = [x.strip() for x in tasks.split(",") if x.strip()]
                if parsed != record["tasks"]: storage.update_tasks(opp.id, parsed)

# PROFILE
elif page == "Student profile":
    page_intro("YOUR PROFILE", "Tell OpportunityKit what matters to you.", "Your profile stays on this device and powers the transparent relevance and eligibility explanations across the app.")
    with st.form("profile"):
        st.markdown('<div class="surface"><div class="eyebrow">ABOUT YOU</div><h3>Identity and education</h3>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        name = c1.text_input("Name or nickname", profile.name, help="Optional — used only for your local welcome message.")
        education_options = ["", "Undergraduate", "Postgraduate", "High school", "Other"]
        education = c1.selectbox("Education level", education_options, index=education_options.index(profile.education_level) if profile.education_level in education_options else 0)
        field = c1.text_input("Degree or field of study", profile.field_of_study)
        year = c1.number_input("Graduation year", 2020, 2040, profile.graduation_year or 2028)
        accessibility = c2.text_area("Accessibility or other preferences", profile.accessibility_preferences, help="Optional. Add only what you need OpportunityKit to consider.")
        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('<div class="surface" style="margin-top:1rem"><div class="eyebrow">YOUR DIRECTION</div><h3>Skills and interests</h3>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        skills = c1.text_input("Skills", ", ".join(profile.skills), help="Separate skills with commas, such as Python, Research, or Figma.")
        interests = c2.text_input("Areas of interest", ", ".join(profile.interests), help="Separate interests with commas, such as Climate or Internship.")
        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('<div class="surface" style="margin-top:1rem"><div class="eyebrow">PREFERENCES</div><h3>Where and how you want to explore</h3>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        types = c1.multiselect("Opportunity types", CATEGORIES, default=profile.opportunity_types)
        location_options = ["Any", "Remote", "India", "Bengaluru", "New Delhi", "Mumbai", "Pune", "Hyderabad"]
        location = c2.selectbox("Location preference", location_options, index=location_options.index(profile.location_preference) if profile.location_preference in location_options else 0)
        st.markdown('</div>', unsafe_allow_html=True)
        if st.form_submit_button("Save profile", type="primary"):
            if not education:
                st.error("Choose an education level so eligibility checks can be transparent.")
            else:
                storage.save_profile(StudentProfile(name, education, field, int(year), [x.strip() for x in skills.split(",") if x.strip()], [x.strip() for x in interests.split(",") if x.strip()], types, location, accessibility))
                st.success("Profile saved locally. Your recommendations are ready to explore.")

# ABOUT
else:
    page_intro("ABOUT OPPORTUNITYKIT", "Useful AI, with its boundaries visible.", "OpportunityKit is designed to help students make better-informed decisions without replacing their judgment or pretending an application outcome is guaranteed.")
    c1, c2 = st.columns(2)
    with c1:
        st.markdown('<div class="surface"><div class="eyebrow">HOW IT WORKS</div><h3>Rules first. AI second.</h3><p>The deterministic eligibility engine checks explicit requirements in Python. The relevance score shows its components. Local Gemma only turns those supplied facts into a clearer Fit Report.</p></div>', unsafe_allow_html=True)
    with c2:
        st.markdown('<div class="surface"><div class="eyebrow">TRUST</div><h3>Verify before applying.</h3><p>Every listing shows its source, verification date, and data status. The current catalogue is fictional demo data. Confirm all deadlines and requirements at the official source.</p></div>', unsafe_allow_html=True)
    st.markdown('<div class="section-head"><h2>Local-first setup</h2></div>', unsafe_allow_html=True)
    st.code("ollama pull gemma4:e4b\n# lighter fallback\nollama pull gemma4:e2b")
    st.caption("No paid API key is required for the core demonstration. See README for setup, testing, and limitations.")
