class WebTVController {
    constructor(model, view, ohWrapper) {
        this.model = model;
        this.view = view;
        this.oh = ohWrapper;

        this.model.subscribe((m) => this.view.render(m));

        this.view.bindSelectStation((stationId) => {
            this.oh.sendCommand(stationId, "ON");
        });

        this.view.bindPlayerControl((action, value) => {
            if (action === "Zap") {
                this.oh.sendCommand("WebTV_Zap", value);
            } else if (action === "PlayPause") {
                const nextState = this.model.playerState === "PLAY" ? "PAUSE" : "PLAY";
                this.oh.sendCommand("WebTV_Control", nextState);
            } else if (action === "Mute") {
                const nextMute = this.model.isMuted ? "OFF" : "ON";
                this.oh.sendCommand("WebTV_Mute", nextMute);
            }
        });

        this.view.bindVolumeChange((vol) => {
            this.oh.sendCommand("WebTV_Volume", vol);
        });

        // Start an event stream and register a callback
        this.oh.connectSSE((itemName, state) => {
            this.model.updateItemState(itemName, state);
        });

        // Loading data
        this.model.loadInitialData();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ohWrapper = new OpenHABWrapperService(CONFIG);
    const model = new WebTVModel(ohWrapper);
    const view = new WebTVView();
    new WebTVController(model, view, ohWrapper);
});