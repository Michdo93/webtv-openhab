# WebTV Controller for openHAB

A modern, responsive, MVC-based HTML5 dashboard for controlling WebTV playback in openHAB. This interface integrates seamlessly with openHAB's REST API and Server-Sent Events (SSE) using the standard `openhab.js` library wrapper.

## 📁 Project Structure

```text
/etc/openhab/html/webtv/
├── index.html          # Main HTML5 Dashboard
├── config.js           # Central configuration file
├── openhab.js          # Official js-openhab-rest-client library
├── openhab-service.js  # Wrapper layer interacting with openhab.js
├── model.js            # MVC Model (State management)
├── view.js             # MVC View (DOM manipulation & event binding)
└── controller.js       # MVC Controller (Application logic)

```

---

## 🛠️ Components Overview

### 1. **openhab.js**

* **Role:** External dependency / Fixed library.
* **Function:** Provides synchronous and asynchronous wrappers (`OpenHABClient`, `Items`, `ItemEvents`) for openHAB REST endpoints and SSE streams.

### 2. **config.js**

* **Role:** Application Configuration.
* **Function:** Holds connection parameters (URL, optional auth credentials, target group item name).

### 3. **openhab-service.js (`OpenHABWrapperService`)**

* **Role:** Service Layer Adapter.
* **Function:** Bridges the application logic with the `openhab.js` library.
* Fetches items and group members via `openHAB.Items`.
* Sends commands to openHAB items.
* Consumes live SSE events using `openHAB.ItemEvents` and decodes event streams into application updates.

### 4. **model.js (`WebTVModel`)**

* **Role:** State Management.
* **Function:** Maintains local UI states (active channel, playback state, volume, mute state) and notifies subscribers (View) upon change.

### 5. **view.js (`WebTVView`)**

* **Role:** UI & DOM Renderer.
* **Function:** Renders channel tiles and control buttons dynamically. Binds UI interaction events (click, slide) to handler functions.

### 6. **controller.js (`WebTVController`)**

* **Role:** Application Orchestrator.
* **Function:** Connects the View events with the Service calls and updates the Model when SSE updates arrive from openHAB.

---

## 🚀 Getting Started

### Prerequisites

1. **openHAB Server** running with configured WebTV Items (`gWebTV`, `WebTV_Sender`, `WebTV_Volume`, `WebTV_Mute`, `WebTV_Control`, `WebTV_Zap`).
2. Deployment directory located at `/etc/openhab/html/webtv/`.

### Installation

1. Copy all project files into your openHAB static HTML directory:
```bash
/etc/openhab/html/webtv/
```


2. Open `config.js` and verify your configuration:
```javascript
const CONFIG = {
    openhabUrl: window.location.protocol + "//" + window.location.host,
    username: null, // Optional
    password: null, // Optional
    token: null,    // Optional
    groupItem: "gWebTV"
};
```

### Accessing the Dashboard

Open any web browser on your PC, tablet, or mobile device and navigate to:

```text
http://<YOUR_OPENHAB_IP>:8080/static/webtv/index.html
```

---

## 📡 Real-time Updates (SSE)

The interface listens to real-time events broadcasted by openHAB using `openHAB.ItemEvents().ItemEvent()`. Any changes made via external switches, physical remotes, or other openHAB rules automatically reflect in the dashboard without requiring a page refresh.

---

## 📄 License

This project is open-source and released under the MIT License.