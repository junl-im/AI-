def test_final_export_endpoint_is_retired(client):
    response = client.post(
        "/api/v1/exports",
        json={"output_format": "wav", "segments": []},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Not Found"


def test_final_export_endpoint_is_absent_from_openapi(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/exports" not in response.json()["paths"]
