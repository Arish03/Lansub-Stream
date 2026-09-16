import asyncio
import json
import uuid
import httpx
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws"

async def run_tests():
    print("\n--- [1] Health Check ---")
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        resp = await client.get("/v1/health")
        print(f"Health status: {resp.status_code}, body: {resp.json()}")
        assert resp.status_code == 200

        print("\n--- [2] Register User ---")
        test_email = f"operator_{uuid.uuid4().hex[:6]}@lansub.com"
        reg_resp = await client.post("/v1/auth/register", json={
            "email": test_email,
            "password": "securepassword123"
        })
        print(f"Register: {reg_resp.status_code}, user_id: {reg_resp.json().get('id')}")
        assert reg_resp.status_code == 200

        print("\n--- [3] Login User ---")
        login_resp = await client.post(
            "/v1/auth/login",
            data={"username": test_email, "password": "securepassword123"}
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Login OK, token prefix: {token[:20]}...")

        print("\n--- [4] Create Device ---")
        dev_resp = await client.post(
            "/v1/devices",
            headers=headers,
            json={"name": "CNC Vibration & Temp Sensor", "template": "generic-sensor"}
        )
        assert dev_resp.status_code == 200
        device = dev_resp.json()
        dev_id = device["id"]
        dev_key = device["device_key"]
        print(f"Device created: ID={dev_id}, Key={dev_key}, MQTT_User={device['mqtt_username']}")

        print("\n--- [5] Connect WebSocket to listen for live readings ---")
        async with websockets.connect(WS_URL) as ws:
            welcome = await ws.recv()
            print(f"WebSocket received: {welcome}")

            print("\n--- [6] Ingest Telemetry ---")
            telemetry_data = {
                "device_key": dev_key,
                "payload": {
                    "temperature": 48.6,
                    "humidity": 52.1,
                    "vibration": 0.045,
                    "battery": 94
                }
            }
            t_resp = await client.post("/v1/telemetry", json=telemetry_data)
            assert t_resp.status_code == 200
            print(f"Telemetry ingested: {t_resp.json()}")

            # Listen for broadcast on WebSocket
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            print(f"WebSocket live broadcast received: {msg}")
            ws_data = json.loads(msg)
            assert ws_data["device_key"] == dev_key
            assert ws_data["data"]["payload"]["temperature"] == 48.6

        print("\n--- [7] Query Historical Telemetry (Indexed) ---")
        hist_resp = await client.get(f"/v1/devices/{dev_id}/telemetry?limit=5", headers=headers)
        assert hist_resp.status_code == 200
        records = hist_resp.json()
        print(f"Found {len(records)} telemetry records in DB. Latest: {records[0]['payload']}")

    print("\n[OK] ALL END-TO-END TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
