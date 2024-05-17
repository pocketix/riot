import paho.mqtt.client as mqtt
import time
import json
import random

messages_per_second = 100


def generate_message_payload():
    return json.dumps({
        "ntf": {
            "msgId": "a210a169-5953-4fc2-8bdb-e595e18f0c90",
            "tst": 1680284232.0
        },
        "data": {
            "devs": [
                {
                    "devType": "shelly1pro",
                    "devUid": "shelly30C6F787B4CCC",
                    "devAttrs": {},
                    "devPars": {
                        "mac": "30C6F787B4CC",
                        "fw_id": "20220512-131622/0.10.2-beta1-gd0e2a8c",
                        "eco_mode": True,
                        "deviceUid": "shelly30C6F787B4CCC",
                        "model_name": "shelly1pro",
                        "tst": 1680284232.0,
                        "relay_0_source": "WS_in",
                        "relay_0_output": False,
                        "relay_0_temperature": random.randint(18, 22)
                    }
                }
            ]
        },
        "topic": "IotLogimic/dev5/shelly/shelly1pro/shelly30C6F787B4CCC/john/ntf",
        "topicPrefix": "IotLogimic",
        "appId": "john",
        "dir": "ntf",
        "connName": "iTemp2"
    })


if __name__ == '__main__':
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set("admin", "password")
    client.connect("host.docker.internal", 1883)
    client.loop_start()
    print(f"Starting the stress test of bp-bures-SfPDfSD... {messages_per_second} MQTT messages per second")
    message_counter = 0
    try:
        while True:
            rc = client.publish("topic", generate_message_payload()).rc
            if rc != mqtt.MQTT_ERR_SUCCESS:
                print(f"Failed to publish message NO {message_counter + 1}: rc = f{rc}")
                break
            message_counter += 1
            time.sleep(1 / messages_per_second)
    except KeyboardInterrupt:
        print("Stress test of bp-bures-SfPDfSD stopped by user...")
    finally:
        client.loop_stop()
        client.disconnect()
    print(f"Stress test of bp-bures-SfPDfSD completed... {message_counter} MQTT messages sent...")
