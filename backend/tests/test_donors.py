import uuid

def test_get_donors_requires_auth(client):
    response = client.get("/api/donors/")
    assert response.status_code == 401

def test_get_donors_list(client, auth_headers):
    response = client.get("/api/donors/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should contain the seeded donor
    assert any(d["cpf"] == "222.222.222-22" for d in data)

def test_create_donor_valid(client, auth_headers):
    payload = {
        "nome": "Novo Doador",
        "cpf": "333.333.333-33",
        "tipo_sanguineo": "A_POSITIVO",
        "idade": 25,
        "sexo": "Feminino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True,
        "email": "novo@doador.com",
        "telefone": "999999999",
        "endereco": "Rua Nova, 100"
    }
    response = client.post("/api/donors/", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["cpf"] == "333.333.333-33"
    assert data["nome_completo"] == "Novo Doador"
    assert data["tipo_sanguineo"] == "A_POSITIVO"

def test_create_donor_duplicate_cpf(client, auth_headers):
    payload = {
        "nome": "Doador Duplicado",
        "cpf": "222.222.222-22",  # Same CPF as seeded donor
        "tipo_sanguineo": "B_POSITIVO",
        "idade": 35,
        "sexo": "Masculino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True
    }
    response = client.post("/api/donors/", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "CPF já cadastrado" in response.json()["detail"]

def test_update_donor(client, auth_headers):
    # First create a donor to update
    payload = {
        "nome": "Doador Atualizar",
        "cpf": "444.444.444-44",
        "tipo_sanguineo": "AB_POSITIVO",
        "idade": 40,
        "sexo": "Masculino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True
    }
    create_response = client.post("/api/donors/", json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    donor_id = create_response.json()["id_doador"]

    # Update the donor
    update_payload = {
        "nome": "Doador Atualizado",
        "cpf": "444.444.444-44",
        "tipo_sanguineo": "O_NEGATIVO",
        "idade": 41,
        "sexo": "Masculino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True,
        "email": "atualizado@email.com"
    }
    response = client.put(f"/api/donors/{donor_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nome_completo"] == "Doador Atualizado"
    assert data["tipo_sanguineo"] == "O_NEGATIVO"

def test_update_donor_not_found(client, auth_headers):
    fake_id = str(uuid.uuid4())
    payload = {
        "nome": "Teste",
        "cpf": "555.555.555-55",
        "tipo_sanguineo": "A_POSITIVO",
        "idade": 30,
        "sexo": "Masculino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True
    }
    response = client.put(f"/api/donors/{fake_id}", json=payload, headers=auth_headers)
    assert response.status_code == 404

def test_delete_donor(client, auth_headers):
    # First create a donor to delete
    payload = {
        "nome": "Doador Deletar",
        "cpf": "666.666.666-66",
        "tipo_sanguineo": "B_NEGATIVO",
        "idade": 28,
        "sexo": "Feminino",
        "condicao_1": True,
        "condicao_2": True,
        "condicao_3": True
    }
    create_response = client.post("/api/donors/", json=payload, headers=auth_headers)
    assert create_response.status_code == 201
    donor_id = create_response.json()["id_doador"]

    # Delete the donor
    response = client.delete(f"/api/donors/{donor_id}", headers=auth_headers)
    assert response.status_code == 200
    assert "removido com sucesso" in response.json()["message"]

def test_delete_donor_not_found(client, auth_headers):
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/api/donors/{fake_id}", headers=auth_headers)
    assert response.status_code == 404
