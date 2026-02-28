def test_accounts_crud(client):
    create_resp = client.post(
        "/api/v1/accounts",
        json={
            "company_name": "CRUD Semicon Inc",
            "segment": "wafer_fab",
            "region": "TW",
            "website": "https://crud-semicon.example",
            "source": "test",
            "priority_tier": "T2",
        },
    )
    assert create_resp.status_code == 200
    account = create_resp.json()
    account_id = account["id"]
    assert account["segment"] == "WAFER_FAB"

    list_resp = client.get("/api/v1/accounts")
    assert list_resp.status_code == 200
    assert any(item["id"] == account_id for item in list_resp.json()["items"])

    get_resp = client.get(f"/api/v1/accounts/{account_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["company_name"] == "CRUD Semicon Inc"

    patch_resp = client.patch(f"/api/v1/accounts/{account_id}", json={"priority_tier": "T1"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["priority_tier"] == "T1"

    delete_resp = client.delete(f"/api/v1/accounts/{account_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"


def test_contacts_crud(client):
    account_resp = client.post(
        "/api/v1/accounts",
        json={"company_name": "Contact Host Co", "segment": "PACKAGING_TEST", "priority_tier": "T3"},
    )
    account_id = account_resp.json()["id"]

    create_resp = client.post(
        "/api/v1/contacts",
        json={
            "account_id": account_id,
            "full_name": "NPI Manager",
            "role_title": "NPI Manager",
            "channel_email": "npi@host.example",
            "contactability_score": 77,
        },
    )
    assert create_resp.status_code == 200
    contact_id = create_resp.json()["id"]
    assert create_resp.json()["account_id"] == account_id

    list_resp = client.get(f"/api/v1/contacts?account_id={account_id}")
    assert list_resp.status_code == 200
    assert any(item["id"] == contact_id for item in list_resp.json()["items"])

    get_resp = client.get(f"/api/v1/contacts/{contact_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["full_name"] == "NPI Manager"

    patch_resp = client.patch(f"/api/v1/contacts/{contact_id}", json={"contactability_score": 85})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["contactability_score"] == 85

    delete_resp = client.delete(f"/api/v1/contacts/{contact_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"


def test_account_delete_conflict_when_contacts_exist(client):
    account_resp = client.post(
        "/api/v1/accounts",
        json={"company_name": "Conflict Co", "segment": "FACTORY_AUTOMATION", "priority_tier": "T2"},
    )
    account_id = account_resp.json()["id"]
    client.post(
        "/api/v1/contacts",
        json={"account_id": account_id, "full_name": "RD Owner", "role_title": "RD Director"},
    )

    delete_resp = client.delete(f"/api/v1/accounts/{account_id}")
    assert delete_resp.status_code == 409
    assert "Delete contacts first" in delete_resp.json()["detail"]


def test_accounts_import_api(client):
    response = client.post(
        "/api/v1/accounts/import",
        json={
            "items": [
                {
                    "company_name": "Import Co A",
                    "segment": "WAFER_FAB",
                    "region": "TW",
                    "priority_tier": "T1",
                },
                {
                    "company_name": "Import Co B",
                    "segment": "PACKAGING_TEST",
                    "region": "US",
                    "priority_tier": "T2",
                },
            ]
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["inserted"] == 2
    assert payload["updated"] == 0

    # upsert behavior
    response_update = client.post(
        "/api/v1/accounts/import",
        json={"items": [{"company_name": "Import Co A", "segment": "CAMERA", "priority_tier": "T3"}]},
    )
    assert response_update.status_code == 200
    payload_update = response_update.json()
    assert payload_update["updated"] == 1
