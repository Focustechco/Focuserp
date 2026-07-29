import subprocess
import time
import os
import sys

CONTAINER_NAME = "test_postgres_challenger_iter2"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgrespassword"
POSTGRES_DB = "focuserp_test_iter2"

def exec_sql(sql_script, user=POSTGRES_USER, dbname=POSTGRES_DB):
    cmd = f'docker exec -i {CONTAINER_NAME} psql -U {user} -d {dbname}'
    proc = subprocess.Popen(cmd, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out_b, err_b = proc.communicate(input=sql_script.encode('utf-8'))
    return proc.returncode, out_b.decode('utf-8', errors='replace'), err_b.decode('utf-8', errors='replace')

def set_mock_jwt(claims_json_or_null):
    if claims_json_or_null is None or claims_json_or_null == "NULL":
        sql = "UPDATE auth.current_jwt SET claims = NULL WHERE id = 1;"
    else:
        sql = f"UPDATE auth.current_jwt SET claims = '{claims_json_or_null}'::jsonb WHERE id = 1;"
    exec_sql(sql)

def test_edge_cases():
    print("\n=== EDGE CASE 1: Malformed UUID in tenant_id claim ('invalid-uuid') ===")
    set_mock_jwt('{"tenant_id": "invalid-uuid", "role": "authenticated"}')
    sql1 = """
    SET ROLE authenticated;
    SELECT count(*) FROM clientes;
    """
    code, out, err = exec_sql(sql1)
    print(f"Result for malformed UUID claim:\nOUT:\n{out}\nERR:\n{err}")

    print("\n=== EDGE CASE 2: Empty string tenant_id claim ('') ===")
    set_mock_jwt('{"tenant_id": "", "role": "authenticated"}')
    sql2 = """
    SET ROLE authenticated;
    SELECT count(*) FROM clientes;
    """
    code, out, err = exec_sql(sql2)
    print(f"Result for empty string claim:\nOUT:\n{out}\nERR:\n{err}")

    print("\n=== EDGE CASE 3: Role spoofing in JWT ('role': 'service_role' without valid tenant_id) ===")
    set_mock_jwt('{"role": "service_role"}')
    sql3 = """
    SET ROLE authenticated;
    SELECT count(*) FROM clientes;
    """
    code, out, err = exec_sql(sql3)
    print(f"Result for service_role claim:\nOUT:\n{out}\nERR:\n{err}")

    print("\n=== EDGE CASE 4: Role spoofing attempt ('role': 'admin') ===")
    set_mock_jwt('{"role": "admin", "tenant_id": "11111111-1111-1111-1111-111111111111"}')
    sql4 = """
    SET ROLE authenticated;
    SELECT count(*) FROM clientes;
    """
    code, out, err = exec_sql(sql4)
    print(f"Result for role=admin claim:\nOUT:\n{out}\nERR:\n{err}")

if __name__ == "__main__":
    test_edge_cases()
