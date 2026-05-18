/**
 * ============================================
 * INTERFACE MANAGER
 * ============================================
 * Manages 5G Network Interfaces (N1, N2, N3, N4, N5, N6)
 * Handles deployment, configuration, and visualization
 */

class InterfaceManager {
    constructor() {
        this.deployedInterfaces = new Map(); // Track deployed interfaces
        this.interfaceDefinitions = this.getInterfaceDefinitions();
        console.log('✅ InterfaceManager initialized');
    }

    /**
     * Get interface definitions
     */
    getInterfaceDefinitions() {
        return {
            'N1': {
                id: 'N1',
                name: 'N1 Interface',
                from: 'UE',
                to: 'AMF',
                protocol: 'NAS (Non-Access Stratum)',
                type: 'Control Plane',
                description: 'UE to AMF signaling interface',
                color: '#3498db',
                icon: '📱',
                requiredNFs: ['UE', 'gNB', 'AMF'],
                flow: [
                    'UE initiates Registration Request',
                    'NAS message encapsulated in RRC',
                    'gNB forwards to AMF via N2',
                    'AMF processes NAS message',
                    'Registration Accept sent back'
                ]
            },
            'N2': {
                id: 'N2',
                name: 'N2 Interface',
                from: 'gNB',
                to: 'AMF',
                protocol: 'NGAP (NG Application Protocol)',
                type: 'Control Plane',
                description: 'RAN to AMF control interface',
                color: '#2ecc71',
                icon: '📡',
                requiredNFs: ['gNB', 'AMF'],
                flow: []
            },
            'N3': {
                id: 'N3',
                name: 'N3 Interface',
                from: 'gNB',
                to: 'UPF',
                protocol: 'GTP-U (User Plane)',
                type: 'User Plane',
                description: 'RAN to UPF data interface',
                color: '#f39c12',
                icon: '🔄',
                requiredNFs: ['gNB', 'UPF'],
                flow: []
            },
            'N4': {
                id: 'N4',
                name: 'N4 Interface',
                from: 'SMF',
                to: 'UPF',
                protocol: 'PFCP (Packet Forwarding Control)',
                type: 'Control Plane',
                description: 'SMF to UPF control interface',
                color: '#e74c3c',
                icon: '⚙️',
                requiredNFs: ['SMF', 'UPF'],
                flow: []
            },
            'N5': {
                id: 'N5',
                name: 'N5 Interface',
                from: 'AF',
                to: 'PCF',
                protocol: 'HTTP/2',
                type: 'Service Based',
                description: 'Application to Policy interface',
                color: '#9b59b6',
                icon: '🌐',
                requiredNFs: ['PCF'],
                flow: []
            },
            'N6': {
                id: 'N6',
                name: 'N6 Interface',
                from: 'UPF',
                to: 'ext-dn',
                protocol: 'IP',
                type: 'User Plane',
                description: 'UPF to Data Network interface',
                color: '#16a085',
                icon: '🌍',
                requiredNFs: ['UPF'],
                flow: []
            },
            'N7': {
                id: 'N7',
                name: 'N7 Interface',
                from: 'SMF',
                to: 'PCF',
                protocol: 'HTTP/2',
                type: 'Service Based',
                description: 'SMF to PCF policy interface',
                color: '#e67e22',
                icon: '📋',
                requiredNFs: ['SMF', 'PCF'],
                flow: []
            },
'N8': {
    id: 'N8',
    name: 'N8 Interface',
    from: 'AMF',
    to: 'UDM',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'AMF to UDM subscriber data interface',
    color: '#3498db',
    icon: '👤',
    requiredNFs: ['AMF', 'UDM'],
    flow: []
},
'N10': {
    id: 'N10',
    name: 'N10 Interface',
    from: 'SMF',
    to: 'UDM',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'SMF to UDM session management subscription data',
    color: '#f1c40f',
    icon: '📊',
    requiredNFs: ['SMF', 'UDM'],
    flow: []
},
'N11': {  
    id: 'N11',
    name: 'N11 Interface',
    from: 'AMF',
    to: 'SMF',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'AMF to SMF session management',
    color: '#2ecc71',
    icon: '🔗',
    requiredNFs: ['AMF', 'SMF'],
    flow: []
},
'N12': {  
    id: 'N12',
    name: 'N12 Interface',
    from: 'AMF',
    to: 'AUSF',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'AMF to AUSF authentication',
    color: '#2ecc71',
    icon: '🔐',
    requiredNFs: ['AMF', 'AUSF'],
    flow: []
},
'N13': {  
    id: 'N13',
    name: 'N13 Interface',
    from: 'AMF',
    to: 'NRF',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'AMF to NRF service discovery',
    color: '#2ecc71',
    icon: '🔍',
    requiredNFs: ['AMF', 'NRF'],
    flow: []
},
'N22': {
    id: 'N22',
    name: 'N22 Interface',
    from: 'AMF',
    to: 'NSSF',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'AMF to NSSF network slice selection',
    color: '#1abc9c',
    icon: '📶',
    requiredNFs: ['AMF', 'NSSF'],
    flow: []
},
'N35': {
    id: 'N35',
    name: 'N35 Interface',
    from: 'UDM',
    to: 'UDR',
    protocol: 'HTTP/2',
    type: 'Service Based',
    description: 'UDM to UDR data repository',
    color: '#8e44ad',
    icon: '🗄️',
    requiredNFs: ['UDM', 'UDR'],
    flow: []
}
        };
    }

    /**
     * N2 above N1 between gNB and AMF (negative = upper, positive = lower)
     */
    applyGnbAmfLineOffsets(gnb, amf) {
        if (!window.dataStore || !gnb || !amf) return;

        const connections = window.dataStore.getAllConnections() || [];
        connections.forEach(conn => {
            const betweenGnbAmf =
                (conn.sourceId === gnb.id && conn.targetId === amf.id) ||
                (conn.sourceId === amf.id && conn.targetId === gnb.id);
            if (!betweenGnbAmf || !conn.options) return;

            const isN2 =
                conn.options.interfaceType === 'N2' ||
                (conn.options.label && String(conn.options.label).includes('N2'));
            const isN1 =
                conn.options.interfaceType === 'N1' ||
                conn.options.interfaceType === 'N1-extended' ||
                (conn.options.label && String(conn.options.label).startsWith('N1'));

            if (isN2) {
                conn.options.lineOffset = -8;
            } else if (isN1) {
                conn.options.lineOffset = 8;
            }
        });

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Create or return ext-dn Data Network node (N6 anchor to UPF)
     */
    createExtDnDataNetwork(position = { x: 850, y: 150 }) {
        const existing = window.dataStore?.getAllNFs().find(nf =>
            nf.type === 'DataNetwork' ||
            nf.id === 'data-network-ext-dn' ||
            nf.id === 'data-network-internet'
        );
        if (existing) {
            if (existing.name !== 'ext-dn') {
                existing.name = 'ext-dn';
                window.dataStore.updateNF(existing.id, existing);
            }
            return existing;
        }

        const dataNetwork = {
            id: 'data-network-ext-dn',
            type: 'DataNetwork',
            name: 'ext-dn',
            position,
            color: '#16a085',
            icon: null,
            status: 'active',
            config: {
                ipAddress: '192.168.4.1',
                port: 8088,
                capacity: 999999,
                load: 0,
                httpProtocol: 'IPv4/IPv6',
                type: 'External Network'
            }
        };

        if (window.dataStore) {
            window.dataStore.addNF(dataNetwork);
            console.log('✅ Data Network (ext-dn) created');
        }
        return dataNetwork;
    }

    /**
     * Add gNB → AMF N2 (NGAP) connection if missing
     */
    async ensureN2Connection(gnb, amf) {
        if (!window.dataStore || !gnb || !amf) return;

        const existingConnections = window.dataStore.getAllConnections() || [];
        const n2Exists = existingConnections.some(conn =>
            conn.options?.interfaceType === 'N2' &&
            conn.sourceId === gnb.id &&
            conn.targetId === amf.id
        );

        if (n2Exists) {
            console.log('ℹ️ N2 connection already exists');
            return;
        }

        const gnbToAmfN2 = {
            id: `conn-${Date.now()}-n2`,
            sourceId: gnb.id,
            targetId: amf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N2 (NGAP)',
                color: '#e91e63',
                style: 'solid',
                interfaceType: 'N2',
                lineWidth: 3,
                lineOffset: -8
            }
        };

        window.dataStore.addConnection(gnbToAmfN2);
        console.log('✅ gNB → AMF N2 connection created');
        await this.delay(300);
        this.applyGnbAmfLineOffsets(gnb, amf);
    }

    /**
     * Deploy N1 Interface
     */
    async deployN1Interface() {
    console.log('🚀 Deploying N1 Interface...');

    const n1Def = this.interfaceDefinitions['N1'];

    // Step 1: Deploy UE
    const ue = await this.deployNF('UE', { x: 100, y: 150 });
    await this.delay(500);

    // Step 2: Deploy gNB
    const gnb = await this.deployNF('gNB', { x: 350, y: 150 });
    await this.delay(500);

    // Step 3: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 600, y: 150 });
    await this.delay(500);

    // Step 4: Create connections - UE → gNB → AMF with parallel lines
console.log('🔗 Creating N1 interface connections...');

if (window.connectionManager) {
    // Connection 1: UE → gNB (with N1/RRC label) - BLUE LINE
    const ueToGnb = {
        id: `conn-${Date.now()}-1`,
        sourceId: ue.id,
        targetId: gnb.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: 'N1 (NAS/RRC)',
            color: '#3498db',  // Blue
            style: 'solid',
            interfaceType: 'N1-RRC',
            lineWidth: 3
        }
    };
    
    window.dataStore.addConnection(ueToGnb);
    console.log('✅ UE → gNB connection created with N1 label');
    await this.delay(300);

    // Connection 2: gNB → AMF (Blue line, N1 label) - LOWER LINE (N2 uses upper when deployed)
    const gnbToAmfN1 = {
        id: `conn-${Date.now()}-2`,
        sourceId: gnb.id,
        targetId: amf.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: 'N1',
            color: '#3498db',
            style: 'solid',
            interfaceType: 'N1-extended',
            lineWidth: 3,
            lineOffset: 8
        }
    };
    
    window.dataStore.addConnection(gnbToAmfN1);
    console.log('✅ gNB → AMF blue line created (N1, lower)');
    this.applyGnbAmfLineOffsets(gnb, amf);
}

    // Step 5: Connect ONLY AMF to Service Bus (NOT UE or gNB)
console.log('🚌 Connecting AMF to Service Bus...');

let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

if (!serviceBus && window.busManager) {
    serviceBus = window.busManager.createBusLine({
        position: { x: 200, y: 350 },
        length: 800,
        orientation: 'horizontal',
        name: 'Service Bus'
    });
    console.log('✅ Service Bus created');
}

if (serviceBus && window.busManager) {
    // ONLY Connect AMF to bus
    await this.delay(300);
    window.busManager.connectNFToBus(amf.id, serviceBus.id);
    console.log('✅ AMF connected to Service Bus');
    console.log('ℹ️ UE and gNB are NOT connected to bus (as per N1 interface design)');
}

    // Step 6: Mark interface as deployed
    this.deployedInterfaces.set('N1', {
        interface: n1Def,
        nfs: { UE: ue, gNB: gnb, AMF: amf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N1');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N1 Interface deployed successfully', {
            components: 'UE, gNB, AMF',
            protocol: 'NAS',
            type: 'Control Plane',
            flow: 'UE → gNB (N1/RRC) → AMF (N1)',
            connectedToBus: true
        });
    }

    console.log('✅ N1 Interface deployment complete');
    console.log('📊 Connection flow: UE → gNB → AMF');
    return { ue, gnb, amf };
}

/**
 * Deploy N2 Interface (builds on N1 topology)
 */
async deployN2Interface() {
    console.log('🚀 Deploying N2 Interface...');

    const n2Def = this.interfaceDefinitions['N2'];

    // Check if N1 is already deployed
    const n1Deployed = this.isInterfaceDeployed('N1');
    
    if (n1Deployed) {
        console.log('✅ N1 already deployed, using existing topology for N2');
        
        // Get existing N1 NFs
        const n1Config = this.deployedInterfaces.get('N1');
        const { gNB, AMF } = n1Config.nfs;

        await this.ensureN2Connection(gNB, AMF);
        this.applyGnbAmfLineOffsets(gNB, AMF);
        
        // Mark N2 as deployed (shares topology with N1)
        this.deployedInterfaces.set('N2', {
            interface: n2Def,
            nfs: { gNB, AMF }, // N2 only involves gNB and AMF
            deployedAt: new Date(),
            sharedWith: 'N1' // Indicates it shares topology with N1
        });
        
        // Update left sidebar
        this.markInterfaceDeployed('N2');
        
        // Log deployment
        if (window.logEngine) {
            window.logEngine.addLog('system', 'SUCCESS',
                'N2 Interface configured successfully', {
                components: 'gNB, AMF',
                protocol: 'NGAP (NG Application Protocol)',
                type: 'Control Plane',
                note: 'Uses existing N1 topology',
                sharedTopology: true
            });
        }
        
        console.log('✅ N2 Interface deployment complete (shared topology with N1)');
        return { gNB, AMF };
    }
    
    // If N1 not deployed, deploy full N1 topology first, then mark N2
    console.log('📋 N1 not deployed, deploying full topology for N2...');
    
    // Step 1-3: Deploy NFs (same as N1)
    const ue = await this.deployNF('UE', { x: 100, y: 150 });
    await this.delay(500);

    const gnb = await this.deployNF('gNB', { x: 350, y: 150 });
    await this.delay(500);

    const amf = await this.deployNF('AMF', { x: 600, y: 150 });
    await this.delay(500);

    // Step 4: Create connections (same as N1)
    console.log('🔗 Creating N2 interface connections...');

    if (window.connectionManager) {
        // Connection 1: UE → gNB (with N1/RRC label) - BLUE LINE
        const ueToGnb = {
            id: `conn-${Date.now()}-1`,
            sourceId: ue.id,
            targetId: gnb.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N1 (NAS/RRC)',
                color: '#3498db',
                style: 'solid',
                interfaceType: 'N1-RRC',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(ueToGnb);
        console.log('✅ UE → gNB connection created with N1 label');
        await this.delay(300);

        // Connection 2: gNB → AMF (N1) - lower line
        const gnbToAmfN1 = {
            id: `conn-${Date.now()}-2`,
            sourceId: gnb.id,
            targetId: amf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N1',
                color: '#3498db',
                style: 'solid',
                interfaceType: 'N1-extended',
                lineWidth: 3,
                lineOffset: 8
            }
        };
        
        window.dataStore.addConnection(gnbToAmfN1);
        console.log('✅ gNB → AMF blue line created (N1, lower)');
        await this.delay(300);

        // Connection 3: gNB → AMF (N2) - upper line
        const gnbToAmfN2 = {
            id: `conn-${Date.now()}-3`,
            sourceId: gnb.id,
            targetId: amf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N2 (NGAP)',
                color: '#e91e63',
                style: 'solid',
                interfaceType: 'N2',
                lineWidth: 3,
                lineOffset: -8
            }
        };
        
        window.dataStore.addConnection(gnbToAmfN2);
        console.log('✅ gNB → AMF pink line created (N2, upper)');
        this.applyGnbAmfLineOffsets(gnb, amf);
    }

    // Step 5: Connect AMF to Service Bus
    console.log('🚌 Connecting AMF to Service Bus...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 350 },
            length: 800,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(amf.id, serviceBus.id);
        console.log('✅ AMF connected to Service Bus');
    }

    // Step 6: Mark BOTH N1 and N2 as deployed
    this.deployedInterfaces.set('N1', {
        interface: this.interfaceDefinitions['N1'],
        nfs: { UE: ue, gNB: gnb, AMF: amf },
        deployedAt: new Date()
    });
    
    this.deployedInterfaces.set('N2', {
        interface: n2Def,
        nfs: { gNB: gnb, AMF: amf },
        deployedAt: new Date(),
        sharedWith: 'N1'
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N1');
    this.markInterfaceDeployed('N2');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N2 Interface deployed successfully', {
            components: 'gNB, AMF',
            protocol: 'NGAP',
            type: 'Control Plane',
            flow: 'gNB ↔ AMF (Control Signaling)',
            sharedTopology: 'N1 and N2 share same topology'
        });
    }

    console.log('✅ N2 Interface deployment complete');
    return { ue, gnb, amf };
}
/**
 * Deploy N3 Interface (User Plane - Data Path)
 */
async deployN3Interface() {
    console.log('🚀 Deploying N3 Interface...');

    const n3Def = this.interfaceDefinitions['N3'];

    // Step 1: Deploy UE
    const ue = await this.deployNF('UE', { x: 100, y: 150 });
    await this.delay(500);

    // Step 2: Deploy gNB
    const gnb = await this.deployNF('gNB', { x: 350, y: 150 });
    await this.delay(500);

    // Step 3: Deploy UPF
    const upf = await this.deployNF('UPF', { x: 600, y: 150 });
    await this.delay(500);

    await this.delay(500);

    // Step 4: Create connections (N3 only — N6 is deployed separately via N6 interface)
    console.log('🔗 Creating N3 interface connections...');

    if (window.connectionManager) {
        // Connection 1: UE → gNB (N1 - same as N1 interface)
const ueToGnb = {
    id: `conn-${Date.now()}-1`,
    sourceId: ue.id,
    targetId: gnb.id,
    type: 'manual',
    showVisual: true,
    createdAt: new Date(),
    options: {
        label: 'N1 (NAS/RRC)',    // ✅ SAME AS N1 INTERFACE
        color: '#3498db',          // ✅ BLUE COLOR
        style: 'solid',
        interfaceType: 'N1-RRC',
        lineWidth: 3
    }
};
        
        window.dataStore.addConnection(ueToGnb);
        console.log('✅ UE → gNB connection created (Radio)');
        await this.delay(300);

        // Connection 2: gNB → UPF (N3 Tunnel) - THE IMPORTANT ONE
        const gnbToUpf = {
            id: `conn-${Date.now()}-2`,
            sourceId: gnb.id,
            targetId: upf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N3 Tunnel',
                color: '#f39c12',  // Orange
                style: 'solid',
                interfaceType: 'N3',
                lineWidth: 4,  // Thicker line for data plane
                isDashed: false
            }
        };
        
        window.dataStore.addConnection(gnbToUpf);
        console.log('✅ gNB → UPF connection created (N3 Tunnel)');
    }

    // Step 5: Mark N3 as deployed
    this.deployedInterfaces.set('N3', {
        interface: n3Def,
        nfs: { UE: ue, gNB: gnb, UPF: upf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N3');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N3 Interface deployed successfully', {
            components: 'UE, gNB, UPF',
            protocol: 'GTP-U (GPRS Tunneling Protocol - User Plane)',
            type: 'User Plane',
            flow: 'UE → gNB (Radio) → UPF (N3 Tunnel)',
            dataPath: 'Complete user data path established',
            note: 'No connections to service bus - pure data plane'
        });
    }

    console.log('✅ N3 Interface deployment complete');
    console.log('📊 Data Path: UE → gNB → UPF (N3)');
    return { ue, gnb, upf };
}

/**
 * Deploy N4 Interface (Control Plane - SMF to UPF)
 */
async deployN4Interface() {
    console.log('🚀 Deploying N4 Interface...');

    const n4Def = this.interfaceDefinitions['N4'];

    // Step 1: Deploy UE
    const ue = await this.deployNF('UE', { x: 80, y: 80 });
    await this.delay(500);

    // Step 2: Deploy gNB
    const gnb = await this.deployNF('gNB', { x: 280, y: 80 });
    await this.delay(500);

    // Step 3: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 480, y: 80 });
    await this.delay(500);

    // Step 4: Deploy SMF
    const smf = await this.deployNF('SMF', { x: 680, y: 200 });
    await this.delay(500);

    // Step 5: Deploy UPF
    const upf = await this.deployNF('UPF', { x: 880, y: 80 });
    await this.delay(500);

    // Step 6: Create connections
console.log('🔗 Creating N4 interface connections...');

// Check if N1 or N2 is already deployed (both have N2 connection)
const n1Deployed = this.isInterfaceDeployed('N1');
const n2Deployed = this.isInterfaceDeployed('N2');
const n2ConnectionExists = n1Deployed || n2Deployed;

if (window.connectionManager) {
    // Connection 1: UE → gNB (N1)
    const ueToGnb = {
        id: `conn-${Date.now()}-1`,
        sourceId: ue.id,
        targetId: gnb.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: 'N1 (NAS/RRC)',
            color: '#3498db',  // Blue
            style: 'solid',
            interfaceType: 'N1',
            lineWidth: 3
        }
    };
    
    window.dataStore.addConnection(ueToGnb);
    console.log('✅ UE → gNB connection created (N1)');
    await this.delay(300);

    // Connection 2: gNB → AMF (N2) - ONLY if N1/N2 not already deployed
    if (!n2ConnectionExists) {
        const gnbToAmf = {
            id: `conn-${Date.now()}-2`,
            sourceId: gnb.id,
            targetId: amf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N2 (NGAP)',
                color: '#e91e63',  // Pink
                style: 'solid',
                interfaceType: 'N2',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(gnbToAmf);
        console.log('✅ gNB → AMF connection created (N2)');
        await this.delay(300);
    } else {
        console.log('ℹ️ N1/N2 already deployed - reusing existing N2 connection between gNB and AMF');
    }


    // Connection 3: SMF → UPF (N4 - PFCP) - THE MAIN ONE
    const smfToUpf = {
        id: `conn-${Date.now()}-3`,
        sourceId: smf.id,
        targetId: upf.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: 'N4 (PFCP)',
            color: '#e74c3c',  // Red
            style: 'solid',
            interfaceType: 'N4',
            lineWidth: 4
        }
    };
    
    window.dataStore.addConnection(smfToUpf);
    console.log('✅ SMF → UPF connection created (N4 - PFCP)');
await this.delay(300);

    // Connection 4: AMF ↔ SMF - Green dotted line
    const amfToSmf = {
        id: `conn-${Date.now()}-4`,
        sourceId: amf.id,
        targetId: smf.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: '',
            color: '#2ecc71',  // Green
            style: 'dashed',   // Dotted line
            interfaceType: 'Namf-SBI',
            lineWidth: 3
        }
    };
    
    window.dataStore.addConnection(amfToSmf);
    console.log('✅ AMF ↔ SMF connection created');
}

// Step 7: Connect AMF and SMF to Service Bus (they communicate via SBI)
console.log('🚌 Connecting AMF and SMF to Service Bus for SBI communication...');

let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

if (!serviceBus && window.busManager) {
    serviceBus = window.busManager.createBusLine({
        position: { x: 150, y: 280 },
        length: 800,
        orientation: 'horizontal',
        name: 'Service Bus'
    });
    console.log('✅ Service Bus created');
}

if (serviceBus && window.busManager) {
    // Connect AMF to bus
    await this.delay(300);
    window.busManager.connectNFToBus(amf.id, serviceBus.id);
    console.log('✅ AMF connected to Service Bus');

    // Connect SMF to bus
    await this.delay(300);
    window.busManager.connectNFToBus(smf.id, serviceBus.id);
    console.log('✅ SMF connected to Service Bus');
    
    console.log('ℹ️ AMF and SMF communicate via Service Bus (SBI - Namf interface)');
    console.log('ℹ️ UE, gNB, and UPF are NOT connected to bus');
}

    // Step 8: Mark N4 as deployed
    this.deployedInterfaces.set('N4', {
        interface: n4Def,
        nfs: { UE: ue, gNB: gnb, AMF: amf, SMF: smf, UPF: upf },
        deployedAt: new Date()
    });

    // Step 9: Update left sidebar
    this.markInterfaceDeployed('N4');

    // Step 10: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N4 Interface deployed successfully', {
            components: 'UE, gNB, AMF, SMF, UPF',
            protocol: 'PFCP (Packet Forwarding Control Protocol)',
            type: 'Control Plane',
            flow: 'UE → gNB (N1) → AMF (N2) → SMF (Namf) → UPF (N4/PFCP)',
            busConnections: 'AMF and SMF connected to Service Bus',
            note: 'SMF controls UPF packet forwarding via PFCP'
        });
    }

    console.log('✅ N4 Interface deployment complete');
    console.log('📊 Control Path: UE → gNB → AMF → SMF → UPF');
    console.log('🚌 Bus Connections: AMF, SMF only');
    return { ue, gnb, amf, smf, upf };
}

/**
 * Deploy N5 Interface (AF to PCF - Policy Control)
 */
async deployN5Interface() {
    console.log('🚀 Deploying N5 Interface...');

    const n5Def = this.interfaceDefinitions['N5'];

    // Step 1: Deploy AF (Application Function)
    const af = await this.deployNF('AF', { x: 250, y: 150 });
    await this.delay(500);

    // Step 2: Deploy PCF (Policy Control Function)
    const pcf = await this.deployNF('PCF', { x: 700, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus
    console.log('🚌 Creating Service Bus for N5 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect AF and PCF to Service Bus (for discovery)
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(af.id, serviceBus.id);
        console.log('✅ AF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(pcf.id, serviceBus.id);
        console.log('✅ PCF connected to Service Bus');
    }

    // Step 5: Create direct N5 connection between AF and PCF
    console.log('🔗 Creating N5 direct connection...');
    
    if (window.connectionManager) {
        const n5Connection = {
            id: `conn-n5-${Date.now()}`,
            sourceId: af.id,
            targetId: pcf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N5',
                color: '#2ecc71',  // Green color
                style: 'dashed',   // Dotted line
                interfaceType: 'N5',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(n5Connection);
        console.log('✅ N5 direct connection created between AF and PCF');
    }

    // Step 6: Mark N5 as deployed
    this.deployedInterfaces.set('N5', {
        interface: n5Def,
        nfs: { AF: af, PCF: pcf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N5');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N5 Interface deployed successfully', {
            components: 'AF, PCF',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N5 (Npcf_PolicyAuthorization)',
            communication: 'Via Service Bus',
            note: 'Applications request policy decisions from PCF'
        });
    }

    console.log('✅ N5 Interface deployment complete');
    console.log('📊 Communication: AF ↔ Service Bus ↔ PCF');
    return { af, pcf };
}

/**
 * Deploy N6 Interface (User Plane - UPF to Data Network)
 */
async deployN6Interface() {
    console.log('🚀 Deploying N6 Interface...');

    const n6Def = this.interfaceDefinitions['N6'];

    
    let ue, gnb, upf, dataNetwork;

    // Check if N3 is already deployed
    const n3Deployed = this.isInterfaceDeployed('N3');
    
    if (n3Deployed) {
        console.log('✅ N3 already deployed - reusing existing NFs');
        const n3Config = this.getN3Configuration();
        ue = n3Config.nfs.UE;
        gnb = n3Config.nfs.gNB;
        upf = n3Config.nfs.UPF;
        dataNetwork = n3Config.nfs.DataNetwork || this.createExtDnDataNetwork({ x: 850, y: 150 });
        
        console.log('✅ Reusing: UE, gNB, UPF from N3');
    } else {
        console.log('📦 N3 not deployed - creating new NFs');
        
        // Step 1: Deploy UE
        ue = await this.deployNF('UE', { x: 100, y: 150 });
        await this.delay(500);

        // Step 2: Deploy gNB
        gnb = await this.deployNF('gNB', { x: 350, y: 150 });
        await this.delay(500);

        // Step 3: Deploy UPF
        upf = await this.deployNF('UPF', { x: 600, y: 150 });
        await this.delay(500);

        dataNetwork = this.createExtDnDataNetwork({ x: 850, y: 150 });
        await this.delay(500);

        // Step 5: Create connections (N1, N3)
        console.log('🔗 Creating connections...');

        if (window.connectionManager) {
            // Connection 1: UE → gNB (N1)
            const ueToGnb = {
                id: `conn-${Date.now()}-1`,
                sourceId: ue.id,
                targetId: gnb.id,
                type: 'manual',
                showVisual: true,
                createdAt: new Date(),
                options: {
                    label: 'N1 (NAS/RRC)',
                    color: '#3498db',
                    style: 'solid',
                    interfaceType: 'N1-RRC',
                    lineWidth: 3
                }
            };
            
            window.dataStore.addConnection(ueToGnb);
            console.log('✅ UE → gNB connection created (N1)');
            await this.delay(300);

            // Connection 2: gNB → UPF (N3 Tunnel)
            const gnbToUpf = {
                id: `conn-${Date.now()}-2`,
                sourceId: gnb.id,
                targetId: upf.id,
                type: 'manual',
                showVisual: true,
                createdAt: new Date(),
                options: {
                    label: 'N3 Tunnel',
                    color: '#f39c12',
                    style: 'solid',
                    interfaceType: 'N3',
                    lineWidth: 4
                }
            };
            
            window.dataStore.addConnection(gnbToUpf);
            console.log('✅ gNB → UPF connection created (N3)');
            await this.delay(300);
        }
    }

    // =============================================
    // ALWAYS CREATE N6 CONNECTION (UPF → ext-dn)
    // =============================================
    console.log('🔗 Creating N6 connection...');

    // Check if N6 connection already exists
    const existingConnections = window.dataStore?.getAllConnections() || [];
    const n6Exists = existingConnections.some(conn => 
        conn.options?.label === 'N6' &&
        conn.sourceId === upf.id &&
        conn.targetId === dataNetwork.id
    );

    if (!n6Exists && window.connectionManager) {
        const upfToInternet = {
            id: `conn-${Date.now()}-n6`,
            sourceId: upf.id,
            targetId: dataNetwork.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N6',
                color: '#16a085',
                style: 'solid',
                interfaceType: 'N6',
                lineWidth: 4
            }
        };
        
        window.dataStore.addConnection(upfToInternet);
        console.log('✅ UPF → ext-dn connection created (N6)');
    } else {
        console.log('ℹ️ N6 connection already exists');
    }

    // Mark N6 as deployed
    this.deployedInterfaces.set('N6', {
        interface: n6Def,
        nfs: { UE: ue, gNB: gnb, UPF: upf, DataNetwork: dataNetwork },
        deployedAt: new Date()
    });

    // Update left sidebar
    this.markInterfaceDeployed('N6');

    // Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N6 Interface deployed successfully', {
            components: n3Deployed ? 'Reused existing NFs' : 'UE, gNB, UPF, ext-dn',
            protocol: 'IP',
            type: 'User Plane',
            flow: 'UPF → ext-dn (N6)',
            reusedFromN3: n3Deployed
        });
    }

    console.log('✅ N6 Interface deployment complete');
    return { ue, gnb, upf, dataNetwork };
}

/**
 * Deploy N7 Interface (SMF to PCF - Policy Control)
 */
async deployN7Interface() {
    console.log('🚀 Deploying N7 Interface...');

    const n7Def = this.interfaceDefinitions['N7'];

    // Step 1: Deploy SMF
    const smf = await this.deployNF('SMF', { x: 300, y: 150 });
    await this.delay(500);

    // Step 2: Deploy PCF
    const pcf = await this.deployNF('PCF', { x: 650, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus (for discovery)
    console.log('🚌 Creating Service Bus for N7 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect SMF and PCF to Service Bus (for discovery)
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(smf.id, serviceBus.id);
        console.log('✅ SMF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(pcf.id, serviceBus.id);
        console.log('✅ PCF connected to Service Bus');
    }

    // Step 5: Create direct N7 connection between SMF and PCF
    console.log('🔗 Creating N7 direct connection...');
    
    if (window.connectionManager) {
        const n7Connection = {
            id: `conn-n7-${Date.now()}`,
            sourceId: smf.id,
            targetId: pcf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N7',
                color: '#2ecc71',  // Green color 
                style: 'dashed',   // Dotted line
                interfaceType: 'N7',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(n7Connection);
        console.log('✅ N7 direct connection created between SMF and PCF');
    }

    // Step 6: Mark N7 as deployed
    this.deployedInterfaces.set('N7', {
        interface: n7Def,
        nfs: { SMF: smf, PCF: pcf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N7');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N7 Interface deployed successfully', {
            components: 'SMF, PCF',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N7 (Npcf_SMPolicyControl)',
            communication: 'Direct connection with Service Bus for discovery',
            note: 'SMF requests policy decisions from PCF for PDU sessions'
        });
    }

    console.log('✅ N7 Interface deployment complete');
    console.log('📊 Communication: SMF ↔ PCF (Direct N7 + Service Bus)');
    return { smf, pcf };
}

/**
 * Deploy N8 Interface (AMF to UDM - Subscriber Data)
 */
async deployN8Interface() {
    console.log('🚀 Deploying N8 Interface...');

    const n8Def = this.interfaceDefinitions['N8'];

    // Step 1: Deploy UE
    const ue = await this.deployNF('UE', { x: 100, y: 150 });
    await this.delay(500);

    // Step 2: Deploy gNB
    const gnb = await this.deployNF('gNB', { x: 350, y: 150 });
    await this.delay(500);

    // Step 3: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 600, y: 150 });
    await this.delay(500);

    // Step 4: Deploy UDM
    const udm = await this.deployNF('UDM', { x: 850, y: 150 });
    await this.delay(500);

    // Step 5: Create connections
    console.log('🔗 Creating N8 interface connections...');

    // Check if N1/N2 already deployed
    const n1Deployed = this.isInterfaceDeployed('N1');
    const n2Deployed = this.isInterfaceDeployed('N2');
    const n1n2Exists = n1Deployed || n2Deployed;

    if (window.connectionManager) {
        // Connection 1: UE → gNB (N1) - Only if not already deployed
        if (!n1n2Exists) {
            const ueToGnb = {
                id: `conn-${Date.now()}-1`,
                sourceId: ue.id,
                targetId: gnb.id,
                type: 'manual',
                showVisual: true,
                createdAt: new Date(),
                options: {
                    label: 'N1 (NAS/RRC)',
                    color: '#3498db',
                    style: 'solid',
                    interfaceType: 'N1',
                    lineWidth: 3
                }
            };
            
            window.dataStore.addConnection(ueToGnb);
            console.log('✅ UE → gNB connection created (N1)');
            await this.delay(300);

            // Connection 2: gNB → AMF (N2) - Only if not already deployed
            const gnbToAmf = {
                id: `conn-${Date.now()}-2`,
                sourceId: gnb.id,
                targetId: amf.id,
                type: 'manual',
                showVisual: true,
                createdAt: new Date(),
                options: {
                    label: 'N2 (NGAP)',
                    color: '#e91e63',
                    style: 'solid',
                    interfaceType: 'N2',
                    lineWidth: 3
                }
            };
            
            window.dataStore.addConnection(gnbToAmf);
            console.log('✅ gNB → AMF connection created (N2)');
            await this.delay(300);
        } else {
            console.log('ℹ️ N1/N2 already deployed - reusing existing connections');
        }

        // Connection 3: AMF → UDM (N8) - THE MAIN ONE (Green dotted line)
        const amfToUdm = {
            id: `conn-n8-${Date.now()}`,
            sourceId: amf.id,
            targetId: udm.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N8',
                color: '#2ecc71',  // White color
                style: 'dashed',
                interfaceType: 'N8',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(amfToUdm);
        console.log('✅ AMF → UDM connection created (N8 - White)');
        console.log('🔍 N8 Connection Details:', amfToUdm);
    }  

    // Step 6: Connect AMF and UDM to Service Bus
    console.log('🚌 Connecting AMF and UDM to Service Bus...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 350 },
            length: 800,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    if (serviceBus && window.busManager) {
        // Connect AMF to bus (if not already connected)
        const amfBusConnections = window.dataStore?.getBusConnectionsForNF(amf.id) || [];
        if (amfBusConnections.length === 0) {
            await this.delay(300);
            window.busManager.connectNFToBus(amf.id, serviceBus.id);
            console.log('✅ AMF connected to Service Bus');
        }

        // Connect UDM to bus
        await this.delay(300);
        window.busManager.connectNFToBus(udm.id, serviceBus.id);
        console.log('✅ UDM connected to Service Bus');
    }

    // Step 7: Mark N8 as deployed
    this.deployedInterfaces.set('N8', {
        interface: n8Def,
        nfs: { UE: ue, gNB: gnb, AMF: amf, UDM: udm },
        deployedAt: new Date()
    });

    // Step 8: Update left sidebar
    this.markInterfaceDeployed('N8');

    // Step 9: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N8 Interface deployed successfully', {
            components: 'UE, gNB, AMF, UDM',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N8 (Nudm_UECM)',
            flow: 'UE → gNB → AMF ← N8 → UDM',
            busConnections: 'AMF and UDM connected to Service Bus',
            note: 'AMF retrieves subscriber context from UDM'
        });
    }

    console.log('✅ N8 Interface deployment complete');
    return { ue, gnb, amf, udm };
}

/**
 * Deploy N10 Interface (SMF to UDM - Session Management Subscription Data)
 */
async deployN10Interface() {
    console.log('🚀 Deploying N10 Interface...');

    const n10Def = this.interfaceDefinitions['N10'];

    // Step 1: Deploy SMF
    const smf = await this.deployNF('SMF', { x: 300, y: 150 });
    await this.delay(500);

    // Step 2: Deploy UDM
    const udm = await this.deployNF('UDM', { x: 650, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus (for discovery)
    console.log('🚌 Creating Service Bus for N10 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect SMF and UDM to Service Bus
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(smf.id, serviceBus.id);
        console.log('✅ SMF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(udm.id, serviceBus.id);
        console.log('✅ UDM connected to Service Bus');
    }

    // Step 5: Create direct N10 connection between SMF and UDM
    console.log('🔗 Creating N10 direct connection...');
    
    const n10Connection = {
        id: `conn-n10-${Date.now()}`,
        sourceId: smf.id,
        targetId: udm.id,
        type: 'manual',
        showVisual: true,
        createdAt: new Date(),
        options: {
            label: 'N10',
            color: '#2ecc71',  // Green color
            style: 'dashed',    // 
            interfaceType: 'N10',
            lineWidth: 3
        }
    };
    
    window.dataStore.addConnection(n10Connection);
    console.log('✅ N10 direct connection created between SMF and UDM');
await this.delay(300);
if (window.canvasRenderer) {
    window.canvasRenderer.render();
    console.log('🎨 Canvas re-rendered to show N10 connection');
}

    // Step 6: Mark N10 as deployed
    this.deployedInterfaces.set('N10', {
        interface: n10Def,
        nfs: { SMF: smf, UDM: udm },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N10');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N10 Interface deployed successfully', {
            components: 'SMF, UDM',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N10 (Nudm_SDM)',
            communication: 'Direct connection with Service Bus for discovery',
            note: 'SMF retrieves session management subscription data from UDM'
        });
    }

    console.log('✅ N10 Interface deployment complete');
    console.log('📊 Communication: SMF ↔ UDM (Direct N10 + Service Bus)');
    return { smf, udm };
}

/**
 * Deploy N11 Interface (AMF to SMF - Session Management)
 */
async deployN11Interface() {
    console.log('🚀 Deploying N11 Interface...');

    const n11Def = this.interfaceDefinitions['N11'];

    // Step 1: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 300, y: 150 });
    await this.delay(500);

    // Step 2: Deploy SMF
    const smf = await this.deployNF('SMF', { x: 650, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus (for discovery)
    console.log('🚌 Creating Service Bus for N11 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect AMF and SMF to Service Bus (for discovery)
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(amf.id, serviceBus.id);
        console.log('✅ AMF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(smf.id, serviceBus.id);
        console.log('✅ SMF connected to Service Bus');
    }

    // Step 5: Create direct N11 connection between AMF and SMF
    console.log('🔗 Creating N11 direct connection...');
    
    if (window.connectionManager) {
        const n11Connection = {
            id: `conn-n11-${Date.now()}`,
            sourceId: amf.id,
            targetId: smf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N11',
                color: '#2ecc71',  // Green color
                style: 'dashed',   // Dotted line
                interfaceType: 'N11',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(n11Connection);
        console.log('✅ N11 direct connection created between AMF and SMF');
        
        // Render canvas
        await this.delay(300);
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
            console.log('🎨 Canvas re-rendered to show N11 connection');
        }
    }

    // Step 6: Mark N11 as deployed
    this.deployedInterfaces.set('N11', {
        interface: n11Def,
        nfs: { AMF: amf, SMF: smf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N11');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N11 Interface deployed successfully', {
            components: 'AMF, SMF',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N11 (Namf_Communication)',
            communication: 'Direct connection with Service Bus for discovery',
            note: 'AMF triggers SMF for PDU session management'
        });
    }

    console.log('✅ N11 Interface deployment complete');
    console.log('📊 Communication: AMF ↔ SMF (Direct N11 + Service Bus)');
    return { amf, smf };
}

/**
 * Deploy N12 Interface (AMF to AUSF - Authentication)
 */
async deployN12Interface() {
    console.log('🚀 Deploying N12 Interface...');

    const n12Def = this.interfaceDefinitions['N12'];

    // Step 1: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 300, y: 150 });
    await this.delay(500);

    // Step 2: Deploy AUSF
    const ausf = await this.deployNF('AUSF', { x: 650, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus (for discovery)
    console.log('🚌 Creating Service Bus for N12 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect AMF and AUSF to Service Bus (for discovery)
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(amf.id, serviceBus.id);
        console.log('✅ AMF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(ausf.id, serviceBus.id);
        console.log('✅ AUSF connected to Service Bus');
    }

    // Step 5: Create direct N12 connection between AMF and AUSF
    console.log('🔗 Creating N12 direct connection...');
    
    if (window.connectionManager) {
        const n12Connection = {
            id: `conn-n12-${Date.now()}`,
            sourceId: amf.id,
            targetId: ausf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N12',
                color: '#2ecc71',  // Green color
                style: 'dashed',   // Dotted line
                interfaceType: 'N12',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(n12Connection);
        console.log('✅ N12 direct connection created between AMF and AUSF');
        
        // Render canvas
        await this.delay(300);
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
            console.log('🎨 Canvas re-rendered to show N12 connection');
        }
    }

    // Step 6: Mark N12 as deployed
    this.deployedInterfaces.set('N12', {
        interface: n12Def,
        nfs: { AMF: amf, AUSF: ausf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N12');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N12 Interface deployed successfully', {
            components: 'AMF, AUSF',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N12 (Nausf_UEAuthentication)',
            communication: 'Direct connection with Service Bus for discovery',
            note: 'AMF requests UE authentication from AUSF'
        });
    }

    console.log('✅ N12 Interface deployment complete');
    console.log('📊 Communication: AMF ↔ AUSF (Direct N12 + Service Bus)');
    return { amf, ausf };
}

/**
 * Deploy N13 Interface (AMF to NRF - Service Discovery)
 */
async deployN13Interface() {
    console.log('🚀 Deploying N13 Interface...');

    const n13Def = this.interfaceDefinitions['N13'];

    // Step 1: Deploy AMF
    const amf = await this.deployNF('AMF', { x: 300, y: 150 });
    await this.delay(500);

    // Step 2: Deploy NRF
    const nrf = await this.deployNF('NRF', { x: 650, y: 150 });
    await this.delay(500);

    // Step 3: Create Service Bus (for discovery)
    console.log('🚌 Creating Service Bus for N13 communication...');

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');

    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
        console.log('✅ Service Bus created');
    }

    // Step 4: Connect AMF and NRF to Service Bus (for discovery)
    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(amf.id, serviceBus.id);
        console.log('✅ AMF connected to Service Bus');

        await this.delay(300);
        window.busManager.connectNFToBus(nrf.id, serviceBus.id);
        console.log('✅ NRF connected to Service Bus');
    }

    // Step 5: Create direct N13 connection between AMF and NRF
    console.log('🔗 Creating N13 direct connection...');
    
    if (window.connectionManager) {
        const n13Connection = {
            id: `conn-n13-${Date.now()}`,
            sourceId: amf.id,
            targetId: nrf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N13',
                color: '#2ecc71',  // Green color
                style: 'dashed',   // Dotted line
                interfaceType: 'N13',
                lineWidth: 3
            }
        };
        
        window.dataStore.addConnection(n13Connection);
        console.log('✅ N13 direct connection created between AMF and NRF');
        
        // Render canvas
        await this.delay(300);
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
            console.log('🎨 Canvas re-rendered to show N13 connection');
        }
    }

    // Step 6: Mark N13 as deployed
    this.deployedInterfaces.set('N13', {
        interface: n13Def,
        nfs: { AMF: amf, NRF: nrf },
        deployedAt: new Date()
    });

    // Step 7: Update left sidebar
    this.markInterfaceDeployed('N13');

    // Step 8: Log deployment
    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS',
            'N13 Interface deployed successfully', {
            components: 'AMF, NRF',
            protocol: 'HTTP/2 (Service-Based Interface)',
            type: 'Control Plane',
            interface: 'N13 (Nnrf_NFDiscovery, Nnrf_NFManagement)',
            communication: 'Direct connection with Service Bus for discovery',
            note: 'AMF discovers and registers with NRF'
        });
    }

    console.log('✅ N13 Interface deployment complete');
    console.log('📊 Communication: AMF ↔ NRF (Direct N13 + Service Bus)');
    return { amf, nrf };
}

/**
 * Deploy N22 Interface (AMF to NSSF)
 */
async deployN22Interface() {
    console.log('🚀 Deploying N22 Interface...');
    const n22Def = this.interfaceDefinitions['N22'];

    const amf = await this.deployNF('AMF', { x: 300, y: 150 });
    await this.delay(500);
    const nssf = await this.deployNF('NSSF', { x: 650, y: 150 });
    await this.delay(500);

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');
    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
    }

    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(amf.id, serviceBus.id);
        await this.delay(300);
        window.busManager.connectNFToBus(nssf.id, serviceBus.id);
    }

    const existingConnections = window.dataStore?.getAllConnections() || [];
    const n22Exists = existingConnections.some(conn =>
        conn.options?.interfaceType === 'N22' &&
        ((conn.sourceId === amf.id && conn.targetId === nssf.id) ||
         (conn.sourceId === nssf.id && conn.targetId === amf.id))
    );

    if (!n22Exists && window.dataStore) {
        window.dataStore.addConnection({
            id: `conn-n22-${Date.now()}`,
            sourceId: amf.id,
            targetId: nssf.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N22',
                color: '#1abc9c',
                style: 'dashed',
                interfaceType: 'N22',
                lineWidth: 3
            }
        });
    }

    this.deployedInterfaces.set('N22', {
        interface: n22Def,
        nfs: { AMF: amf, NSSF: nssf },
        deployedAt: new Date()
    });
    this.markInterfaceDeployed('N22');

    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS', 'N22 Interface deployed successfully', {
            components: 'AMF, NSSF',
            interface: 'N22 (AMF ↔ NSSF)'
        });
    }

    if (window.canvasRenderer) {
        window.canvasRenderer.render();
    }
    return { amf, nssf };
}

/**
 * Deploy N35 Interface (UDM to UDR)
 */
async deployN35Interface() {
    console.log('🚀 Deploying N35 Interface...');
    const n35Def = this.interfaceDefinitions['N35'];

    const udm = await this.deployNF('UDM', { x: 300, y: 150 });
    await this.delay(500);
    const udr = await this.deployNF('UDR', { x: 650, y: 150 });
    await this.delay(500);

    let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');
    if (!serviceBus && window.busManager) {
        serviceBus = window.busManager.createBusLine({
            position: { x: 200, y: 300 },
            length: 700,
            orientation: 'horizontal',
            name: 'Service Bus'
        });
    }

    if (serviceBus && window.busManager) {
        await this.delay(300);
        window.busManager.connectNFToBus(udm.id, serviceBus.id);
        await this.delay(300);
        window.busManager.connectNFToBus(udr.id, serviceBus.id);
    }

    const existingConnections = window.dataStore?.getAllConnections() || [];
    const n35Exists = existingConnections.some(conn =>
        conn.options?.interfaceType === 'N35' &&
        ((conn.sourceId === udm.id && conn.targetId === udr.id) ||
         (conn.sourceId === udr.id && conn.targetId === udm.id))
    );

    if (!n35Exists && window.dataStore) {
        window.dataStore.addConnection({
            id: `conn-n35-${Date.now()}`,
            sourceId: udm.id,
            targetId: udr.id,
            type: 'manual',
            showVisual: true,
            createdAt: new Date(),
            options: {
                label: 'N35',
                color: '#8e44ad',
                style: 'dashed',
                interfaceType: 'N35',
                lineWidth: 3
            }
        });
    }

    this.deployedInterfaces.set('N35', {
        interface: n35Def,
        nfs: { UDM: udm, UDR: udr },
        deployedAt: new Date()
    });
    this.markInterfaceDeployed('N35');

    if (window.logEngine) {
        window.logEngine.addLog('system', 'SUCCESS', 'N35 Interface deployed successfully', {
            components: 'UDM, UDR',
            interface: 'N35 (UDM ↔ UDR)'
        });
    }

    if (window.canvasRenderer) {
        window.canvasRenderer.render();
    }
    return { udm, udr };
}

    /**
     * Deploy N4 for core (SMF ↔ UPF only, no gNB/UE)
     */
    async deployN4CoreInterface() {
        console.log('🚀 Deploying N4 Interface (core)...');
        const n4Def = this.interfaceDefinitions['N4'];

        const smf = await this.deployNF('SMF', { x: 680, y: 200 });
        await this.delay(500);
        const upf = await this.deployNF('UPF', { x: 880, y: 80 });
        await this.delay(500);

        if (window.connectionManager) {
            const existingConnections = window.dataStore?.getAllConnections() || [];
            const n4Exists = existingConnections.some(conn =>
                conn.options?.interfaceType === 'N4' &&
                conn.sourceId === smf.id &&
                conn.targetId === upf.id
            );

            if (!n4Exists) {
                window.dataStore.addConnection({
                    id: `conn-n4-core-${Date.now()}`,
                    sourceId: smf.id,
                    targetId: upf.id,
                    type: 'manual',
                    showVisual: true,
                    createdAt: new Date(),
                    options: {
                        label: 'N4 (PFCP)',
                        color: '#e74c3c',
                        style: 'solid',
                        interfaceType: 'N4',
                        lineWidth: 4
                    }
                });
                console.log('✅ SMF → UPF N4 connection created');
            }
        }

        let serviceBus = window.dataStore?.getAllBuses().find(b => b.name === 'Service Bus');
        if (!serviceBus && window.busManager) {
            serviceBus = window.busManager.createBusLine({
                position: { x: 150, y: 280 },
                length: 800,
                orientation: 'horizontal',
                name: 'Service Bus'
            });
        }
        if (serviceBus && window.busManager) {
            await this.delay(300);
            window.busManager.connectNFToBus(smf.id, serviceBus.id);
        }

        this.deployedInterfaces.set('N4', {
            interface: n4Def,
            nfs: { SMF: smf, UPF: upf },
            deployedAt: new Date(),
            coreOnly: true
        });
        this.markInterfaceDeployed('N4');

        if (window.logEngine) {
            window.logEngine.addLog('system', 'SUCCESS', 'N4 Interface deployed (core)', {
                components: 'SMF, UPF',
                protocol: 'PFCP',
                note: 'No gNB/UE — core docker deployment'
            });
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
        return { smf, upf };
    }

    /**
     * Deploy N6 for core (UPF ↔ ext-dn only, no gNB/UE)
     */
    async deployN6CoreInterface() {
        console.log('🚀 Deploying N6 Interface (core)...');
        const n6Def = this.interfaceDefinitions['N6'];

        const upf = await this.deployNF('UPF', { x: 600, y: 150 });
        await this.delay(500);
        const dataNetwork = this.createExtDnDataNetwork({ x: 850, y: 150 });
        await this.delay(300);

        const existingConnections = window.dataStore?.getAllConnections() || [];
        const n6Exists = existingConnections.some(conn =>
            conn.options?.interfaceType === 'N6' &&
            conn.sourceId === upf.id &&
            conn.targetId === dataNetwork.id
        );

        if (!n6Exists && window.dataStore) {
            window.dataStore.addConnection({
                id: `conn-n6-core-${Date.now()}`,
                sourceId: upf.id,
                targetId: dataNetwork.id,
                type: 'manual',
                showVisual: true,
                createdAt: new Date(),
                options: {
                    label: 'N6',
                    color: '#16a085',
                    style: 'solid',
                    interfaceType: 'N6',
                    lineWidth: 4
                }
            });
            console.log('✅ UPF → ext-dn N6 connection created');
        }

        this.deployedInterfaces.set('N6', {
            interface: n6Def,
            nfs: { UPF: upf, DataNetwork: dataNetwork },
            deployedAt: new Date(),
            coreOnly: true
        });
        this.markInterfaceDeployed('N6');

        if (window.logEngine) {
            window.logEngine.addLog('system', 'SUCCESS', 'N6 Interface deployed (core)', {
                components: 'UPF, ext-dn',
                protocol: 'IP',
                note: 'No gNB/UE — core docker deployment'
            });
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
        return { upf, dataNetwork };
    }

    /**
     * Deploy a Network Function
     */
    async deployNF(type, position) {
        console.log(`📦 Deploying ${type}...`);

        // Check if already exists
        const existing = window.dataStore?.getAllNFs().find(nf => nf.type === type);
        if (existing) {
            console.log(`ℹ️ ${type} already exists`);
            return existing;
        }

        // Create NF
        if (window.nfManager) {
            const nf = window.nfManager.createNetworkFunction(type, position);
            
            if (nf) {
                // Log creation
                if (window.logEngine) {
                    window.logEngine.addLog(nf.id, 'SUCCESS',
                        `${type} deployed for N1 interface`, {
                        ipAddress: nf.config.ipAddress,
                        port: nf.config.port,
                        subnet: window.nfManager.getNetworkFromIP(nf.config.ipAddress) + '.0/24',
                        autoDeployed: true
                    });
                }

                // Render
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }

                return nf;
            }
        }

        console.error(`❌ Failed to deploy ${type}`);
        return null;
    }

    /**
     * Mark interface as deployed in sidebar
     */
    markInterfaceDeployed(interfaceId) {
    const palette = document.querySelector('.nf-palette');
    if (!palette) return;

    const items = palette.querySelectorAll('.network-interface-item');
    items.forEach(item => {
        if (item.dataset.interfaceId === interfaceId) {
            item.classList.add('deployed');
            
            // Add SINGLE checkmark only if not already added
            if (!item.querySelector('.deployed-check')) {
                const check = document.createElement('div');
                check.className = 'deployed-check';
                check.innerHTML = '✓';
                check.style.cssText = `
                    color: #2ecc71;
                    font-weight: bold;
                    font-size: 18px;
                    margin-left: auto;
                `;
                item.appendChild(check);
            }
        }
    });
}

    /**
     * Get N1 Configuration for display
     */
    getN1Configuration() {
        const deployment = this.deployedInterfaces.get('N1');
        
        if (!deployment) {
            return null;
        }

        return {
            interface: deployment.interface,
            nfs: deployment.nfs,
            deployedAt: deployment.deployedAt
        };
    }

/**
 * Get N2 Configuration for display
 */
getN2Configuration() {
    const deployment = this.deployedInterfaces.get('N2');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt,
        sharedWith: deployment.sharedWith
    };
}

/**
 * Get N3 Configuration for display
 */
getN3Configuration() {
    const deployment = this.deployedInterfaces.get('N3');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N4 Configuration for display
 */
getN4Configuration() {
    const deployment = this.deployedInterfaces.get('N4');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N5 Configuration for display
 */
getN5Configuration() {
    const deployment = this.deployedInterfaces.get('N5');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N6 Configuration for display
 */
getN6Configuration() {
    const deployment = this.deployedInterfaces.get('N6');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N7 Configuration for display
 */
getN7Configuration() {
    const deployment = this.deployedInterfaces.get('N7');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N8 Configuration for display
 */
getN8Configuration() {
    const deployment = this.deployedInterfaces.get('N8');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N10 Configuration for display
 */
getN10Configuration() {
    const deployment = this.deployedInterfaces.get('N10');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N11 Configuration for display
 */
getN11Configuration() {
    const deployment = this.deployedInterfaces.get('N11');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N12 Configuration for display
 */
getN12Configuration() {
    const deployment = this.deployedInterfaces.get('N12');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

/**
 * Get N13 Configuration for display
 */
getN13Configuration() {
    const deployment = this.deployedInterfaces.get('N13');
    
    if (!deployment) {
        return null;
    }

    return {
        interface: deployment.interface,
        nfs: deployment.nfs,
        deployedAt: deployment.deployedAt
    };
}

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if interface is deployed
     */
    isInterfaceDeployed(interfaceId) {
        if (!this.deployedInterfaces.has(interfaceId)) {
            return false;
        }
        
        // Check if all required NFs still exist
        const interfaceConfig = this.deployedInterfaces.get(interfaceId);
        if (!interfaceConfig || !interfaceConfig.nfs) {
            return false;
        }
        
        const interfaceDef = interfaceConfig.interface;
        if (interfaceDef && interfaceDef.requiredNFs) {
            // Verify all required NFs still exist in dataStore
            const allNFs = window.dataStore?.getAllNFs() || [];
            const existingNFTypes = new Set(allNFs.map(nf => nf.type));
            
            const allRequiredNFsExist = interfaceDef.requiredNFs.every(requiredType => {
                // Check if required NF type exists in the interface's nfs object
                const nfInInterface = Object.values(interfaceConfig.nfs).find(nf => nf && nf.type === requiredType);
                if (!nfInInterface) {
                    return false;
                }
                // Also verify the NF still exists in dataStore
                return existingNFTypes.has(requiredType) && 
                       allNFs.some(nf => nf.id === nfInInterface.id);
            });
            
            if (!allRequiredNFsExist) {
                // Interface is incomplete, allow redeployment
                console.log(`⚠️ ${interfaceId} interface is incomplete - missing required NFs`);
                return false;
            }
        }
        
        return true;
    }
}

console.log('✅ InterfaceManager class loaded');