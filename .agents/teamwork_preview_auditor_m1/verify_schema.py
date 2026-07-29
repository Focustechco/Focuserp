import sys
import re

# Ensure stdout uses UTF-8
sys.stdout.reconfigure(encoding='utf-8')

sql_path = r"c:\Focuserp\supabase_schema.sql"

with open(sql_path, "r", encoding="utf-8") as f:
    content = f.read()

print(f"Total lines: {len(content.splitlines())}")
print(f"Total size: {len(content)} bytes")

# Extract CREATE TABLE statements
create_tables = re.findall(r"CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\((.*?)\);", content, re.DOTALL | re.IGNORECASE)
print(f"\nFound {len(create_tables)} CREATE TABLE statements:")
tables = []
for name, body in create_tables:
    tables.append(name)
    has_tenant_id = "tenant_id" in body or name == "tenants"
    has_pk = "PRIMARY KEY" in body
    has_fk = "REFERENCES" in body
    has_generated = "GENERATED ALWAYS AS" in body
    print(f"  - Table '{name}': tenant_scoped={has_tenant_id}, PK={has_pk}, FK={has_fk}, Generated={has_generated}")

# Extract CREATE INDEX statements
indexes = re.findall(r"CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+(\w+)", content, re.IGNORECASE)
print(f"\nFound {len(indexes)} CREATE INDEX statements:")
for idx, tbl in indexes:
    print(f"  - Index '{idx}' on table '{tbl}'")

# Extract RLS status
rls_enabled = re.findall(r"ALTER TABLE\s+(\w+)\s+ENABLE ROW LEVEL SECURITY", content, re.IGNORECASE)
print(f"\nRLS Enabled on {len(rls_enabled)} tables: {rls_enabled}")

# Check RLS policy conditions
policies = re.findall(r"CREATE POLICY\s+(\w+)\s+ON\s+(\w+).*?USING\s*\((.*?)\)", content, re.DOTALL | re.IGNORECASE)
print(f"\nFound {len(policies)} explicit policy definitions:")
for pol, tbl, cond in policies:
    print(f"  - Policy '{pol}' on '{tbl}'")
    if "auth.jwt() IS NULL" in cond:
        print(f"    [WARNING] Policy '{pol}' contains 'auth.jwt() IS NULL' bypass!")

# Check PL/pgSQL macro block for RLS
macro_match = re.search(r"DO \$\$.*?END \$\$;", content, re.DOTALL)
if macro_match:
    macro_text = macro_match.group(0)
    print("\nFound dynamic PL/pgSQL block for bulk RLS policy creation:")
    if "auth.jwt() IS NULL" in macro_text:
        print("  [WARNING] PL/pgSQL macro block includes 'auth.jwt() IS NULL' bypass for ALL tenant tables!")

# Check for prohibited patterns (mock data, hardcoded results, facades)
has_insert = bool(re.search(r"INSERT INTO", content, re.IGNORECASE))
print(f"\nHardcoded mock data (INSERT INTO) present: {has_insert}")
