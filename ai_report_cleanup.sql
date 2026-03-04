-- 1. AIレポート保存用テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSの設定
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- データの閲覧ポリシー: 企業に所属するマネージャー・特権管理者のみ
CREATE POLICY "Managers can view their company's reports" 
ON ai_reports FOR SELECT 
USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- データの挿入ポリシー: 企業に所属するマネージャー・特権管理者のみ
CREATE POLICY "Managers can insert reports for their company" 
ON ai_reports FOR INSERT 
WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- ==========================================
-- 2. 最新3件のみを保持する自動クリーンアップ関数
-- ==========================================
CREATE OR REPLACE FUNCTION maintain_recent_ai_reports()
RETURNS trigger AS $$
BEGIN
  -- 新しくINSERTされたレコードと同じ company_id を持つデータのうち、
  -- 作成日時の降順で4件目以降の古いレコードを強制削除する
  DELETE FROM ai_reports
  WHERE id IN (
    SELECT id
    FROM ai_reports
    WHERE company_id = NEW.company_id
    ORDER BY created_at DESC
    OFFSET 3
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. INSERT時に自動発火するトリガー
-- ==========================================
-- 既に存在する場合は一度削除して再作成
DROP TRIGGER IF EXISTS trigger_maintain_recent_ai_reports ON ai_reports;

CREATE TRIGGER trigger_maintain_recent_ai_reports
AFTER INSERT ON ai_reports
FOR EACH ROW
EXECUTE FUNCTION maintain_recent_ai_reports();
