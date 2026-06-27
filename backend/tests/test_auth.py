def test_login_valid_credentials(client):
    response = client.post("/api/auth/login", json={"email": "admin@teste.com", "password": "12345678"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "ADMINISTRADOR"
    assert data["name"] == "Admin Teste"

def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"email": "admin@teste.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert "E-mail ou senha incorretos" in response.json()["detail"]

def test_login_nonexistent_email(client):
    response = client.post("/api/auth/login", json={"email": "naoexiste@teste.com", "password": "12345678"})
    assert response.status_code == 401
    assert "E-mail ou senha incorretos" in response.json()["detail"]
