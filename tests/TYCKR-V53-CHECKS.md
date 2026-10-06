# v53 Party/room Mosquitto → tyckr

Authorized scope: replace only BROKERS[2] and room selector value2 label. Keep BROKERS[0]=EMQX and BROKERS[1]=HiveMQ, DM independent EMQX, selected-tower retry and saved index unchanged. No theme/layout/native/player/sync changes.

Source-normalization test proves main HTML byte-identical to deployed v52 except third broker name/URL, selector label and synchronized build53. node tests/tyckr-room.cjs and node tests/update-version.cjs pass.

Actual broker checks performed over certificate-verified WSS wss://mqtt.tyckr.io:8081:
- Separate sender/receiver MQTT 3.1.1 connections accepted.
- Wildcard subscription granted QoS1.
- QoS1 publish delivered with acknowledgements.
- Third, late-joining client received retained test state.
- Retained synthetic state deleted and deletion acknowledged; all clients disconnected.
These checks ran from workspace, not a full Android/handset Party test. User separately confirmed official tyckr status green on their network.

Diagnostics page includes tyckr, now labelled Party/room tower. Historic Mosquitto/Eclipse diagnostic rows remain for comparison. Main app room list still has exactly three slots. No automatic switch of users on EMQX/HiveMQ; saved slot2 now resolves to tyckr. Party peers need updated page and same selected tower. No new APK.
