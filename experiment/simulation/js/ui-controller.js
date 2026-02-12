/**
 * Main class definition and initialization
 */

class UIController {
    constructor() {
        this.connectionMode = 'idle';
        this.selectedSourceNF = null;
        this.selectedDestinationNF = null;
        this.selectedSourceBus = null;
        console.log('✅ UIController initialized');
    }

    init() {
        console.log('🎮 Initializing UI...');
        this.setupAddNFButton();
        this.setupDeployAllButton();
        this.setupClearButton();
        this.setupValidateButton();
        this.setupHelpButton();
        this.setupTerminalButton();
        this.setupConnectionButtons();
        this.setupNFPalette();
        this.setupConfigPanelToggle();
        this.initializeLogPanel();
        this.setupKeyboardShortcuts();
        console.log('✅ UI initialized');
    }

    // ==========================================
    // NF PALETTE SETUP
    // ==========================================

    setupNFPalette() {
    const palette = document.querySelector('.nf-palette');
    if (!palette) {
        console.error('❌ Palette not found');
        return;
    }

    // Update sidebar heading
    const sidebarHeading = document.querySelector('.sidebar-left h3');
    if (sidebarHeading) {
        sidebarHeading.textContent = '📡 Network Interfaces';
    }

    // Network Interface definitions with proper 5G standard names
    const networkInterfaces = [
        {
            id: 'N1',
            name: 'N1 Interface',
            description: 'UE ↔ AMF (NAS)',
            color: '#3498db',
            icon: '📱',
            tooltip: 'Non-Access Stratum signaling between UE and AMF'
        },
        {
            id: 'N2',
            name: 'N2 Interface',
            description: 'gNB ↔ AMF (NGAP)',
            color: '#2ecc71',
            icon: '📡',
            tooltip: 'NG Application Protocol between RAN and AMF'
        },
        {
            id: 'N3',
            name: 'N3 Interface',
            description: 'gNB ↔ UPF (GTP-U)',
            color: '#f39c12',
            icon: '🔄',
            tooltip: 'User plane data between RAN and UPF'
        },
        {
            id: 'N4',
            name: 'N4 Interface',
            description: 'SMF ↔ UPF (PFCP)',
            color: '#e74c3c',
            icon: '⚙️',
            tooltip: 'Packet Forwarding Control Protocol'
        },
        {
            id: 'N5',
            name: 'N5 Interface',
            description: 'AF ↔ PCF (HTTP/2)',
            color: '#9b59b6',
            icon: '🌐',
            tooltip: 'Application Function to Policy Control'
        },
        {
            id: 'N6',
            name: 'N6 Interface',
            description: 'UPF ↔ DN (IP)',
            color: '#16a085',
            icon: '🌍',
            tooltip: 'Connection to Data Network (Internet)'
        },
        {
            id: 'N7',
            name: 'N7 Interface',
            description: 'SMF ↔ PCF (HTTP/2)',
            color: '#e67e22',
            icon: '📋',
            tooltip: 'Session Management Policy Control'
        },
{
    id: 'N8',
    name: 'N8 Interface',
    description: 'AMF ↔ UDM (HTTP/2)',
    color: '#3498db',
    icon: '👤',
    tooltip: 'Subscriber Data Management'
},
{
    id: 'N10',
    name: 'N10 Interface',
    description: 'SMF ↔ UDM (HTTP/2)',
    color: '#f1c40f',
    icon: '📊',
    tooltip: 'Session Management Subscription Data'
},
{   id: 'N11',
    name: 'N11 Interface',
    description: 'AMF ↔ SMF (HTTP/2)',
    color: '#2ecc71',
    icon: '🔗',
    tooltip: 'Session Management Control'
},
{  
    id: 'N12',
    name: 'N12 Interface',
    description: 'AMF ↔ AUSF (HTTP/2)',
    color: '#2ecc71',
    icon: '🔐',
    tooltip: 'UE Authentication Service'
},
{  
    id: 'N13',
    name: 'N13 Interface',
    description: 'AMF ↔ NRF (HTTP/2)',
    color: '#2ecc71',
    icon: '🔍',
    tooltip: 'NF Discovery and Registration'
}
    ];

    palette.innerHTML = ''; // Clear existing content

    networkInterfaces.forEach(ni => {
        const item = document.createElement('div');
        item.className = 'nf-palette-item network-interface-item';
        item.dataset.interfaceId = ni.id;
        item.title = ni.tooltip;

        item.innerHTML = `
            <div class="ni-icon" style="background: ${ni.color};">
                ${ni.icon}
            </div>
            <div class="ni-details">
                <div class="ni-name">${ni.id}</div>
                <div class="ni-desc">${ni.description}</div>
            </div>
        `;

        // Click handler - Deploy interface
        item.addEventListener('click', () => {
            console.log('🖱️ Network Interface clicked:', ni.id);
            this.deployNetworkInterface(ni.id);
        });

        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(5px)';
            item.style.background = 'rgba(52, 152, 219, 0.15)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
            item.style.background = 'rgba(52, 73, 94, 0.3)';
        });

        palette.appendChild(item);
    });

    console.log('✅ Network Interface palette initialized with', networkInterfaces.length, 'interfaces');
}

    updateNFPaletteStatus() {
        const palette = document.querySelector('.nf-palette');
        if (!palette) return;

        const allNFs = window.dataStore?.getAllNFs() || [];
        const existingTypes = new Set(allNFs.map(nf => nf.type));

        palette.querySelectorAll('.nf-palette-item').forEach(item => {
            const type = item.dataset.type;
            if (existingTypes.has(type)) {
                item.classList.add('disabled');
                item.style.opacity = '0.5';
                item.style.cursor = 'not-allowed';
                item.title = `${type} already exists (only one instance allowed)`;
            } else {
                item.classList.remove('disabled');
                item.style.opacity = '1';
                item.style.cursor = 'pointer';
                item.title = `Click to add ${type}`;
            }
        });
    }

    updateModalNFButtonStates() {
        const nfGrid = document.getElementById('nf-grid');
        if (!nfGrid) return;

        const allNFs = window.dataStore?.getAllNFs() || [];
        const existingTypes = new Set(allNFs.map(nf => nf.type));

        nfGrid.querySelectorAll('.nf-select-btn').forEach(btn => {
            const type = btn.dataset.type;
            if (existingTypes.has(type)) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = `${type} already exists (only one instance allowed)`;
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = `Click to add ${type}`;
            }
        });
    }

    createNFFromPalette(type) {
        console.log('🖱️ Palette item clicked:', type);
        
        if (this.isNFTypeAlreadyExists(type)) {
            alert(`❌ ${type} Already Exists!\n\nOnly ONE instance of each Network Function type is allowed.\n\n${type} is already running in your topology.`);
            return;
        }
        
        this.showNFConfigurationForNewNF(type);
    }

    // ==========================================
    // ADD NF BUTTON & MODAL
    // ==========================================

    setupAddNFButton() {
        const addNIBtn = document.getElementById('btn-add-ni') || document.getElementById('btn-add-nf');
        
        if (!addNIBtn) {
            console.error('❌ Add Network Interface button not found');
            return;
        }

        if (addNIBtn.textContent.includes('Add NF')) {
            addNIBtn.textContent = '➕ Add Network Interface';
            addNIBtn.id = 'btn-add-ni';
        }

        addNIBtn.addEventListener('click', () => {
            console.log('🖱️ Add Network Interface button clicked');
            this.showAddNetworkInterfaceModal();
        });

        this.setupAddNetworkInterfaceModal();
    }

/**
 * Setup Deploy All Interfaces Button
 */
setupDeployAllButton() {
    const deployAllBtn = document.getElementById('btn-deploy-all');
    
    if (!deployAllBtn) {
        console.error('❌ Deploy All button not found');
        return;
    }

    deployAllBtn.addEventListener('click', async () => {
        console.log('🚀 Deploy All Interfaces clicked');
        await this.deployAllInterfaces();
    });

    console.log('✅ Deploy All button initialized');
}

/**
 * Deploy all network interfaces sequentially with topology from 5g.json and logs from 5g-logs.json
 */
async deployAllInterfaces() {
    if (!window.interfaceManager) {
        alert('❌ Interface Manager not available. Please refresh the page.');
        return;
    }

    // Confirm before deploying
    const confirmed = confirm(
        '🚀 Deploy All Network Interfaces\n\n' +
        'This will:\n' +
        '• Clear canvas\n' +
        '• Create Service Bus' +
        '• Deploy all 12 interfaces one by one\n' +
        'Any existing topology will be cleared.\n\n' +
        'Continue?'
    );

    if (!confirmed) {
        return;
    }

    // Disable button during deployment
    const deployAllBtn = document.getElementById('btn-deploy-all');
    if (deployAllBtn) {
        deployAllBtn.disabled = true;
        deployAllBtn.textContent = '⏳ Deploying...';
    }

    try {
        console.log('═══════════════════════════════════════');
        console.log('🚀 DEPLOYING ALL INTERFACES FROM 5g.json');
        console.log('═══════════════════════════════════════');

        // Step 1: Load 5g.json topology
        let topologyResponse;
        const topologyPaths = ['../5g.json', './5g.json', '/5g.json', '5g.json'];
        let topologyLoaded = false;
        let topology = null;
        
        for (const path of topologyPaths) {
            try {
                topologyResponse = await fetch(path);
                if (topologyResponse.ok) {
                    topology = await topologyResponse.json();
                    topologyLoaded = true;
                    console.log(`✅ Topology loaded from ${path}`);
                    break;
                }
            } catch (e) {
                console.warn(`Failed to load topology from ${path}:`, e);
            }
        }
        
        if (!topologyLoaded || !topology) {
            throw new Error(`Failed to load 5g.json from any of these paths: ${topologyPaths.join(', ')}`);
        }

        // Step 2: Load logs from 5g-logs.json
        let logsResponse;
        const logPaths = ['../5g-logs.json', './5g-logs.json', '/5g-logs.json', '5g-logs.json'];
        let logsLoaded = false;
        let logsData = { logs: [] };
        
        for (const path of logPaths) {
            try {
                logsResponse = await fetch(path);
                if (logsResponse.ok) {
                    logsData = await logsResponse.json();
                    logsLoaded = true;
                    console.log(`✅ Logs loaded from ${path}`);
                    break;
                }
            } catch (e) {
                console.warn(`Failed to load logs from ${path}:`, e);
            }
        }
        
        if (!logsLoaded) {
            console.warn('⚠️ Could not load 5g-logs.json, continuing without logs');
        }

        // Step 3: Clear canvas and all data
        console.log('\n🧹 Clearing canvas...');
        if (window.dataStore) {
            window.dataStore.clearAll();
        }
        if (window.logEngine) {
            window.logEngine.clearAllLogs();
        }
        
        // Clear log UI
        const logContent = document.getElementById('log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }
        
        // Render empty canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
        console.log('✅ Canvas cleared');

        // Step 4: Create Service Bus from 5g.json
        console.log('\n🚌 Creating Service Bus ');
        if (topology.buses && topology.buses.length > 0 && window.dataStore) {
            const busData = topology.buses[0];
            
            const bus = {
                id: busData.id,
                name: busData.name,
                orientation: busData.orientation,
                position: busData.position,
                length: busData.length,
                thickness: busData.thickness || 8,
                color: busData.color || '#3498db',
                type: busData.type || 'service-bus',
                connections: busData.connections || []
            };
            
            window.dataStore.addBus(bus);
            console.log(`✅ Service Bus created at (${bus.position.x}, ${bus.position.y})`);
            
            // Render canvas
            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        }

        // Step 5: Create NF mapping from 5g.json (type -> full config from JSON)
        const nfConfigMap = new Map();
        topology.nfs.forEach(nfData => {
            if (nfData.type !== 'DataNetwork') {
                // Store full config by type
                nfConfigMap.set(nfData.type, nfData);
            }
        });

        // Step 6: Suppress automatic logs from interface manager during bulk deployment
        // We'll only use logs from 5g-logs.json
        const originalAddLog = window.logEngine?.addLog.bind(window.logEngine);
        const addedLogMessages = new Set(); // Track added log messages to prevent duplicates
        
        if (window.logEngine) {
            // Temporarily override addLog to suppress duplicates
            window.logEngine.addLog = function(nfId, level, message, details = {}) {
                // Create a unique key for this log
                const logKey = `${nfId}|${level}|${message}`;
                
                // Skip if this log was already added from JSON
                if (addedLogMessages.has(logKey)) {
                    return null;
                }
                
                // Call original addLog
                return originalAddLog(nfId, level, message, details);
            };
        }

        // Step 7: Deploy interfaces one by one
        const interfaces = [
            { id: 'N1', method: 'deployN1Interface' },
            { id: 'N2', method: 'deployN2Interface' },
            { id: 'N13', method: 'deployN13Interface' },
            { id: 'N12', method: 'deployN12Interface' },
            { id: 'N8', method: 'deployN8Interface' },
            { id: 'N11', method: 'deployN11Interface' },
            { id: 'N10', method: 'deployN10Interface' },
            { id: 'N7', method: 'deployN7Interface' },
            { id: 'N5', method: 'deployN5Interface' },
            { id: 'N4', method: 'deployN4Interface' },
            { id: 'N3', method: 'deployN3Interface' },
            { id: 'N6', method: 'deployN6Interface' }
        ];
        
        let successCount = 0;
        let failCount = 0;
        const nfIdMap = new Map(); // Maps old NF IDs from logs JSON to new NF IDs
        
        for (const interfaceInfo of interfaces) {
            console.log(`\n📡 Deploying ${interfaceInfo.id} Interface...`);
            
            try {
                // Deploy interface using interface manager
                const deployMethod = window.interfaceManager[interfaceInfo.method];
                if (deployMethod) {
                    await deployMethod.call(window.interfaceManager);
                    
                    // Update NF positions, IPs, and names to match 5g.json
                    const interfaceConfig = window.interfaceManager.deployedInterfaces.get(interfaceInfo.id);
                    if (interfaceConfig && interfaceConfig.nfs) {
                        Object.entries(interfaceConfig.nfs).forEach(([type, nf]) => {
                            if (nf && nfConfigMap.has(type)) {
                                const jsonNF = nfConfigMap.get(type);
                                
                                // Update position, IP, port, and name from 5g.json
                                nf.position = jsonNF.position;
                                nf.config.ipAddress = jsonNF.config.ipAddress;
                                nf.config.port = jsonNF.config.port;
                                nf.name = jsonNF.name;
                                nf.status = jsonNF.status || 'stable';
                                
                                // Update in dataStore
                                if (window.dataStore) {
                                    window.dataStore.updateNF(nf.id, {
                                        position: nf.position,
                                        config: nf.config,
                                        name: nf.name,
                                        status: nf.status
                                    });
                                }
                                
                                // Map old NF ID from logs JSON to new NF ID
                                // Find the old NF ID from topology JSON that matches this type
                                const oldNF = topology.nfs.find(n => n.type === type);
                                if (oldNF && oldNF.id) {
                                    nfIdMap.set(oldNF.id, nf.id);
                                }
                            }
                        });
                    }
                    
                    // Render canvas after each interface
                    if (window.canvasRenderer) {
                        window.canvasRenderer.render();
                    }
                    
                    // Load and display logs for this interface (from JSON only)
                    await this.loadLogsForInterface(interfaceInfo.id, logsData.logs, nfIdMap, addedLogMessages);
                    
                    successCount++;
                    console.log(`✅ ${interfaceInfo.id} deployed successfully`);
                    
                    // Delay between deployments
                    await this.delay(800);
                } else {
                    throw new Error(`Deploy method ${interfaceInfo.method} not found`);
                }
            } catch (error) {
                console.error(`❌ Failed to deploy ${interfaceInfo.id}:`, error);
                failCount++;
            }
        }
        
        // Restore original addLog function
        if (window.logEngine && originalAddLog) {
            window.logEngine.addLog = originalAddLog;
        }
        
        // Step 7: Create DataNetwork if needed (only if it doesn't already exist)
        const dataNetworkData = topology.nfs.find(nf => nf.type === 'DataNetwork');
        if (dataNetworkData && window.dataStore) {
            // Check if DataNetwork already exists (might be created during N3/N6 deployment)
            const existingDataNetwork = window.dataStore.getAllNFs().find(nf => nf.type === 'DataNetwork');
            
            if (!existingDataNetwork) {
                const dataNetwork = {
                    id: dataNetworkData.id,
                    type: dataNetworkData.type,
                    name: dataNetworkData.name,
                    position: dataNetworkData.position,
                    color: dataNetworkData.color,
                    icon: dataNetworkData.icon || null,
                    iconImage: null,
                    status: dataNetworkData.status || 'active',
                    statusTimestamp: dataNetworkData.statusTimestamp || Date.now(),
                    config: dataNetworkData.config
                };
                
                window.dataStore.addNF(dataNetwork);
                console.log('✅ Data Network (Internet) created');
            } else {
                // Update existing DataNetwork position and config from 5g.json
                existingDataNetwork.position = dataNetworkData.position;
                existingDataNetwork.config = dataNetworkData.config;
                existingDataNetwork.name = dataNetworkData.name;
                window.dataStore.updateNF(existingDataNetwork.id, existingDataNetwork);
                console.log('✅ Data Network (Internet) updated from 5g.json');
            }
        }
        
        // Step 8: Create all connections from 5g.json (map old IDs to new IDs)
        console.log('\n🔗 Creating connections from 5g.json...');
        if (topology.connections && window.dataStore) {
            for (const connData of topology.connections) {
                if (connData.showVisual) {
                    // Map old NF IDs to new NF IDs
                    const newSourceId = nfIdMap.get(connData.sourceId) || connData.sourceId;
                    const newTargetId = nfIdMap.get(connData.targetId) || connData.targetId;
                    
                    // Verify both NFs exist
                    const sourceNF = window.dataStore.getNFById(newSourceId);
                    const targetNF = window.dataStore.getNFById(newTargetId);
                    
                    if (sourceNF && targetNF) {
                        const connection = {
                            id: connData.id,
                            sourceId: newSourceId,
                            targetId: newTargetId,
                            type: connData.type,
                            showVisual: connData.showVisual,
                            createdAt: connData.createdAt ? new Date(connData.createdAt) : new Date(),
                            options: connData.options || {}
                        };
                        
                        window.dataStore.addConnection(connection);
                    }
                }
            }
        }
        
        // Step 9: Create bus connections from 5g.json (map old IDs to new IDs)
        console.log('\n🔌 Creating bus connections from 5g.json...');
        if (topology.busConnections && window.dataStore) {
            for (const busConnData of topology.busConnections) {
                // Map old NF ID to new NF ID
                const newNFId = nfIdMap.get(busConnData.nfId) || busConnData.nfId;
                const nf = window.dataStore.getNFById(newNFId);
                const bus = window.dataStore.getBusById(busConnData.busId);
                
                if (nf && bus) {
                    const busConnection = {
                        id: busConnData.id,
                        nfId: newNFId,
                        busId: busConnData.busId,
                        type: busConnData.type || 'bus-connection',
                        interfaceName: busConnData.interfaceName,
                        protocol: busConnData.protocol || 'HTTP/2',
                        status: busConnData.status || 'connected',
                        createdAt: busConnData.createdAt || Date.now()
                    };
                    
                    window.dataStore.addBusConnection(busConnection);
                    
                    if (!bus.connections.includes(newNFId)) {
                        bus.connections.push(newNFId);
                    }
                }
            }
        }
        
        // Step 10: Remove duplicate/unconnected DataNetwork instances
        console.log('\n🧹 Cleaning up duplicate DataNetwork instances...');
        if (window.dataStore) {
            const allDataNetworks = window.dataStore.getAllNFs().filter(nf => nf.type === 'DataNetwork');
            
            if (allDataNetworks.length > 1) {
                console.log(`⚠️ Found ${allDataNetworks.length} DataNetwork instances, removing unconnected ones...`);
                
                // Find DataNetwork that is connected to UPF via N6
                let connectedDataNetwork = null;
                const allConnections = window.dataStore.getAllConnections();
                
                for (const dataNet of allDataNetworks) {
                    // Check if this DataNetwork has a connection to UPF
                    const hasConnection = allConnections.some(conn => {
                        const sourceNF = window.dataStore.getNFById(conn.sourceId);
                        const targetNF = window.dataStore.getNFById(conn.targetId);
                        
                        // Check if connection is between UPF and this DataNetwork
                        return (sourceNF?.type === 'UPF' && targetNF?.id === dataNet.id) ||
                               (targetNF?.type === 'UPF' && sourceNF?.id === dataNet.id);
                    });
                    
                    if (hasConnection) {
                        connectedDataNetwork = dataNet;
                        break;
                    }
                }
                
                // Remove all DataNetworks except the connected one
                for (const dataNet of allDataNetworks) {
                    if (connectedDataNetwork && dataNet.id !== connectedDataNetwork.id) {
                        console.log(`🗑️ Removing unconnected DataNetwork: ${dataNet.name} (${dataNet.id})`);
                        window.dataStore.removeNF(dataNet.id);
                    } else if (!connectedDataNetwork && dataNet !== allDataNetworks[0]) {
                        // If no connected one found, keep the first one and remove others
                        console.log(`🗑️ Removing duplicate DataNetwork: ${dataNet.name} (${dataNet.id})`);
                        window.dataStore.removeNF(dataNet.id);
                    }
                }
                
                console.log('✅ Duplicate DataNetwork instances removed');
            }
        }
        
        console.log('\n═══════════════════════════════════════');
        console.log('📊 DEPLOYMENT SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Successfully deployed: ${successCount} interfaces`);
        console.log(`❌ Failed: ${failCount} interfaces`);
        console.log('═══════════════════════════════════════\n');

        // Final render
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Show success message
        alert(
            '✅ Deployment Complete!\n\n' +
            `Successfully deployed: ${successCount} interfaces\n` +
            `Failed: ${failCount} interfaces\n\n` 
        );

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        alert(`❌ Deployment failed: ${error.message}\n\nCheck console for details.`);
    } finally {
        // Re-enable button
        if (deployAllBtn) {
            deployAllBtn.disabled = false;
            deployAllBtn.textContent = '🚀 Deploy All Interfaces';
        }
    }
}
    setupAddNFModal() {
        const modal = document.getElementById('add-nf-modal');
        const modalCancel = document.getElementById('modal-cancel');
        const nfGrid = document.getElementById('nf-grid');

        if (!modal || !nfGrid) return;

        const nfTypes = ['NRF', 'AUSF', 'UDM', 'PCF', 'NSSF', 'UDR', 'AMF', 'SMF', 'UPF'];

        nfGrid.innerHTML = '';

        nfTypes.forEach(type => {
            const nfDef = window.nfDefinitions?.[type] || {
                name: type,
                color: '#95a5a6'
            };

            const btn = document.createElement('button');
            btn.className = 'nf-select-btn';
            btn.dataset.type = type;

            btn.innerHTML = `
                <div class="nf-icon" style="background: ${nfDef.color}">
                    ${type[0]}
                </div>
                <div class="nf-label">${type}</div>
            `;

            btn.addEventListener('click', () => {
                console.log('🖱️ Modal: Selected NF type:', type);

                if (this.isNFTypeAlreadyExists(type)) {
                    alert(`❌ ${type} Already Exists!\n\nOnly ONE instance of each Network Function type is allowed.\n\n${type} is already running in your topology.`);
                    modal.style.display = 'none';
                    return;
                }

                this.showNFConfigurationForNewNF(type);
                modal.style.display = 'none';
            });

            nfGrid.appendChild(btn);
        });

        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showAddNFModal() {
        this.updateModalNFButtonStates();
        
        const modal = document.getElementById('add-nf-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    setupAddNetworkInterfaceModal() {
    console.log('🔧 Setting up Network Interface modal...');
    
    const modal = document.getElementById('add-nf-modal');
    if (!modal) {
        console.error('❌ Modal not found');
        return;
    }
    
    // Modal will show list of available network interfaces
    console.log('✅ Network Interface modal ready');
}

showAddNetworkInterfaceModal() {
    const modal = document.getElementById('add-nf-modal');
    if (!modal) {
        console.error('❌ Modal not found');
        return;
    }
    
    // Get modal elements
    const modalTitle = modal.querySelector('h2');
    const nfGrid = document.getElementById('nf-grid');
    const modalCancel = document.getElementById('modal-cancel');
    
    // Update modal title
    if (modalTitle) {
        modalTitle.textContent = '📡 Select Network Interface to Deploy';
    }
    
    // Network Interface definitions (ALL 13 INTERFACES)
    const networkInterfaces = [
        {
            id: 'N1',
            name: 'N1 Interface',
            description: 'UE ↔ AMF (NAS)',
            color: '#3498db',
            icon: '📱',
            deployed: window.interfaceManager?.isInterfaceDeployed('N1') || false
        },
        {
            id: 'N2',
            name: 'N2 Interface',
            description: 'gNB ↔ AMF (NGAP)',
            color: '#2ecc71',
            icon: '📡',
            deployed: window.interfaceManager?.isInterfaceDeployed('N2') || false
        },
        {
            id: 'N3',
            name: 'N3 Interface',
            description: 'gNB ↔ UPF (GTP-U)',
            color: '#f39c12',
            icon: '🔄',
            deployed: window.interfaceManager?.isInterfaceDeployed('N3') || false
        },
        {
            id: 'N4',
            name: 'N4 Interface',
            description: 'SMF ↔ UPF (PFCP)',
            color: '#e74c3c',
            icon: '⚙️',
            deployed: window.interfaceManager?.isInterfaceDeployed('N4') || false
        },
        {
            id: 'N5',
            name: 'N5 Interface',
            description: 'AF ↔ PCF (HTTP/2)',
            color: '#9b59b6',
            icon: '🌐',
            deployed: window.interfaceManager?.isInterfaceDeployed('N5') || false
        },
        {
            id: 'N6',
            name: 'N6 Interface',
            description: 'UPF ↔ DN (IP)',
            color: '#16a085',
            icon: '🌍',
            deployed: window.interfaceManager?.isInterfaceDeployed('N6') || false
        },
        {
            id: 'N7',
            name: 'N7 Interface',
            description: 'SMF ↔ PCF (HTTP/2)',
            color: '#e67e22',
            icon: '📋',
            deployed: window.interfaceManager?.isInterfaceDeployed('N7') || false
        },
        {
            id: 'N8',
            name: 'N8 Interface',
            description: 'AMF ↔ UDM (HTTP/2)',
            color: '#3498db',
            icon: '👤',
            deployed: window.interfaceManager?.isInterfaceDeployed('N8') || false
        },
        {
            id: 'N10',
            name: 'N10 Interface',
            description: 'SMF ↔ UDM (HTTP/2)',
            color: '#f1c40f',
            icon: '📊',
            deployed: window.interfaceManager?.isInterfaceDeployed('N10') || false
        },
        {
            id: 'N11',
            name: 'N11 Interface',
            description: 'AMF ↔ SMF (HTTP/2)',
            color: '#2ecc71',
            icon: '🔗',
            deployed: window.interfaceManager?.isInterfaceDeployed('N11') || false
        },
        {
            id: 'N12',
            name: 'N12 Interface',
            description: 'AMF ↔ AUSF (HTTP/2)',
            color: '#2ecc71',
            icon: '🔐',
            deployed: window.interfaceManager?.isInterfaceDeployed('N12') || false
        },
        {
            id: 'N13',
            name: 'N13 Interface',
            description: 'AMF ↔ NRF (HTTP/2)',
            color: '#2ecc71',
            icon: '🔍',
            deployed: window.interfaceManager?.isInterfaceDeployed('N13') || false
        }
    ];
    
    // Clear grid
    if (nfGrid) {
        nfGrid.innerHTML = '';
        
        // Create interface cards
        networkInterfaces.forEach(ni => {
            const card = document.createElement('button');
            card.className = 'nf-select-btn network-interface-card';
            if (ni.deployed) {
                card.classList.add('deployed');
                card.disabled = true;
            }
            
            card.innerHTML = `
                <div class="nf-icon" style="background: ${ni.color};">
                    ${ni.icon}
                </div>
                <div class="nf-label">${ni.id}</div>
                <div class="ni-modal-desc">${ni.description}</div>
                ${ni.deployed ? '<div class="deployed-badge">✓ Deployed</div>' : ''}
            `;
            
            // Click handler
            card.addEventListener('click', () => {
                console.log('🚀 Deploying interface:', ni.id);
                this.deployNetworkInterface(ni.id);
                modal.style.display = 'none';
            });
            
            nfGrid.appendChild(card);
        });
    }
    
    // Cancel button
    if (modalCancel) {
        modalCancel.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Show modal
    modal.style.display = 'flex';
    console.log('✅ Network Interface modal opened with 13 interfaces');
}

    setupConnectionButtons() {
        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        if (!btnSource || !btnDestination || !btnCancel) {
            console.error('❌ Connection buttons not found');
            return;
        }

        btnSource.addEventListener('click', () => {
            console.log('🖱️ Select Source clicked');
            this.enterSourceSelectionMode();
        });

        btnDestination.addEventListener('click', () => {
            console.log('🖱️ Select Destination clicked');
            if (this.selectedSourceNF) {
                this.enterDestinationSelectionMode();
                console.log('💡 You can now click on an NF or Bus Line to connect!');
            } else {
                alert('Please select a source NF first!');
            }
        });

        btnCancel.addEventListener('click', () => {
            console.log('🖱️ Connection cancelled');
            this.cancelConnectionMode();
        });

        this.setupConnectionModeListener();
    }

    enterBusSelectionMode() {
        this.connectionMode = 'selecting-bus';

        const btnDestination = document.getElementById('btn-select-destination');
        btnDestination.classList.add('active');
        btnDestination.style.background = '#27ae60';

        this.showCanvasMessage(`Select a SERVICE BUS to connect ${this.selectedSourceNF.name}`);
    }

    selectBus(bus) {
        console.log('✅ Bus selected as destination:', bus.name);

        if (this.selectedSourceNF) {
            console.log('🔗 Creating NF-to-Bus connection:', this.selectedSourceNF.name, '→', bus.name);
            if (window.busManager) {
                const connection = window.busManager.connectNFToBus(this.selectedSourceNF.id, bus.id);
                if (connection) {
                    console.log('✅ NF-to-Bus connection created successfully!');
                }
            }
        } else if (this.selectedSourceBus) {
            console.log('🔗 Creating Bus-to-Bus connection:', this.selectedSourceBus.name, '→', bus.name);
            if (window.busManager) {
                const connection = window.busManager.connectBusToBus(this.selectedSourceBus.id, bus.id);
                if (connection) {
                    console.log('✅ Bus-to-Bus connection created successfully!');
                }
            }
        } else {
            console.error('❌ No source selected!');
            alert('Error: No source selected');
        }

        this.cancelConnectionMode();
    }

setupConnectionModeListener() {
    if (window.dataStore) {
        window.dataStore.subscribe((event, data) => {
            if (event === 'nf-added') {
                this.updateLogNFFilter();
            }
        });
    }

    const canvas = document.getElementById('main-canvas');
    if (canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // =============================================
            // PRIORITY 1: Check if in connection mode
            // =============================================
            if (this.connectionMode !== 'idle') {
                const clickedNF = window.canvasRenderer?.getNFAtPosition(x, y);
                const clickedBus = this.getBusAtPosition(x, y);

                console.log('🖱️ Canvas click in connection mode:', this.connectionMode);
                console.log('🖱️ Clicked NF:', clickedNF?.name || 'none');
                console.log('🖱️ Clicked Bus:', clickedBus?.name || 'none');

                if (this.connectionMode === 'selecting-source') {
                    if (clickedNF) {
                        console.log('🔗 Selecting NF as source...');
                        this.selectSourceNF(clickedNF);
                    } else if (clickedBus) {
                        console.log('🚌 Selecting Bus as source...');
                        this.selectSourceBus(clickedBus);
                    } else {
                        console.log('❌ Please click on an NF or Bus Line');
                    }
                } else if (this.connectionMode === 'selecting-destination') {
                    if (clickedNF) {
                        console.log('🔗 Connecting to NF...');
                        this.selectDestinationNF(clickedNF);
                    } else if (clickedBus) {
                        console.log('🚌 Connecting to Bus...');
                        this.selectBus(clickedBus);
                    } else {
                        console.log('❌ Please click on an NF or Bus Line');
                    }
                } else if (this.connectionMode === 'selecting-bus' && clickedBus) {
                    console.log('🚌 Bus click detected, calling selectBus...');
                    this.selectBus(clickedBus);
                }
                
                return; // Exit early if in connection mode
            }

            // =============================================
// PRIORITY 2: Check if clicked on N1 or N2 label
// =============================================
const clickedInterface = this.isClickOnInterfaceLabel(x, y);
if (clickedInterface) {
    if (clickedInterface.interface === 'N1') {
        console.log('🔵 N1 Interface label clicked!');
        this.showN1InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N2') {
        console.log('🟣 N2 Interface label clicked!');
        this.showN2InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N3') {
        console.log('🟠 N3 Interface label clicked!');
        this.showN3InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N4') {
        console.log('🔴 N4 Interface label clicked!');
        this.showN4InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N5') {
        console.log('💚 N5 Interface label clicked!');
        this.showN5InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N6') {
        console.log('🌐 N6 Interface label clicked!');
        this.showN6InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N7') {
        console.log('🧡 N7 Interface label clicked!');
        this.showN7InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N8') {
        console.log('💙 N8 Interface label clicked!');
        this.showN8InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N10') {  
        console.log('💛 N10 Interface label clicked!');
        this.showN10InterfaceConfiguration();
        return;
    } else if (clickedInterface.interface === 'N11') {  
    console.log('🟢 N11 Interface label clicked!');
    this.showN11InterfaceConfiguration();
    return;
    } else if (clickedInterface.interface === 'N12') {  
    console.log('🔐 N12 Interface label clicked!');
    this.showN12InterfaceConfiguration();
    return;
    } else if (clickedInterface.interface === 'N13') {  
    console.log('🔍 N13 Interface label clicked!');
    this.showN13InterfaceConfiguration();
    return;
    }

}


            // =============================================
            // PRIORITY 3: Check if clicked on NF
            // (Only if not clicked on N1 label)
            // =============================================
            const clickedNF = window.canvasRenderer?.getNFAtPosition(x, y);
            if (clickedNF) {
                console.log('✅ Clicked on NF:', clickedNF.name);
                this.selectedNF = clickedNF.id;
                
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }

                // Open NF config panel (NOT N1 config)
                this.showNFConfigPanel(clickedNF);
            } else {
                // Clicked on empty space
                this.selectedNF = null;
                
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }

                // Close config panel
                this.hideNFConfigPanel();
            }
        });
    }
}

    enterSourceSelectionMode() {
        this.connectionMode = 'selecting-source';
        this.selectedSourceNF = null;
        this.selectedSourceBus = null;
        this.selectedDestinationNF = null;

        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        btnSource.classList.add('active');
        btnSource.style.background = '#3498db';
        btnDestination.disabled = true;
        btnCancel.style.display = 'block';
    }

    enterDestinationSelectionMode() {
        this.connectionMode = 'selecting-destination';

        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');

        btnSource.classList.remove('active');
        btnSource.style.background = '';
        btnDestination.classList.add('active');
        btnDestination.style.background = '#4caf50';
    }

    selectSourceNF(nf) {
        console.log('✅ Source selected:', nf.name);
        this.selectedSourceNF = nf;

        const btnDestination = document.getElementById('btn-select-destination');
        btnDestination.disabled = false;

        this.enterDestinationSelectionMode();
    }

    selectSourceBus(bus) {
        console.log('✅ Bus source selected:', bus.name);
        this.selectedSourceBus = bus;
        this.selectedSourceNF = null;

        const btnDestination = document.getElementById('btn-select-destination');
        btnDestination.disabled = false;

        this.enterDestinationSelectionMode();
    }

    selectDestinationNF(nf) {
        console.log('✅ NF selected as destination:', nf.name);
        this.selectedDestinationNF = nf;

        if (this.selectedSourceNF) {
            console.log('🔗 Creating NF-to-NF connection:', this.selectedSourceNF.name, '→', nf.name);
            if (window.connectionManager) {
                const connection = window.connectionManager.createManualConnection(
                    this.selectedSourceNF.id,
                    this.selectedDestinationNF.id
                );

                if (connection) {
                    console.log('✅ NF-to-NF connection created successfully');
                }
            }
        } else if (this.selectedSourceBus) {
            console.log('🔗 Creating Bus-to-NF connection:', this.selectedSourceBus.name, '→', nf.name);
            if (window.busManager) {
                const connection = window.busManager.connectBusToNF(this.selectedSourceBus.id, nf.id);
                if (connection) {
                    console.log('✅ Bus-to-NF connection created successfully');
                }
            }
        } else {
            console.error('❌ No source selected!');
            alert('Error: No source selected');
        }

        this.cancelConnectionMode();
    }

    cancelConnectionMode() {
        this.connectionMode = 'idle';
        this.selectedSourceNF = null;
        this.selectedSourceBus = null;
        this.selectedDestinationNF = null;

        const btnSource = document.getElementById('btn-select-source');
        const btnDestination = document.getElementById('btn-select-destination');
        const btnCancel = document.getElementById('btn-cancel-connection');

        btnSource.classList.remove('active');
        btnSource.style.background = '';
        btnDestination.classList.remove('active');
        btnDestination.style.background = '';
        btnDestination.disabled = true;
        btnCancel.style.display = 'none';

        this.hideCanvasMessage();
    }

    showCanvasMessage(message) {
        const msgElement = document.getElementById('canvas-message');
        if (msgElement) {
            msgElement.textContent = message;
            msgElement.classList.add('show');
        }
    }

    hideCanvasMessage() {
        const msgElement = document.getElementById('canvas-message');
        if (msgElement) {
            msgElement.classList.remove('show');
        }
    }

    setupClearButton() {
        const clearBtn = document.getElementById('btn-clear');
        if (!clearBtn) return;

        clearBtn.addEventListener('click', () => {
            console.log('🗑️ Clear clicked');
            this.clearTopology();
        });
    }

    clearTopology() {
        if (!confirm('Are you sure you want to clear the entire topology? This cannot be undone.')) {
            return;
        }

        if (window.dataStore) {
            window.dataStore.clearAll();
        }

        if (window.logEngine) {
            window.logEngine.clearAllLogs();
        }

        const logContent = document.getElementById('log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        console.log('✅ Topology cleared');
        alert('Topology cleared successfully!');
    }

    setupValidateButton() {
        const validateBtn = document.getElementById('btn-validate');
        if (!validateBtn) return;

        validateBtn.addEventListener('click', () => {
            console.log('✓ Validate clicked');
            this.validateTopology();
        });
    }

    validateTopology() {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const allConnections = window.dataStore?.getAllConnections() || [];

        if (allNFs.length === 0) {
            alert('Topology is empty. Add some Network Functions first.');
            return;
        }

        let report = '═══════════════════════════════════\n';
        report += '5G TOPOLOGY VALIDATION REPORT\n';
        report += '═══════════════════════════════════\n\n';

        const hasNRF = allNFs.some(nf => nf.type === 'NRF');
        if (!hasNRF) {
            report += '❌ CRITICAL: NRF is missing!\n';
            report += '   NRF is required as the central registry.\n\n';
        } else {
            report += '✅ NRF exists\n\n';
        }

        report += 'NETWORK FUNCTIONS:\n';
        report += '─────────────────────────────────\n';
        allNFs.forEach(nf => {
            const connections = window.dataStore.getConnectionsForNF(nf.id);
            report += `${nf.name} (${nf.type}): ${connections.length} connections\n`;
        });

        report += '\n';
        report += `Total NFs: ${allNFs.length}\n`;
        report += `Total Connections: ${allConnections.length}\n`;

        report += '\n═══════════════════════════════════\n';
        report += hasNRF ? 'STATUS: ✅ VALID' : 'STATUS: ❌ INVALID';
        report += '\n═══════════════════════════════════';

        alert(report);
        console.log(report);
    }

    setupHelpButton() {
        const helpBtn = document.getElementById('btn-help');
        if (!helpBtn) return;

        helpBtn.addEventListener('click', () => {
            console.log('❓ Help clicked');
            this.showHelpModal();
        });
    }

    setupTerminalButton() {
        const terminalBtn = document.getElementById('btn-terminal');
        if (!terminalBtn) {
            console.warn('⚠️ Terminal button not found');
            return;
        }

        terminalBtn.addEventListener('click', () => {
            console.log('💻 Terminal clicked');
            if (window.dockerTerminal) {
                window.dockerTerminal.openTerminal();
            } else {
                console.error('❌ DockerTerminal not available');
                alert('Terminal is not available. Please refresh the page.');
            }
        });
    }

    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        const closeBtn = document.getElementById('help-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    showNFConfigurationForNewNF(nfType) {
        const configForm = document.getElementById('config-form');
        if (!configForm) return;

        const nfDef = window.nfManager?.getNFDefinition(nfType) || { name: nfType, color: '#95a5a6' };

        const count = (window.nfManager?.nfCounters[nfType] || 0) + 1;
        const defaultName = `${nfType}-${count}`;
        
        const defaultIP = this.getNextAvailableIP();
        const defaultPort = this.getNextAvailablePort();
        const globalProtocol = window.globalHTTPProtocol || 'HTTP/2';

        configForm.innerHTML = `
            <h4>Configure New ${nfType}</h4>
            
            <div class="form-group">
                <input type="text" id="config-ip" value="${defaultIP}" required>
            </div>
            
            <div class="form-group">
                <input type="number" id="config-port" value="${defaultPort}" required>
            </div>
            
            <div class="form-group">
                <label>🌐 HTTP Protocol (Global Setting)</label>
                <select id="config-http-protocol">
                    <option value="HTTP/1" ${globalProtocol === 'HTTP/1' ? 'selected' : ''}>HTTP/1.1</option>
                    <option value="HTTP/2" ${globalProtocol === 'HTTP/2' ? 'selected' : ''}>HTTP/2</option>
                </select>
                <small style="color: #95a5a6; font-size: 11px; display: block; margin-top: 4px;">
                    ⚠️ Changing this will update ALL Network Functions in topology
                </small>
            </div>
            
            <button class="btn btn-success btn-block" id="btn-start-nf" data-nf-type="${nfType}">
                🚀 Start Network Function
            </button>
            <button class="btn btn-secondary btn-block" id="btn-cancel-nf">Cancel</button>
        `;

        const protocolSelect = document.getElementById('config-http-protocol');
        if (protocolSelect) {
            protocolSelect.addEventListener('change', (e) => {
                const newProtocol = e.target.value;
                const currentProtocol = window.globalHTTPProtocol || 'HTTP/2';

                if (newProtocol !== currentProtocol) {
                    const allNFs = window.dataStore?.getAllNFs() || [];
                    const confirmMsg = `⚠️ GLOBAL PROTOCOL CHANGE\n\n` +
                        `This will change HTTP protocol for ALL ${allNFs.length} Network Functions from ${currentProtocol} to ${newProtocol}.\n\n` +
                        `All NFs will use ${newProtocol} for Service-Based Interfaces.\n\n` +
                        `Do you want to continue?`;

                    if (confirm(confirmMsg)) {
                        if (window.nfManager) {
                            const updateCount = window.nfManager.updateGlobalProtocol(newProtocol);
                            alert(`✅ Success!\n\nUpdated ${updateCount} Network Functions to ${newProtocol}`);
                        }
                    } else {
                        protocolSelect.value = currentProtocol;
                    }
                }
            });
        }

        const startBtn = document.getElementById('btn-start-nf');
        startBtn.addEventListener('click', () => {
            this.startNewNetworkFunction(nfType);
        });

        const cancelBtn = document.getElementById('btn-cancel-nf');
        cancelBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }

    showNFConfigPanel(nf) {
        const configForm = document.getElementById('config-form');
        if (!configForm) return;

        configForm.innerHTML = `
            <h4>${nf.name} Configuration</h4>
            
            <div class="form-group">
                <label>NF Type</label>
                <input type="text" value="${nf.type}" disabled>
            </div>
            
            <div class="form-group">
                <label>IP Address</label>
                <input type="text" id="config-ip" value="${nf.config.ipAddress}">
            </div>
            
            <div class="form-group">
                <label>Port</label>
                <input type="number" id="config-port" value="${nf.config.port}">
            </div>
            
            <div class="form-group">
                <label>🌐 HTTP Protocol (Global Setting)</label>
                <select id="config-http-protocol">
                    <option value="HTTP/1" ${nf.config.httpProtocol === 'HTTP/1' ? 'selected' : ''}>HTTP/1.1</option>
                    <option value="HTTP/2" ${nf.config.httpProtocol === 'HTTP/2' ? 'selected' : ''}>HTTP/2</option>
                </select>
                <small style="color: #95a5a6; font-size: 11px; display: block; margin-top: 4px;">
                    ⚠️ Changing this will update ALL Network Functions in topology
                </small>
            </div>
            
            <button class="btn btn-primary btn-block" id="btn-save-config">Save Changes</button>
            <button class="btn btn-danger btn-block" id="btn-delete-nf">Delete NF</button>
            
            <div class="troubleshoot-section">
                <h4>🔧 Troubleshoot</h4>
                <p class="config-hint">Open Windows-style terminal for network diagnostics</p>
                
                <button class="btn btn-terminal btn-block" id="btn-open-terminal">
                    💻 Open Command Prompt
                </button>
            </div>
        `;

        const protocolSelect = document.getElementById('config-http-protocol');
        if (protocolSelect) {
            protocolSelect.addEventListener('change', (e) => {
                const newProtocol = e.target.value;
                const currentProtocol = window.globalHTTPProtocol || 'HTTP/2';
                
                if (newProtocol !== currentProtocol) {
                    const allNFs = window.dataStore?.getAllNFs() || [];
                    const confirmMsg = `⚠️ GLOBAL PROTOCOL CHANGE\n\n` +
                        `This will change HTTP protocol for ALL ${allNFs.length} Network Functions from ${currentProtocol} to ${newProtocol}.\n\n` +
                        `All NFs will use ${newProtocol} for Service-Based Interfaces.\n\n` +
                        `Do you want to continue?`;

                    if (confirm(confirmMsg)) {
                        if (window.nfManager) {
                            const updateCount = window.nfManager.updateGlobalProtocol(newProtocol);
                            alert(`✅ Success!\n\nUpdated ${updateCount} Network Functions to ${newProtocol}`);
                            this.showNFConfigPanel(nf);
                        }
                    } else {
                        protocolSelect.value = currentProtocol;
                    }
                }
            });
        }

        const saveBtn = document.getElementById('btn-save-config');
        saveBtn.addEventListener('click', () => {
            this.saveNFConfig(nf.id);
        });

        const deleteBtn = document.getElementById('btn-delete-nf');
        deleteBtn.addEventListener('click', () => {
            this.deleteNF(nf.id);
        });

        this.setupPingTroubleshootingHandlers(nf.id);
    }

    startNewNetworkFunction(nfType) {
        const ipAddress = document.getElementById('config-ip')?.value;
        const port = parseInt(document.getElementById('config-port')?.value);
        const httpProtocol = document.getElementById('config-http-protocol')?.value;

        if (!ipAddress || !port) {
            alert('Please fill all required fields');
            return;
        }
        
        const count = (window.nfManager?.nfCounters[nfType] || 0) + 1;
        const name = `${nfType}-${count}`;

        if (!this.isValidIP(ipAddress)) {
            alert('❌ Invalid IP address format!\n\nPlease enter a valid IP address (e.g., 192.168.1.20)');
            return;
        }

        if (!window.nfManager?.isIPAddressAvailable(ipAddress)) {
            alert(`❌ IP Conflict Detected!\n\nIP address ${ipAddress} is already in use by another service.\n\nPlease choose a different IP address.`);
            return;
        }

        if (!window.nfManager?.isPortAvailable(port)) {
            alert(`❌ Port Conflict Detected!\n\nPort ${port} is already in use by another service.\n\nPlease choose a different port number.`);
            return;
        }

        console.log('🚀 Starting new NF:', { nfType, name, ipAddress, port, httpProtocol });

        const position = this.calculateNFPositionWithSpacing(nfType);

        if (window.nfManager) {
            const nf = window.nfManager.createNetworkFunction(nfType, position);

            if (nf) {
                nf.name = name;
                nf.config.ipAddress = ipAddress;
                nf.config.port = port;
                nf.config.httpProtocol = httpProtocol;

                window.dataStore.updateNF(nf.id, nf);

                console.log('✅ NF started successfully:', nf.name);

                if (window.logEngine) {
                    window.logEngine.addLog(nf.id, 'SUCCESS',
                        `${nf.name} created successfully`, {
                        ipAddress: ipAddress,
                        port: port,
                        subnet: window.nfManager?.getNetworkFromIP(ipAddress) + '.0/24',
                        protocol: httpProtocol,
                        status: 'starting',
                        note: 'Service will be stable in 5 seconds'
                    });
                }

                this.autoConnectToBusIfApplicable(nf);
                this.hideNFConfigPanel();

                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }
            }
        } else {
            console.error('❌ NFManager not available');
            alert('Error: NFManager not available');
        }
    }

    calculateNFPositionWithSpacing(nfType) {
        const allNFs = window.dataStore?.getAllNFs() || [];

        const nfsPerRow = 6;
        const nfWidth = 60;
        const nfHeight = 80;
        const marginX = 40;
        const marginY = 60;
        const startX = 120;
        const startY = 120;

        const totalNFs = allNFs.length;
        const row = Math.floor(totalNFs / nfsPerRow);
        const col = totalNFs % nfsPerRow;

        return {
            x: startX + col * (nfWidth + marginX),
            y: startY + row * (nfHeight + marginY)
        };
    }

    autoConnectToBusIfApplicable(nf) {
        const excludedTypes = ['UPF', 'gNB', 'UE'];

        if (excludedTypes.includes(nf.type)) {
            console.log(`🚫 Skipping auto-connect for ${nf.type} (excluded type)`);
            return;
        }

        const allBuses = window.dataStore?.getAllBuses() || [];

        if (allBuses.length === 0) {
            console.log('ℹ️ No bus lines available for auto-connect');
            return;
        }

        const targetBus = allBuses[0];

        if (window.busManager) {
            console.log(`🔗 Auto-connecting ${nf.name} to ${targetBus.name}`);
            const connection = window.busManager.connectNFToBus(nf.id, targetBus.id);

            if (connection) {
                console.log(`✅ Auto-connected ${nf.name} to ${targetBus.name}`);

                if (window.logEngine) {
                    window.logEngine.addLog(nf.id, 'INFO',
                        `Auto-connected to ${targetBus.name} service bus`, {
                        busId: targetBus.id,
                        interfaceName: connection.interfaceName,
                        autoConnect: true
                    });
                }
            }
        }
    }

    hideNFConfigPanel() {
        const configForm = document.getElementById('config-form');
        if (configForm) {
            configForm.innerHTML = '<p class="hint">Select a Network Function type to configure and start it</p>';
        }
    }

    saveNFConfig(nfId) {
        const ipAddress = document.getElementById('config-ip')?.value;
        const port = parseInt(document.getElementById('config-port')?.value);
        const httpProtocol = document.getElementById('config-http-protocol')?.value;

        if (!ipAddress || !port) {
            alert('Please fill all required fields');
            return;
        }

        if (!this.isValidIP(ipAddress)) {
            alert('❌ Invalid IP address format!\n\nPlease enter a valid IP address (e.g., 192.168.1.20)');
            return;
        }

        const currentNf = window.dataStore.getNFById(nfId);
        if (currentNf && currentNf.config.ipAddress !== ipAddress) {
            if (!window.nfManager?.isIPAddressAvailable(ipAddress)) {
                alert(`❌ IP Conflict Detected!\n\nIP address ${ipAddress} is already in use by another service.\n\nPlease choose a different IP address.`);
                return;
            }
        }

        if (currentNf && currentNf.config.port !== port) {
            if (!window.nfManager?.isPortAvailable(port)) {
                alert(`❌ Port Conflict Detected!\n\nPort ${port} is already in use by another service.\n\nPlease choose a different port number.`);
                return;
            }
        }

        const nf = window.dataStore.getNFById(nfId);
        if (nf) {
            const oldIP = nf.config.ipAddress;
            const oldPort = nf.config.port;

            nf.config.ipAddress = ipAddress;
            nf.config.port = port;
            nf.config.httpProtocol = httpProtocol;

            window.dataStore.updateNF(nfId, nf);

            if (window.logEngine) {
                const changes = [];
                if (oldIP !== ipAddress) changes.push(`IP: ${oldIP} → ${ipAddress}`);
                if (oldPort !== port) changes.push(`Port: ${oldPort} → ${port}`);
                
                if (changes.length > 0) {
                    window.logEngine.addLog(nfId, 'INFO',
                        `Configuration updated: ${changes.join(', ')}`, {
                        previousIP: oldIP,
                        newIP: ipAddress,
                        previousPort: oldPort,
                        newPort: port,
                        subnet: window.nfManager?.getNetworkFromIP(ipAddress) + '.0/24'
                    });
                }
            }

            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }

            alert('✅ Configuration saved successfully!\n\n' + 
                  `IP: ${ipAddress}\n` +
                  `Port: ${port}\n` +
                  `Subnet: ${window.nfManager?.getNetworkFromIP(ipAddress)}.0/24`);
            console.log('✅ NF config saved:', nf.name);
        }
    }

    deleteNF(nfId) {
        const nf = window.dataStore.getNFById(nfId);
        if (!nf) return;

        if (!confirm(`Are you sure you want to delete ${nf.name}?`)) {
            return;
        }

        if (window.nfManager) {
            window.nfManager.deleteNetworkFunction(nfId);
        }

        this.hideNFConfigPanel();
    }

    initializeLogPanel() {
        console.log('📋 Initializing log panel...');

        if (window.logEngine) {
            window.logEngine.subscribe((logEntry) => {
                if (logEntry.type) return;
                this.appendLogToUI(logEntry);
            });
        }

        const filterNF = document.getElementById('log-filter-nf');
        const filterLevel = document.getElementById('log-filter-level');
        const clearBtn = document.getElementById('btn-clear-logs');
        const exportBtn = document.getElementById('btn-export-logs');
        const toggleBtn = document.getElementById('btn-toggle-logs');

        if (filterNF) {
            filterNF.addEventListener('change', () => this.filterLogs());
        }

        if (filterLevel) {
            filterLevel.addEventListener('change', () => this.filterLogs());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const logContent = document.getElementById('log-content');
                if (logContent) {
                    logContent.innerHTML = '';
                }
                if (window.logEngine) {
                    window.logEngine.clearAllLogs();
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLogs());
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLogPanel());
        }

        console.log('✅ Log panel initialized');
    }

    appendLogToUI(logEntry) {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const nf = window.dataStore?.getNFById(logEntry.nfId);
        const nfName = nf?.name || logEntry.nfId;

        const logDiv = document.createElement('div');
        logDiv.className = `log-entry ${logEntry.level}`;
        logDiv.dataset.nfId = logEntry.nfId;
        logDiv.dataset.level = logEntry.level;

        const time = new Date(logEntry.timestamp).toLocaleTimeString();

        logDiv.innerHTML = `
            <span class="log-timestamp">[${time}]</span>
            <span class="log-nf-name">${nfName}</span>
            <span class="log-level">${logEntry.level}</span>
            <span class="log-message">${this.escapeHtml(logEntry.message)}</span>
        `;

        if (logEntry.details && Object.keys(logEntry.details).length > 0) {
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'log-details';

            Object.entries(logEntry.details).forEach(([key, value]) => {
                const detailLine = document.createElement('div');
                detailLine.textContent = `${key}: ${JSON.stringify(value)}`;
                detailsDiv.appendChild(detailLine);
            });

            logDiv.appendChild(detailsDiv);
        }

        logContent.appendChild(logDiv);
        logContent.scrollTop = logContent.scrollHeight;

        while (logContent.children.length > 500) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    filterLogs() {
        const filterNF = document.getElementById('log-filter-nf')?.value || 'all';
        const filterLevel = document.getElementById('log-filter-level')?.value || 'all';
        const logContent = document.getElementById('log-content');

        if (!logContent) return;

        const allLogEntries = logContent.querySelectorAll('.log-entry');

        allLogEntries.forEach(entry => {
            let show = true;

            if (filterNF !== 'all' && entry.dataset.nfId !== filterNF) {
                show = false;
            }

            if (filterLevel !== 'all' && entry.dataset.level !== filterLevel) {
                show = false;
            }

            entry.style.display = show ? 'flex' : 'none';
        });
    }

    updateLogNFFilter() {
        const select = document.getElementById('log-filter-nf');
        if (!select) return;

        const currentValue = select.value;

        while (select.options.length > 1) {
            select.remove(1);
        }

        const allNFs = window.dataStore?.getAllNFs() || [];
        allNFs.forEach(nf => {
            const option = document.createElement('option');
            option.value = nf.id;
            option.textContent = `${nf.name} (${nf.type})`;
            select.appendChild(option);
        });

        if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    }

    exportLogs() {
        if (!window.logEngine) return;

        const format = prompt('Export format (json/csv/txt):', 'txt');

        if (!format) return;

        let content, filename, mimeType;

        if (format.toLowerCase() === 'json') {
            content = window.logEngine.exportLogsAsJSON();
            filename = `5g-logs-${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format.toLowerCase() === 'csv') {
            content = window.logEngine.exportLogsAsCSV();
            filename = `5g-logs-${Date.now()}.csv`;
            mimeType = 'text/csv';
        } else if (format.toLowerCase() === 'txt') {
            content = window.logEngine.exportLogsAsText();
            filename = `5g-logs-${Date.now()}.txt`;
            mimeType = 'text/plain';
        } else {
            alert('Invalid format. Use "json", "csv", or "txt"');
            return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Logs exported as', format);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleLogPanel() {
        const logPanel = document.getElementById('log-panel');
        const toggleIcon = document.getElementById('toggle-icon');

        if (!logPanel || !toggleIcon) return;

        const isCollapsed = logPanel.classList.contains('collapsed');

        if (isCollapsed) {
            logPanel.classList.remove('collapsed');
            toggleIcon.textContent = '▼';
            console.log('📋 Log panel expanded');
        } else {
            logPanel.classList.add('collapsed');
            toggleIcon.textContent = '▲';
            console.log('📋 Log panel collapsed');
        }

        setTimeout(() => {
            if (window.canvasRenderer) {
                window.canvasRenderer.resizeCanvas();
            }
        }, 350);
    }

    setupConfigPanelToggle() {
        const toggleBtn = document.getElementById('btn-toggle-config');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleConfigPanel());
            console.log('✅ Config panel toggle initialized');
        } else {
            console.warn('⚠️ Config panel toggle button not found');
        }
    }

    toggleConfigPanel() {
        const sidebar = document.querySelector('.sidebar-right');
        const toggleIcon = document.getElementById('config-toggle-icon');

        if (!sidebar || !toggleIcon) return;

        const isCollapsed = sidebar.classList.contains('collapsed');

        if (isCollapsed) {
            sidebar.classList.remove('collapsed');
            toggleIcon.textContent = '◀';
            console.log('⚙️ Config panel expanded');
        } else {
            sidebar.classList.add('collapsed');
            toggleIcon.textContent = '▶';
            console.log('⚙️ Config panel collapsed');
        }

        setTimeout(() => {
            if (window.canvasRenderer) {
                window.canvasRenderer.resizeCanvas();
            }
        }, 350);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.toggleLogPanel();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleConfigPanel();
            }

            if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === 'h')) {
                e.preventDefault();
                this.showHelpModal();
            }
        });

        console.log('⌨️ Keyboard shortcuts initialized (Ctrl+L: Toggle logs, Ctrl+K: Toggle config, F1/Ctrl+H: Help)');
    }

    setupPingTroubleshootingHandlers(nfId) {
        const terminalBtn = document.getElementById('btn-open-terminal');

        if (terminalBtn) {
            terminalBtn.addEventListener('click', () => {
                this.openWindowsTerminal(nfId);
            });
        }
    }

    openWindowsTerminal(nfId) {
        const nf = window.dataStore?.getNFById(nfId);
        if (!nf) return;

        this.createTerminalModal(nf);
    }

    createTerminalModal(nf) {
        const existingTerminal = document.getElementById('windows-terminal-modal');
        if (existingTerminal) {
            existingTerminal.remove();
        }

        const terminalModal = document.createElement('div');
        terminalModal.id = 'windows-terminal-modal';
        terminalModal.className = 'windows-terminal-modal';
        
        terminalModal.innerHTML = `
            <div class="windows-terminal-window">
                <div class="windows-terminal-titlebar">
                    <div class="terminal-title">
                        <span class="terminal-icon">⬛</span>
                        Command Prompt - ${nf.name} (${nf.config.ipAddress})
                    </div>
                    <div class="terminal-controls">
                        <button class="terminal-btn minimize">−</button>
                        <button class="terminal-btn maximize">□</button>
                        <button class="terminal-btn close" id="terminal-close">×</button>
                    </div>
                </div>
                <div class="windows-terminal-content" id="terminal-content">
                    <div class="terminal-header">
                        Microsoft Windows [Version 10.0.19045.3570]<br>
                        (c) Microsoft Corporation. All rights reserved.<br><br>
                    </div>
                    <div class="terminal-output" id="terminal-output"></div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt">C:\\${nf.name}></span>
                        <input type="text" id="terminal-input" class="terminal-input" autocomplete="off" spellcheck="false">
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(terminalModal);

        this.setupWindowsTerminal(nf, terminalModal);

        setTimeout(() => {
            terminalModal.classList.add('show');
        }, 10);

        const input = document.getElementById('terminal-input');
        if (input) {
            input.focus();
        }
    }

    setupWindowsTerminal(nf, terminalModal) {
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        const closeBtn = document.getElementById('terminal-close');
        
        let commandHistory = [];
        let historyIndex = -1;

        closeBtn.addEventListener('click', () => {
            terminalModal.classList.remove('show');
            setTimeout(() => {
                terminalModal.remove();
            }, 300);
        });

        terminalModal.addEventListener('click', (e) => {
            if (e.target === terminalModal) {
                closeBtn.click();
            }
        });

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const command = input.value.trim();
                if (command) {
                    commandHistory.push(command);
                    historyIndex = commandHistory.length;

                    this.addTerminalLine(output, `C:\\${nf.name}>${command}`, 'command');
                    
                    input.value = '';

                    await this.processWindowsCommand(nf, command, output);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    input.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    input.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    input.value = '';
                }
            }
        });

        this.addTerminalLine(output, `Connected to ${nf.name} (${nf.config.ipAddress})`, 'info');
        this.addTerminalLine(output, 'Type "help" for available commands.', 'info');
        this.addTerminalLine(output, '', 'blank');
    }

    async processWindowsCommand(nf, command, output) {
        const cmd = command.toLowerCase().trim();
        const args = command.split(' ');

        if (cmd === 'help' || cmd === '?') {
            this.showWindowsHelp(output);
        } else if (cmd === 'ipconfig') {
            this.showIPConfig(nf, output);
        } else if (cmd.startsWith('ping ')) {
            const target = args[1];
            if (target) {
                await this.executeWindowsPing(nf, target, output);
            } else {
                this.addTerminalLine(output, 'Usage: ping <hostname or IP address>', 'error');
            }
        } else if (cmd === 'ping subnet') {
            await this.executeWindowsPingSubnet(nf, output);
        } else if (cmd === 'cls' || cmd === 'clear') {
            output.innerHTML = '';
        } else if (cmd === 'exit') {
            const closeBtn = document.getElementById('terminal-close');
            if (closeBtn) closeBtn.click();
        } else if (cmd === 'systeminfo') {
            this.showSystemInfo(nf, output);
        } else if (cmd === 'netstat') {
            this.showNetstat(nf, output);
        } else if (cmd === '') {
            // Empty command
        } else {
            this.addTerminalLine(output, `'${command}' is not recognized as an internal or external command,`, 'error');
            this.addTerminalLine(output, 'operable program or batch file.', 'error');
        }

        this.addTerminalLine(output, '', 'blank');
    }

    addTerminalLine(output, text, type = 'normal') {
        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;
        line.innerHTML = text || '&nbsp;';
        output.appendChild(line);
        
        output.scrollTop = output.scrollHeight;
    }

    showWindowsHelp(output) {
        const helpText = [
            'Available commands:',
            '',
            'HELP        - Display this help message',
            'IPCONFIG    - Display network configuration',
            'PING        - Test network connectivity',
            'SYSTEMINFO  - Display system information',
            'NETSTAT     - Display network connections',
            'CLS         - Clear the screen',
            'EXIT        - Close this terminal',
            ''
        ];

        helpText.forEach(line => {
            this.addTerminalLine(output, line, 'info');
        });
    }

    showIPConfig(nf, output) {
        const lines = [
            'Windows IP Configuration',
            '',
            'Ethernet adapter Local Area Connection:',
            '',
            `   Connection-specific DNS Suffix  . : 5g.local`,
            `   IPv4 Address. . . . . . . . . . . : ${nf.config.ipAddress}`,
            `   Subnet Mask . . . . . . . . . . . : 255.255.255.0`,
            `   Default Gateway . . . . . . . . . : 192.168.1.1`,
            `   DNS Servers . . . . . . . . . . . : 8.8.8.8`,
            `                                       8.8.4.4`,
            ''
        ];

        lines.forEach(line => {
            this.addTerminalLine(output, line, 'info');
        });
    }

    async executeWindowsPing(nf, target, output) {
        if (!this.isValidIP(target)) {
            this.addTerminalLine(output, `Ping request could not find host ${target}. Please check the name and try again.`, 'error');
            return;
        }

        const sourceNetwork = this.getNetworkFromIP(nf.config.ipAddress);
        const targetNetwork = this.getNetworkFromIP(target);
        
        if (sourceNetwork !== targetNetwork) {
            this.addTerminalLine(output, `Pinging ${target} with 32 bytes of data:`, 'info');
            this.addTerminalLine(output, '', 'blank');
            this.addTerminalLine(output, `PING: transmit failed. General failure.`, 'error');
            this.addTerminalLine(output, '', 'blank');
            this.addTerminalLine(output, `Network Error: Cannot reach ${target}`, 'error');
            this.addTerminalLine(output, `Source subnet: ${sourceNetwork}.0/24`, 'error');
            this.addTerminalLine(output, `Target subnet: ${targetNetwork}.0/24`, 'error');
            this.addTerminalLine(output, `Reason: Cross-subnet communication not allowed`, 'error');
            this.addTerminalLine(output, '', 'blank');
            this.addTerminalLine(output, `Ping statistics for ${target}:`, 'info');
            this.addTerminalLine(output, `    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),`, 'info');
            return;
        }

        this.addTerminalLine(output, `Pinging ${target} with 32 bytes of data:`, 'info');
        this.addTerminalLine(output, '', 'blank');

        const isReachable = this.isTargetReachable(nf, target);
        const results = [];

        for (let i = 1; i <= 4; i++) {
            await this.delay(500);

            if (isReachable) {
                const responseTime = this.generateResponseTime();
                const ttl = 255;
                
                results.push({
                    sequence: i,
                    time: responseTime,
                    ttl: ttl,
                    success: true
                });

                this.addTerminalLine(output, 
                    `Reply from ${target}: bytes=32 time=${responseTime}ms TTL=${ttl}`, 
                    'success'
                );
            } else {
                await this.delay(500);
                
                results.push({
                    sequence: i,
                    success: false,
                    timeout: true
                });

                this.addTerminalLine(output, 'Request timed out.', 'error');
            }
        }

        await this.delay(500);
        this.showPingStatistics(target, results, output);
    }

    async executeWindowsPingSubnet(nf, output) {
        const sourceNetwork = this.getNetworkFromIP(nf.config.ipAddress);
        const allNFs = window.dataStore?.getAllNFs() || [];
        
        const sameSubnetServices = allNFs.filter(otherNf => 
            otherNf.id !== nf.id && 
            this.getNetworkFromIP(otherNf.config.ipAddress) === sourceNetwork
        );

        this.addTerminalLine(output, `Subnet Scan: ${sourceNetwork}.0/24`, 'info');
        this.addTerminalLine(output, `Source: ${nf.name} (${nf.config.ipAddress})`, 'info');
        this.addTerminalLine(output, `Restriction: Only same-subnet services can be pinged`, 'info');
        this.addTerminalLine(output, '', 'blank');

        if (sameSubnetServices.length === 0) {
            this.addTerminalLine(output, `No other services found in subnet ${sourceNetwork}.0/24`, 'error');
            this.addTerminalLine(output, `Add more services with IPs in range ${sourceNetwork}.1-${sourceNetwork}.254`, 'info');
            return;
        }

        this.addTerminalLine(output, `Found ${sameSubnetServices.length} services in subnet ${sourceNetwork}.0/24:`, 'info');
        
        sameSubnetServices.forEach(targetNf => {
            const statusIcon = targetNf.status === 'stable' ? '✅' : '⚠️';
            this.addTerminalLine(output, `  ${statusIcon} ${targetNf.name} (${targetNf.config.ipAddress}) [${targetNf.status.toUpperCase()}]`, 'info');
        });
        
        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, 'Starting connectivity tests...', 'info');
        this.addTerminalLine(output, '', 'blank');

        for (const targetNf of sameSubnetServices) {
            const statusInfo = targetNf.status === 'stable' ? 'STABLE' : targetNf.status.toUpperCase();
            this.addTerminalLine(output, `Testing ${targetNf.name} (${targetNf.config.ipAddress}) [${statusInfo}]`, 'info');
            await this.executeWindowsPing(nf, targetNf.config.ipAddress, output);
            this.addTerminalLine(output, '', 'blank');
            await this.delay(200);
        }

        this.addTerminalLine(output, '═══════════════════════════════════════', 'info');
        this.addTerminalLine(output, `Subnet scan completed for ${sourceNetwork}.0/24`, 'success');
        this.addTerminalLine(output, `Total services tested: ${sameSubnetServices.length}`, 'info');
        this.addTerminalLine(output, `Stable services: ${sameSubnetServices.filter(nf => nf.status === 'stable').length}`, 'info');
        this.addTerminalLine(output, `Unstable services: ${sameSubnetServices.filter(nf => nf.status !== 'stable').length}`, 'info');
        this.addTerminalLine(output, '═══════════════════════════════════════', 'info');
    }

    showPingStatistics(target, results, output) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const lossPercentage = Math.round((failed.length / results.length) * 100);

        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, `Ping statistics for ${target}:`, 'info');
        this.addTerminalLine(output, 
            `    Packets: Sent = ${results.length}, Received = ${successful.length}, Lost = ${failed.length} (${lossPercentage}% loss),`, 
            'info'
        );

        if (successful.length > 0) {
            const times = successful.map(r => r.time);
            const min = Math.min(...times);
            const max = Math.max(...times);
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

            this.addTerminalLine(output, 'Approximate round trip times in milli-seconds:', 'info');
            this.addTerminalLine(output, 
                `    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`, 
                'info'
            );
        }
    }

    showSystemInfo(nf, output) {
        const uptime = window.nfManager?.getServiceUptime(nf) || 'Unknown';
        const lines = [
            'Host Name:                 ' + nf.name,
            'Network Card:              5G Service Interface',
            '                          Connection Name: Local Area Connection',
            `                          IP Address:      ${nf.config.ipAddress}`,
            `                          Port:            ${nf.config.port}`,
            `                          Protocol:        ${nf.config.httpProtocol}`,
            `System Up Time:            ${uptime}`,
            `Service Status:            ${nf.status.toUpperCase()}`,
            ''
        ];

        lines.forEach(line => {
            this.addTerminalLine(output, line, 'info');
        });
    }

    showNetstat(nf, output) {
        const connections = window.dataStore?.getConnectionsForNF(nf.id) || [];
        const busConnections = window.dataStore?.getBusConnectionsForNF(nf.id) || [];
        
        this.addTerminalLine(output, 'Active Connections', 'info');
        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, '  Proto  Local Address          Foreign Address        State', 'info');

        connections.forEach(conn => {
            const otherNfId = conn.sourceId === nf.id ? conn.targetId : conn.sourceId;
            const otherNf = window.dataStore?.getNFById(otherNfId);
            if (otherNf) {
                this.addTerminalLine(output, 
                    `  TCP    ${nf.config.ipAddress}:${nf.config.port}         ${otherNf.config.ipAddress}:${otherNf.config.port}         ESTABLISHED`, 
                    'info'
                );
            }
        });

        busConnections.forEach(busConn => {
            const bus = window.dataStore?.getBusById(busConn.busId);
            if (bus) {
                this.addTerminalLine(output, 
                    `  TCP    ${nf.config.ipAddress}:${nf.config.port}         ${bus.name}:BUS            ESTABLISHED`, 
                    'info'
                );
            }
        });

        if (connections.length === 0 && busConnections.length === 0) {
            this.addTerminalLine(output, '  No active connections.', 'info');
        }

        this.addTerminalLine(output, '', 'blank');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Load and display logs for a specific interface from 5g-logs.json
     */
    async loadLogsForInterface(interfaceId, allLogs, nfIdMap) {
        if (!window.logEngine || !allLogs || allLogs.length === 0) {
            return;
        }
        
        // Get interface configuration to find related NF types
        const interfaceConfig = window.interfaceManager?.deployedInterfaces.get(interfaceId);
        const relatedNFTypes = new Set();
        const relatedNFIds = new Set();
        
        if (interfaceConfig && interfaceConfig.nfs) {
            Object.entries(interfaceConfig.nfs).forEach(([type, nf]) => {
                if (nf && nf.id) {
                    relatedNFTypes.add(type);
                    relatedNFIds.add(nf.id);
                }
            });
        }
        
        // Find logs that match this interface
        const interfaceLogs = [];
        let interfaceDeploymentLogFound = false;
        
        for (const log of allLogs) {
            const message = (log.message || '').toLowerCase();
            
            // Check if this is the interface deployment log
            if (log.nfId === 'system' && 
                (message.includes(`${interfaceId.toLowerCase()} interface deployed`) ||
                 message.includes(`${interfaceId.toLowerCase()} interface configured`))) {
                interfaceLogs.push(log);
                interfaceDeploymentLogFound = true;
                continue;
            }
            
            // If we haven't found the deployment log yet, skip other logs
            // (we want logs that happen during/after this interface deployment)
            if (!interfaceDeploymentLogFound) {
                continue;
            }
            
            // Include logs from related NFs
            if (relatedNFIds.has(log.nfId)) {
                interfaceLogs.push(log);
                continue;
            }
            
            // Include logs from NFs of related types (by matching NF ID prefix)
            const logNFType = log.nfId.split('-')[0];
            if (relatedNFTypes.has(logNFType.charAt(0).toUpperCase() + logNFType.slice(1))) {
                interfaceLogs.push(log);
                continue;
            }
            
            // Stop collecting logs when we hit the next interface deployment
            if (log.nfId === 'system' && 
                message.includes('interface deployed') &&
                !message.includes(interfaceId.toLowerCase())) {
                break;
            }
        }
        
        // Sort logs by timestamp
        interfaceLogs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Add logs with timing delays to simulate real-time logging
        let firstTimestamp = interfaceLogs.length > 0 ? interfaceLogs[0].timestamp : Date.now();
        
        for (const log of interfaceLogs) {
            // Calculate delay based on log timestamp relative to first log
            const logTimestamp = log.timestamp || Date.now();
            const delay = Math.max(50, Math.min(logTimestamp - firstTimestamp, 500)); // 50ms min, 500ms max
            
            // Map NF ID
            let nfId = log.nfId;
            
            // Try to find matching NF
            if (!nfIdMap.has(nfId)) {
                const allNFs = window.dataStore?.getAllNFs() || [];
                
                // Try to match by extracting type from old ID
                const oldIdParts = log.nfId.split('-');
                if (oldIdParts.length > 0) {
                    const oldType = oldIdParts[0];
                    const matchingNF = allNFs.find(nf => {
                        return nf.type.toLowerCase() === oldType.toLowerCase();
                    });
                    if (matchingNF) {
                        nfIdMap.set(log.nfId, matchingNF.id);
                        nfId = matchingNF.id;
                    }
                }
            } else {
                nfId = nfIdMap.get(nfId);
            }
            
            // Add log after delay
            await this.delay(delay);
            
            if (window.logEngine) {
                window.logEngine.addLog(
                    nfId,
                    log.level || 'INFO',
                    log.message || '',
                    log.details || {}
                );
            }
            
            firstTimestamp = logTimestamp;
        }
        
        console.log(`📋 Loaded ${interfaceLogs.length} logs for ${interfaceId}`);
    }

    isTargetReachable(sourceNf, targetIP) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const targetNf = allNFs.find(nf => nf.config.ipAddress === targetIP);
        
        if (!targetNf) {
            return Math.random() < 0.1;
        }

        const sourceNetwork = this.getNetworkFromIP(sourceNf.config.ipAddress);
        const targetNetwork = this.getNetworkFromIP(targetIP);
        
        if (sourceNetwork !== targetNetwork) {
            return Math.random() < 0.2;
        }

        if (sourceNf.status !== 'stable' || targetNf.status !== 'stable') {
            return Math.random() < 0.3;
        }

        return Math.random() < 0.9;
    }

    getNetworkFromIP(ip) {
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }

    generateResponseTime() {
        const baseTime = Math.random() * 50 + 1;
        const variation = (Math.random() - 0.5) * 10;
        return Math.max(1, Math.round(baseTime + variation));
    }

    getNextAvailableIP() {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const usedIPs = new Set(allNFs.map(nf => nf.config.ipAddress));
        
        const subnets = [
            '192.168.1',
            '192.168.2',
            '192.168.3',
            '192.168.4'
        ];

        for (const subnet of subnets) {
            for (let host = 10; host <= 254; host++) {
                const ip = `${subnet}.${host}`;
                if (!usedIPs.has(ip)) {
                    console.log(`🌐 Auto-assigned next available IP: ${ip}`);
                    return ip;
                }
            }
        }

        const randomSubnet = Math.floor(Math.random() * 254) + 1;
        const randomHost = Math.floor(Math.random() * 244) + 10;
        const fallbackIP = `192.168.${randomSubnet}.${randomHost}`;
        
        console.warn(`⚠️ Using fallback IP: ${fallbackIP}`);
        return fallbackIP;
    }

    getNextAvailablePort() {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const usedPorts = new Set(allNFs.map(nf => nf.config.port));
        
        for (let port = 8080; port <= 9999; port++) {
            if (!usedPorts.has(port)) {
                console.log(`🔌 Auto-assigned next available port: ${port}`);
                return port;
            }
        }

        const randomPort = Math.floor(Math.random() * 1000) + 8000;
        console.warn(`⚠️ Using fallback port: ${randomPort}`);
        return randomPort;
    }

    isValidIP(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }

    isNFTypeAlreadyExists(type) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        return allNFs.some(nf => nf.type === type);
    }

    getBusAtPosition(x, y) {
        const allBuses = window.dataStore?.getAllBuses() || [];

        for (const bus of allBuses) {
            const tolerance = 30;

            if (bus.orientation === 'horizontal') {
                if (x >= bus.position.x &&
                    x <= bus.position.x + bus.length &&
                    Math.abs(y - bus.position.y) <= tolerance) {
                    return bus;
                }
            } else {
                if (y >= bus.position.y &&
                    y <= bus.position.y + bus.length &&
                    Math.abs(x - bus.position.x) <= tolerance) {
                    return bus;
                }
            }
        }

        return null;
    }
/**
 * Check if click is on N1 or N2 label area
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @returns {Object|null} Interface info if clicked, null otherwise
 */
isClickOnInterfaceLabel(x, y) {
    // Check N1 Interface
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N1')) {
        const n1Config = window.interfaceManager.getN1Configuration();
        if (n1Config && n1Config.nfs) {
            const { UE, gNB, AMF } = n1Config.nfs;
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N1-related connections (blue lines)
            const n1Connections = connections.filter(conn => {
                return conn.options && 
                       conn.options.color === '#3498db' && 
                       (conn.options.label === 'N1 (NAS/RRC)' || conn.options.label === 'N1') &&
                       (
                           (conn.sourceId === UE?.id && conn.targetId === gNB?.id) ||
                           (conn.sourceId === gNB?.id && conn.targetId === AMF?.id)
                       );
            });

            // Check N1 labels
            for (const conn of n1Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N1 label');
                    return { interface: 'N1', connection: conn };
                }
            }
        }
    }

    // Check N2 Interface
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N2')) {
        const n2Config = window.interfaceManager.getN2Configuration();
        if (n2Config && n2Config.nfs) {
            const { gNB, AMF } = n2Config.nfs;
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N2-related connection (pink line)
            const n2Connections = connections.filter(conn => {
                return conn.options && 
                       conn.options.color === '#e91e63' && 
                       conn.options.label === 'N2 (NGAP)' &&
                       conn.sourceId === gNB?.id && 
                       conn.targetId === AMF?.id;
            });

            // Check N2 label
            for (const conn of n2Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N2 label');
                    return { interface: 'N2', connection: conn };
                }
            }
        }
    }

// Check N3 Interface 
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N3')) {
    const n3Config = window.interfaceManager.getN3Configuration();
    if (n3Config && n3Config.nfs) {
        const { gNB, UPF } = n3Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N3-related connection (orange line with "N3 Tunnel" label)
        const n3Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#f39c12' && 
                   conn.options.label === 'N3 Tunnel' &&
                   conn.sourceId === gNB?.id && 
                   conn.targetId === UPF?.id;
        });

        // Check N3 label
        for (const conn of n3Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N3 Tunnel label');
                return { interface: 'N3', connection: conn };
            }
        }
    }
}

// Check N4 Interface
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N4')) {
    const n4Config = window.interfaceManager.getN4Configuration();
    if (n4Config && n4Config.nfs) {
        const { SMF, UPF } = n4Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N4-related connection (red line with "N4 (PFCP)" label)
        const n4Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#e74c3c' && 
                   conn.options.label === 'N4 (PFCP)' &&
                   conn.sourceId === SMF?.id && 
                   conn.targetId === UPF?.id;
        });

        // Check N4 label
        for (const conn of n4Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N4 (PFCP) label');
                return { interface: 'N4', connection: conn };
            }
        }
    }
}
// Check N6 Interface 
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N6')) {
    const n6Config = window.interfaceManager.getN6Configuration();
    if (n6Config && n6Config.nfs) {
        const { UPF, DataNetwork } = n6Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N6-related connection (teal line with "N6" label)
        const n6Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#16a085' && 
                   conn.options.label === 'N6' &&
                   conn.sourceId === UPF?.id && 
                   conn.targetId === DataNetwork?.id;
        });

        // Check N6 label
        for (const conn of n6Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N6 label');
                return { interface: 'N6', connection: conn };
            }
        }
    }
}

// Check N5 Interface (AF-PCF direct connection)
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N5')) {
        const n5Config = window.interfaceManager.getN5Configuration();
        if (n5Config && n5Config.nfs) {
            const { AF, PCF } = n5Config.nfs;
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N5 direct connection (green dashed line)
            const n5Connections = connections.filter(conn => {
                return conn.options && 
                       conn.options.color === '#2ecc71' && 
                       conn.options.label === 'N5' &&
                       conn.sourceId === AF?.id && 
                       conn.targetId === PCF?.id;
            });

            // Check N5 label click
            for (const conn of n5Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N5 label');
                    return { interface: 'N5', connection: conn };
                }
            }
        }
    }

// Check N7 Interface (SMF-PCF direct connection)
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N7')) {
        const n7Config = window.interfaceManager.getN7Configuration();
        if (n7Config && n7Config.nfs) {
            const { SMF, PCF } = n7Config.nfs;
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N7 direct connection (green dashed line)
            const n7Connections = connections.filter(conn => {
                return conn.options && 
                       conn.options.color === '#2ecc71' && 
                       conn.options.label === 'N7' &&
                       conn.sourceId === SMF?.id && 
                       conn.targetId === PCF?.id;
            });

            // Check N7 label click
            for (const conn of n7Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N7 label');
                    return { interface: 'N7', connection: conn };
                }
            }
        }
    }

// Check N8 Interface (AMF-UDM direct connection)
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N8')) {
        const n8Config = window.interfaceManager.getN8Configuration();
        if (n8Config && n8Config.nfs) {
            const { AMF, UDM } = n8Config.nfs;
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N8 direct connection (green dashed line)
const n8Connections = connections.filter(conn => {
    return conn.options && 
           conn.options.color === '#2ecc71' && 
           conn.options.label === 'N8' &&
           conn.sourceId === AMF?.id && 
           conn.targetId === UDM?.id;
});

            // Check N8 label click
            for (const conn of n8Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N8 label');
                    return { interface: 'N8', connection: conn };
                }
            }
        }
    }

// Check N10 Interface (SMF-UDM direct connection)
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N10')) {
        console.log('✅ N10 is deployed, checking connections...');
        const n10Config = window.interfaceManager.getN10Configuration();
        if (n10Config && n10Config.nfs) {
            const { SMF, UDM } = n10Config.nfs;
            console.log('🔍 N10 Config:', { SMF: SMF?.name, UDM: UDM?.name });
            
            const connections = window.dataStore?.getAllConnections() || [];
            
            // Find N10 direct connection (green dashed line)
            const n10Connections = connections.filter(conn => {
                return conn.options && 
                       conn.options.color === '#2ecc71' && 
                       conn.options.label === 'N10' &&
                       conn.sourceId === SMF?.id && 
                       conn.targetId === UDM?.id;
            });
            
            console.log('🎯 N10 connections found:', n10Connections.length);

            // Check N10 label click
            for (const conn of n10Connections) {
                if (this.isClickOnConnectionLabel(x, y, conn)) {
                    console.log('✅ Click detected on N10 label');
                    return { interface: 'N10', connection: conn };
                }
            }
        }
    }

// Check N11 Interface (AMF-SMF direct connection)  
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N11')) {
    const n11Config = window.interfaceManager.getN11Configuration();
    if (n11Config && n11Config.nfs) {
        const { AMF, SMF } = n11Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N11 direct connection (green dashed line)
        const n11Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#2ecc71' && 
                   conn.options.label === 'N11' &&
                   conn.sourceId === AMF?.id && 
                   conn.targetId === SMF?.id;
        });

        // Check N11 label click
        for (const conn of n11Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N11 label');
                return { interface: 'N11', connection: conn };
            }
        }
    }
}

// Check N12 Interface (AMF-AUSF direct connection)  
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N12')) {
    const n12Config = window.interfaceManager.getN12Configuration();
    if (n12Config && n12Config.nfs) {
        const { AMF, AUSF } = n12Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N12 direct connection (green dashed line)
        const n12Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#2ecc71' && 
                   conn.options.label === 'N12' &&
                   conn.sourceId === AMF?.id && 
                   conn.targetId === AUSF?.id;
        });

        // Check N12 label click
        for (const conn of n12Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N12 label');
                return { interface: 'N12', connection: conn };
            }
        }
    }
}

// Check N13 Interface (AMF-NRF direct connection)  
if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed('N13')) {
    const n13Config = window.interfaceManager.getN13Configuration();
    if (n13Config && n13Config.nfs) {
        const { AMF, NRF } = n13Config.nfs;
        
        const connections = window.dataStore?.getAllConnections() || [];
        
        // Find N13 direct connection (green dashed line)
        const n13Connections = connections.filter(conn => {
            return conn.options && 
                   conn.options.color === '#2ecc71' && 
                   conn.options.label === 'N13' &&
                   conn.sourceId === AMF?.id && 
                   conn.targetId === NRF?.id;
        });

        // Check N13 label click
        for (const conn of n13Connections) {
            if (this.isClickOnConnectionLabel(x, y, conn)) {
                console.log('✅ Click detected on N13 label');
                return { interface: 'N13', connection: conn };
            }
        }
    }
}

return null;
}

/**
 * Helper method to check if click is on a connection label
 */
isClickOnConnectionLabel(x, y, conn) {
    const sourceNF = window.dataStore.getNFById(conn.sourceId);
    const targetNF = window.dataStore.getNFById(conn.targetId);
    
    if (!sourceNF || !targetNF) return false;

    // Connection line coordinates
    const x1 = sourceNF.position.x + 20;
    const y1 = sourceNF.position.y + 20;
    const x2 = targetNF.position.x + 20;
    const y2 = targetNF.position.y + 20;

    // Calculate label position
    let labelX = (x1 + x2) / 2;
    let labelY = (y1 + y2) / 2;
    
    if (conn.options.lineOffset) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perpAngle = angle + Math.PI / 2;
        const offset = conn.options.lineOffset;
        
        labelX += offset * Math.cos(perpAngle);
        labelY += offset * Math.sin(perpAngle);
    }

    // Check if click is in label area
    const labelWidth = 80;  // Wider for "N2 (NGAP)"
    const labelHeight = 20;
    
    return (x >= labelX - labelWidth/2 && 
            x <= labelX + labelWidth/2 &&
            y >= labelY - labelHeight/2 && 
            y <= labelY + labelHeight/2);
}

/**
 * Calculate distance from point to line segment
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Line start X
 * @param {number} y1 - Line start Y
 * @param {number} x2 - Line end X
 * @param {number} y2 - Line end Y
 * @returns {number} Distance in pixels
 */
distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq != 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

    /**
     * Update NFs from 5g.json topology after interface deployment
     */
    async updateNFsFromTopology(interfaceId) {
        try {
            // Load 5g.json topology
            const topologyPaths = ['../5g.json', './5g.json', '/5g.json', '5g.json'];
            let topology = null;
            
            for (const path of topologyPaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        topology = await response.json();
                        break;
                    }
                } catch (e) {
                    console.warn(`Failed to load topology from ${path}:`, e);
                }
            }
            
            if (!topology) {
                console.warn('⚠️ Could not load 5g.json, skipping topology update');
                return;
            }
            
            // Get interface configuration
            const interfaceConfig = window.interfaceManager?.deployedInterfaces.get(interfaceId);
            if (!interfaceConfig || !interfaceConfig.nfs) {
                return;
            }
            
            // Update each NF to match 5g.json
            Object.entries(interfaceConfig.nfs).forEach(([type, nf]) => {
                if (nf && nf.type !== 'DataNetwork') {
                    // Find matching NF in topology
                    const jsonNF = topology.nfs.find(n => n.type === type);
                    if (jsonNF) {
                        // Update position, IP, port, and name from 5g.json
                        nf.position = jsonNF.position;
                        nf.config.ipAddress = jsonNF.config.ipAddress;
                        nf.config.port = jsonNF.config.port;
                        nf.name = jsonNF.name;
                        nf.status = jsonNF.status || 'stable';
                        
                        // Update in dataStore
                        if (window.dataStore) {
                            window.dataStore.updateNF(nf.id, {
                                position: nf.position,
                                config: nf.config,
                                name: nf.name,
                                status: nf.status
                            });
                        }
                        
                        console.log(`✅ Updated ${nf.name} from 5g.json topology`);
                    }
                } else if (nf && nf.type === 'DataNetwork') {
                    // Handle DataNetwork separately
                    const jsonDataNetwork = topology.nfs.find(n => n.type === 'DataNetwork');
                    if (jsonDataNetwork) {
                        nf.position = jsonDataNetwork.position;
                        nf.config = jsonDataNetwork.config;
                        nf.name = jsonDataNetwork.name;
                        
                        if (window.dataStore) {
                            window.dataStore.updateNF(nf.id, {
                                position: nf.position,
                                config: nf.config,
                                name: nf.name
                            });
                        }
                        
                        console.log(`✅ Updated ${nf.name} from 5g.json topology`);
                    }
                }
            });
            
            // Render canvas after updates
            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        } catch (error) {
            console.error('❌ Error updating NFs from topology:', error);
        }
    }

    /**
     * Deploy Network Interface (with 5g.json topology support)
     */
    async deployNetworkInterface(interfaceId) {
    console.log('🚀 Deploying interface:', interfaceId);

    // Check if already deployed
    if (window.interfaceManager && window.interfaceManager.isInterfaceDeployed(interfaceId)) {
        alert(`ℹ️ ${interfaceId} Interface Already Deployed!\n\nThis interface is already active in your network.`);
        return;
    }

    if (interfaceId === 'N1') {
        if (window.interfaceManager) {
            await window.interfaceManager.deployN1Interface();
            await this.updateNFsFromTopology(interfaceId);
            this.showN1InterfaceConfiguration();
        } else {
            console.error('❌ InterfaceManager not available');
            alert('Interface Manager not initialized. Please refresh the page.');
        }
    } else if (interfaceId === 'N2') {
        if (window.interfaceManager) {
            await window.interfaceManager.deployN2Interface();
            await this.updateNFsFromTopology(interfaceId);
            this.showN2InterfaceConfiguration();
        } else {
            console.error('❌ InterfaceManager not available');
            alert('Interface Manager not initialized. Please refresh the page.');
        }
    } else if (interfaceId === 'N3') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN3Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN3InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N4') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN4Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN4InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N5') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN5Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN5InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N6') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN6Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN6InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N7') {
        if (window.interfaceManager) {
            await window.interfaceManager.deployN7Interface();
            await this.updateNFsFromTopology(interfaceId);
            this.showN7InterfaceConfiguration();
        } else {
            console.error('❌ InterfaceManager not available');
            alert('Interface Manager not initialized. Please refresh the page.');
        }
    } else if (interfaceId === 'N8') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN8Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN8InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N10') {
    if (window.interfaceManager) {
        await window.interfaceManager.deployN10Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN10InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N11') {  
    if (window.interfaceManager) {
        await window.interfaceManager.deployN11Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN11InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N12') {  
    if (window.interfaceManager) {
        await window.interfaceManager.deployN12Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN12InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
} else if (interfaceId === 'N13') {  
    if (window.interfaceManager) {
        await window.interfaceManager.deployN13Interface();
        await this.updateNFsFromTopology(interfaceId);
        this.showN13InterfaceConfiguration();
    } else {
        console.error('❌ InterfaceManager not available');
        alert('Interface Manager not initialized. Please refresh the page.');
    }
}   else {
        alert(`ℹ️ ${interfaceId} Interface\n\nThis interface will be implemented in the next phase.\n\nCurrently N1 and N2 interfaces are available.`);
    }
}


    /**
 * Show N1 Interface Configuration Panel
 */
showN1InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n1Config = window.interfaceManager.getN1Configuration();
    const interfaceData = n1Config.interface;
    const { UE, gNB, AMF } = n1Config.nfs;

    configForm.innerHTML = `
        <h4>📱 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Message Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                ${interfaceData.flow.map(step => `<div>✓ ${step}</div>`).join('')}
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(UE, 'UE')}
        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N2 Interface Configuration Panel
 */
showN2InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n2Config = window.interfaceManager.getN2Configuration();
    if (!n2Config) {
        alert('N2 Interface not deployed yet. Please deploy N2 first.');
        return;
    }

    const interfaceData = n2Config.interface;
    const { gNB, AMF } = n2Config.nfs;

    configForm.innerHTML = `
        <h4>📡 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(233, 30, 99, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #e91e63;">
            <h5 style="color: #e91e63; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N3 Interface Configuration Panel
 */
showN3InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n3Config = window.interfaceManager.getN3Configuration();
    if (!n3Config) {
        alert('N3 Interface not deployed yet. Please deploy N3 first.');
        return;
    }

    const interfaceData = n3Config.interface;
    const { UE, gNB, UPF, DataNetwork } = n3Config.nfs;

    configForm.innerHTML = `
        <h4>📡 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(243, 156, 18, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
            <h5 style="color: #f39c12; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Data Path Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE generates user data (browsing, streaming)</div>
                <div>✓ gNB encapsulates data in GTP-U tunnel</div>
                <div>✓ Data flows through N3 tunnel to UPF</div>
                <div>✓ UPF decapsulates and routes to Internet (N6)</div>
                <div>✓ Return path: Internet → UPF → gNB → UE</div>
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">N3 Tunnel Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Tunnel Protocol:</strong> GTP-U (GPRS Tunneling Protocol - User Plane)<br>
                <strong>Encapsulation:</strong> User IP packets in GTP-U headers<br>
                <strong>QoS Support:</strong> Per-flow QoS marking via 5QI<br>
                <strong>Tunnel Endpoint:</strong> gNB ↔ UPF<br>
                <strong>Purpose:</strong> Transparent user data transport<br>
                <strong>Security:</strong> IPsec optional for N3 protection
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(UE, 'UE')}
        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(UPF, 'UPF')}
        ${this.generateDataNetworkConfigHTML(DataNetwork)}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N4 Interface Configuration Panel
 */
showN4InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n4Config = window.interfaceManager.getN4Configuration();
    if (!n4Config) {
        alert('N4 Interface not deployed yet. Please deploy N4 first.');
        return;
    }

    const interfaceData = n4Config.interface;
    const { UE, gNB, AMF, SMF, UPF } = n4Config.nfs;

    configForm.innerHTML = `
        <h4>⚙️ ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #e74c3c;">
            <h5 style="color: #e74c3c; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Control Path Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE initiates PDU Session Request</div>
                <div>✓ Request flows: UE → gNB (N1) → AMF (N2)</div>
                <div>✓ AMF forwards to SMF via Service Bus (Namf SBI)</div>
                <div>✓ SMF programs UPF via N4 (PFCP)</div>
                <div>✓ UPF installs packet forwarding rules</div>
            </div>
        </div>

        <div style="background: rgba(231, 76, 60, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #e74c3c;">
            <h5 style="color: #e74c3c; margin-bottom: 10px;">N4 (PFCP) Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Protocol:</strong> PFCP (Packet Forwarding Control Protocol)<br>
                <strong>Purpose:</strong> SMF controls UPF packet processing<br>
                <strong>What SMF sends:</strong> PDR (Packet Detection Rules), FAR (Forwarding Action Rules)<br>
                <strong>What UPF reports:</strong> Usage statistics, error reports<br>
                <strong>Session Management:</strong> Create/Modify/Delete PDU sessions<br>
                <strong>QoS Control:</strong> Per-flow QoS enforcement
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(UE, 'UE')}
        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}
        ${this.generateCleanNFConfigHTML(SMF, 'SMF')}
        ${this.generateCleanNFConfigHTML(UPF, 'UPF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N5 Interface Configuration Panel
 */
showN5InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n5Config = window.interfaceManager.getN5Configuration();
    if (!n5Config) {
        alert('N5 Interface not deployed yet. Please deploy N5 first.');
        return;
    }

    const interfaceData = n5Config.interface;
    const { AF, PCF } = n5Config.nfs;

    configForm.innerHTML = `
        <h4>💚 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Green Dashed Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Communication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ Application requests policy from AF</div>
                <div>✓ AF sends policy authorization request to PCF via N5</div>
                <div>✓ Direct connection for low-latency policy decisions</div>
                <div>✓ PCF evaluates policy rules</div>
                <div>✓ PCF responds with policy decision</div>
                <div>✓ AF enforces policy at application layer</div>
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">N5 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Npcf_PolicyAuthorization<br>
                <strong>Purpose:</strong> Application-triggered policy control<br>
                <strong>What AF requests:</strong> QoS changes, traffic steering, charging rules<br>
                <strong>What PCF provides:</strong> Policy decisions, QoS parameters, charging control<br>
                <strong>Use Cases:</strong> Video optimization, gaming prioritization, enterprise policies<br>
                <strong>Connection Type:</strong> Direct point-to-point (no bus)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(AF, 'AF')}
        ${this.generateCleanNFConfigHTML(PCF, 'PCF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N6 Interface Configuration Panel (EXACT COPY OF N3)
 */
showN6InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n6Config = window.interfaceManager.getN6Configuration();
    if (!n6Config) {
        alert('N6 Interface not deployed yet. Please deploy N6 first.');
        return;
    }

    const interfaceData = n6Config.interface;
    const { UE, gNB, UPF, DataNetwork } = n6Config.nfs;

    configForm.innerHTML = `
        <h4>🌐 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(22, 160, 133, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #16a085;">
            <h5 style="color: #16a085; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Data Path Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE generates user data (browsing, streaming)</div>
                <div>✓ gNB encapsulates data in GTP-U tunnel</div>
                <div>✓ Data flows through N3 tunnel to UPF</div>
                <div>✓ UPF decapsulates and routes to Internet (N6)</div>
                <div>✓ Return path: Internet → UPF → gNB → UE</div>
            </div>
        </div>

        <div style="background: rgba(22, 160, 133, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #16a085;">
            <h5 style="color: #16a085; margin-bottom: 10px;">N6 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Purpose:</strong> Connect 5G network to external data networks<br>
                <strong>Protocol:</strong> Standard IP routing<br>
                <strong>Supported Networks:</strong> Internet, IMS, Enterprise networks<br>
                <strong>Data Translation:</strong> UPF performs NAT/PAT<br>
                <strong>Security:</strong> Firewall and DPI at UPF<br>
                <strong>QoS:</strong> Per-flow traffic shaping and prioritization
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(UE, 'UE')}
        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(UPF, 'UPF')}
        ${this.generateDataNetworkConfigHTML(DataNetwork)}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N7 Interface Configuration Panel
 */
showN7InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n7Config = window.interfaceManager.getN7Configuration();
    if (!n7Config) {
        alert('N7 Interface not deployed yet. Please deploy N7 first.');
        return;
    }

    const interfaceData = n7Config.interface;
    const { SMF, PCF } = n7Config.nfs;

    configForm.innerHTML = `
        <h4>🧡 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(230, 126, 34, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #e67e22;">
            <h5 style="color: #e67e22; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Orange Dashed Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Communication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE requests PDU Session establishment</div>
                <div>✓ SMF needs policy rules for the session</div>
                <div>✓ SMF sends policy request to PCF via N7</div>
                <div>✓ Direct connection for session policy decisions</div>
                <div>✓ PCF evaluates subscriber policies</div>
                <div>✓ PCF returns PCC rules (QoS, charging, etc.)</div>
                <div>✓ SMF applies policies to PDU session</div>
            </div>
        </div>

        <div style="background: rgba(230, 126, 34, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #e67e22;">
            <h5 style="color: #e67e22; margin-bottom: 10px;">N7 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Npcf_SMPolicyControl<br>
                <strong>Purpose:</strong> Session management policy control<br>
                <strong>What SMF requests:</strong> PCC rules, QoS parameters, charging policies<br>
                <strong>What PCF provides:</strong> Policy and Charging Control rules for sessions<br>
                <strong>Use Cases:</strong> PDU session QoS, traffic differentiation, charging control<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(SMF, 'SMF')}
        ${this.generateCleanNFConfigHTML(PCF, 'PCF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N8 Interface Configuration Panel
 */
showN8InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n8Config = window.interfaceManager.getN8Configuration();
    if (!n8Config) {
        alert('N8 Interface not deployed yet. Please deploy N8 first.');
        return;
    }

    const interfaceData = n8Config.interface;
    const { UE, gNB, AMF, UDM } = n8Config.nfs;

    configForm.innerHTML = `
        <h4>👤 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (White Solid Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Communication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE attaches to network via gNB</div>
                <div>✓ gNB forwards registration to AMF (N2)</div>
                <div>✓ AMF needs subscriber data from UDM</div>
                <div>✓ AMF sends request to UDM via N8</div>
                <div>✓ Direct connection for subscriber context</div>
                <div>✓ UDM returns subscription profile</div>
                <div>✓ AMF completes registration with subscriber data</div>
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">N8 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Nudm_UECM (UE Context Management)<br>
                <strong>Purpose:</strong> AMF retrieves subscriber data from UDM<br>
                <strong>What AMF requests:</strong> SUPI, subscription data, authentication vectors<br>
                <strong>What UDM provides:</strong> Subscriber profile, authentication credentials, slice info<br>
                <strong>Use Cases:</strong> Registration, authentication, mobility management<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(UE, 'UE')}
        ${this.generateCleanNFConfigHTML(gNB, 'gNB')}
        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}
        ${this.generateCleanNFConfigHTML(UDM, 'UDM')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N10 Interface Configuration Panel
 */
showN10InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n10Config = window.interfaceManager.getN10Configuration();
    if (!n10Config) {
        alert('N10 Interface not deployed yet. Please deploy N10 first.');
        return;
    }

    const interfaceData = n10Config.interface;
    const { SMF, UDM } = n10Config.nfs;

    configForm.innerHTML = `
        <h4>📊 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(241, 196, 15, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f1c40f;">
            <h5 style="color: #f1c40f; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Yellow Solid Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Communication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE requests PDU Session establishment</div>
                <div>✓ AMF selects SMF for the session</div>
                <div>✓ SMF needs subscriber session data from UDM</div>
                <div>✓ SMF sends request to UDM via N10</div>
                <div>✓ Direct connection for session subscription data</div>
                <div>✓ UDM returns session management subscription</div>
                <div>✓ SMF establishes PDU session with subscription data</div>
            </div>
        </div>

        <div style="background: rgba(241, 196, 15, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f1c40f;">
            <h5 style="color: #f1c40f; margin-bottom: 10px;">N10 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Nudm_SDM (Subscriber Data Management)<br>
                <strong>Purpose:</strong> SMF retrieves session management subscription data<br>
                <strong>What SMF requests:</strong> DNN authorization, S-NSSAI info, session AMBR<br>
                <strong>What UDM provides:</strong> Session subscription data, QoS profiles, allowed DNNs<br>
                <strong>Use Cases:</strong> PDU session establishment, session modification, DNN authorization<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(SMF, 'SMF')}
        ${this.generateCleanNFConfigHTML(UDM, 'UDM')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N11 Interface Configuration Panel
 */
showN11InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n11Config = window.interfaceManager.getN11Configuration();
    if (!n11Config) {
        alert('N11 Interface not deployed yet. Please deploy N11 first.');
        return;
    }

    const interfaceData = n11Config.interface;
    const { AMF, SMF } = n11Config.nfs;

    configForm.innerHTML = `
        <h4>🔗 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Green Dashed Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Communication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE requests PDU Session establishment</div>
                <div>✓ AMF receives request from UE via N1/N2</div>
                <div>✓ AMF selects appropriate SMF</div>
                <div>✓ AMF sends session request to SMF via N11</div>
                <div>✓ Direct connection for session control</div>
                <div>✓ SMF establishes PDU session</div>
                <div>✓ SMF responds to AMF with session details</div>
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">N11 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Namf_Communication<br>
                <strong>Purpose:</strong> AMF triggers SMF for PDU session management<br>
                <strong>What AMF sends:</strong> PDU session requests, UE context, DNN, S-NSSAI<br>
                <strong>What SMF provides:</strong> PDU session IDs, QoS parameters, session status<br>
                <strong>Use Cases:</strong> PDU session create/modify/release, handover management<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}
        ${this.generateCleanNFConfigHTML(SMF, 'SMF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N12 Interface Configuration Panel
 */
showN12InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n12Config = window.interfaceManager.getN12Configuration();
    if (!n12Config) {
        alert('N12 Interface not deployed yet. Please deploy N12 first.');
        return;
    }

    const interfaceData = n12Config.interface;
    const { AMF, AUSF } = n12Config.nfs;

    configForm.innerHTML = `
        <h4>🔐 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Green Dashed Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Authentication Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ UE sends Registration Request to AMF</div>
                <div>✓ AMF extracts SUCI (Subscription Concealed Identifier)</div>
                <div>✓ AMF sends Authentication Request to AUSF via N12</div>
                <div>✓ Direct connection for authentication service</div>
                <div>✓ AUSF generates authentication vectors</div>
                <div>✓ AUSF responds with authentication challenge</div>
                <div>✓ AMF completes 5G-AKA authentication with UE</div>
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">N12 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Service:</strong> Nausf_UEAuthentication<br>
                <strong>Purpose:</strong> AMF requests UE authentication from AUSF<br>
                <strong>What AMF sends:</strong> SUCI, serving network name, authentication type<br>
                <strong>What AUSF provides:</strong> Authentication vectors, SUPI, KAUSF key<br>
                <strong>Authentication Method:</strong> 5G-AKA (Authentication and Key Agreement)<br>
                <strong>Use Cases:</strong> Initial registration, re-authentication, key refresh<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}
        ${this.generateCleanNFConfigHTML(AUSF, 'AUSF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

/**
 * Show N13 Interface Configuration Panel
 */
showN13InterfaceConfiguration() {
    const configForm = document.getElementById('config-form');
    if (!configForm) return;

    if (!window.interfaceManager) {
        console.error('❌ InterfaceManager not available');
        return;
    }

    const n13Config = window.interfaceManager.getN13Configuration();
    if (!n13Config) {
        alert('N13 Interface not deployed yet. Please deploy N13 first.');
        return;
    }

    const interfaceData = n13Config.interface;
    const { AMF, NRF } = n13Config.nfs;

    configForm.innerHTML = `
        <h4>🔍 ${interfaceData.name} Configuration</h4>
        
        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">Interface Details</h5>
            <div style="font-size: 12px; line-height: 1.8;">
                <strong>Name:</strong> ${interfaceData.name}<br>
                <strong>From:</strong> ${interfaceData.from}<br>
                <strong>To:</strong> ${interfaceData.to}<br>
                <strong>Protocol:</strong> ${interfaceData.protocol}<br>
                <strong>Type:</strong> ${interfaceData.type}<br>
                <strong>Connection:</strong> Direct (Green Dashed Line)<br>
                <strong>Status:</strong> <span style="color: #2ecc71;">●</span> Active
            </div>
        </div>

        <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3498db;">
            <h5 style="color: #3498db; margin-bottom: 10px;">Service Discovery Flow</h5>
            <div style="font-size: 11px; line-height: 2;">
                <div>✓ AMF starts up and needs to find other NFs</div>
                <div>✓ AMF registers itself with NRF via N13</div>
                <div>✓ AMF sends discovery request to NRF</div>
                <div>✓ Direct connection for NF management</div>
                <div>✓ NRF returns list of available NFs (SMF, UDM, AUSF, etc.)</div>
                <div>✓ AMF stores NF profiles for future communication</div>
                <div>✓ AMF subscribes to NRF for NF status updates</div>
            </div>
        </div>

        <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2ecc71;">
            <h5 style="color: #2ecc71; margin-bottom: 10px;">N13 Interface Details</h5>
            <div style="font-size: 11px; line-height: 1.8;">
                <strong>Services:</strong> Nnrf_NFDiscovery, Nnrf_NFManagement<br>
                <strong>Purpose:</strong> AMF discovers and registers with NRF<br>
                <strong>What AMF sends:</strong> NF profile, NF status, discovery queries<br>
                <strong>What NRF provides:</strong> Available NF list, NF profiles, endpoint URLs<br>
                <strong>Discovery Types:</strong> Find SMF, UDM, AUSF, PCF, UDR by type/slice<br>
                <strong>Use Cases:</strong> NF registration, NF discovery, heartbeat, status updates<br>
                <strong>Connection Type:</strong> Direct point-to-point (with bus for discovery)
            </div>
        </div>

        ${this.generateCleanNFConfigHTML(AMF, 'AMF')}
        ${this.generateCleanNFConfigHTML(NRF, 'NRF')}

        <button class="btn btn-secondary btn-block" id="btn-close-config" style="margin-top: 20px;">Close Configuration</button>
    `;

    const closeBtn = document.getElementById('btn-close-config');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.hideNFConfigPanel();
        });
    }
}

    /**
     * Generate NF Configuration HTML
     */
    generateNFConfigHTML(nf, nfType) {
        if (!nf) {
            return `
                <div style="background: rgba(231, 76, 60, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #e74c3c;">
                    <strong style="color: #e74c3c;">${nfType}:</strong> Not deployed
                </div>
            `;
        }

        const details = this.getNFSpecificDetails(nf);

        return `
            <div style="background: rgba(52, 73, 94, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${nf.color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: ${nf.color};">${nf.name}</strong>
                    <span style="font-size: 10px; color: #2ecc71;">● ${nf.status.toUpperCase()}</span>
                </div>
                <div style="font-size: 11px; line-height: 1.6; color: #bdc3c7;">
                    <strong>📍 Network:</strong> ${nf.config.ipAddress}:${nf.config.port}<br>
                    <strong>🔧 Protocol:</strong> ${nf.config.httpProtocol}<br>
                    <strong>📊 What it has:</strong> ${details.has}<br>
                    <strong>📤 What it shares:</strong> ${details.shares}<br>
                    <strong>📥 What it receives:</strong> ${details.receives}<br>
                    <strong>🔗 From/To:</strong> ${details.connections}
                </div>
            </div>
        `;
    }

/**
 * Generate clean NF Configuration HTML (without emojis and From/To line)
 */
generateCleanNFConfigHTML(nf, nfType) {
    if (!nf) {
        return `
            <div style="background: rgba(231, 76, 60, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #e74c3c;">
                <strong style="color: #e74c3c;">${nfType}:</strong> Not deployed
            </div>
        `;
    }

    const details = this.getNFSpecificDetails(nf);

    return `
        <div style="background: rgba(52, 73, 94, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${nf.color};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: ${nf.color};">${nf.name}</strong>
                <span style="font-size: 10px; color: #2ecc71;">● ${nf.status.toUpperCase()}</span>
            </div>
            <div style="font-size: 11px; line-height: 1.6; color: #bdc3c7;">
                <strong>Network:</strong> ${nf.config.ipAddress}:${nf.config.port}<br>
                <strong>Protocol:</strong> ${nf.config.httpProtocol}<br>
                <strong>What it has:</strong> ${details.has}<br>
                <strong>What it shares:</strong> ${details.shares}<br>
                <strong>What it receives:</strong> ${details.receives}
            </div>
        </div>
    `;
}

/**
 * Generate Data Network (Internet) Configuration HTML
 */
generateDataNetworkConfigHTML(dataNetwork) {
    if (!dataNetwork) {
        return '';
    }

    return `
        <div style="background: rgba(22, 160, 133, 0.2); padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #16a085;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #16a085;">🌐 ${dataNetwork.name}</strong>
                <span style="font-size: 10px; color: #2ecc71;">● ACTIVE</span>
            </div>
            <div style="font-size: 11px; line-height: 1.6; color: #bdc3c7;">
                <strong>Network:</strong> ${dataNetwork.config.ipAddress}:${dataNetwork.config.port}<br>
                <strong>Protocol:</strong> ${dataNetwork.config.httpProtocol}<br>
                <strong>Type:</strong> External Data Network<br>
                <strong>Gateway:</strong> Public Internet Gateway<br>
                <strong>What it provides:</strong> Internet connectivity, DNS, Content delivery<br>
                <strong>What it receives:</strong> User data from UPF via N6
            </div>
        </div>
    `;
}
    /**
     * Get NF-specific configuration details
     */
    getNFSpecificDetails(nf) {
        const connections = window.dataStore?.getConnectionsForNF(nf.id) || [];
        const connectedNFs = connections.map(conn => {
            const otherNfId = conn.sourceId === nf.id ? conn.targetId : conn.sourceId;
            const otherNf = window.dataStore?.getNFById(otherNfId);
            return otherNf ? otherNf.name : 'Unknown';
        }).join(', ') || 'None';

        const details = {
    'UE': {
        has: 'IMSI (15-digit), SUPI, IP address',
        shares: 'Registration Request, NAS messages',
        receives: 'Registration Accept, Configuration',
        connections: connectedNFs
    },
    'gNB': {
        has: 'Cell ID, Radio resources, RRC',
        shares: 'NGAP messages, User data',
        receives: 'NAS from UE, Control from AMF',
        connections: connectedNFs
    },
    'AMF': {
        has: 'GUAMI, Tracking Area, UE context',
        shares: 'Registration Accept, Mobility updates',
        receives: 'NAS messages from UE/gNB',
        connections: connectedNFs
    },
    'SMF': {
        has: 'PDU Session ID, QoS parameters',
        shares: 'Session establishment, N4 rules',
        receives: 'Session requests from AMF',
        connections: connectedNFs
    },
    'UPF': {
        has: 'Data plane stats, Throughput info',
        shares: 'User traffic, Statistics',
        receives: 'PFCP rules from SMF, User data',
        connections: connectedNFs
    },
    'AF': {
        has: 'Application requirements, Traffic descriptors',
        shares: 'Policy requests, QoS requirements',
        receives: 'Policy decisions from PCF',
        connections: connectedNFs
    },
    'PCF': {
        has: 'Policy rules, QoS profiles, Charging rules',
        shares: 'Policy decisions, PCC rules',
        receives: 'Policy requests from AF/AMF/SMF',
        connections: connectedNFs
    },
'UDM': {
    has: 'Subscriber profiles, Authentication credentials, SUPI/SUCI mappings',
    shares: 'Subscriber data, Authentication vectors, Slice selection info',
    receives: 'Subscriber data requests from AMF/SMF/AUSF',
    connections: connectedNFs
}
};

        return details[nf.type] || {
            has: 'Network configuration',
            shares: 'Service data',
            receives: 'Control messages',
            connections: connectedNFs
        };
    }
}

// ==========================================
// END OF UI CONTROLLER CLASS
// ==========================================

console.log('✅ UIController class definition complete');
