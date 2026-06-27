def test_get_employees_requires_auth(client):
    response = client.get("/api/employees/")
    assert response.status_code == 401

def test_get_employees_list(client, auth_headers):
    response = client.get("/api/employees/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should contain seeded users
    assert any(e["email"] == "admin@teste.com" for e in data)
    assert any(e["email"] == "atendente@teste.com" for e in data)

def test_create_employee(client, auth_headers):
    payload = {
        "name": "Novo Funcionario",
        "email": "novo@funcionario.com",
        "password": "senha123",
        "cpf": "777.777.777-77",
        "cargo": "Enfermeiro",
        "pis": "12345678901",
        "telefone": "988888888"
    }
    response = client.post("/api/employees/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "novo@funcionario.com"
    assert data["cargo"] == "Enfermeiro"
    assert "id_usuario" in data
    # Password should not be in response
    assert "password" not in data
    assert "senha_hash" not in data

def test_create_employee_duplicate_cpf(client, auth_headers):
    payload = {
        "name": "Funcionario Duplicado",
        "email": "dup@funcionario.com",
        "password": "senha123",
        "cpf": "000.000.000-00",  # Same CPF as admin
        "cargo": "Recepcionista"
    }
    response = client.post("/api/employees/", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "CPF já cadastrado" in response.json()["detail"]
