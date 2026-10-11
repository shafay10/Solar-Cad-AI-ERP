CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SURVEY_ENGINEER', 'DESIGN_ENGINEER', 'SALES_MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_category AS ENUM ('ROOF_SURFACE', 'ELECTRICAL_PANEL', 'CABLE_ROUTE', 'INVERTER_LOCATION', 'TRANSFORMER', 'OBSTRUCTIONS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_cnic VARCHAR(30),
    site_address TEXT NOT NULL,
    sub_division VARCHAR(150),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    system_capacity_kw NUMERIC(10, 2) DEFAULT 0,
    contract_price_pkr NUMERIC(14, 2) DEFAULT 0,
    estimated_cost_pkr NUMERIC(14, 2) DEFAULT 0,
    net_profit_pkr NUMERIC(14, 2) DEFAULT 0,
    deal_close_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    target_delivery_date TIMESTAMP WITH TIME ZONE,
    project_details TEXT,
    status VARCHAR(50) DEFAULT 'ONBOARDED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    surveyor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    roof_pitch_deg NUMERIC(5, 2) DEFAULT 0,
    azimuth_deg NUMERIC(5, 2) DEFAULT 180,
    polygon_area_sqft NUMERIC(12, 2) DEFAULT 0,
    polygon_area_sqm NUMERIC(12, 2) DEFAULT 0,
    polygon_geojson JSONB,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES field_surveys(id) ON DELETE CASCADE,
    category media_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cad_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    module_model VARCHAR(150) NOT NULL,
    module_wattage NUMERIC(8, 2) NOT NULL,
    panels_per_string INT NOT NULL,
    total_strings INT NOT NULL,
    total_modules INT NOT NULL,
    system_dc_kw NUMERIC(10, 2) NOT NULL,
    inverter_model VARCHAR(150) NOT NULL,
    winter_voc_v NUMERIC(8, 2) NOT NULL,
    summer_vmp_v NUMERIC(8, 2) NOT NULL,
    is_mppt_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    boq_level VARCHAR(5) DEFAULT 'L2',
    total_system_kw NUMERIC(10, 2) NOT NULL,
    equipment_cost NUMERIC(12, 2) NOT NULL,
    bos_cost NUMERIC(12, 2) NOT NULL,
    install_cost NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    final_price NUMERIC(12, 2) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    annual_generation_kwh NUMERIC(12, 2) NOT NULL,
    first_year_savings NUMERIC(12, 2) NOT NULL,
    payback_years NUMERIC(5, 2) NOT NULL,
    payback_months INT NOT NULL,
    npv_25yr NUMERIC(14, 2) NOT NULL,
    irr_pct NUMERIC(5, 2) NOT NULL,
    lcoe_per_kwh NUMERIC(8, 4) NOT NULL,
    annual_co2_tons NUMERIC(10, 2) NOT NULL,
    trees_planted INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
