
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

        # -------------------------------
        # 8. Device Templates
        # -------------------------------
        print("\n--- [8] Create Device Template ---")
        tmpl_resp = await client.post(
            "/v1/templates",
            headers=headers,
            json={
                "name": "High-Temp Bearing Thermocouple",
                "category": "Sensor",
                "description": "Thermocouple schema for CNC spindles",
                "parameters": [
                    {"key": "temperature", "name": "Temperature", "type": "float", "unit": "°C"}
                ]
            }
        )
        print("Template status:", tmpl_resp.status_code)
        assert tmpl_resp.status_code == 201

        # -------------------------------
        # 9. Industrial Asset Node
        # -------------------------------
        print("\n--- [9] Create Asset Node ---")
        asset_resp = await client.post(
            "/v1/assets",
            headers=headers,
            json={
                "name": "CNC Milling Cell 01",
                "type": "Equipment",
                "criticality": "A",
                "health_score": 96
            }
        )
        print("Asset status:", asset_resp.status_code)
        assert asset_resp.status_code == 201

        # -------------------------------
        # 10. Automation Rule & Alarm Evaluation
        # -------------------------------
        print("\n--- [10] Create Automation Rule ---")
        rule_resp = await client.post(
            "/v1/rules",
            headers=headers,
            json={
                "name": "Spindle Overheat Emergency Interlock",
                "scope": "Device",
                "target_id": dev_key,
                "parameter": "temperature",
                "operator": ">",
                "threshold": "75.0",
                "unit": "°C",
                "actions": [
                    {"type": "alarm", "label": "CRITICAL Alarm", "detail": "Temperature Breach"}
                ]
            }
        )
        print("Rule status:", rule_resp.status_code)
        assert rule_resp.status_code == 201
        rule_data = rule_resp.json()

        print("\n--- [11] Ingest Breaching Telemetry (Triggering Rule) ---")
        breach_resp = await client.post(
            "/v1/telemetry",
            json={
                "device_key": dev_key,
                "payload": {
                    "temperature": 89.2,
                    "humidity": 45.0
                }
            }
        )
        print("Breach ingest status:", breach_resp.status_code)
        assert breach_resp.status_code == 200

        print("\n--- [12] Verify Automated Alarm Generation ---")
        alarms_resp = await client.get(
            "/v1/alarms?status=ACTIVE",
            headers=headers
        )
        print("Alarms query status:", alarms_resp.status_code)
        assert alarms_resp.status_code == 200
        active_alarms = alarms_resp.json()
        print(f"Active alarms found: {len(active_alarms)}")
        assert len(active_alarms) >= 1
        print(f"Triggered Alarm: '{active_alarms[0]['title']}' - {active_alarms[0]['message']}")

        # -------------------------------
        # 13. Telemetry Aggregation & Fleet KPIs
        # -------------------------------
        print("\n--- [13] Query Telemetry Aggregation & Fleet KPIs ---")
        agg_resp = await client.get(
            f"/v1/telemetry/aggregate?metric=temperature&device_key={dev_key}&limit=10"
        )
        print("Aggregation status:", agg_resp.status_code)
        assert agg_resp.status_code == 200
        agg_json = agg_resp.json()
        print(f"Aggregation stats: Avg={agg_json['avg']}, Min={agg_json['min']}, Max={agg_json['max']}, Points={agg_json['count']}")

        kpi_resp = await client.get("/v1/telemetry/kpis")
        print("KPIs status:", kpi_resp.status_code)
        assert kpi_resp.status_code == 200
        kpi_json = kpi_resp.json()
        print(f"Fleet KPIs: OEE={kpi_json['oee']}%, Availability={kpi_json['availability']}%, Telemetry Count={kpi_json['total_telemetry']}")

    print(
        "\n[OK] ALL MULTI-PHASE END-TO-END TESTS "
        "PASSED SUCCESSFULLY!\n"
    )


if __name__ == "__main__":
    asyncio.run(run_tests())