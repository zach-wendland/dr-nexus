-- Dr. Nexus Medical Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patient Profile Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    mrn TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Conditions Table
CREATE TABLE IF NOT EXISTS conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icd10_code TEXT,
    snomed_code TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'inactive', 'recurrence')),
    clinical_status TEXT,
    verification_status TEXT DEFAULT 'confirmed',
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    onset_date DATE,
    resolution_date DATE,
    notes TEXT,
    source_document TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Implanted Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    device_name TEXT,
    udi TEXT,
    manufacturer TEXT,
    model TEXT,
    lot_number TEXT,
    serial_number TEXT,
    implant_date DATE,
    explant_date DATE,
    body_location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline Events Table (Main medical history)
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    event_date TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('encounter', 'diagnosis', 'lab_result', 'medication', 'procedure', 'imaging', 'vital_signs', 'immunization', 'note')),
    summary TEXT,
    details JSONB DEFAULT '{}',
    clinical_significance TEXT DEFAULT 'medium' CHECK (clinical_significance IN ('low', 'medium', 'high', 'critical')),
    provider TEXT,
    location TEXT,
    source_document TEXT,
    codes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results Table (Detailed lab data for charting)
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    timeline_event_id UUID REFERENCES timeline_events(id) ON DELETE SET NULL,
    test_date TIMESTAMPTZ NOT NULL,
    loinc_code TEXT,
    test_name TEXT NOT NULL,
    category TEXT,
    value NUMERIC,
    value_text TEXT,
    unit TEXT,
    reference_range_low NUMERIC,
    reference_range_high NUMERIC,
    reference_range_text TEXT,
    interpretation TEXT CHECK (interpretation IN ('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    generic_name TEXT,
    rxnorm_code TEXT,
    ndc_code TEXT,
    dosage TEXT,
    dosage_value NUMERIC,
    dosage_unit TEXT,
    frequency TEXT,
    route TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'on-hold')),
    start_date DATE,
    end_date DATE,
    prescriber TEXT,
    indication TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vital Signs Table
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    measurement_date TIMESTAMPTZ NOT NULL,
    heart_rate NUMERIC,
    systolic_bp NUMERIC,
    diastolic_bp NUMERIC,
    respiratory_rate NUMERIC,
    temperature NUMERIC,
    temperature_unit TEXT DEFAULT 'F',
    oxygen_saturation NUMERIC,
    height NUMERIC,
    height_unit TEXT DEFAULT 'in',
    weight NUMERIC,
    weight_unit TEXT DEFAULT 'lb',
    bmi NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table (For tracking source files)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    document_date DATE,
    provider TEXT,
    facility TEXT,
    category TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis Results Table
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    analysis_date TIMESTAMPTZ DEFAULT NOW(),
    summary TEXT,
    findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    confidence_score NUMERIC,
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_status ON conditions(status);
CREATE INDEX IF NOT EXISTS idx_devices_patient ON devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_timeline_patient ON timeline_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_date ON lab_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_loinc ON lab_results(loinc_code);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_date ON vital_signs(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conditions_updated_at BEFORE UPDATE ON conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - customize based on auth requirements)
CREATE POLICY "Allow all on patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all on conditions" ON conditions FOR ALL USING (true);
CREATE POLICY "Allow all on devices" ON devices FOR ALL USING (true);
CREATE POLICY "Allow all on timeline_events" ON timeline_events FOR ALL USING (true);
CREATE POLICY "Allow all on lab_results" ON lab_results FOR ALL USING (true);
CREATE POLICY "Allow all on medications" ON medications FOR ALL USING (true);
CREATE POLICY "Allow all on vital_signs" ON vital_signs FOR ALL USING (true);
CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all on ai_analyses" ON ai_analyses FOR ALL USING (true);
