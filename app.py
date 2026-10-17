from __future__ import annotations

from datetime import date
from pathlib import Path

import streamlit as st

from src.data_loader import load_opportunities
from src.eligibility import check_eligibility
from src.matching import calculate_relevance
from src.models import StudentProfile
from src.ollama_client import generate_fit_report
from src.storage import Storage

ROOT = Path(__file__).parent
st.set_page_config(page_title="OpportunityKit", page_icon="OK", layout="wide")

st.markdown("""<style>
:root { --ink:#16233b; --muted:#61708a; --brand:#4f46e5; --mint:#dff7ef; }
.block-container { max-width: 1180px; padding-top: 2rem; }
.hero { padding: 2rem; border-radius: 24px; background: linear-gradient(135deg,#eef2ff 0%,#ecfeff 100%); margin-bottom: 1.5rem; }
.hero h1 { color: var(--ink); margin-bottom: .3rem; }
.card { padding: 1.2rem; border: 1px solid #e8ecf4; border-radius: 18px; background: white; height: 100%; box-shadow: 0 8px 22px rgba(36,48,80,.05); }
.muted { color: var(--muted); }
.badge { display:inline-block; padding:.25rem .55rem; border-radius:999px; background:#eef2ff; color:#3730a3; font-size:.78rem; margin-right:.25rem; }
</style>""", unsafe_allow_html=True)

@st.cache_data
def get_opportunities():
    return load_opportunities(ROOT / "data" / "opportunities.json")

storage = Storage(ROOT / "opportunitykit.db")
opportunities = get_opportunities()
profile = storage.load_profile() or StudentProfile()

with st.sidebar:
    st.markdown("## OpportunityKit")
    st.caption("Your local-first opportunity companion")
    page = st.radio("Navigate", ["Discover", "Fit Report", "Saved tracker", "My profile"])
    st.divider()
    st.caption("Privacy note")
    st.caption("Your profile and saved items stay in a local SQLite file. AI reports use Ollama on your machine when available.")

st.markdown('<div class="hero"><h1>Find your next opportunity with clarity.</h1><p class="muted">Explore scholarships, internships, hackathons, competitions, and fellowships — with transparent matching and grounded next steps.</p></div>', unsafe_allow_html=True)

if page == "My profile":
    st.subheader("Your student profile")
    st.caption("Add only what you are comfortable storing locally. You can edit this anytime.")
    with st.form("profile"):
        c1, c2 = st.columns(2)
        name = c1.text_input("Name or nickname (optional)", profile.name)
        education = c1.selectbox("Education level", ["", "Undergraduate", "Postgraduate", "High school", "Other"], index=["", "Undergraduate", "Postgraduate", "High school", "Other"].index(profile.education_level) if profile.education_level in ["", "Undergraduate", "Postgraduate", "High school", "Other"] else 0)
        field = c1.text_input("Degree or field of study", profile.field_of_study)
        year = c1.number_input("Graduation year", min_value=2020, max_value=2040, value=profile.graduation_year or 2028, step=1)
        skills = c2.text_input("Skills (comma separated)", ", ".join(profile.skills))
        interests = c2.text_input("Areas of interest (comma separated)", ", ".join(profile.interests))
        types = c2.multiselect("Preferred opportunity types", ["Internship", "Scholarship", "Hackathon", "Competition", "Fellowship"], default=profile.opportunity_types)
        location = c2.selectbox("Location preference", ["Any", "Remote", "India", "Bengaluru", "New Delhi", "Mumbai", "Pune", "Hyderabad"], index=["Any", "Remote", "India", "Bengaluru", "New Delhi", "Mumbai", "Pune", "Hyderabad"].index(profile.location_preference) if profile.location_preference in ["Any", "Remote", "India", "Bengaluru", "New Delhi", "Mumbai", "Pune", "Hyderabad"] else 0)
        accessibility = st.text_area("Optional accessibility or other relevant preferences", profile.accessibility_preferences)
        if st.form_submit_button("Save profile", type="primary"):
            storage.save_profile(StudentProfile(name, education, field, int(year), [x.strip() for x in skills.split(",") if x.strip()], [x.strip() for x in interests.split(",") if x.strip()], types, location, accessibility))
            st.success("Profile saved locally.")
            st.rerun()

elif page == "Discover":
    saved = storage.saved_items()
    c1, c2, c3 = st.columns([2, 1, 1])
    query = c1.text_input("Search opportunities", placeholder="Try Python, climate, scholarship...")
    category = c2.selectbox("Category", ["All"] + sorted({o.category for o in opportunities}))
    sort = c3.selectbox("Sort by", ["Relevance", "Deadline soonest", "Newest verified"])
    filtered = [o for o in opportunities if (not query or query.lower() in (o.title + o.description + o.organization + ' '.join(o.required_skills)).lower()) and (category == "All" or o.category == category)]
    ranked = [(o, calculate_relevance(profile, o), check_eligibility(profile, o)) for o in filtered]
    if sort == "Relevance": ranked.sort(key=lambda x: x[1].score, reverse=True)
    elif sort == "Deadline soonest": ranked.sort(key=lambda x: x[0].deadline)
    else: ranked.sort(key=lambda x: x[0].last_verified, reverse=True)
    m1, m2, m3 = st.columns(3)
    m1.metric("Opportunities", len(opportunities)); m2.metric("Showing", len(ranked)); m3.metric("Saved", len(saved))
    st.divider()
    if not ranked: st.info("No matches yet. Try broadening your search or category filter.")
    for start in range(0, len(ranked), 3):
        cols = st.columns(3)
        for col, (opp, relevance, eligibility) in zip(cols, ranked[start:start+3]):
            with col:
                st.markdown(f'<div class="card"><span class="badge">{opp.category}</span><span class="badge">Demo data</span><h3>{opp.title}</h3><p><b>{opp.organization}</b> · {opp.location}</p><p class="muted">{opp.description}</p></div>', unsafe_allow_html=True)
                st.progress(relevance.score / 100, text=f"Profile relevance: {relevance.score}/100")
                st.caption(f"Eligibility: {eligibility.status}")
                st.caption(f"Deadline: {opp.deadline} · Verified: {opp.last_verified}")
                a, b = st.columns(2)
                if a.button("Unsave" if opp.id in saved else "Save", key=f"save-{opp.id}"):
                    storage.set_saved(opp.id, opp.id not in saved); st.rerun()
                if b.button("View fit", key=f"fit-{opp.id}"):
                    st.session_state["selected_opp"] = opp.id; st.session_state["page_override"] = "Fit Report"; st.rerun()
                st.markdown(f"[Official source]({opp.source_url})")

elif page == "Fit Report":
    selected = st.session_state.get("selected_opp")
    options = {o.id: o for o in opportunities}
    selected = st.selectbox("Choose an opportunity", list(options), format_func=lambda x: options[x].title, index=list(options).index(selected) if selected in options else 0)
    opp = options[selected]; eligibility = check_eligibility(profile, opp); relevance = calculate_relevance(profile, opp)
    st.subheader(opp.title); st.caption(f"{opp.organization} · {opp.category} · {opp.verification_status}")
    st.info(f"Deterministic eligibility: **{eligibility.status}**")
    with st.expander("Why this score?", expanded=True):
        st.progress(relevance.score / 100, text=f"Profile relevance: {relevance.score}/100")
        for item in relevance.explanation: st.write("• " + item)
    if st.button("Generate grounded Fit Report", type="primary"):
        with st.spinner("Trying local Gemma through Ollama; fallback is automatic..."):
            st.session_state["report"] = generate_fit_report(profile, opp, eligibility)
    report = st.session_state.get("report")
    if report:
        st.caption(f"Report source: {report.source}")
        for heading, items in [("Why this matches you", report.why_match), ("Your strengths", report.strengths), ("Gaps to address", report.gaps), ("Recommended next steps", report.next_steps), ("Before applying", report.before_applying)]:
            st.markdown(f"### {heading}")
            for item in items: st.write("• " + item)
        st.markdown("### Eligibility summary")
        st.write(report.eligibility_summary)
    st.markdown(f"[Open official source]({opp.source_url})")

else:
    saved = storage.saved_items()
    st.subheader("Saved opportunities")
    if not saved: st.info("Nothing saved yet. Explore the Discover page and save opportunities you want to revisit.")
    for opp in sorted([o for o in opportunities if o.id in saved], key=lambda o: o.deadline):
        record = saved[opp.id]
        st.markdown(f"### {opp.title}")
        st.caption(f"Deadline: {opp.deadline} · {opp.location}")
        c1, c2 = st.columns(2)
        status = c1.selectbox("Application status", ["Interested", "Planning", "Applied", "Completed"], index=["Interested", "Planning", "Applied", "Completed"].index(record["status"]), key=f"status-{opp.id}")
        if status != record["status"]: storage.update_status(opp.id, status); st.rerun()
        task_text = c2.text_input("Preparation checklist (comma separated)", ", ".join(record["tasks"]), key=f"tasks-{opp.id}")
        if task_text.split(",") != record["tasks"]: storage.update_tasks(opp.id, [x.strip() for x in task_text.split(",") if x.strip()])
        if st.button("Remove from saved", key=f"remove-{opp.id}"): storage.set_saved(opp.id, False); st.rerun()
        st.divider()
