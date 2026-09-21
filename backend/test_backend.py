
import asyncio
import json
import uuid
import httpx
import websockets


BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws"


async def run_tests():

    print("\n--- [1] Health Check ---")

    async with httpx.AsyncClient(
        base_url=BASE_URL,
        timeout=30.0
    ) as client:

        # -------------------------------
        # 1. Health Check
        # -------------------------------

        resp = await client.get("/v1/health")

        print(
            f"Health status: {resp.status_code}, "
            f"body: {resp.text}"
        )

        assert resp.status_code == 200

        # -------------------------------
        # 2. Register User
        # -------------------------------

        print("\n--- [2] Register User ---")

        test_email = (
            f"operator_{uuid.uuid4().hex[:6]}@lansub.com"
        )

        reg_resp = await client.post(
            "/v1/auth/register",
            json={
                "email": test_email,
                "password": "securepassword123"
            }
        )

        print("Register status:", reg_resp.status_code)
        print("Register response:", reg_resp.text)

        if reg_resp.status_code != 200:
            print("Registration failed. Stopping test.")
            return

        print("Registration successful!")

        # -------------------------------
        # 3. Login User
        # -------------------------------

        print("\n--- [3] Login User ---")

        login_resp = await client.post(
            "/v1/auth/login",
            data={
                "username": test_email,
                "password": "securepassword123"
            }
        )

        print("Login status:", login_resp.status_code)
        print("Login response:", login_resp.text)

        assert login_resp.status_code == 200

        token = login_resp.json()["access_token"]

        headers = {
            "Authorization": f"Bearer {token}"
        }

        print(
            f"Login OK, token prefix: "
            f"{token[:20]}..."
        )

        # -------------------------------
        # 4. Create Device
        # -------------------------------

        print("\n--- [4] Create Device ---")

        dev_resp = await client.post(
            "/v1/devices",
            headers=headers,
            json={
                "name": "CNC Vibration & Temp Sensor",
                "template": "generic-sensor"
            }
        )

        # Print the actual response for debugging
        print("Device status:", dev_resp.status_code)
        print("Device response:", dev_resp.text)

        # Accept the expected success status
        assert dev_resp.status_code in (200, 201), (
            f"Device creation failed: "
            f"{dev_resp.status_code} - {dev_resp.text}"
        )

        device = dev_resp.json()

        dev_id = device["id"]
        dev_key = device["device_key"]

        print(
            f"Device created: ID={dev_id}, "
            f"Key={dev_key}, "
            f"MQTT_User={device['mqtt_username']}"
        )

        # -------------------------------
        # 5. WebSocket Connection
        # -------------------------------

        print(
            "\n--- [5] Connect WebSocket "
            "to listen for live readings ---"
        )

        async with websockets.connect(WS_URL) as ws:

            welcome = await ws.recv()

            print(
                f"WebSocket received: {welcome}"
            )

            # -------------------------------
            # 6. Ingest Telemetry
            # -------------------------------

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

            t_resp = await client.post(
                "/v1/telemetry",
                json=telemetry_data
            )

            print(
                "Telemetry status:",
                t_resp.status_code
            )

            print(
                "Telemetry response:",
                t_resp.text
            )

            assert t_resp.status_code == 200

            print(
                f"Telemetry ingested: "
                f"{t_resp.json()}"
            )

            # -------------------------------
            # WebSocket Live Broadcast
            # -------------------------------

            msg = await asyncio.wait_for(
                ws.recv(),
                timeout=5.0
            )

            print(
                f"WebSocket live broadcast "
                f"received: {msg}"
            )

            ws_data = json.loads(msg)

            assert ws_data["device_key"] == dev_key

            assert (
                ws_data["data"]["payload"]["temperature"]
                == 48.6
            )

        # -------------------------------
        # 7. Historical Telemetry
        # -------------------------------

        print(
            "\n--- [7] Query Historical "
            "Telemetry (Indexed) ---"
        )

        hist_resp = await client.get(
            f"/v1/devices/{dev_id}/telemetry?limit=5",
            headers=headers
        )

        print(
            "Historical telemetry status:",
            hist_resp.status_code
        )

        print(
            "Historical telemetry response:",
            hist_resp.text
        )

        assert hist_resp.status_code == 200

        records = hist_resp.json()

        if records:
            print(
                f"Found {len(records)} telemetry "
                f"records in DB. "
                f"Latest: {records[0]['payload']}"
            )
        else:
            print(
                "No historical telemetry records found."
            )

    print(
        "\n[OK] ALL END-TO-END TESTS "
        "PASSED SUCCESSFULLY!\n"
    )


if __name__ == "__main__":
    asyncio.run(run_tests())