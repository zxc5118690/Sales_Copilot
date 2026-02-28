def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "timestamp" in payload
    assert response.headers.get("X-Request-ID")


def test_error_payload_contains_code_and_request_id(client):
    response = client.get("/api/v1/accounts/99999")
    assert response.status_code == 404
    payload = response.json()
    assert payload["error"]["code"] == "HTTP_404"
    assert payload["request_id"]
    assert response.headers.get("X-Request-ID")
