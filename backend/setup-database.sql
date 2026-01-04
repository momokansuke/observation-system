-- 企業マスタテーブル
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100) UNIQUE,
  plan_type VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- ユーザーテーブル
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  department VARCHAR(100),
  manager_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 観察記録テーブル
CREATE TABLE observations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  observer_id INTEGER NOT NULL REFERENCES users(id),
  subject_id INTEGER NOT NULL REFERENCES users(id),
  observation_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  month_period VARCHAR(7) NOT NULL,
  specific_behavior TEXT NOT NULL,
  result_outcome TEXT,
  comment TEXT,
  improvement_plan TEXT,
  evaluation_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, observer_id, subject_id, observation_date)
);

-- 週次記録追跡テーブル
CREATE TABLE weekly_tracking (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  observer_id INTEGER NOT NULL REFERENCES users(id),
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  has_recorded BOOLEAN DEFAULT false,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP,
  UNIQUE(company_id, observer_id, year, week_number)
);

-- サンプルデータの挿入
INSERT INTO companies (name, domain) VALUES ('株式会社サンプル', 'sample.co.jp');

