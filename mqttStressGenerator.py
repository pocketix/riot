import paho.mqtt.client as mqtt
import time
import json
import random
import argparse
import enum


class SDInstanceMode(enum.Enum):
    ONE = "one"
    FEW = "few"
    MANY = "many"
    UNLIMITED = "unlimited"


def sequential_number_generator():
    number = 1
    while True:
        yield number
        number += 1


sng = sequential_number_generator()


def generate_message_payload():
    sd_instance_uid_suffix = {
        SDInstanceMode.ONE: 1,
        SDInstanceMode.FEW: random.randint(1, 3),
        SDInstanceMode.MANY: random.randint(1, 100),
        SDInstanceMode.UNLIMITED: next(sng)
    }.get(sd_instance_mode)
    sd_instance_uid = f"shelly30C6F787B4CCC-{sd_instance_uid_suffix}"
    return json.dumps({
        "ntf": {
            "msgId": "a210a169-5953-4fc2-8bdb-e595e18f0c90",
            "tst": 1680284232.0
        },
        "data": {
            "devs": [
                {
                    "devType": "shelly1pro",
                    "devUid": sd_instance_uid,
                    "devAttrs": {},
                    "devPars": {
                        "mac": "30C6F787B4CC",
                        "fw_id": "20220512-131622/0.10.2-beta1-gd0e2a8c",
                        "eco_mode": True,
                        "deviceUid": sd_instance_uid,
                        "model_name": "shelly1pro",
                        "tst": 1680284232.0,
                        "relay_0_source": "WS_in",
                        "relay_0_output": False,
                        "relay_0_temperature": random.randint(18, 22)
                    }
                }
            ]
        },
        "topic": f"IotLogimic/dev5/shelly/shelly1pro/{sd_instance_uid}/john/ntf",
        "topicPrefix": "IotLogimic",
        "appId": "john",
        "dir": "ntf",
        "connName": "iTemp2"
    })


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='bp-bures-SfPDfSD MQTT stress test script')
    parser.add_argument('--messages-per-second', type=int, default=10, help='Number of MQTT messages to send per second')
    parser.add_argument('--sd-instance-mode', type=lambda s: SDInstanceMode[s.upper()], choices=list(SDInstanceMode), default=SDInstanceMode.ONE, help='SD instance mode: from how many different SD instances should the messages come')
    args = parser.parse_args()
    messages_per_second = args.messages_per_second
    sd_instance_mode = args.sd_instance_mode
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set("admin", "password")
    client.connect("host.docker.internal", 1883)
    client.loop_start()
    print(f"Starting the stress test of bp-bures-SfPDfSD... {messages_per_second} MQTT message(s) per second")
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
    print(f"Stress test of bp-bures-SfPDfSD completed... {message_counter} MQTT message(s) sent...")
