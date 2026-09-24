class WebTVModel {
    constructor(ohWrapper) {
        this.oh = ohWrapper;
        this.stations = [];
        this.currentSender = "No channel";
        this.volume = 80;
        this.isMuted = false;
        this.playerState = "PAUSE";
        this.listeners = [];
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    async loadInitialData() {
        try {
            const members = await this.oh.getGroupMembers(CONFIG.groupItem);
            this.stations = members.map(item => ({
                id: item.name,
                name: item.label || item.name,
                state: item.state
            }));

            const senderItem = await this.oh.getItem("WebTV_Sender");
            this.currentSender = senderItem.state || "No channel";

            const volItem = await this.oh.getItem("WebTV_Volume");
            this.volume = parseInt(volItem.state, 10) || 80;

            const muteItem = await this.oh.getItem("WebTV_Mute");
            this.isMuted = muteItem.state === "ON";

            const ctrlItem = await this.oh.getItem("WebTV_Control");
            this.playerState = ctrlItem.state || "PAUSE";

            this.notify();
        } catch (e) {
            console.error("Error while loading initial data:", e);
        }
    }

    updateItemState(itemName, state) {
        if (itemName === "WebTV_Sender") {
            this.currentSender = state;
        } else if (itemName === "WebTV_Volume") {
            this.volume = parseInt(state, 10);
        } else if (itemName === "WebTV_Mute") {
            this.isMuted = (state === "ON");
        } else if (itemName === "WebTV_Control") {
            this.playerState = state;
        } else {
            const station = this.stations.find(s => s.id === itemName);
            if (station) {
                this.stations.forEach(s => s.state = "OFF");
                station.state = state;
            }
        }
        this.notify();
    }
}