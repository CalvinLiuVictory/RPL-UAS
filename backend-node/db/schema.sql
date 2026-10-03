-- ====================================================
-- CampusCare Database Schema (DDL Structure Only)
-- Target: Supabase PostgreSQL (Postgres 15+)
-- Generated non-destructively for production documentation
-- ====================================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name CHARACTER VARYING(255) NOT NULL,
  email CHARACTER VARYING(255) NOT NULL,
  email_verified_at TIMESTAMP WITHOUT TIME ZONE,
  password CHARACTER VARYING(255) NOT NULL,
  role CHARACTER VARYING(255) NOT NULL DEFAULT 'user'::character varying,
  remember_token CHARACTER VARYING(100),
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: gedungs
CREATE TABLE IF NOT EXISTS gedungs (
  id BIGINT NOT NULL DEFAULT nextval('gedungs_id_seq'::regclass),
  kode_gedung CHARACTER VARYING(255) NOT NULL,
  nama_gedung CHARACTER VARYING(255) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: ruangans
CREATE TABLE IF NOT EXISTS ruangans (
  id BIGINT NOT NULL DEFAULT nextval('ruangans_id_seq'::regclass),
  gedung_id BIGINT NOT NULL,
  nama_ruangan CHARACTER VARYING(255) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: perangkats
CREATE TABLE IF NOT EXISTS perangkats (
  id BIGINT NOT NULL DEFAULT nextval('perangkats_id_seq'::regclass),
  ruangan_id BIGINT NOT NULL,
  kode_aset CHARACTER VARYING(255) NOT NULL,
  nama_perangkat CHARACTER VARYING(255) NOT NULL,
  status CHARACTER VARYING(255) NOT NULL DEFAULT 'Bagus'::character varying,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: pengaduans
CREATE TABLE IF NOT EXISTS pengaduans (
  id BIGINT NOT NULL DEFAULT nextval('pengaduans_id_seq'::regclass),
  user_id BIGINT NOT NULL,
  perangkat_id BIGINT NOT NULL,
  deskripsi TEXT NOT NULL,
  status CHARACTER VARYING(255) NOT NULL DEFAULT 'Menunggu'::character varying,
  teknisi_id BIGINT,
  catatan_teknisi TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: maintenances
CREATE TABLE IF NOT EXISTS maintenances (
  id BIGINT NOT NULL DEFAULT nextval('maintenances_id_seq'::regclass),
  perangkat_id BIGINT NOT NULL,
  teknisi_id BIGINT NOT NULL,
  tanggal_jadwal DATE NOT NULL,
  deskripsi_pekerjaan TEXT NOT NULL,
  status CHARACTER VARYING(255) NOT NULL DEFAULT 'Terjadwal'::character varying,
  catatan_hasil TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: personal_access_tokens
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id BIGINT NOT NULL DEFAULT nextval('personal_access_tokens_id_seq'::regclass),
  tokenable_type CHARACTER VARYING(255) NOT NULL,
  tokenable_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  token CHARACTER VARYING(64) NOT NULL,
  abilities TEXT,
  last_used_at TIMESTAMP WITHOUT TIME ZONE,
  expires_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  PRIMARY KEY (id)
);

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  key CHARACTER VARYING(255) NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (key)
);

-- ====================================================
-- Foreign Key Constraints
-- ====================================================

-- maintenances_perangkat_id_foreign
ALTER TABLE maintenances ADD CONSTRAINT maintenances_perangkat_id_foreign FOREIGN KEY (perangkat_id) REFERENCES perangkats(id) ON DELETE CASCADE;

-- maintenances_teknisi_id_foreign
ALTER TABLE maintenances ADD CONSTRAINT maintenances_teknisi_id_foreign FOREIGN KEY (teknisi_id) REFERENCES users(id) ON DELETE CASCADE;

-- pengaduans_perangkat_id_foreign
ALTER TABLE pengaduans ADD CONSTRAINT pengaduans_perangkat_id_foreign FOREIGN KEY (perangkat_id) REFERENCES perangkats(id) ON DELETE CASCADE;

-- pengaduans_teknisi_id_foreign
ALTER TABLE pengaduans ADD CONSTRAINT pengaduans_teknisi_id_foreign FOREIGN KEY (teknisi_id) REFERENCES users(id) ON DELETE CASCADE;

-- pengaduans_user_id_foreign
ALTER TABLE pengaduans ADD CONSTRAINT pengaduans_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- perangkats_ruangan_id_foreign
ALTER TABLE perangkats ADD CONSTRAINT perangkats_ruangan_id_foreign FOREIGN KEY (ruangan_id) REFERENCES ruangans(id) ON DELETE CASCADE;

-- ruangans_gedung_id_foreign
ALTER TABLE ruangans ADD CONSTRAINT ruangans_gedung_id_foreign FOREIGN KEY (gedung_id) REFERENCES gedungs(id) ON DELETE CASCADE;

-- ====================================================
-- Indexes (Including Partial Unique Indexes)
-- ====================================================

CREATE UNIQUE INDEX gedungs_kode_gedung_unique ON public.gedungs USING btree (kode_gedung);
CREATE UNIQUE INDEX idx_pengaduans_active_user_device ON public.pengaduans USING btree (user_id, perangkat_id) WHERE ((status)::text = ANY ((ARRAY['Menunggu'::character varying, 'Diproses'::character varying])::text[]));
CREATE UNIQUE INDEX perangkats_kode_aset_unique ON public.perangkats USING btree (kode_aset);
CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);
CREATE UNIQUE INDEX personal_access_tokens_token_unique ON public.personal_access_tokens USING btree (token);
CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);
CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);
