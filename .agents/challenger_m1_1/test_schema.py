import subprocess
import time
import os
import sys

CONTAINER_NAME = "test_postgres_challenger"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgrespassword"
POSTGRES_DB = "focuserp_test"

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
        f"docker run -d --name {CONTAINER_NAME} -e POSTGRES_PASSWORD={POSTGRES_PASSWORD} -e POSTGRES_DB={POSTGRES_DB} -p 5432:5432 postgres:alpine"
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

    # Setup Supabase mock schema auth and auth.jwt() and session settings table/func
    mock_auth_sql = """
    CREATE SCHEMA IF NOT EXISTS auth;
    
    -- Table or settings to hold mock jwt per session
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
    print("\n=== TEST 1: Executing supabase_schema.sql ===")
    code, out, err = exec_sql_file(r"c:\Focuserp\supabase_schema.sql")
    if code == 0 and "ERROR" not in err:
        print("PASS: Schema loaded successfully without SQL syntax errors.")
    else:
        print(f"Schema Execution Results:\nSTDOUT:\n{out}\nSTDERR:\n{err}")

    # Ensure get_auth_tenant_id function has grant
    exec_sql("GRANT EXECUTE ON FUNCTION get_auth_tenant_id() TO PUBLIC;")

    print("\n=== TEST 2: Seed Test Data ===")
    test_data_sql = """
    INSERT INTO tenants (id, name) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Tenant Alpha'),
      ('22222222-2222-2222-2222-222222222222', 'Tenant Beta');
      
    INSERT INTO users (id, tenant_id, nome, email) VALUES
      ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'User Alpha', 'alpha@test.com'),
      ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'User Beta', 'beta@test.com');

    INSERT INTO clientes (id, tenant_id, codigo, razao_social, nome_fantasia, documento) VALUES
      ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CLI001', 'Alpha Corp', 'Alpha', '11111111000111'),
      ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'CLI002', 'Beta Corp', 'Beta', '22222222000122');
    """
    code, out, err = exec_sql(test_data_sql)
    if code == 0 and "ERROR" not in err:
        print("Test data seeded successfully.")
    else:
        print(f"Error seeding test data:\nOUT: {out}\nERR: {err}")

    # Create app role authenticated & anon
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

    print("\n=== TEST 3: RLS Policy Evaluation for auth.jwt() IS NULL (Unauthenticated / Anonymous) ===")
    set_mock_jwt("NULL")
    rls_null_jwt_query = """
    SET ROLE authenticated;
    SELECT 'clientes count:' as label, count(*) FROM clientes
    UNION ALL
    SELECT 'users count:', count(*) FROM users
    UNION ALL
    SELECT 'tenants count:', count(*) FROM tenants;
    """
    code, out, err = exec_sql(rls_null_jwt_query)
    print(f"Result for auth.jwt() IS NULL (unauthenticated caller):\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 4: Tenant Isolation & Cross-Tenant Data Access (Tenant Alpha JWT) ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    jwt_alpha = """
    SET ROLE authenticated;
    SELECT 'users seen by Tenant Alpha:' as label, id::text, nome FROM users;
    SELECT 'clientes seen by Tenant Alpha:' as label, id::text, razao_social FROM clientes;
    """
    code, out, err = exec_sql(jwt_alpha)
    print(f"Result for Tenant Alpha querying data:\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 5: Cross-Tenant Data Injection Attack (INSERT with spoofed tenant_id) ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    jwt_cross_insert = """
    SET ROLE authenticated;
    -- Tenant Alpha tries to insert a client record into Tenant Beta's tenant_id:
    INSERT INTO clientes (id, tenant_id, codigo, razao_social, nome_fantasia, documento) 
    VALUES ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'CLI003', 'Spoofed Corp', 'Spoofed', '33333333000133');
    SELECT tenant_id, codigo, razao_social FROM clientes WHERE id = 'c3333333-3333-3333-3333-333333333333';
    """
    code, out, err = exec_sql(jwt_cross_insert)
    print(f"Result for Cross-tenant INSERT by Tenant Alpha into Tenant Beta:\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 6: Table Mutation on `tenants` table by regular app user ===")
    set_mock_jwt('{"tenant_id": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}')
    tenants_write_test = """
    SET ROLE authenticated;
    INSERT INTO tenants (id, name) VALUES ('99999999-9999-9999-9999-999999999999', 'Hacked Tenant');
    UPDATE tenants SET name = 'Hacked Alpha' WHERE id = '11111111-1111-1111-1111-111111111111';
    DELETE FROM tenants WHERE id = '22222222-2222-2222-2222-222222222222';
    SELECT id, name FROM tenants;
    """
    code, out, err = exec_sql(tenants_write_test)
    print(f"Result for Write/Mutation operations on `tenants` table:\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 7: Type Constraints, Business Rules & Input Validation Stress Test ===")
    constraint_test_sql = """
    -- Test 7.1: Invalid enum/status strings and negative monetary values in contas_receber
    INSERT INTO contas_receber (
        tenant_id, numero, descricao, valor_original, valor_recebido, status, data_emissao, data_vencimento
    ) VALUES (
        '11111111-1111-1111-1111-111111111111', 'REC-001', 'Test Negative', -500.00, -200.00, 'INVALID_STATUS_STRING', '2026-01-01', '2026-01-10'
    );
    SELECT id, valor_original, valor_recebido, saldo, status FROM contas_receber WHERE numero = 'REC-001';

    -- Test 7.2: Invalid progress and negative numbers in projetos
    INSERT INTO projetos (
        tenant_id, codigo, nome, tipo, valor_contratado, valor_recebido, progresso_global, horas_planejadas, horas_realizadas
    ) VALUES (
        '11111111-1111-1111-1111-111111111111', 'PRJ-001', 'Invalid Project', 'Consultoria', -1000.00, 5000.00, 999.99, -50.00, -10.00
    );
    SELECT id, valor_contratado, valor_recebido, saldo_restante, progresso_global FROM projetos WHERE codigo = 'PRJ-001';

    -- Test 7.3: Invalid user status and email format
    INSERT INTO users (
        tenant_id, nome, email, status, perfil, tentativas_falhas
    ) VALUES (
        '11111111-1111-1111-1111-111111111111', 'Bad User', 'not-an-email', 'HACKED_STATUS', 'SuperAdmin', -99
    );
    SELECT id, email, status, perfil, tentativas_falhas FROM users WHERE nome = 'Bad User';
    """
    code, out, err = exec_sql(constraint_test_sql)
    print(f"Result for Type & Constraint Stress Test:\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 8: Foreign Key Referential & Multi-Tenant Integrity Stress Test ===")
    cross_tenant_fk_sql = """
    -- Test 8.1: Child table conta_receber_parcelas referring to a conta_receber in a DIFFERENT tenant
    INSERT INTO contas_receber (
        id, tenant_id, numero, descricao, valor_original, data_emissao, data_vencimento
    ) VALUES (
        '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'REC-ALPHA-1', 'Alpha Bill', 1000.00, '2026-01-01', '2026-01-10'
    );
    
    INSERT INTO contas_receber (
        id, tenant_id, numero, descricao, valor_original, data_emissao, data_vencimento
    ) VALUES (
        '99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'REC-BETA-1', 'Beta Bill', 1000.00, '2026-01-01', '2026-01-10'
    );

    -- Cross-tenant FK vulnerability test: Parcel for Tenant Alpha references Beta's Conta Receber
    INSERT INTO contas_receber_parcelas (
        id, tenant_id, conta_receber_id, numero, valor, vencimento
    ) VALUES (
        '77777777-7777-7777-7777-777777777777', 
        '11111111-1111-1111-1111-111111111111', -- Tenant Alpha
        '99999999-9999-9999-9999-999999999999', -- Conta Receber from Tenant Beta!
        1, 500.00, '2026-02-01'
    );
    SELECT id, tenant_id, conta_receber_id FROM contas_receber_parcelas WHERE id = '77777777-7777-7777-7777-777777777777';

    -- Test 8.2: Projeto for Tenant Alpha references Cliente from Tenant Beta!
    INSERT INTO projetos (
        id, tenant_id, cliente_id, codigo, nome, tipo
    ) VALUES (
        '66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111', -- Tenant Alpha
        'c2222222-2222-2222-2222-222222222222', -- Cliente belonging to Tenant Beta!
        'PRJ-CROSS', 'Cross Tenant Project', 'Desenvolvimento'
    );
    SELECT id, tenant_id, cliente_id FROM projetos WHERE id = '66666666-6666-6666-6666-666666666666';
    """
    code, out, err = exec_sql(cross_tenant_fk_sql)
    print(f"Result for Cross-Tenant FK Integrity Test:\nOut:\n{out}\nErr:\n{err}")

    print("\n=== TEST 9: Duplicate Codes within same Tenant vs across Tenants ===")
    dup_code_sql = """
    -- Two clientes with SAME code in SAME tenant:
    INSERT INTO clientes (tenant_id, codigo, razao_social, nome_fantasia, documento) VALUES
    ('11111111-1111-1111-1111-111111111111', 'DUP001', 'Company A', 'A', '11111111000111'),
    ('11111111-1111-1111-1111-111111111111', 'DUP001', 'Company B', 'B', '22222222000222');
    SELECT tenant_id, codigo, razao_social FROM clientes WHERE codigo = 'DUP001';
    """
    code, out, err = exec_sql(dup_code_sql)
    print(f"Result for Unique Code Constraint within Tenant:\nOut:\n{out}\nErr:\n{err}")

if __name__ == "__main__":
    setup_db()
    run_tests()
