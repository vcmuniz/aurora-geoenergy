import json


def test_login_success(client, test_db):
    """Teste de login com credenciais válidas"""
    from tests.helpers import create_test_user
    
    create_test_user(test_db, 'teste@example.com', 'senha123')
    
    response = client.post('/auth/login', json={
        'email': 'teste@example.com',
        'password': 'senha123'
    })
    
    assert response.status_code == 200
    data = response.json()
    assert 'data' in data
    assert 'access_token' in data['data']
    assert data['data']['token_type'] == 'bearer'


def test_login_invalid_email(client, test_db):
    """Teste de login com email não encontrado"""
    response = client.post('/auth/login', json={
        'email': 'nonexistent@example.com',
        'password': 'senha123'
    })
    
    assert response.status_code == 404


def test_login_invalid_password(client, test_db):
    """Teste de login com senha incorreta"""
    from tests.helpers import create_test_user
    
    create_test_user(test_db, 'teste@example.com', 'senha123')
    
    response = client.post('/auth/login', json={
        'email': 'teste@example.com',
        'password': 'senhaerrada'
    })
    
    assert response.status_code == 401


def test_get_me_with_token(client, test_db):
    """Teste de /auth/me com token válido"""
    from tests.helpers import create_test_user
    
    create_test_user(test_db, 'teste@example.com', 'senha123')
    
    # Login
    login_response = client.post('/auth/login', json={
        'email': 'teste@example.com',
        'password': 'senha123'
    })
    token = login_response.json()['data']['access_token']
    
    # Get me
    response = client.get(
        '/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = response.json()
    # Response está encapsulada em {success, data, error, requestId}
    assert 'data' in data
    assert data['data']['email'] == 'teste@example.com'
    assert data['data']['name'] == 'Teste User'


def test_get_me_without_token(client):
    """Teste de /auth/me sem token"""
    response = client.get('/auth/me')
    
    assert response.status_code == 401
