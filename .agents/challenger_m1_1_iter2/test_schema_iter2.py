import subprocess
import time
import os
import sys

CONTAINER_NAME = "test_postgres_challenger_iter2"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgrespassword"
POSTGRES_DB = "focuserp_test_iter2"

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return result.returncode, result.stdout, result.stderr

def exec_sql(sql_script, user=POSTGRES_USER, dbname=POSTGRES_DB):
    cmd = f'docker exec -i {CONTAINER_NAME} psql -U {user} -d {dbname}'
    proc = subprocess.Popen(cmd, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out_b, err_b = proc.communicate(input=sql_script.encode('utf-8'))
    return proc.returncode, out_b.decode('utf-8', errors='replace'), err_b.decode('utf-8', errors='replace')

def exec_sql_file(file_path):
    run_cmd(f"docker cp {file_path} {CONTAINER_NAME}:/tmp/schema.sql")
    cmd = f"docker exec {CONTAINER_NAME} psql -U {POSTGRES_USER} -d {POSTGRES_DB} -f /tmp/schema.sql"
    return run_cmd(cmd)

def setup_db():
    print("Stopping existing container if any...")
    run_cmd(f"docker stop {CONTAINER_NAME}")
    run_cmd(f"docker rm {CONTAINER_NAME}")
    
    print("Starting Postgres container...")
    code, out, err = run_cmd(
        f"docker run -d --name {CONTAINER_NAME} -e POSTGRES_PASSWORD={POSTGRES_PASSWORD} -e POSTGRES_DB={POSTGRES_DB} -p 5433:5432 postgres:alpine"
    )
    if code != 0:
        print(f"Failed to start docker container: {err}")
        sys.exit(1)
        
    print("Waiting for Postgres to accept connections...")
    for i in range(30):
        time.sleep(1)
        code, out, err = run_cmd(f"docker exec {CONTAINER_NAME} psql -U {POSTGRES_USER} -d {POSTGRES_DB} -c \"SELECT 1;\"")
        if code == 0:
            print("Postgres is accepting SQL connections!")
            break
    else:
        print("Postgres container timed out.")
        sys.exit(1)

    # Setup Supabase mock schema auth and auth.jwt() function
    mock_auth_sql = """
    CREATE SCHEMA IF NOT EXISTS auth;
    
    CREATE TABLE IF NOT EXISTS auth.current_jwt (
        id int primary key default 1,
        claims jsonb
    );
    INSERT INTO auth.current_jwt (id, claims) VALUES (1, NULL) ON CONFLICT (id) DO NOTHING;

    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
      SELECT claims FROM auth.current_jwt WHERE id = 1;
    $$ LANGUAGE sql STABLE SECURITY DEFINER;

    GRANT USAGE ON SCHEMA auth TO PUBLIC;
    GRANT SELECT, UPDATE ON auth.current_jwt TO PUBLIC;
    GRANT EXECUTE ON FUNCTION auth.jwt() TO PUBLIC;
    """
    code, out, err = exec_sql(mock_auth_sql)
    if code != 0:
        print(f"Error setting up mock auth schema: {err}")

def set_mock_jwt(claims_json_or_null):
    if claims_json_or_null is None or claims_json_or_null == "NULL":
        sql = "UPDATE auth.current_jwt SET claims = NULL WHERE id = 1;"
    else:
        sql = f"UPDATE auth.current_jwt SET claims = '{claims_json_or_null}'::jsonb WHERE id = 1;"
    exec_sql(sql)

def run_tests():
    print("\n=== TEST 1: Executing remediated supabase_schema.sql ===")
    code, out, err = exec_sql_file(r"c:\Focuserp\supabase_schema.sql")
    if code == 0 and "ERROR" not in err:
        print("PASS: Remediated schema loaded successfully without SQL syntax errors.")
    else:
        print(f"Schema Execution Results:\nSTDOUT:\n{out}\nSTDERR:\n{err}")

    exec_sql("GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO PUBLIC;")

    print("\n=== TEST 2: Seed Test Data ===")
    test_data_sql = """
    INSERT INTO tenants (id, name, documento) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Tenant Alpha', '11111111000111'),
      ('22222222-2222-2222-2222-222222222222', 'Tenant Beta', '22222222000122');
      
    INSERT INTO users (id, tenant_id, nome, email) VALUES
      ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'User Alpha', 'alpha@test.com'),
      ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'User Beta', 'beta@test.com');

    INSERT INTO clientes (id, tenant_id, codigo, razao_social, nome_fantasia, documento) VALUES
      ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CLI001', 'Alpha Corp', 'Alpha', '11111111000111'),
      ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'CLI002', 'Beta Corp', 'Beta', '22222222000122');

    INSERT INTO cliente_contatos (id, tenant_id, cliente_id, nome) VALUES
      ('cc111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Contato Alpha'),
      ('cc222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Contato Beta');

    INSERT INTO fornecedores (id, tenant_id, codigo, razao_social, nome_fantasia, cnpj) VALUES
      ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'FOR001', 'Supp A', 'Supp A', '11111111000111'),
      ('f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'FOR002', 'Supp B', 'Supp B', '22222222000122');

    INSERT INTO contas_receber (id, tenant_id, cliente_id, numero, descricao, valor_original, data_emissao, data_vencimento) VALUES
      ('da111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'REC001', 'Alpha Rec', 100.00, '2026-01-01', '2026-01-15'),
      ('da222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'REC002', 'Beta Rec', 200.00, '2026-01-01', '2026-01-15');

    INSERT INTO contas_receber_parcelas (id, tenant_id, conta_receber_id, numero, valor, vencimento) VALUES
      ('db111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'da111111-1111-1111-1111-111111111111', 1, 100.00, '2026-01-15'),
      ('db222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'da222222-2222-2222-2222-222222222222', 1, 200.00, '2026-01-15');

    INSERT INTO contas_pagar (id, tenant_id, fornecedor_id, numero, descricao, valor_original, data_emissao, data_vencimento) VALUES
      ('ea111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'PAG001', 'Alpha Pag', 50.00, '2026-01-01', '2026-01-15'),
      ('ea222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', 'PAG002', 'Beta Pag', 75.00, '2026-01-01', '2026-01-15');

    INSERT INTO contas_pagar_parcelas (id, tenant_id, conta_pagar_id, numero, valor, vencimento) VALUES
      ('eb111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ea111111-1111-1111-1111-111111111111', 1, 50.00, '2026-01-15'),
      ('eb222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'ea222222-2222-2222-2222-222222222222', 1, 75.00, '2026-01-15');

    INSERT INTO projetos (id, tenant_id, cliente_id, codigo, nome, tipo) VALUES
      ('fa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'PRJ001', 'Alpha Proj', 'Dev'),
      ('fa222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'PRJ002', 'Beta Proj', 'Dev');

    INSERT INTO audit_logs (id, tenant_id, user_id, acao, modulo) VALUES
      ('aa111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'LOGIN', 'AUTH'),
      ('aa222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'LOGIN', 'AUTH');
    """
    code, out, err = exec_sql(test_data_sql)
    if code == 0 and "ERROR" not in err:
        print("Test data seeded successfully across all 11 tables.")
    else:
        print(f"Error seeding test data:\nOUT: {out}\nERR: {err}")

    # Setup roles
    rls_test_setup = """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon NOLOGIN;
        END IF;
    END $$;
    GRANT USAGE ON SCHEMA public TO authenticated, anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
    """
    exec_sql(rls_test_setup)

    print("\n=== TEST 3: Null JWT / Unauthenticated SELECT Attack across ALL 11 tables ===")
    set_mock_jwt("NULL")
    null_jwt_select = """
    SET ROLE authenticated;
    SELECT 'tenants' as table_name, count(*) FROM tenants
    UNION ALL SELECT 'users', count(*) FROM users
    UNION ALL SELECT 'clientes', count(*) FROM clientes
    UNION ALL SELECT 'cliente_contatos', count(*) FROM cliente_contatos
    UNION ALL SELECT 'fornecedores', count(*) FROM fornecedores
    UNION ALL SELECT 'contas_receber', count(*) FROM contas_receber
    UNION ALL SELECT 'contas_receber_parcelas', count(*) FROM contas_receber_parcelas
    UNION ALL SELECT 'contas_pagar', count(*) FROM contas_pagar
    UNION ALL SELECT 'contas_pagar_parcelas', count(*) FROM contas_pagar_parcelas
    UNION ALL SELECT 'projetos', count(*) FROM projetos
    UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
    """
    code, out, err = exec_sql(null_jwt_select)
    print(f"Result for Null JWT SELECT (Role: authenticated):\n{out}")

    print("\n=== TEST 4: Null JWT / Unauthenticated INSERT Attack ===")
    set_mock_jwt("NULL")
    null_jwt_insert = """
    SET ROLE authenticated;
    INSERT INTO clientes (id, tenant_id, codigo, razao_social, nome_fantasia, documento) 
    VALUES ('c9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'HACK001', 'Hacked', 'Hacked', '99999999000199');
    """
    code, out, err = exec_sql(null_jwt_insert)
    print(f"Result for Null JWT INSERT (Role: authenticated):\nOUT:\n{out}\nERR:\n{err}")

    print("\n=== TEST 5: JWT Missing tenant_id Claim (`{}`) ===")
    set_mock_jwt('{"role": "authenticated"}')
    missing_tenant_id_jwt = """
    SET ROLE authenticated;
    SELECT 'clientes count with empty JWT:' as label, count(*) FROM clientes;
    """
    code, out, err = exec_sql(missing_tenant_id_jwt)
    print(f"Result for Empty JWT (no tenant_id claim):\n{out}")

    print("\n=== TEST 6: Tenant Isolation - Tenant Alpha JWT (`tenant_id = 11111111...`) ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    tenant_alpha_select = """
    SET ROLE authenticated;
    SELECT 'tenants seen by Alpha:' as label, id::text, name FROM tenants;
    SELECT 'users seen by Alpha:' as label, id::text, email FROM users;
    SELECT 'clientes seen by Alpha:' as label, id::text, codigo FROM clientes;
    SELECT 'contas_receber seen by Alpha:' as label, id::text, numero FROM contas_receber;
    SELECT 'projetos seen by Alpha:' as label, id::text, codigo FROM projetos;
    SELECT 'audit_logs seen by Alpha:' as label, id::text, acao FROM audit_logs;
    """
    code, out, err = exec_sql(tenant_alpha_select)
    print(f"Result for Tenant Alpha SELECT:\n{out}")

    print("\n=== TEST 7: Cross-Tenant Data Injection (Tenant Alpha trying to INSERT into Tenant Beta) ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    cross_insert = """
    SET ROLE authenticated;
    INSERT INTO clientes (id, tenant_id, codigo, razao_social, nome_fantasia, documento)
    VALUES ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'CLI003', 'Cross Insert', 'Cross', '33333333000133');
    """
    code, out, err = exec_sql(cross_insert)
    print(f"Result for Cross-Tenant INSERT by Tenant Alpha into Tenant Beta:\nOUT:\n{out}\nERR:\n{err}")

    print("\n=== TEST 8: Cross-Tenant Data Mutation (Tenant Alpha trying to UPDATE Tenant Beta) ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    cross_update = """
    SET ROLE authenticated;
    UPDATE clientes SET razao_social = 'HACKED' WHERE id = 'c2222222-2222-2222-2222-222222222222';
    SELECT id, razao_social FROM clientes WHERE id = 'c2222222-2222-2222-2222-222222222222';
    """
    code, out, err = exec_sql(cross_update)
    print(f"Result for Cross-Tenant UPDATE by Tenant Alpha on Tenant Beta:\n{out}")

    print("\n=== TEST 9: Service Role JWT (`role = service_role`) ===")
    set_mock_jwt('{"role": "service_role"}')
    service_role_select = """
    SET ROLE authenticated;
    SELECT 'tenants seen by Service Role:' as label, count(*) FROM tenants;
    SELECT 'clientes seen by Service Role:' as label, count(*) FROM clientes;
    SELECT 'audit_logs seen by Service Role:' as label, count(*) FROM audit_logs;
    """
    code, out, err = exec_sql(service_role_select)
    print(f"Result for Service Role SELECT:\n{out}")

    print("\n=== TEST 10: Unique Constraint Integrity within Tenant ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    unique_constraint_test = """
    SET ROLE authenticated;
    -- Try inserting duplicate codigo under same tenant:
    INSERT INTO clientes (tenant_id, codigo, razao_social, nome_fantasia, documento) 
    VALUES ('11111111-1111-1111-1111-111111111111', 'CLI001', 'Duplicate Code', 'Dup', '99999999000199');
    """
    code, out, err = exec_sql(unique_constraint_test)
    print(f"Result for Duplicate codigo under same tenant:\nOUT:\n{out}\nERR:\n{err}")

if __name__ == "__main__":
    setup_db()
    run_tests()
