**Video Walkthrough:** We have created a video demonstrating this experiment where we perform the procedure and explain the steps. [Click here to watch on YouTube]( https://youtu.be/7H8q9zXD26c)

## Step 1: Deploy Core Network

**Option A (Terminal):**
Click on the **Terminal button** to open the terminal then from the project root directory, execute the following command:

**Deploy Core Network Components:**
This command starts all core network components (AMF, SMF, UPF, NRF, etc.) in detached mode using the main Docker Compose file. The `-d` flag runs containers in the background, allowing you to continue with other deployments.

```bash
docker compose -f docker-compose.yml up -d
```

**Command Parameters:**
- `docker compose` - Docker Compose orchestration tool
- `-f docker-compose.yml` - Specifies the compose file for core network services
- `up` - Creates and starts containers
- `-d` - Detached mode (runs in background)

<img src="images/prd1.png" width="90%">

*Fig: Terminal output showing core network deployment with docker compose*

**Deploy gNB (Base Station) Services:**
Once the core network is up and running, deploy the gNB services. This command initializes the gNB (Next Generation NodeB - 5G base station) and establishes connectivity with the core network components deployed in the previous step.

```bash
docker compose -f docker-compose-gnb.yml up -d
```

**Command Parameters:**
- `-f docker-compose-gnb.yml` - Specifies the compose file for gNB services
- Establishes N2 interface connection to AMF for control plane
- Establishes N3 interface connection to UPF for user plane

<img src="images/prd2.png" width="90%">

*Fig: Terminal output showing gNB deployment and connection to core network*

---

**Deploy UE (User Equipment) Services:**
After the gNB deployment is complete, deploy the UE services. This command starts the UE containers (representing 5G mobile devices/endpoints) and attaches them to the gNB for communication.

```bash
docker compose -f docker-compose-ue.yml up -d
```

**Command Parameters:**
- `-f docker-compose-ue.yml` - Specifies the compose file for UE services
- UE containers connect to gNB via Uu interface (radio interface)
- Enables establishment of PDU sessions and data transfer

<img src="images/prd3.png" width="90%">

*Fig: Terminal output showing UE deployment and attachment to gNB*

---

<img src="images/prd4.png" width="90%">

*Fig: Complete 5G network topology with UE, gNB, and all core network functions running*

---

**Verify Container Status:**
To verify that all containers are running successfully, execute the following command. This displays a real-time list of all running containers with their status, showing whether each service is up and healthy.

```bash
docker ps
```

**Output Shows:**
- Container ID, Image name, Status, and Port mappings
- All core network functions, gNB, and UE containers
- Confirms successful deployment of the entire 5G network topology

<img src="images/prd5.png" width="90%">

*Fig: Docker PS output listing all running 5G network containers with their status*

---

**Monitor Core Network Status Continuously:**
To continuously monitor the status of the core network containers in real-time, use the `watch` command. This will refresh the display every 2 seconds by default, allowing you to observe the state changes of containers during the connection management process.

```bash
watch docker compose -f docker-compose.yml ps -a
```

**Command Parameters:**
- `watch` - Runs command repeatedly at 2-second intervals
- `-a` - Shows all containers (running and stopped)
- Useful for monitoring during connection establishment and troubleshooting

<img src="images/prd6.png" width="90%">

*Fig: Continuous real-time monitoring of core network container status*

---

**Option B (Automatic):** Click the **🚀 Deploy Core** button on the top toolbar. This will automatically clear any existing topology and sequentially deploy the Service Bus, Network Functions (NRF, AMF, SMF, UPF, AUSF, UDM, PCF, NSSF, UDR, MySQL, gNB, UE), and establish the necessary connections.

<img src="images/prd7.png" width="90%">

*Fig: Automatic one-click core network deployment*

---

**Option C (Manual):** Manually add each Network Function using the **➕ Add NF** button and connect them using the **Select Source** and **Select Destination** buttons in the left sidebar.

<img src="images/prd24.png" width="90%">

*Fig: Core Network Deployment*

## Step 2: Enable Connection Management Mode

Once the core network is successfully deployed and all NFs show a "Stable" status, click on the **📡 Connection Management** button in the top toolbar to switch the interface to the Connection Management experiment mode.

<img src="images/prd8.png" width="90%">

*Fig: Connection Management Mode*

---

## Step 3: Observe Experiment Panels

You will now see:

- **Right Panel (Connection Management Process):** A step-by-step interactive flow with 13 steps for the complete connection management process.
- **Left Panel (Connection Management Messages):** An inspector panel that displays the JSON content of every Request and Response message sent between NFs.

<img src="images/prd9.png" width="90%">

*Fig: Experiment Panels*

---

## Step 4: RRC Connection Request

Click **Step 1** in the right panel.

- **Action:** UE sends an RRC Connection Request to the gNB to establish radio connection.
- **Observation:** A packet travels from UE to gNB. The left panel shows the RRC message details including rrcMessage, ueIdentity, and establishmentCause.

<img src="images/prd10.png" width="90%">

*Fig: RRC Connection Request*

---

## Step 5: RRC Connection Setup

Click **Step 2** in the right panel.

- **Action:** gNB responds with RRC Connection Setup, allocating radio resources.
- **Observation:** A packet travels from gNB to UE. The left panel shows the RRC Connection Setup with SRB1 configuration.

<img src="images/prd11.png" width="90%">

*Fig: RRC Connection Setup*

---

## Step 6: RRC Connection Setup Complete

Click **Step 3** in the right panel.

- **Action:** UE confirms RRC connection establishment and includes NAS Service Request.
- **Observation:** A packet travels from UE to gNB. The message contains embedded NAS PDU with Service Request.

<img src="images/prd12.png" width="90%">

*Fig: RRC Connection Setup Complete*

---

## Step 7: NAS Service Request

Click **Step 4** in the right panel.

- **Action:** UE sends NAS Service Request to AMF via N1 interface to request PDU session.
- **Observation:** A packet travels from UE to AMF. The left panel displays the NAS message with 5G-GUTI, service type, and PDU session status.

<img src="images/prd13.png" width="90%">

*Fig: NAS Service Request*

---

## Step 8: AMF Validates UE Context

Click **Step 5** in the right panel.

- **Action:** AMF performs internal validation of UE context and credentials.
- **Observation:** The left panel shows AMF internal checks including validation of 5G-GUTI, UE context fetch, and access rights verification.

<img src="images/prd14.png" width="90%">

*Fig: AMF Validates UE Context*

---

## Step 9: Update SM Context Request

Click **Step 6** in the right panel.

- **Action:** AMF forwards the service request to SMF via Nsmf_PDUSession interface.
- **Observation:** A packet travels from AMF to SMF. The message includes ueId, pduSessionId, and upActivation flag.

<img src="images/prd15.png" width="90%">

*Fig: Update SM Context Request*

---

## Step 10: SMF Internal Processing

Click **Step 7** in the right panel.

- **Action:** SMF performs internal processing to prepare for UPF session establishment.
- **Observation:** The left panel shows SMF processing actions including UPF selection, TEID allocation, and PFCP rules preparation.

<img src="images/prd16.png" width="90%">

*Fig: SMF Internal Processing*

---

## Step 11: PFCP Session Establishment Request

Click **Step 8** in the right panel.

- **Action:** SMF sends PFCP Session Establishment Request to UPF via N4 interface to create user plane session.
- **Observation:** A packet travels from SMF to UPF. The response JSON contains the tunnel TEIDs (upfTeid: 0x1001, gnbTeid: 0x2001) and QoS parameters.

<img src="images/prd17.png" width="90%">

*Fig: PFCP Session Establishment Request*

---

## Step 12: PFCP Session Establishment Response

Click **Step 9** in the right panel.

- **Action:** UPF confirms session establishment and returns success response.
- **Observation:** A packet travels from UPF to SMF. The response confirms successful PFCP session establishment.

<img src="images/prd18.png" width="90%">

*Fig: PFCP Session Establishment Response*

---

## Step 13: Update SM Context Response

Click **Step 10** in the right panel.

- **Action:** SMF sends Update SM Context Response back to AMF with tunnel information.
- **Observation:** A packet travels from SMF to AMF. The message includes session status as "activated" and N3 tunnel details.

<img src="images/prd19.png" width="90%">

*Fig: Update SM Context Response*

---

## Step 14: PDU Session Resource Setup Request

Click **Step 11** in the right panel.

- **Action:** AMF instructs gNB to setup PDU session resources via N2 interface.
- **Observation:** A packet travels from AMF to gNB. The message contains QoS flows with QFI 9, 5QI 9, and transport layer information.

<img src="images/prd20.png" width="90%">

*Fig: PDU Session Resource Setup Request*

---

## Step 15: PDU Session Resource Setup Response

Click **Step 12** in the right panel.

- **Action:** gNB confirms PDU session resource setup and provides gNB tunnel endpoint.
- **Observation:** A packet travels from gNB to AMF. The response includes the gNB TEID (0x2001) and success status.

<img src="images/prd22.png" width="90%">

*Fig: PDU Session Resource Setup Response*

---

## Step 16: NAS Service Accept

Click **Step 13** in the right panel.

- **Action:** AMF sends final NAS Service Accept message to UE, confirming PDU session is established.
- **Observation:** A packet travels from AMF to UE. The UE receives confirmation that the PDU Session is marked as Established. The connection management process is now complete.

<img src="images/prd21.png" width="90%">

*Fig: NAS Service Accept*
