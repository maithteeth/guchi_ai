import streamlit as st
import pandas as pd
from supabase import create_client, Client
import google.generativeai as genai
import os
from dotenv import load_dotenv
import streamlit.components.v1 as components

# ==========================================
# 1. 環境設定と初期化
# ==========================================
st.set_page_config(page_title="経営者ダッシュボード | 課題解析AI", layout="wide", initial_sidebar_state="expanded")

# Custom CSS for Dark Glassmorphism Theme
st.markdown("""
<style>
    /* Main Background & Text */
    .stApp {
        background-color: #0A0F1C;
        color: #F8FAFC;
    }
    
    /* Sidebar Background */
    [data-testid="stSidebar"] {
        background-color: #131B2F !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    [data-testid="stSidebar"] * {
        color: #F8FAFC !important;
    }
    
    /* Headers */
    h1, h2, h3, h4, h5, h6 {
        color: #F8FAFC !important;
    }
    
    /* Labels */
    label, label p, [data-testid="stWidgetLabel"] p, .stTextInput label p {
        color: #e2e8f0 !important;
        font-weight: 600 !important;
    }
    
    /* Inputs */
    .stTextInput > div > div > input {
        background-color: #0A0F1C !important;
        color: #F8FAFC !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 0.5rem;
    }
    .stTextInput > div > div > input:focus {
        border-color: #06b6d4 !important;
        box-shadow: 0 0 0 1px #06b6d4 !important;
    }
    
    /* Primary Buttons */
    .stButton > button {
        background: linear-gradient(to right, #6366F1, #8B5CF6) !important;
        color: white !important;
        border: none !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
        transition: all 0.3s ease !important;
        font-weight: bold !important;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 25px rgba(99, 102, 241, 0.5) !important;
    }
    
    /* Selectbox */
    .stSelectbox > div > div {
        background-color: #0A0F1C !important;
        color: #F8FAFC !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    /* Info/Success/Error boxes */
    .stAlert {
        background-color: rgba(19, 27, 47, 0.8) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #e2e8f0 !important;
        backdrop-filter: blur(10px);
    }
    
    /* Markdown Text */
    .stMarkdown p {
        color: #cbd5e1 !important;
    }
    
    /* Horizontal rule */
    hr {
        border-color: rgba(255, 255, 255, 0.1) !important;
    }
</style>
""", unsafe_allow_html=True)

# 環境変数の読み込み (app.pyが配置されているmanager_dashboardの親ディレクトリにある.env.localを読み込む)
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '.env.local')
load_dotenv(env_path)

SUPABASE_URL = ""
SUPABASE_KEY = ""
GEMINI_API_KEY = ""
PAYPAL_CLIENT_ID = "test"

# Streamlit CloudのSecretsか、ローカルのOS環境変数から取得する関数
def get_env_var(key, default=""):
    try:
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    return os.environ.get(key, default)

SUPABASE_URL = get_env_var("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = get_env_var("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
GEMINI_API_KEY = get_env_var("GEMINI_API_KEY", "")
PAYPAL_CLIENT_ID = get_env_var("PAYPAL_CLIENT_ID", "test")

# クライアント初期化
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    st.error("Supabaseの環境変数が設定されていません")
    st.stop()

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    st.warning("Gemini API Keyが設定されていません。レポートはダミーで表示されます。")

# ==========================================
# 2. セッションステート管理
# ==========================================
if "user" not in st.session_state:
    st.session_state.user = None
if "profile" not in st.session_state:
    st.session_state.profile = None
if "access_token" not in st.session_state:
    st.session_state.access_token = None
if "refresh_token" not in st.session_state:
    st.session_state.refresh_token = None

# セッションの復元
if st.session_state.access_token and st.session_state.refresh_token:
    try:
        supabase.auth.set_session(st.session_state.access_token, st.session_state.refresh_token)
    except Exception:
        st.session_state.user = None
        st.session_state.profile = None
        st.session_state.access_token = None
        st.session_state.refresh_token = None

# ==========================================
# 3. 認証処理 (Login)
# ==========================================
def login():
    st.title("■ 経営者向けダッシュボード ログイン")
    st.markdown("従業員から集まった現場の声をAIで解析し、経営課題を浮き彫りにします。")
    
    email = st.text_input("メールアドレス")
    password = st.text_input("パスワード", type="password")
    
    if st.button("ログイン"):
        try:
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if res.user:
                # profile取得
                profile = supabase.table("profiles").select("*").eq("id", res.user.id).single().execute()
                role = profile.data.get("role")
                if profile.data and role in ["manager", "super_admin"]:
                    st.session_state.user = res.user
                    st.session_state.profile = profile.data
                    st.session_state.access_token = res.session.access_token
                    st.session_state.refresh_token = res.session.refresh_token
                    st.success("ログイン成功！")
                    st.rerun()
                else:
                    st.error("このアカウントは管理者権限を持っていません。")
        except Exception as e:
            st.error(f"ログインに失敗しました: {e}")

if not st.session_state.user:
    login()
    st.stop()

company_id = st.session_state.profile.get("company_id")
manager_id = st.session_state.profile.get("id")
is_super_admin = st.session_state.profile.get("role") == "super_admin"

# ==========================================
# 4. データ取得関数 (DB Query)
# ==========================================
def get_all_companies():
    res = supabase.table("companies").select("id, name").order("created_at").execute()
    return {c["id"]: c["name"] for c in res.data}

@st.cache_data(ttl=60)
def get_grievances(cid):
    res = supabase.table("grievances").select("*").eq("company_id", cid).execute()
    return pd.DataFrame(res.data)

def check_subscription(cid):
    res = supabase.table("subscriptions").select("*").eq("company_id", cid).eq("status", "active").execute()
    return len(res.data) > 0, res.data

def get_purchased_reports(cid):
    res = supabase.table("report_purchases").select("report_type").eq("company_id", cid).execute()
    return [r["report_type"] for r in res.data]

# ==========================================
# 5. 特権管理者向けの動的切り替えUI (サイドバーの一部)
# ==========================================
st.sidebar.title("■ 経営者ダッシュボード")
st.sidebar.markdown(f"**アカウント:** {st.session_state.user.email}")

if is_super_admin:
    st.sidebar.markdown("### ▶ 特権管理者モード")
    all_companies = get_all_companies()
    if not all_companies:
        st.sidebar.warning("まだ登録されている企業がありません。")
        st.stop()
        
    company_options = list(all_companies.keys())
    # システム管理用ダミー会社は一覧から除外するか、一番最後に回す
    filtered_options = [cid for cid in company_options if all_companies[cid] != "【システム管理用マスターアカウント】"]
    
    selected_company_name = st.sidebar.selectbox(
        "閲覧する企業を選択", 
        [all_companies[cid] for cid in filtered_options] if filtered_options else ["企業が存在しません"]
    )
    
    # Selected Name -> Selected ID
    if filtered_options:
        inv_map = {v: k for k, v in all_companies.items()}
        company_id = inv_map[selected_company_name]
    
    is_subscribed = True # スーパー管理者は全開放
    purchased_reports = []
    st.sidebar.markdown(f"**サブスク状態:** [ 全開放 (Super Admin) ]")
else:
    is_subscribed, sub_data = check_subscription(company_id)
    purchased_reports = get_purchased_reports(company_id)
    st.sidebar.markdown(f"**サブスク状態:** {'[ 有効 (全開放) ]' if is_subscribed else '[ 未登録 ]'}")

# ==========================================
# 6. Gemini AI レポート生成関数
# ==========================================
def generate_report(report_id, title, df):
    if df.empty:
        return "データが不足しているため解析できません。"
        
    prompt = f"""
    あなたは企業の経営コンサルタントAIです。以下の従業員の不満データ(JSON形式)を分析し、「{title}」というテーマで経営向けのレポートを作成してください。
    データ: {df.to_json(orient='records', force_ascii=False)}
    
    文字数は300〜500字程度、マークダウンを使用して読みやすくまとめてください。
    """
    if GEMINI_API_KEY:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text
    else:
        return f"【ダミー解析結果】\n{title}に関する分析結果です。データ件数は{len(df)}件です。深刻な課題が散見されますが、APIキーが未設定のため詳細は表示できません。"

# ==========================================
# 6. PayPal 決済UI部品 (モザイク＆ボタン)
# ==========================================
def render_locked_report(report_id, title, company_id, manager_id):
    st.markdown(f"### ● {title}")
    
    mock_blur = """
    <div style="filter: blur(8px); user-select: none; color: transparent; text-shadow: 0 0 15px rgba(255,255,255,0.4);">
        この部分はロックされています。この部分はロックされています。この部分はロックされています。
        従業員の深刻な声がここに表示されます。改善のための具体的なアクションプランが含まれています。
        この部分はロックされています。この部分はロックされています。この部分はロックされています。
    </div>
    """
    st.markdown(mock_blur, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        st.info("▶ **単発アンロック (¥300)**\n\nこのレポートのみを閲覧します")
        # 簡易的なPayPalボタン (Sandbox用)
        paypal_html = f"""
        <div id="paypal-button-container-{report_id}"></div>
        <script src="https://www.paypal.com/sdk/js?client-id={PAYPAL_CLIENT_ID}&currency=JPY"></script>
        <script>
            paypal.Buttons({{
                createOrder: function(data, actions) {{
                    return actions.order.create({{
                        purchase_units: [{{
                            amount: {{ value: '300.00' }},
                            custom_id: JSON.stringify({{ company_id: '{company_id}', manager_id: '{manager_id}', report_type: '{report_id}' }})
                        }}]
                    }});
                }},
                onApprove: function(data, actions) {{
                    return actions.order.capture().then(function(details) {{
                        alert('購入が完了しました！ページをリロードしてください。');
                    }});
                }}
            }}).render('#paypal-button-container-{report_id}');
        </script>
        """
        components.html(paypal_html, height=150)
        
    with col2:
        st.success("▶ **月額見放題プラン (¥3,000/月)**\n\nすべてのレポートを無制限に閲覧")
        sub_html = f"""
        <div id="paypal-sub-container-{report_id}"></div>
        <!-- ※実際のサブスク決済は vault=true や intent=subscription などのパラメータとPlan IDが必要です -->
        <script src="https://www.paypal.com/sdk/js?client-id={PAYPAL_CLIENT_ID}&vault=true&intent=subscription"></script>
        <script>
            paypal.Buttons({{
                createSubscription: function(data, actions) {{
                    return actions.subscription.create({{
                        'plan_id': 'YOUR_PAYPAL_PLAN_ID',
                        'custom_id': '{company_id}'
                    }});
                }},
                onApprove: function(data, actions) {{
                    alert('サブスクリプションが有効化されました！ページをリロードしてください。');
                }}
            }}).render('#paypal-sub-container-{report_id}');
        </script>
        """
        components.html(sub_html, height=150)
    
    st.divider()

# ==========================================
# 8. デバッグ・ログアウト処理
# ==========================================
if not is_super_admin:
    st.sidebar.divider()
    st.sidebar.markdown("### ▶ デバッグ用ツール")
    st.sidebar.caption("ローカル環境ではPayPalからのWebhookを受信できないため、ワンクリックで全開放をシミュレートできます。")
    if st.sidebar.button("デバッグ: 月額サブスクを強制有効化"):
        # subscriptionsテーブルに強制インサート/アップデート
        existing = supabase.table("subscriptions").select("id").eq("company_id", company_id).execute()
        if existing.data:
            supabase.table("subscriptions").update({"status": "active"}).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("subscriptions").insert({
                "company_id": company_id,
                "paypal_subscription_id": "DEBUG_SUB_123",
                "status": "active"
            }).execute()
        st.sidebar.success("強制有効化しました！ページをリロードします。")
        st.rerun()

st.sidebar.divider()
if st.sidebar.button("ログアウト"):
    st.session_state.user = None
    st.session_state.profile = None
    st.session_state.access_token = None
    st.session_state.refresh_token = None
    supabase.auth.sign_out()
    st.rerun()

st.title("■ AIインサイトレポート")
df = get_grievances(company_id)

if df.empty:
    st.info("現在、従業員からの課題（現場の声）は投稿されていません。")
else:
    st.markdown(f"収集された全課題数: **{len(df)}件**")

    reports = [
        {"id": "ai_intro", "title": "【無料】AI導入ポイント解析", "free": True},
        {"id": "human_relations_analysis", "title": "1. 人間関係・コミュニケーション分析", "free": False},
        {"id": "workload_analysis", "title": "2. 業務量・スケジュール過多分析", "free": False},
        {"id": "environment_analysis", "title": "3. 職場環境・ルール問題の抽出", "free": False},
        {"id": "equipment_analysis", "title": "4. 設備・機材によるボトルネック", "free": False},
        {"id": "management_feedback", "title": "5. 経営・マネジメント層への直接的要望", "free": False},
        {"id": "burnout_risk", "title": "6. バーンアウト(燃え尽き症候群)リスク判定", "free": False},
        {"id": "productivity_bottlenecks", "title": "7. 生産性低下要因の特定", "free": False},
        {"id": "employee_satisfaction", "title": "8. 従業員エンゲージメント予測", "free": False},
        {"id": "retention_strategy", "title": "9. 離職防止(リテンション)戦略提案", "free": False},
    ]

    for rep in reports:
        report_id = rep["id"]
        title = rep["title"]
        
        # 無料レポート or サブスク有効 or 個別購入済み なら表示
        if rep["free"] or is_subscribed or report_id in purchased_reports:
            prefix = "○" if rep["free"] else "●"
            st.markdown(f"### {prefix} {title}")
            with st.spinner("AIがデータを解析中..."):
                content = generate_report(report_id, title, df)
                st.markdown(f"<div style='background-color: rgba(19, 27, 47, 0.8); padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid #06b6d4; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); color: #e2e8f0; font-size: 0.95em; line-height: 1.6;'>{content}</div>", unsafe_allow_html=True)
            st.divider()
        else:
            render_locked_report(report_id, title, company_id, manager_id)
