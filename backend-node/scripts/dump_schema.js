import db from '../src/db.js';
import fs from 'fs';
import path from 'path';

async function dumpSchema() {
  const tables = [
    'users',
    'gedungs',
    'ruangans',
    'perangkats',
    'pengaduans',
    'maintenances',
    'personal_access_tokens',
    'login_attempts'
  ];

  let sql = '-- ====================================================\n';
  sql += '-- CampusCare Database Schema (DDL Structure Only)\n';
  sql += '-- Target: Supabase PostgreSQL (Postgres 15+)\n';
  sql += '-- Generated non-destructively for production documentation\n';
  sql += '-- ====================================================\n\n';

  for (const t of tables) {
    const cols = await db.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [t]
    );

    const pkQuery = await db.query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = 'public'
         AND tc.table_name = $1`,
      [t]
    );
    const pkCols = pkQuery.rows.map(r => r.column_name);

    sql += `-- Table: ${t}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${t} (\n`;
    const colDefs = cols.rows.map(c => {
      let type = c.data_type.toUpperCase();
      if (c.character_maximum_length) {
        type += `(${c.character_maximum_length})`;
      }
      let def = `  ${c.column_name} ${type}`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      return def;
    });

    if (pkCols.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
    }

    sql += colDefs.join(',\n') + '\n);\n\n';
  }

  // Foreign keys
  const fkQuery = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ANY($1)
    ORDER BY tc.table_name
  `, [tables]);

  if (fkQuery.rows.length > 0) {
    sql += '-- ====================================================\n';
    sql += '-- Foreign Key Constraints\n';
    sql += '-- ====================================================\n\n';
    for (const fk of fkQuery.rows) {
      sql += `-- ${fk.constraint_name}\n`;
      sql += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name}) ON DELETE CASCADE;\n\n`;
    }
  }

  // Indexes
  const idx = await db.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = ANY($1)
    ORDER BY tablename, indexname
  `, [tables]);

  sql += '-- ====================================================\n';
  sql += '-- Indexes (Including Partial Unique Indexes)\n';
  sql += '-- ====================================================\n\n';
  for (const row of idx.rows) {
    if (!row.indexname.endsWith('_pkey')) {
      sql += `${row.indexdef};\n`;
    }
  }

  const outDir = path.resolve('db');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'schema.sql');
  fs.writeFileSync(outFile, sql, 'utf8');

  console.log(`Schema successfully written to ${outFile} (${sql.length} bytes)`);

  // Also create db/README.md
  const readmeContent = `# CampusCare Database Schema Documentation

Berkas ini mendokumentasikan arsitektur dan struktur skema tabel Supabase PostgreSQL yang digunakan oleh CampusCare Node.js Express backend.

## 📋 Daftar Tabel Utama

1. **\`users\`**: Menyimpan data akun pengguna dan peran (\`admin\`, \`teknisi\`, \`user\`).
2. **\`gedungs\`**: Master data gedung kampus (mis. Gedung Rektorat, Gedung Lab Komputer).
3. **\`ruangans\`**: Master data ruangan terkait gedung (\`gedung_id\`).
4. **\`perangkats\`**: Master data perangkat/inventaris di dalam ruangan (\`ruangan_id\`) beserta status (\`Bagus\`, \`Rusak\`, \`Maintenance\`).
5. **\`pengaduans\`**: Tiket pengaduan kerusakan fasilitas dari pengguna (\`user_id\`), ditugaskan ke teknisi (\`teknisi_id\`), dengan status (\`Menunggu\`, \`Diproses\`, \`Selesai\`).
6. **\`maintenances\`**: Jadwal dan log pemeliharaan preventif/rutin oleh teknisi.
7. **\`personal_access_tokens\`**: Token autentikasi berbasis SHA-256 yang kompatibel dengan format Sanctum (\`id|plaintext\`) dengan masa aktif dinamis (\`expires_at\`).
8. **\`login_attempts\`**: Tabel pembatas laju (rate limiting) atomik multi-kunci berbasis PostgreSQL (\`INSERT ... ON CONFLICT DO UPDATE\`).

## 🛡️ Indeks Unik Parsial (Race Condition Guard)
Untuk mencegah duplikasi tiket saat pengguna menekan tombol kirim secara serentak, dibuat indeks parsial:
\`\`\`sql
CREATE UNIQUE INDEX idx_pengaduans_active_user_device 
ON pengaduans(user_id, perangkat_id) 
WHERE status IN ('Menunggu', 'Diproses');
\`\`\`

## 🔄 Pemulihan Skema
Skema lengkap tanpa data dapat dipelajari atau diimpor ulang melalui berkas [schema.sql](./schema.sql).
`;

  fs.writeFileSync(path.join(outDir, 'README.md'), readmeContent, 'utf8');
  console.log('Created db/README.md');

  process.exit(0);
}

dumpSchema().catch(err => {
  console.error('Failed to dump schema:', err);
  process.exit(1);
});
