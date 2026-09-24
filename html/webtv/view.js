class WebTVView {
    constructor() {
        this.elSender = document.getElementById("current-sender");
        this.elPlayBtn = document.getElementById("btn-play");
        this.elMuteBtn = document.getElementById("btn-mute");
        this.elVolume = document.getElementById("volume-slider");
        this.elVolVal = document.getElementById("volume-val");
        this.elStationGrid = document.getElementById("station-grid");
    }

    bindSelectStation(handler) {
        this.elStationGrid.addEventListener("click", (e) => {
            const card = e.target.closest(".station-card");
            if (card) handler(card.dataset.id);
        });
    }

    bindPlayerControl(handler) {
        document.getElementById("btn-prev").addEventListener("click", () => handler("Zap", "PREV"));
        document.getElementById("btn-next").addEventListener("click", () => handler("Zap", "NEXT"));
        this.elPlayBtn.addEventListener("click", () => handler("PlayPause"));
        this.elMuteBtn.addEventListener("click", () => handler("Mute"));
    }

    bindVolumeChange(handler) {
        this.elVolume.addEventListener("input", (e) => {
            this.elVolVal.textContent = `${e.target.value}%`;
        });
        this.elVolume.addEventListener("change", (e) => {
            handler(e.target.value);
        });
    }

    render(model) {
        if (this.elSender) this.elSender.textContent = model.currentSender;
        if (this.elVolume) this.elVolume.value = model.volume;
        if (this.elVolVal) this.elVolVal.textContent = `${model.volume}%`;
        
        if (this.elPlayBtn) {
            this.elPlayBtn.textContent = model.playerState === "PLAY" ? "⏸ Pause" : "▶ Play";
        }
        if (this.elMuteBtn) {
            this.elMuteBtn.textContent = model.isMuted ? "🔇 Mute" : "🔊 Unmute";
            this.elMuteBtn.classList.toggle("active", model.isMuted);
        }

        if (this.elStationGrid) {
            this.elStationGrid.innerHTML = model.stations.map(st => `
                <div class="station-card ${st.state === 'ON' ? 'active' : ''}" data-id="${st.id}">
                    <div class="icon">📺</div>
                    <div class="name">${st.name}</div>
                </div>
            `).join('');
        }
    }
}