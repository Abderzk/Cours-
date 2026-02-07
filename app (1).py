import streamlit as st
import json
import os
from itertools import combinations

HORSES = list(range(1, 17))
TOP_K = 10
WEIGHTS_FILE = "weights.json"

RACE_LIMITS = {
    "Plat": (20, 40),
    "Attelé": (22, 45),
    "Handicap": (25, 50),
}

def load_weights():
    if os.path.exists(WEIGHTS_FILE):
        with open(WEIGHTS_FILE, "r") as f:
            return json.load(f)
    return {str(i): 1.0 for i in HORSES}

def save_weights(weights):
    with open(WEIGHTS_FILE, "w") as f:
        json.dump(weights, f)

weights = load_weights()

def generate_candidates(race_type):
    min_sum, max_sum = RACE_LIMITS[race_type]
    candidates = []
    for comb in combinations(HORSES, 5):
        s = sum(comb)
        if min_sum <= s <= max_sum:
            score = sum(weights[str(h)] for h in comb)
            candidates.append((comb, score))
    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates[:TOP_K]

def learn_from_result(result):
    for i, h in enumerate(result):
        if str(h) in weights:
            weights[str(h)] += 0.3 * (len(result) - i)  # More reward for earlier position
    save_weights(weights)

st.set_page_config(
    page_title="Horse Race AI",
    page_icon="🐎",
    layout="centered"
)

st.title("🐎 Horse Race AI")
st.caption("Smart numerical pattern engine — learns after every race")

race_type = st.selectbox(
    "اختر نوع السباق",
    ["Plat", "Attelé", "Handicap"]
)

if st.button("🔮 توليد Top 10"):
    results = generate_candidates(race_type)
    if not results:
        st.warning("لا توجد تشكيلات ضمن الحدود لهذا النوع من السباق.")
    else:
        st.subheader("✅ أفضل 10 نتائج محتملة")
        for i, (comb, _) in enumerate(results, 1):
            st.write(f"{i}. {' / '.join(map(str, comb))}")

st.divider()

st.subheader("📥 إدخال النتيجة الصحيحة (للتعلم)")
real_result = st.text_input(
    "مثال: 5/2/3/6/16",
    placeholder="أدخل 5 أرقام مفصولة بـ /"
)

if st.button("📈 تحديث التعلم"):
    try:
        parsed = [int(x) for x in real_result.split("/") if x.strip().isdigit() and int(x) in HORSES]
        if len(parsed) >= 3:
            learn_from_result(parsed)
            st.success("✅ تم تحديث النموذج — النظام يتحسن مع الوقت")
            st.json({k: round(v, 2) for k, v in weights.items()})
        else:
            st.error("❌ أدخل على الأقل 3 أرقام صحيحة")
    except Exception as e:
        st.error(f"❌ صيغة غير صحيحة: {e}")

st.caption(
    "This system provides probabilistic insights based on numerical pattern analysis."
)