class OpenHABWrapperService {
    constructor(config) {
        // Instantiate a client from the openhab.js library
        this.client = new openHAB.OpenHABClient(
            config.openhabUrl,
            config.username,
            config.password,
            config.token
        );
        this.itemsApi = new openHAB.Items(this.client);
        this.itemEventsApi = new openHAB.ItemEvents(this.client);
    }

    // Retrieve a Single Item
    async getItem(itemName) {
        return await this.itemsApi.getItem(itemName);
    }

    // Retrieve all members of a group
    async getGroupMembers(groupName) {
        const groupItem = await this.itemsApi.getItem(groupName, { recursive: true });
        return groupItem.members || [];
    }

    // Send a command to an item
    async sendCommand(itemName, command) {
        return await this.itemsApi.sendCommand(itemName, command.toString());
    }

    // Listen for Server-Sent Events via ItemEvents from openhab.js
    async connectSSE(onEventCallback) {
        try {
            const response = await this.itemEventsApi.ItemEvent();
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const readStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const eventData = JSON.parse(line.slice(6));
                                // Parse the openHAB SSE event structure
                                // Topic format: openhab/items/{itemName}/statechanged
                                if (eventData.topic) {
                                    const parts = eventData.topic.split("/");
                                    if (parts.length >= 3 && parts[0] === "openhab" && parts[1] === "items") {
                                        const itemName = parts[2];
                                        let payloadValue = null;

                                        if (eventData.payload) {
                                            const payloadObj = typeof eventData.payload === "string" 
                                                ? JSON.parse(eventData.payload) 
                                                : eventData.payload;
                                            payloadValue = payloadObj.value !== undefined ? payloadObj.value : payloadObj.itemState;
                                        }

                                        if (itemName && payloadValue !== undefined) {
                                            onEventCallback(itemName, payloadValue);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn("Error parsing the SSE event:", e);
                            }
                        }
                    }
                }
            };

            readStream();
        } catch (err) {
            console.error("SSE Connection Error:", err);
        }
    }
}