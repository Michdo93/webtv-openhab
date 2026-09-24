import subprocess
import scope
from openhab import rule, Registry
from openhab.triggers import when

# --- CONFIGURATION ---
METADATA_NAMESPACE = "stream_uri"

USE_SSH = True
SSH_USER = "pi"
SSH_HOST = "192.168.1.50"
SSH_KEY_PATH = "/var/lib/openhab/.ssh/id_rsa"

PLAYER_CMD = "mpv --fs --no-terminal --input-ipc-server=/tmp/mpvsocket"

def execute_command(cmd_string):
    if USE_SSH:
        ssh_cmd = ["ssh"]
        if SSH_KEY_PATH:
            ssh_cmd.extend(["-i", SSH_KEY_PATH])
        remote_command = "export DISPLAY=:0; {}".format(cmd_string)
        ssh_cmd.append("{}@{}".format(SSH_USER, SSH_HOST))
        ssh_cmd.append(remote_command)
        return subprocess.Popen(ssh_cmd)
    else:
        return subprocess.Popen(cmd_string, shell=True)

def send_mpv_ipc(command_json):
    """ Sends IPC commands to the running MPV player """
    cmd = "echo '{}' | socat - /tmp/mpvsocket".format(command_json)
    execute_command(cmd)

def stop_remote_player():
    kill_cmd = "killall -9 mpv vlc"
    execute_command(kill_cmd)

def play_station_by_item(item_name):
    item = Registry.getItem(item_name)
    if not item:
        return
    meta_proxy = item.getMetadata()
    meta_entry = meta_proxy.get(METADATA_NAMESPACE) if meta_proxy else None
    
    if meta_entry and meta_entry.getValue():
        url = meta_entry.getValue()
        stop_remote_player()
        play_cmd = "{} '{}'".format(PLAYER_CMD, url)
        execute_command(play_cmd)
        
        # Update UI States
        events.postUpdate("WebTV_Sender", item.getLabel() or item_name)
        events.postUpdate("WebTV_Control", "PLAY")
        
        for other in Registry.getItems():
            if other.getName().startswith("iWebTV_"):
                other.postUpdate(scope.OFF if other.getName() != item_name else scope.ON)

# --- RULES ---

@rule()
@when("Member of gWebTV received command")
def webtv_station_rule(module, input):
    event = input.get('event')
    if not event or str(event.getItemCommand()) != "ON":
        return
    play_station_by_item(event.getItemName())

@rule()
@when("Item WebTV_Control received command")
def webtv_player_control_rule(module, input):
    cmd = str(input.get('event').getItemCommand())
    if cmd in ["PLAY", "PAUSE"]:
        send_mpv_ipc('{"command": ["cycle", "pause"]}')
    elif cmd in ["STOP"]:
        stop_remote_player()
        events.postUpdate("WebTV_Sender", "No channel")

@rule()
@when("Item WebTV_Volume received command")
def webtv_volume_rule(module, input):
    vol = str(input.get('event').getItemCommand())
    send_mpv_ipc('{{"command": ["set_property", "volume", {}]}}'.format(vol))

@rule()
@when("Item WebTV_Mute received command")
def webtv_mute_rule(module, input):
    cmd = str(input.get('event').getItemCommand())
    is_mute = "true" if cmd == "ON" else "false"
    send_mpv_ipc('{{"command": ["set_property", "mute", {}]}}'.format(is_mute))

@rule()
@when("Item WebTV_Zap received command")
def webtv_zap_rule(module, input):
    cmd = str(input.get('event').getItemCommand())
    items = sorted([i for i in Registry.getItems() if i.getName().startswith("iWebTV_")], key=lambda x: x.getName())
    if not items:
        return
    
    current_index = 0
    for idx, item in enumerate(items):
        if str(item.getState()) == "ON":
            current_index = idx
            break
            
    if cmd == "NEXT":
        next_idx = (current_index + 1) % len(items)
    elif cmd == "PREV":
        next_idx = (current_index - 1) % len(items)
    else:
        return
        
    play_station_by_item(items[next_idx].getName())

@rule()
@when("System reached start level 100")
def webtv_init_rule(module, input):
    events.postUpdate("WebTV_Sender", "No channel")
    events.postUpdate("WebTV_Volume", "80")
    events.postUpdate("WebTV_Mute", "OFF")
    events.postUpdate("WebTV_Control", "PAUSE")
    for item in Registry.getItems():
        if item.getName().startswith("iWebTV_"):
            item.postUpdate(scope.OFF)