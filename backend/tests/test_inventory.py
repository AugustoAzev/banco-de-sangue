def test_get_bolsas_requires_auth(client):
    response = client.get("/api/inventory/bolsas")
    assert response.status_code == 401

def test_get_bolsas_empty(client, auth_headers):
    response = client.get("/api/inventory/bolsas", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_post_bolsas(client, auth_headers):
    payload = {
        "tipo_sangue": "O_POSITIVO",
        "quantidade": 3
    }
    response = client.post("/api/inventory/bolsas", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "3 bolsas registradas com sucesso" in data["message"]

def test_get_insumos_requires_auth(client):
    response = client.get("/api/inventory/insumos")
    assert response.status_code == 401

def test_get_insumos_empty(client, auth_headers):
    response = client.get("/api/inventory/insumos", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_post_insumos(client, auth_headers):
    payload = {
        "nome": "Luva Descartavel",
        "quantidade": 100
    }
    response = client.post("/api/inventory/insumos", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "Luva Descartavel"
    assert data["quantidade"] == 100
    assert "id" in data

def test_put_insumos(client, auth_headers):
    # First create an insumo
    create_payload = {"nome": "Algodao", "quantidade": 50}
    create_response = client.post("/api/inventory/insumos", json=create_payload, headers=auth_headers)
    assert create_response.status_code == 201
    insumo_id = create_response.json()["id"]

    # Update the insumo
    update_payload = {"nome": "Algodao Premium", "quantidade": 75}
    response = client.put(f"/api/inventory/insumos/{insumo_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Algodao Premium"
    assert data["quantidade"] == 75

def test_put_insumos_not_found(client, auth_headers):
    payload = {"nome": "Teste", "quantidade": 10}
    response = client.put("/api/inventory/insumos/99999", json=payload, headers=auth_headers)
    assert response.status_code == 404

def test_delete_insumos(client, auth_headers):
    # First create an insumo to delete
    create_payload = {"nome": "Gaze", "quantidade": 200}
    create_response = client.post("/api/inventory/insumos", json=create_payload, headers=auth_headers)
    assert create_response.status_code == 201
    insumo_id = create_response.json()["id"]

    # Delete the insumo
    response = client.delete(f"/api/inventory/insumos/{insumo_id}", headers=auth_headers)
    assert response.status_code == 200
    assert "removido" in response.json()["message"]

def test_delete_insumos_not_found(client, auth_headers):
    response = client.delete("/api/inventory/insumos/99999", headers=auth_headers)
    assert response.status_code == 404
