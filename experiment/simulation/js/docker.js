/***
 * ============================================
 * DOCKER TERMINAL MANAGER
 * ============================================
 * Manages Docker terminal functionality for managing Network Functions
 * 
 * Responsibilities:
 * - Docker compose commands (up, down, ps)
 * - Start/stop individual NFs
 * - Display service status with health indicators
 * - Watch mode for real-time status updates
 */

class DockerTerminal {
    constructor() {
        this.watchInterval = null;
        this.isWatching = false;
        this.dockerServices = new Map(); // Map of service name to status

        // Terminal window state
        this.terminalState = {
            x: null,
            y: null,
            width: 900,
            height: 700,
            isMaximized: false,
            isMinimized: false
        };

        // Network state
        this.oaiWorkshopNetworkExists = false;
        this.oaiWorkshopNetworkId = this.generateNetworkId();
        this.oaiWorkshopCreatedTime = null;

        console.log('✅ DockerTerminal initialized');
    }

    /**
     * Initialize Docker terminal button
     */
    init() {
        // Button is added in HTML, just setup click handler if needed
        console.log('✅ Docker terminal ready');
    }

    /**
     * Open Docker terminal modal
     */
    openTerminal() {
        // Remove existing terminal if any
        const existingTerminal = document.getElementById('docker-terminal-modal');
        if (existingTerminal) {
            existingTerminal.remove();
        }

        // Create terminal modal
        const terminalModal = document.createElement('div');
        terminalModal.id = 'docker-terminal-modal';
        terminalModal.className = 'docker-terminal-modal';
        terminalModal.innerHTML = `
            <div class="docker-terminal-window" id="docker-terminal-window">
                <div class="docker-terminal-titlebar" id="docker-terminal-titlebar">
                    <div class="docker-terminal-title">
                        <span class="docker-terminal-icon">🐳</span>
                        Docker Terminal - Main Terminal
                    </div>
                    <div class="docker-terminal-controls">
                        <button class="docker-terminal-btn close" id="docker-terminal-close" title="Close">×</button>
                    </div>
                </div>
                <div class="docker-terminal-content" id="docker-terminal-content" tabindex="0">
                    <div class="docker-terminal-output" id="docker-terminal-output"></div>
                </div>
                <div class="docker-terminal-resize-handle" id="docker-terminal-resize-handle"></div>
            </div>
        `;

        document.body.appendChild(terminalModal);

        // Setup terminal functionality
        this.setupTerminal(terminalModal);

        // Setup dragging, resizing, and window controls
        this.setupWindowControls(terminalModal);

        // Apply saved position and size
        this.applyTerminalState();

        // Show terminal with animation
        setTimeout(() => {
            terminalModal.classList.add('show');
        }, 10);

        // Focus on terminal content for keyboard input
        const content = document.getElementById('docker-terminal-content');
        if (content) {
            content.focus();
        }
    }

    /**
     * Setup Docker terminal functionality
     * @param {HTMLElement} terminalModal - Terminal modal element
     */
    setupTerminal(terminalModal) {
        const content = document.getElementById('docker-terminal-content');
        const output = document.getElementById('docker-terminal-output');
        const closeBtn = document.getElementById('docker-terminal-close');

        let commandHistory = [];
        let historyIndex = -1;
        let currentCommand = '';
        let currentInputLine = null;
        let cursorVisible = true;
        let isCommandRunning = false; // Lock to prevent input during command execution

        // Close button
        closeBtn.addEventListener('click', () => {
            this.stopWatch();
            terminalModal.classList.remove('show');
            setTimeout(() => {
                terminalModal.remove();
            }, 300);
        });

        // Click outside to close
        terminalModal.addEventListener('click', (e) => {
            if (e.target === terminalModal) {
                closeBtn.click();
            }
        });

        // Create initial input line
        const createInputLine = () => {
            const line = document.createElement('div');
            line.className = 'docker-terminal-line docker-terminal-input-active';
            line.innerHTML = `<span class="docker-terminal-prompt">docker@main></span><span class="docker-terminal-cursor-line"></span>`;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
            return line;
        };

        // Update input line display
        const updateInputLine = () => {
            if (currentInputLine) {
                const cursorChar = cursorVisible ? '▋' : '';
                const promptClass = isCommandRunning ? 'docker-terminal-prompt-disabled' : 'docker-terminal-prompt';
                currentInputLine.innerHTML = `<span class="${promptClass}">docker@main></span><span class="docker-terminal-command-text">${this.escapeHtml(currentCommand)}</span><span class="docker-terminal-cursor">${cursorChar}</span>`;
            }
        };

        // Cursor blink
        const cursorInterval = setInterval(() => {
            cursorVisible = !cursorVisible;
            updateInputLine();
        }, 500);

        // Cleanup on terminal close
        terminalModal.addEventListener('remove', () => {
            clearInterval(cursorInterval);
        });

        // Keyboard handling for inline input
        content.addEventListener('keydown', async (e) => {
            // Block all input if command is running (except Ctrl+C for watch mode)
            if (isCommandRunning && !(e.ctrlKey && e.key === 'c' && this.isWatching)) {
                e.preventDefault();
                return;
            }

            // Handle Ctrl+C to stop watch mode
            if (e.ctrlKey && e.key === 'c' && this.isWatching) {
                e.preventDefault();
                this.stopWatch();
                this.addTerminalLine(output, '', 'blank');
                this.addTerminalLine(output, 'Watch mode stopped.', 'info');
                this.addTerminalLine(output, '', 'blank');
                // Create new input line
                currentCommand = '';
                currentInputLine = createInputLine();
                updateInputLine();
                return;
            }

            // Handle Ctrl+C for regular commands (cancel)
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                // Convert current input line to regular line showing cancelled command
                if (currentInputLine && currentCommand) {
                    currentInputLine.innerHTML = `<span class="docker-terminal-prompt">docker@main></span><span class="docker-terminal-command-text">${this.escapeHtml(currentCommand)}</span><span class="docker-terminal-cursor"></span>`;
                    currentInputLine.classList.remove('docker-terminal-input-active');
                }
                this.addTerminalLine(output, '^C', 'info');
                currentCommand = '';
                currentInputLine = createInputLine();
                updateInputLine();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const command = currentCommand.trim();
                
                // Convert input line to regular line
                if (currentInputLine) {
                    currentInputLine.innerHTML = `<span class="docker-terminal-prompt">docker@main></span><span class="docker-terminal-command-text">${this.escapeHtml(currentCommand)}</span>`;
                    currentInputLine.classList.remove('docker-terminal-input-active');
                }
                
                if (command) {
                    // Add to history
                    commandHistory.push(command);
                    historyIndex = commandHistory.length;

                    // Lock input during command execution
                    isCommandRunning = true;

                    // Process command
                    await this.processCommand(command, output);

                    // Unlock input after command completes
                    isCommandRunning = false;
                }
                
                // Create new input line
                currentCommand = '';
                currentInputLine = createInputLine();
                updateInputLine();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    currentCommand = commandHistory[historyIndex];
                    updateInputLine();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    currentCommand = commandHistory[historyIndex];
                    updateInputLine();
                } else {
                    historyIndex = commandHistory.length;
                    currentCommand = '';
                    updateInputLine();
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                currentCommand = currentCommand.slice(0, -1);
                updateInputLine();
            } else if (e.key === 'Tab') {
                e.preventDefault();

                // Real terminal tab completion:
                // - Split input into tokens, complete the LAST token
                // - Flags (-f, -d, etc.) are real tokens, kept as-is
                // - Single match → complete in place
                // - Multiple matches → print all below, keep input unchanged

                // Full command tree (each entry is a full valid command)
                const allCommands = [
                    'help',
                    'status',
                    'check',
                    'clear',
                    'cls',
                    'exit',
                    'ls',
                    'ls -la',
                    'ls -l',
                    'vi docker-compose.yml',
                    'ping',
                    'ping subnet',
                    'watch docker compose -f docker-compose.yml ps -a',
                    'docker compose -f docker-compose.yml up -d',
                    'docker compose -f docker-compose-gnb.yml up -d',
                    'docker compose -f docker-compose-ue.yml up -d',
                    'docker compose -f docker-compose-ran.yml up -d oai-ue1',
                    'docker compose -f docker-compose-ran.yml up -d oai-ue2',
                    'docker compose -f docker-compose.yml down',
                    'docker compose -f docker-compose-gnb.yml down',
                    'docker compose -f docker-compose-ue.yml down',
                    'docker compose up -d',
                    'docker compose down',
                    'docker ps',
                    'docker network ls',
                    'docker network inspect oaiworkshop',
                    'docker version',
                    'docker start',
                    'docker stop',
                ];

                const input = currentCommand;
                const tokens = input.split(' ');
                const lastToken = tokens[tokens.length - 1];
                const prefix = tokens.slice(0, -1).join(' ');

                // Find all commands that start with the full current input
                const matches = allCommands.filter(cmd =>
                    cmd.toLowerCase().startsWith(input.toLowerCase())
                );

                if (matches.length === 0) {
                    // nothing to complete

                } else {
                    // Find LCP across all matches but stop at next space — one word at a time
                    const lcp = matches.reduce((acc, cmd) => {
                        let i = 0;
                        while (i < acc.length && i < cmd.length && acc[i].toLowerCase() === cmd[i].toLowerCase()) i++;
                        return acc.slice(0, i);
                    });

                    // Trim LCP to the end of the next word (no jumping multiple words)
                    const afterInput = lcp.slice(input.length);
                    const nextSpaceIdx = afterInput.indexOf(' ');
                    const oneWordExtension = nextSpaceIdx === -1 ? afterInput : afterInput.slice(0, nextSpaceIdx);
                    const completed = input + oneWordExtension;

                    if (completed.length > input.length) {
                        // Extend by one word
                        currentCommand = completed;
                        updateInputLine();
                    } else {
                        // Already at ambiguous point — show all matches
                        if (currentInputLine) {
                            currentInputLine.innerHTML = `<span class="docker-terminal-prompt">docker@main></span><span class="docker-terminal-command-text">${this.escapeHtml(currentCommand)}</span>`;
                            currentInputLine.classList.remove('docker-terminal-input-active');
                        }
                        this.addTerminalLine(output, '', 'blank');
                        matches.forEach(m => this.addTerminalLine(output, m, 'info'));
                        this.addTerminalLine(output, '', 'blank');
                        currentInputLine = createInputLine();
                        updateInputLine();
                    }
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                currentCommand += e.key;
                updateInputLine();
            }
        });

        // Focus content on click
        content.addEventListener('click', () => {
            content.focus();
        });

        // Initial welcome message
        this.addTerminalLine(output, '5G WIRELESS LAB', 'info');
        this.addTerminalLine(output, 'Type "help" for available commands.', 'info');
        this.addTerminalLine(output, '', 'blank');
        
        // Create initial input line
        currentInputLine = createInputLine();
        updateInputLine();
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Process Docker command
     * @param {string} command - Command to process
     * @param {HTMLElement} output - Output element
     */
    async processCommand(command, output) {
        const cmd = command.toLowerCase().trim();
        const args = command.split(' ');

        if (cmd === 'help' || cmd === '?') {
            this.showHelp(output);
        } else if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'ls -l') {
            this.lsCommand(output);
        } else if (cmd === 'vi docker-compose.yml' || cmd === 'cat docker-compose.yml' || cmd === 'view docker-compose.yml') {
            this.viDockerCompose(output);
        } else if (cmd === 'status' || cmd === 'check') {
            this.checkSystemStatus(output);
        } else if (cmd === 'docker compose -f docker-compose.yml up -d' || cmd === 'docker-compose -f docker-compose.yml up -d' ||
                   cmd === 'docker compose up -d' ||
                   cmd === 'docker-compose up -d') {
            await this.dockerComposeUp(output);
        } else if (cmd === 'docker compose -f docker-compose-gnb.yml up -d' || 
                   cmd === 'docker-compose -f docker-compose-gnb.yml up -d') {
            await this.dockerComposeGnbUp(output);
        } else if (cmd === 'docker compose -f docker-compose-ue.yml up -d' || 
                   cmd === 'docker-compose -f docker-compose-ue.yml up -d') {
            await this.dockerComposeUeUp(output);
        } else if (cmd === 'docker compose -f docker-compose-ran.yml up -d oai-ue1' || 
                   cmd === 'docker-compose -f docker-compose-ran.yml up -d oai-ue1') {
            await this.dockerComposeUe1Up(output);
        } else if (cmd === 'docker compose -f docker-compose-ran.yml up -d oai-ue2' || 
                   cmd === 'docker-compose -f docker-compose-ran.yml up -d oai-ue2') {
            await this.dockerComposeUe2Up(output);
        } else if (cmd === 'docker ps') {
            await this.dockerPS(output);
        } else if (cmd === 'docker network ls') {
            this.dockerNetworkLS(output);
        } else if (cmd.startsWith('docker network inspect ')) {
            const networkName = args.slice(3).join(' ');
            this.dockerNetworkInspect(networkName, output);
        } else if (cmd === 'docker version') {
            this.dockerVersion(output);
        } else if (cmd.startsWith('watch docker compose -f docker-compose.yml ps -a') ||
                   cmd.startsWith('watch docker-compose -f docker-compose.yml ps -a') ||
                   cmd.startsWith('watch docker compose ps -a')) {
            this.startWatch(output);
        } else if (cmd === 'docker compose -f docker-compose.yml down' ||
                   cmd === 'docker-compose -f docker-compose.yml down' ||
                   cmd === 'docker compose down' ||
                   cmd === 'docker-compose down') {
            await this.dockerComposeDown(output);
         } else if (cmd.startsWith('docker compose -f docker-compose.yml up -d ') ||
                 cmd.startsWith('docker-compose -f docker-compose.yml up -d ') ||
                 cmd.startsWith('docker compose up -d ') ||
                 cmd.startsWith('docker-compose up -d ')) {
             const parts = command.split(' ').filter(Boolean);
             const serviceName = parts[parts.length - 1];
             await this.dockerComposeServiceUp(serviceName, output);
         } else if (cmd.startsWith('docker compose -f docker-compose.yml down ') ||
                 cmd.startsWith('docker-compose -f docker-compose.yml down ') ||
                 cmd.startsWith('docker compose down ') ||
                 cmd.startsWith('docker-compose down ')) {
             const parts = command.split(' ').filter(Boolean);
             const serviceName = parts[parts.length - 1];
             await this.dockerComposeServiceDown(serviceName, output);
        } else if (cmd === 'docker compose -f docker-compose-gnb.yml down' ||
                   cmd === 'docker-compose -f docker-compose-gnb.yml down') {
            await this.dockerComposeGnbDown(output);
        } else if (cmd === 'docker compose -f docker-compose-ue.yml down' ||
                   cmd === 'docker-compose -f docker-compose-ue.yml down') {
            await this.dockerComposeUeDown(output);
        } else if (cmd.startsWith('docker start ')) {
            const serviceName = args.slice(2).join(' ');
            await this.dockerStart(serviceName, output);
        } else if (cmd.startsWith('docker stop ')) {
            const serviceName = args.slice(2).join(' ');
            await this.dockerStop(serviceName, output);
        } else if (cmd === 'ping subnet') {
            await this.pingSubnet(output);
        } else if (cmd.startsWith('ping ')) {
            const targetIP = args[1];
            await this.pingIP(targetIP, output);
        } else if (cmd === 'cls' || cmd === 'clear') {
            output.innerHTML = '';
        } else if (cmd === 'exit') {
            const closeBtn = document.getElementById('docker-terminal-close');
            if (closeBtn) closeBtn.click();
        } else {
            this.addTerminalLine(output, `Command not found: ${command}`, 'error');
            this.addTerminalLine(output, 'Type "help" for available commands.', 'info');
        }

        this.addTerminalLine(output, '', 'blank');
    }

    /**
     * Check system status
     * @param {HTMLElement} output - Output element
     */
    checkSystemStatus(output) {
        this.addTerminalLine(output, 'System Status Check:', 'info');
        this.addTerminalLine(output, '', 'blank');

        // Check dataStore
        if (window.dataStore) {
            this.addTerminalLine(output, '✅ DataStore: Available', 'success');
            const allNFs = window.dataStore.getAllNFs() || [];
            this.addTerminalLine(output, `   Found ${allNFs.length} Network Function(s)`, 'info');

            if (allNFs.length > 0) {
                this.addTerminalLine(output, '', 'blank');
                this.addTerminalLine(output, 'Network Functions:', 'info');
                allNFs.forEach(nf => {
                    const status = nf.status || 'unknown';
                    const statusColor = status === 'stable' ? 'success' : (status === 'starting' ? 'warning' : 'info');
                    this.addTerminalLine(output, `  - ${nf.name} (${nf.type}): ${status}`, statusColor);
                });
            }
        } else {
            this.addTerminalLine(output, '❌ DataStore: Not available', 'error');
        }

        this.addTerminalLine(output, '', 'blank');

        // Check other managers
        if (window.nfManager) {
            this.addTerminalLine(output, '✅ NFManager: Available', 'success');
        } else {
            this.addTerminalLine(output, '❌ NFManager: Not available', 'error');
        }

        if (window.canvasRenderer) {
            this.addTerminalLine(output, '✅ CanvasRenderer: Available', 'success');
        } else {
            this.addTerminalLine(output, '❌ CanvasRenderer: Not available', 'error');
        }
    }

    /**
     * Show help
     * @param {HTMLElement} output - Output element
     */
    showHelp(output) {
        const helpText = [
            'Available Docker Commands:',
            '',
            '  docker compose -f docker-compose.yml up -d',
            '    Start all Core Network Functions (one-click deployment)',
            '',
            '  docker compose -f docker-compose-gnb.yml up -d',
            '    Start gNB (gNodeB) container',
            '',
            '  docker compose -f docker-compose-ue.yml up -d',
            '    Start UE-1 container',
            '',
            '  docker compose -f docker-compose-ran.yml up -d oai-ue1',
            '    Start only UE1 container',
            '',
            '  docker compose -f docker-compose-ran.yml up -d oai-ue2',
            '    Start only UE2 container',
            '',
            '  docker ps',
            '    Show running Docker containers',
            '',
            '  docker network ls',
            '    List all Docker networks',
            '',
            '  docker network inspect <network-name>',
            '    Inspect a specific Docker network (bridge, host, none, oaiworkshop)',
            '',
            '  docker version',
            '    Show Docker version information',
            '',
            '  watch docker compose -f docker-compose.yml ps -a',
            '    Watch service status with auto-refresh (every 1 second)',
            '',
            '  docker compose -f docker-compose.yml down',
            '    Stop and remove all core network services',
            '',
            '  docker compose -f docker-compose-gnb.yml down',
            '    Stop and remove gNB container',
            '',
            '  docker compose -f docker-compose-ue.yml down',
            '    Stop and remove all UE containers',
            '',
            '  docker start <service-name>',
            '    Start a specific Network Function',
            '',
            '  docker stop <service-name>',
            '    Stop a specific Network Function',
            '',
            '  cls / clear',
            '    Clear the terminal screen',
            '',
            '  status / check',
            '    Check system status and list available NFs',
            '',
            '  exit',
            '    Close the terminal',
            ''
        ];

        helpText.forEach(line => {
            this.addTerminalLine(output, line, 'info');
        });
    }

    /**
     * ls command — list files in current docker path
     */
    lsCommand(output) {
        this.addTerminalLine(output, 'docker-compose.yml', 'success');
    }

    /**
     * vi docker-compose.yml — read-only viewer
     */
    viDockerCompose(output) {
        const composeContent = [
            'services:',
            '  mysql:',
            '    container_name: "mysql"',
            '    image: ghcr.io/openairinterface/mysql:8.0',
            '    volumes:',
            '      - ./database/oai_db.sql:/docker-entrypoint-initdb.d/oai_db.sql',
            '      - ./healthscripts/mysql-healthcheck.sh:/tmp/mysql-healthcheck.sh',
            '    environment:',
            '      - TZ=Europe/Paris',
            '      - MYSQL_DATABASE=oai_db',
            '      - MYSQL_USER=test',
            '      - MYSQL_PASSWORD=test',
            '      - MYSQL_ROOT_PASSWORD=linux',
            '    healthcheck:',
            '      test: /bin/bash -c "/tmp/mysql-healthcheck.sh"',
            '      interval: 10s',
            '      timeout: 5s',
            '      retries: 30',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.131',
            '',
            '  oai-udr:',
            '    container_name: "oai-udr"',
            '    image: ghcr.io/openairinterface/oai-udr:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-udr/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - mysql',
            '      - oai-nrf',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.136',
            '',
            '  oai-udm:',
            '    container_name: "oai-udm"',
            '    image: ghcr.io/openairinterface/oai-udm:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-udm/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - oai-udr',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.137',
            '',
            '  oai-ausf:',
            '    container_name: "oai-ausf"',
            '    image: ghcr.io/openairinterface/oai-ausf:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-ausf/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - oai-udm',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.138',
            '',
            '  oai-nrf:',
            '    container_name: "oai-nrf"',
            '    image: ghcr.io/openairinterface/oai-nrf:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-nrf/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.130',
            '',
            '  oai-amf:',
            '    container_name: "oai-amf"',
            '    image: ghcr.io/openairinterface/oai-amf:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '      - 38412/sctp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-amf/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - mysql',
            '      - oai-nrf',
            '      - oai-ausf',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.132',
            '',
            '  oai-smf:',
            '    container_name: "oai-smf"',
            '    image: ghcr.io/openairinterface/oai-smf:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 8080/tcp',
            '      - 8805/udp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-smf/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - oai-nrf',
            '      - oai-amf',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.133',
            '',
            '  oai-upf:',
            '    container_name: "oai-upf"',
            '    image: ghcr.io/openairinterface/oai-upf:develop',
            '    expose:',
            '      - 80/tcp',
            '      - 2152/udp',
            '      - 8805/udp',
            '    volumes:',
            '      - ./conf/config.yaml:/openair-upf/etc/config.yaml',
            '    environment:',
            '      - TZ=Europe/Paris',
            '    depends_on:',
            '      - oai-nrf',
            '      - oai-smf',
            '    cap_add:',
            '      - NET_ADMIN',
            '      - SYS_ADMIN',
            '    cap_drop:',
            '      - ALL',
            '    privileged: true',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.134',
            '',
            '  oai-traffic-server:',
            '    privileged: true',
            '    init: true',
            '    container_name: oai-ext-dn',
            '    image: ghcr.io/openairinterface/trf-gen-cn5g:latest',
            '    environment:',
            '      - UPF_FQDN=oai-upf',
            '      - UE_NETWORK=10.0.0.0/24',
            '      - USE_FQDN=yes',
            '    healthcheck:',
            '      test: /bin/bash -c "ip r | grep 12.1.1"',
            '      interval: 10s',
            '      timeout: 5s',
            '      retries: 5',
            '    networks:',
            '      public_net:',
            '        ipv4_address: 192.168.70.135',
            '',
            'networks:',
            '  public_net:',
            '    driver: bridge',
            '    name: oaiworkshop',
            '    ipam:',
            '      config:',
            '        - subnet: 192.168.70.128/26',
            '    driver_opts:',
            '      com.docker.network.bridge.name: "oaiworkshop"',
        ];

        // Create a vi-style overlay on the terminal
        const terminalContent = document.getElementById('docker-terminal-content');
        const terminalOutput = document.getElementById('docker-terminal-output');
        if (!terminalContent) return;

        // Build vi viewer overlay
        const viOverlay = document.createElement('div');
        viOverlay.id = 'vi-overlay';
        viOverlay.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: #1a1a2e; color: #e0e0e0; font-family: monospace;
            font-size: 13px; overflow: hidden; display: flex; flex-direction: column;
            z-index: 100;
        `;

        const viBody = document.createElement('div');
        viBody.style.cssText = 'flex: 1; overflow-y: auto; padding: 4px 8px; white-space: pre;';
        viBody.textContent = composeContent.join('\n');

        const viStatusBar = document.createElement('div');
        viStatusBar.style.cssText = `
            background: #2c3e50; color: #ecf0f1; padding: 2px 8px;
            font-size: 12px; display: flex; justify-content: space-between;
            border-top: 1px solid #34495e;
        `;
        viStatusBar.innerHTML = `<span>"docker-compose.yml" [readonly] ${composeContent.length}L</span><span>Press :q to quit</span>`;

        const viCmdLine = document.createElement('div');
        viCmdLine.id = 'vi-cmdline';
        viCmdLine.style.cssText = 'background: #1a1a2e; color: #e0e0e0; padding: 2px 8px; font-size: 13px; min-height: 20px;';
        viCmdLine.textContent = '';

        viOverlay.appendChild(viBody);
        viOverlay.appendChild(viStatusBar);
        viOverlay.appendChild(viCmdLine);
        terminalContent.style.position = 'relative';
        terminalContent.appendChild(viOverlay);

        // Handle :q to close — capture keystrokes
        let viInput = '';
        const viKeyHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
                viInput = '';
                viCmdLine.textContent = '';
                return;
            }

            if (e.key === 'Enter') {
                if (viInput === ':q' || viInput === ':q!' || viInput === ':wq') {
                    // Remove handler BEFORE removing overlay so no keys leak through
                    terminalContent.removeEventListener('keydown', viKeyHandler, true);
                    viOverlay.remove();
                    // Small delay so the Enter keyup doesn't trigger terminal input
                    setTimeout(() => {
                        terminalContent.focus();
                    }, 50);
                }
                viInput = '';
                viCmdLine.textContent = '';
                return;
            }

            if (e.key === 'Backspace') {
                viInput = viInput.slice(0, -1);
            } else if (e.key.length === 1) {
                // Only accept : and then q/!/w after colon
                if (viInput === '' && e.key !== ':') return;
                viInput += e.key;
            }

            viCmdLine.textContent = viInput;
        };

        terminalContent.addEventListener('keydown', viKeyHandler, true);
        terminalContent.focus();
    }

    /**
     * ping <ip> — simulate ping to an IP
     */
    async pingIP(targetIP, output) {
        if (!targetIP) {
            this.addTerminalLine(output, 'Usage: ping <ip-address>', 'error');
            return;
        }
        this.addTerminalLine(output, `Pinging ${targetIP} with 32 bytes of data:`, 'info');
        const allNFs = window.dataStore?.getAllNFs() || [];
        const targetNF = allNFs.find(nf => nf.config?.ipAddress === targetIP);
        const reachable = targetNF && targetNF.status === 'stable';
        for (let i = 0; i < 4; i++) {
            await this.delay(500);
            if (reachable) {
                const ms = Math.floor(Math.random() * 10 + 1);
                this.addTerminalLine(output, `Reply from ${targetIP}: bytes=32 time=${ms}ms TTL=64`, 'success');
            } else {
                this.addTerminalLine(output, `Request timeout for icmp_seq ${i}`, 'error');
            }
        }
        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, `Ping statistics for ${targetIP}:`, 'info');
        if (reachable) {
            this.addTerminalLine(output, `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`, 'success');
        } else {
            this.addTerminalLine(output, `    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`, 'error');
        }
    }

    /**
     * ping subnet — ping all NFs in the subnet
     */
    async pingSubnet(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        if (allNFs.length === 0) {
            this.addTerminalLine(output, 'No network functions found. Deploy the network first.', 'warning');
            return;
        }
        this.addTerminalLine(output, 'Scanning subnet 192.168.70.128/26...', 'info');
        this.addTerminalLine(output, '', 'blank');
        for (const nf of allNFs) {
            const ip = nf.config?.ipAddress;
            if (!ip) continue;
            await this.delay(300);
            if (nf.status === 'stable') {
                const ms = Math.floor(Math.random() * 10 + 1);
                this.addTerminalLine(output, `${ip.padEnd(18)} ${nf.name.padEnd(20)} time=${ms}ms  [reachable]`, 'success');
            } else {
                this.addTerminalLine(output, `${ip.padEnd(18)} ${nf.name.padEnd(20)} Request timeout  [unreachable]`, 'error');
            }
        }
    }

    /**
     * Execute docker compose up -d (start all NFs)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUp(output) {
        // Check if dataStore is available
        if (!window.dataStore) {
            this.addTerminalLine(output, 'Error: DataStore not initialized. Please refresh the page.', 'error');
            console.error('❌ DataStore not available');
            return;
        }

        // Check if NFManager is available
        if (!window.nfManager) {
            this.addTerminalLine(output, 'Error: NFManager not initialized. Please refresh the page.', 'error');
            console.error('❌ NFManager not available');
            return;
        }

        // Get all existing NFs from data store (exclude gNB and UE for core network deployment)
        let existingNFs = window.dataStore.getAllNFs() || [];
        
        // Filter out gNB and UE - they should only be started with separate compose files
        existingNFs = existingNFs.filter(nf => nf.type !== 'gNB' && nf.type !== 'UE');

        // Define expected core network NFs
        // Note: ext-dn intentionally excluded (user requested removal)
        const expectedNFTypes = ['NRF', 'AMF', 'SMF', 'UPF', 'AUSF', 'UDM', 'UDR', 'PCF', 'NSSF', 'MySQL'];
        
        // Check which NFs already exist
        const existingNFTypes = new Set(existingNFs.map(nf => nf.type));
        const missingNFTypes = expectedNFTypes.filter(type => !existingNFTypes.has(type));

        // If some NFs are missing, create only the missing ones
        if (missingNFTypes.length > 0) {
            for (const nfType of missingNFTypes) {
                // Get default configuration for this NF type
                const defaultConfigs = this.getDefaultNFConfigurations();
                const nfConfig = defaultConfigs.find(config => config.type === nfType);
                
                if (nfConfig && window.nfManager) {
                    const position = this.getTopologyPosition(nfType, existingNFs);
                    const nf = window.nfManager.createNetworkFunction(nfType, position);
                    
                    if (nf) {
                        nf.config.ipAddress = nfConfig.ipAddress;
                        nf.config.port = nfConfig.port;
                        nf.config.httpProtocol = nfConfig.httpProtocol || 'HTTP/2';
                        nf.createdAt = Date.now();
                        nf.status = 'stopped'; // Will be started below
                        window.dataStore.updateNF(nf.id, nf);
                    }
                }
            }
            
            // Refresh existing NFs list after creating missing ones
            existingNFs = window.dataStore.getAllNFs() || [];
            existingNFs = existingNFs.filter(nf => nf.type !== 'gNB' && nf.type !== 'UE');
        }

        // Filter to only NFs that need to be started (not already stable/starting)
        const nfsToStart = existingNFs.filter(nf => {
            const status = nf.status || 'stopped';
            return status !== 'stable' && status !== 'starting';
        });

        // Check if network needs to be created
        const needsNetwork = !this.oaiWorkshopNetworkExists;

        if (nfsToStart.length === 0 && !needsNetwork) {
            this.addTerminalLine(output, 'All core network services are already running.', 'info');
            this.addTerminalLine(output, '', 'blank');
            return;
        }

        // Show Docker Compose style output
        const totalToStart = nfsToStart.length + (needsNetwork ? 1 : 0);
        this.addTerminalLine(output, `[+] Running ${totalToStart}/${totalToStart}`, 'info');

        // Create network only if it doesn't exist
        if (!this.oaiWorkshopNetworkExists) {
            this.addTerminalLine(output, ' ✔ Network oaiworkshop Created' + ' '.repeat(20) + '0.2s', 'success');
            this.oaiWorkshopNetworkExists = true;
            this.oaiWorkshopCreatedTime = Date.now();
            await this.delay(200);
        } else {
            this.addTerminalLine(output, ' ✔ Network oaiworkshop Already exists', 'info');
        }

        // Create Service Bus if it doesn't exist
        const allBuses = window.dataStore?.getAllBuses() || [];
        let serviceBus = allBuses.find(bus => bus.name === 'Service Bus');
        if (!serviceBus && window.busManager) {
            serviceBus = window.busManager.createBusLine('horizontal', { x: 200, y: 350 }, 800, 'Service Bus');
            if (serviceBus) {
                console.log('✅ Service Bus created for auto-connections');
            }
        }

        // Start each NF that needs to be started
        for (const nf of nfsToStart) {
            // Skip gNB and UE - they have separate compose files
            if (nf.type === 'gNB' || nf.type === 'UE') {
                continue;
            }

            // Get fresh NF from dataStore to ensure we have the latest
            const freshNF = window.dataStore.getNFById(nf.id);
            if (!freshNF) {
                continue;
            }

            // Store creation timestamp if not already set
            if (!freshNF.createdAt) {
                freshNF.createdAt = Date.now();
            }

            // Get service name
            const serviceNameMap = {
                'AMF': 'oai-amf', 'SMF': 'oai-smf', 'UPF': 'oai-upf', 'AUSF': 'oai-ausf',
                'UDM': 'oai-udm', 'UDR': 'oai-udr', 'NRF': 'oai-nrf', 'PCF': 'oai-pcf',
                'NSSF': 'oai-nssf', 'MySQL': 'mysql'
            };
            const serviceName = serviceNameMap[freshNF.type] || freshNF.type.toLowerCase();

            // Show container creation with timing (random between 0.8s and 2.3s)
            const randomDelay = (Math.random() * 1.5 + 0.8).toFixed(1); // 0.8s to 2.3s
            this.addTerminalLine(output, ` ✔ Container ${serviceName.padEnd(16)} Started${' '.repeat(20)}${randomDelay}s`, 'success');
            await this.delay(parseFloat(randomDelay) * 1000); // Convert to milliseconds

            // Set status to starting (preserve createdAt)
            freshNF.status = 'starting';
            freshNF.statusTimestamp = Date.now();

            // Ensure createdAt is preserved
            if (!freshNF.createdAt) {
                freshNF.createdAt = Date.now();
            }

            window.dataStore.updateNF(freshNF.id, freshNF);

            // Generate startup log
            if (window.logEngine) {
                window.logEngine.addLog(freshNF.id, 'INFO', `${freshNF.name} starting via docker compose`, {
                    ipAddress: freshNF.config.ipAddress,
                    port: freshNF.config.port,
                    protocol: freshNF.config.httpProtocol,
                    status: 'starting',
                    source: 'docker-compose'
                });
            }

            // Auto-connect to bus line when starting
            this.autoConnectNFToBus(freshNF);

            // After 5 seconds, set to stable
            setTimeout(() => {
                const updatedNF = window.dataStore?.getNFById(freshNF.id);
                if (updatedNF) {
                    updatedNF.status = 'stable';
                    updatedNF.statusTimestamp = Date.now();

                    // Preserve createdAt timestamp
                    if (!updatedNF.createdAt && freshNF.createdAt) {
                        updatedNF.createdAt = freshNF.createdAt;
                    }

                    window.dataStore.updateNF(updatedNF.id, updatedNF);

                    // Generate stable log
                    if (window.logEngine) {
                        window.logEngine.addLog(updatedNF.id, 'SUCCESS', `${updatedNF.name} is now STABLE and ready for connections`, {
                            previousStatus: 'starting',
                            newStatus: 'stable',
                            uptime: '5 seconds',
                            readyForConnections: true
                        });
                    }

                    // Auto-connect MySQL to UDR when stable
                    if (updatedNF.type === 'MySQL') {
                        this.connectMySQLToUDR(updatedNF);
                    } else if (updatedNF.type === 'UDR') {
                        // Also connect when UDR becomes stable
                        const allNFs = window.dataStore?.getAllNFs() || [];
                        const mysql = allNFs.find(nf => nf.type === 'MySQL' && nf.status === 'stable');
                        if (mysql) {
                            this.connectMySQLToUDR(mysql);
                        }
                    }

                    if (window.canvasRenderer) {
                        window.canvasRenderer.render();
                    }
                }
            }, 5000);
        }

        this.addTerminalLine(output, '', 'blank');

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // For core command, deploy only core interfaces (no gNB/UE dependent interfaces)
        await this.deployInterfacesForCommand('core', output);
    }

    /**
     * Execute docker compose -f docker-compose-gnb.yml up -d (start gNB)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeGnbUp(output) {
        this.addTerminalLine(output, 'WARN[0000] No services to build', 'warning');
        this.addTerminalLine(output, 'WARN[0000] Found orphan containers ([oai-upf oai-smf oai-amf oai-ausf oai-udm oai-udr mysql oai-nrf oai-ext-dn]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.', 'warning');
        this.addTerminalLine(output, '[+] up 1/1', 'info');

        // Check if gNB already exists
        const allNFs = window.dataStore?.getAllNFs() || [];
        let gnb = allNFs.find(nf => nf.type === 'gNB');

        if (!gnb && window.nfManager) {
            // Create gNB if it doesn't exist
            const position = this.getTopologyPosition('gNB', allNFs);
            gnb = window.nfManager.createNetworkFunction('gNB', position);
            
            if (gnb) {
                gnb.createdAt = Date.now();
                gnb.status = 'starting';
                gnb.statusTimestamp = Date.now();
                window.dataStore.updateNF(gnb.id, gnb);
            }
        }

        const randomDelay = (Math.random() * 0.3 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container oai-gnb Created${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        if (gnb) {
            // Set to stable after 5 seconds
            setTimeout(() => {
                const updatedGnb = window.dataStore?.getNFById(gnb.id);
                if (updatedGnb) {
                    updatedGnb.status = 'stable';
                    updatedGnb.statusTimestamp = Date.now();
                    window.dataStore.updateNF(updatedGnb.id, updatedGnb);

                    if (window.logEngine) {
                        window.logEngine.addLog(updatedGnb.id, 'SUCCESS', `${updatedGnb.name} is now STABLE and ready`, {
                            previousStatus: 'starting',
                            newStatus: 'stable',
                            uptime: '5 seconds'
                        });
                    }

                    if (window.canvasRenderer) {
                        window.canvasRenderer.render();
                    }
                }
            }, 5000);
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Auto-connect gNB to bus and create gNB interface after start
        if (gnb) {
            this.connectGnbToBusAndCreateInterface(gnb, output);
        }

        // Deploy gNB-related pending interfaces after gNB starts
        await this.deployInterfacesForCommand('gnb', output);
    }

    /**
     * Execute docker compose -f docker-compose-ue.yml up -d (start UE-1 only)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUeUp(output) {
        // Keep behavior aligned with user's expectation: this command starts one UE only.
        await this.dockerComposeUe1Up(output);
    }

    /**
     * Execute docker compose -f docker-compose-ran.yml up -d oai-ue1 (start UE1 only)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUe1Up(output) {
        this.addTerminalLine(output, 'WARN[0000] No services to build', 'warning');
        this.addTerminalLine(output, 'WARN[0000] Found orphan containers ([oai-upf oai-smf oai-amf oai-ausf oai-udm oai-udr mysql oai-nrf oai-ext-dn]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.', 'warning');
        this.addTerminalLine(output, '[+] up 1/1', 'info');

        const allNFs = window.dataStore?.getAllNFs() || [];
        let ue1 = allNFs.find(nf => nf.type === 'UE' && nf.name === 'UE-1');

        if (!ue1 && window.nfManager) {
            const position = this.getTopologyPosition('UE', allNFs);
            ue1 = window.nfManager.createNetworkFunction('UE', position);
            
            if (ue1) {
                ue1.name = 'UE-1';
                ue1.createdAt = Date.now();
                ue1.status = 'starting';
                ue1.statusTimestamp = Date.now();
                window.dataStore.updateNF(ue1.id, ue1);
            }
        }

        const randomDelay = (Math.random() * 0.2 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container oai-ue1 Created${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        if (ue1) {
            setTimeout(() => {
                const updatedUe = window.dataStore?.getNFById(ue1.id);
                if (updatedUe) {
                    updatedUe.status = 'stable';
                    updatedUe.statusTimestamp = Date.now();
                    window.dataStore.updateNF(updatedUe.id, updatedUe);

                    if (window.logEngine) {
                        window.logEngine.addLog(updatedUe.id, 'SUCCESS', `${updatedUe.name} is now STABLE and ready`, {
                            previousStatus: 'starting',
                            newStatus: 'stable',
                            uptime: '5 seconds'
                        });
                    }

                    if (window.canvasRenderer) {
                        window.canvasRenderer.render();
                    }
                }
            }, 5000);
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Deploy UE-related pending interfaces after UE-1 starts
        await this.deployInterfacesForCommand('ue', output);
    }

    /**
     * Execute docker compose -f docker-compose-ran.yml up -d oai-ue2 (start UE2 only)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUe2Up(output) {
        this.addTerminalLine(output, 'WARN[0000] No services to build', 'warning');
        this.addTerminalLine(output, 'WARN[0000] Found orphan containers ([oai-upf oai-smf oai-amf oai-ausf oai-udm oai-udr mysql oai-nrf oai-ext-dn]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.', 'warning');
        this.addTerminalLine(output, '[+] up 1/1', 'info');

        const allNFs = window.dataStore?.getAllNFs() || [];
        let ue2 = allNFs.find(nf => nf.type === 'UE' && nf.name === 'UE-2');

        if (!ue2 && window.nfManager) {
            const basePosition = this.getTopologyPosition('UE', allNFs);
            // Offset UE-2 to the right of UE-1
            const position = {
                x: basePosition.x + 100,
                y: basePosition.y
            };
            ue2 = window.nfManager.createNetworkFunction('UE', position);
            
            if (ue2) {
                ue2.name = 'UE-2';
                ue2.createdAt = Date.now();
                ue2.status = 'starting';
                ue2.statusTimestamp = Date.now();
                window.dataStore.updateNF(ue2.id, ue2);
            }
        }

        const randomDelay = (Math.random() * 0.2 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container oai-ue2 Created${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        if (ue2) {
            setTimeout(() => {
                const updatedUe = window.dataStore?.getNFById(ue2.id);
                if (updatedUe) {
                    updatedUe.status = 'stable';
                    updatedUe.statusTimestamp = Date.now();
                    window.dataStore.updateNF(updatedUe.id, updatedUe);

                    if (window.logEngine) {
                        window.logEngine.addLog(updatedUe.id, 'SUCCESS', `${updatedUe.name} is now STABLE and ready`, {
                            previousStatus: 'starting',
                            newStatus: 'stable',
                            uptime: '5 seconds'
                        });
                    }

                    if (window.canvasRenderer) {
                        window.canvasRenderer.render();
                    }
                }
            }, 5000);
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Deploy UE-related pending interfaces after UE-2 starts
        await this.deployInterfacesForCommand('ue', output);
    }

    /**
     * Deploy interfaces based on terminal command context.
     * core -> only core interfaces; gnb/ue -> access interfaces when dependencies exist.
     * @param {string} commandType - core | gnb | ue
     * @param {HTMLElement} output - Output element
     */
    async deployInterfacesForCommand(commandType, output) {
        if (!window.interfaceManager) {
            return;
        }

        const interfacePlanByCommand = {
            // Core command must never create/access UE or gNB paths
            core: ['N13', 'N12', 'N11', 'N10', 'N7', 'N5'],
            // gNB command only starts gNB container; UE-dependent interfaces wait for UE command
            gnb: [],
            // After UE starts, deploy remaining radio/access related interfaces
            ue: ['N1', 'N2', 'N3', 'N4', 'N6', 'N8']
        };

        const deployMethodMap = {
            N1: 'deployN1Interface',
            N2: 'deployN2Interface',
            N3: 'deployN3Interface',
            N4: 'deployN4Interface',
            N5: 'deployN5Interface',
            N6: 'deployN6Interface',
            N7: 'deployN7Interface',
            N8: 'deployN8Interface',
            N10: 'deployN10Interface',
            N11: 'deployN11Interface',
            N12: 'deployN12Interface',
            N13: 'deployN13Interface'
        };

        const interfacesToDeploy = interfacePlanByCommand[commandType] || [];
        if (interfacesToDeploy.length === 0) {
            return;
        }

        let deployedCount = 0;
        let skippedCount = 0;

        for (const interfaceId of interfacesToDeploy) {
            if (window.interfaceManager.isInterfaceDeployed(interfaceId)) {
                skippedCount++;
                continue;
            }

            const deployMethodName = deployMethodMap[interfaceId];
            const deployMethod = window.interfaceManager[deployMethodName];
            if (typeof deployMethod !== 'function') {
                skippedCount++;
                continue;
            }

            try {
                await deployMethod.call(window.interfaceManager);
                deployedCount++;
            } catch (error) {
                // Interface manager enforces dependencies; skip silently when not ready.
                skippedCount++;
            }
        }

        if (deployedCount > 0) {
            this.addTerminalLine(
                output,
                `✅ Interface deployment complete for ${commandType} command (${deployedCount} deployed)`,
                'success'
            );
        } else {
            this.addTerminalLine(
                output,
                `ℹ No new interfaces deployed for ${commandType} command`,
                'info'
            );
        }
    }

    /**
     * Connect gNB to service bus and create N2 interface to AMF.
     * @param {Object} gnb - gNB Network Function object
     * @param {HTMLElement} output - Output element
     */
    connectGnbToBusAndCreateInterface(gnb, output) {
        if (!gnb || !window.dataStore) {
            return;
        }

        // Ensure Service Bus exists
        let serviceBus = window.dataStore.getAllBuses()?.find(bus => bus.name === 'Service Bus');
        if (!serviceBus && window.busManager) {
            serviceBus = window.busManager.createBusLine('horizontal', { x: 200, y: 350 }, 800, 'Service Bus');
        }

        // Connect gNB to Service Bus if not already connected
        if (serviceBus && window.busManager) {
            const existingBusConnections = window.dataStore.getBusConnectionsForNF(gnb.id) || [];
            const alreadyConnected = existingBusConnections.some(conn => conn.busId === serviceBus.id);
            if (!alreadyConnected) {
                window.busManager.connectNFToBus(gnb.id, serviceBus.id);
                this.addTerminalLine(output, '✅ gNB connected to Service Bus', 'success');
            }
        }

        // Create N2 interface connection: gNB -> AMF
        const allNFs = window.dataStore.getAllNFs() || [];
        const amf = allNFs.find(nf => nf.type === 'AMF');
        if (!amf) {
            this.addTerminalLine(output, 'ℹ AMF not found yet, N2 interface will be created later', 'info');
            return;
        }

        const allConnections = window.dataStore.getAllConnections() || [];
        const n2Exists = allConnections.some(conn => {
            const isBetweenGnbAmf =
                (conn.sourceId === gnb.id && conn.targetId === amf.id) ||
                (conn.sourceId === amf.id && conn.targetId === gnb.id);
            return isBetweenGnbAmf && (
                conn.options?.interfaceType === 'N2' ||
                conn.options?.label === 'N2' ||
                conn.options?.label === 'N2 (NGAP)'
            );
        });

        if (!n2Exists) {
            const n2Connection = {
                id: `conn-n2-${Date.now()}`,
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
            window.dataStore.addConnection(n2Connection);
            this.addTerminalLine(output, '✅ N2 interface created (gNB ↔ AMF)', 'success');
        }

        if (window.interfaceManager && !window.interfaceManager.isInterfaceDeployed('N2')) {
            const n2Def = window.interfaceManager.interfaceDefinitions?.N2 || { id: 'N2', name: 'N2 Interface' };
            window.interfaceManager.deployedInterfaces.set('N2', {
                interface: n2Def,
                nfs: { gNB: gnb, AMF: amf },
                deployedAt: new Date()
            });
            if (typeof window.interfaceManager.markInterfaceDeployed === 'function') {
                window.interfaceManager.markInterfaceDeployed('N2');
            }
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Execute docker compose -f docker-compose-gnb.yml down (stop gNB)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeGnbDown(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const gnb = allNFs.find(nf => nf.type === 'gNB');

        if (!gnb) {
            this.addTerminalLine(output, 'No gNB container to stop.', 'info');
            return;
        }

        this.addTerminalLine(output, '[+] Running 1/1', 'info');

        const randomDelay = (Math.random() * 0.3 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container oai-gnb Removed${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        // Remove gNB
        if (window.nfManager) {
            window.nfManager.deleteNetworkFunction(gnb.id);
        } else if (window.dataStore) {
            window.dataStore.removeNF(gnb.id);
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Execute docker compose -f docker-compose-ue.yml down (stop all UEs)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUeDown(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const ues = allNFs.filter(nf => nf.type === 'UE');

        if (ues.length === 0) {
            this.addTerminalLine(output, 'No UE containers to stop.', 'info');
            return;
        }

        this.addTerminalLine(output, `[+] Running ${ues.length}/${ues.length}`, 'info');

        for (let i = 0; i < ues.length; i++) {
            const ue = ues[i];
            const randomDelay = (Math.random() * 0.2 + 0.1).toFixed(1);
            this.addTerminalLine(output, `✔ Container oai-ue${i + 1} Removed${' '.repeat(20)}${randomDelay}s`, 'success');
            await this.delay(parseFloat(randomDelay) * 1000);

            // Remove UE
            if (window.nfManager) {
                window.nfManager.deleteNetworkFunction(ue.id);
            } else if (window.dataStore) {
                window.dataStore.removeNF(ue.id);
            }
        }

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Execute docker ps (show running containers)
     * @param {HTMLElement} output - Output element
     */
    async dockerPS(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];

        if (allNFs.length === 0) {
            this.addTerminalLine(output, 'No containers running.', 'info');
            return;
        }

        // Header
        this.addTerminalLine(output, 'CONTAINER ID   IMAGE                                          COMMAND                  CREATED       STATUS                 PORTS                                                   NAMES', 'info');
        this.addTerminalLine(output, '────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────', 'info');

        // Map NF types to Docker service names
        const serviceNameMap = {
            'AMF': 'oai-amf',
            'SMF': 'oai-smf',
            'UPF': 'oai-upf',
            'AUSF': 'oai-ausf',
            'UDM': 'oai-udm',
            'UDR': 'oai-udr',
            'NRF': 'oai-nrf',
            'PCF': 'oai-pcf',
            'NSSF': 'oai-nssf',
            'MySQL': 'mysql',
            'ext-dn': 'ext-dn',
            'gNB': 'oai-gnb',
            'UE': 'oai-ue'
        };

        // Image map
        const imageMap = {
            'AMF': 'ghcr.io/openairinterface/oai-amf:develop',
            'SMF': 'ghcr.io/openairinterface/oai-smf:develop',
            'UPF': 'ghcr.io/openairinterface/oai-upf:develop',
            'AUSF': 'ghcr.io/openairinterface/oai-ausf:develop',
            'UDM': 'ghcr.io/openairinterface/oai-udm:develop',
            'UDR': 'ghcr.io/openairinterface/oai-udr:develop',
            'NRF': 'ghcr.io/openairinterface/oai-nrf:develop',
            'PCF': 'ghcr.io/openairinterface/oai-pcf:develop',
            'NSSF': 'ghcr.io/openairinterface/oai-nssf:develop',
            'MySQL': 'ghcr.io/openairinterface/mysql:8.0',
            'ext-dn': 'ghcr.io/openairinterface/trf-gen-cn5g:latest',
            'gNB': 'ghcr.io/openairinterface/oai-gnb:develop',
            'UE': 'ghcr.io/openairinterface/oai-ue:develop'
        };

        allNFs.forEach((nf, index) => {
            const containerId = this.generateContainerId();
            const serviceName = serviceNameMap[nf.type] || `oai-${nf.type.toLowerCase()}`;
            const image = imageMap[nf.type] || `ghcr.io/openairinterface/oai-${nf.type.toLowerCase()}:develop`;
            const status = nf.status === 'stable' ? 'Up (healthy)' : 'Up (starting)';
            const ports = this.getPortsForNF(nf);

            // Calculate creation time
            const createdAt = nf.createdAt || nf.statusTimestamp || Date.now();
            const createdTime = this.formatCreationTime(createdAt);

            const line = `${containerId}   ${image.padEnd(45)} "${serviceName}"   ${createdTime.padEnd(13)} ${status.padEnd(20)} ${ports.padEnd(55)} ${serviceName}`;
            this.addTerminalLine(output, line, nf.status === 'stable' ? 'success' : 'warning');
        });
    }

    /**
     * Start watch mode for docker compose ps -a
     * @param {HTMLElement} output - Output element
     */
    startWatch(output) {
        if (this.isWatching) {
            this.addTerminalLine(output, 'Watch mode is already running. Use Ctrl+C to stop.', 'warning');
            return;
        }

        this.isWatching = true;
        this.addTerminalLine(output, 'Starting watch mode (refreshes every 1 second)...', 'info');
        this.addTerminalLine(output, 'Press Ctrl+C to stop watching', 'info');
        this.addTerminalLine(output, '', 'blank');

        // Store initial content length to know where to clear from
        const initialLength = output.querySelectorAll('.docker-terminal-line').length;

        // Initial display
        this.showDockerComposePS(output);

        // Refresh every 1 second
        this.watchInterval = setInterval(() => {
            // Remove all lines added after the initial watch start message
            const allLines = output.querySelectorAll('.docker-terminal-line');
            const linesToRemove = Array.from(allLines).slice(initialLength);
            linesToRemove.forEach(line => line.remove());

            // Add fresh output
            this.showDockerComposePS(output);
        }, 1000);
    }

    /**
     * Stop watch mode
     */
    stopWatch() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
            this.isWatching = false;
        }
    }

    /**
     * Show docker compose ps -a output
     * @param {HTMLElement} output - Output element
     */
    showDockerComposePS(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const timestamp = new Date().toLocaleString();

        // Header with timestamp
        this.addTerminalLine(output, `Every 1.0s: docker compose -f docker-compose.yml ps -a`, 'info');
        this.addTerminalLine(output, `Timestamp: ${timestamp}`, 'info');
        this.addTerminalLine(output, '', 'blank');

        if (allNFs.length === 0) {
            this.addTerminalLine(output, 'No services found.', 'info');
            return;
        }

        // Table header
        this.addTerminalLine(output, 'NAME         IMAGE                                     COMMAND                  SERVICE              CREATED              STATUS                        PORTS', 'info');
        this.addTerminalLine(output, '════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════', 'info');

        // Service name map
        const serviceNameMap = {
            'AMF': 'oai-amf',
            'SMF': 'oai-smf',
            'UPF': 'oai-upf',
            'AUSF': 'oai-ausf',
            'UDM': 'oai-udm',
            'UDR': 'oai-udr',
            'NRF': 'oai-nrf',
            'PCF': 'oai-pcf',
            'NSSF': 'oai-nssf',
            'MySQL': 'mysql',
            'ext-dn': 'ext-dn',
            'gNB': 'oai-gnb',
            'UE': 'oai-ue'
        };

        const imageMap = {
            'AMF': 'oaisoftwarealliance/oai-amf:2024-june',
            'SMF': 'oaisoftwarealliance/oai-smf:2024-june',
            'UPF': 'oaisoftwarealliance/oai-upf:2024-june',
            'AUSF': 'oaisoftwarealliance/oai-ausf:2024-june',
            'UDM': 'oaisoftwarealliance/oai-udm:2024-june',
            'UDR': 'oaisoftwarealliance/oai-udr:2024-june',
            'NRF': 'oaisoftwarealliance/oai-nrf:2024-june',
            'PCF': 'oaisoftwarealliance/oai-pcf:2024-june',
            'NSSF': 'oaisoftwarealliance/oai-nssf:2024-june',
            'MySQL': 'mysql:8.0',
            'ext-dn': 'oaisoftwarealliance/trf-gen-cn5g:latest',
            'gNB': 'oaisoftwarealliance/oai-gnb:2024-june',
            'UE': 'oaisoftwarealliance/oai-ue:2024-june'
        };

        allNFs.forEach(nf => {
            const serviceName = serviceNameMap[nf.type] || `oai-${nf.type.toLowerCase()}`;
            const image = imageMap[nf.type] || `oaisoftwarealliance/oai-${nf.type.toLowerCase()}:2024-june`;

            // Calculate creation time
            const createdAt = nf.createdAt || nf.statusTimestamp || Date.now();
            const created = this.formatCreationTimeForWatch(createdAt);
            const status = nf.status === 'stable' ? `Up ${created} (healthy)` : `Up ${created} (starting)`;
            const ports = this.getPortsForNF(nf);

            const statusColor = nf.status === 'stable' ? 'success' : 'warning';
            const statusIcon = nf.status === 'stable' ? '🟢' : '🔴';

            const line = `${serviceName.padEnd(12)} ${image.padEnd(38)} "${serviceName}"   ${serviceName.padEnd(15)} ${created.padEnd(20)} ${status.padEnd(28)} ${ports}`;
            this.addTerminalLine(output, `${statusIcon} ${line}`, statusColor);
        });
    }

    /**
     * Execute docker compose down (stop and remove all core network services)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeDown(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        
        // Filter to only core network NFs (exclude gNB and UE)
        const coreNFs = allNFs.filter(nf => nf.type !== 'gNB' && nf.type !== 'UE');

        if (coreNFs.length === 0) {
            this.addTerminalLine(output, 'No core network services to stop.', 'info');
            return;
        }

        // Collect all NF IDs first (before deletion to avoid iteration issues)
        const nfIds = coreNFs.map(nf => ({ id: nf.id, name: nf.name, type: nf.type }));

        // Show Docker Compose style output
        this.addTerminalLine(output, `[+] Running ${nfIds.length + 1}/${nfIds.length + 1}`, 'info');

        // Stop and remove each service
        for (const nfInfo of nfIds) {
            // Skip gNB and UE (double check)
            if (nfInfo.type === 'gNB' || nfInfo.type === 'UE') {
                continue;
            }

            // Get service name
            const serviceNameMap = {
                'AMF': 'oai-amf', 'SMF': 'oai-smf', 'UPF': 'oai-upf', 'AUSF': 'oai-ausf',
                'UDM': 'oai-udm', 'UDR': 'oai-udr', 'NRF': 'oai-nrf', 'PCF': 'oai-pcf',
                'NSSF': 'oai-nssf', 'MySQL': 'mysql', 'ext-dn': 'oai-ext-dn'
            };
            const serviceName = serviceNameMap[nfInfo.type] || nfInfo.type.toLowerCase();

            // Random delay between 0.8s and 2.3s
            const randomDelay = (Math.random() * 1.5 + 0.8).toFixed(1);
            this.addTerminalLine(output, ` ✔ Container ${serviceName.padEnd(16)} Removed${' '.repeat(20)}${randomDelay}s`, 'success');
            await this.delay(parseFloat(randomDelay) * 1000);

            // Actually remove the NF (this also removes connections)
            if (window.nfManager) {
                window.nfManager.deleteNetworkFunction(nfInfo.id);
            } else if (window.dataStore) {
                window.dataStore.removeNF(nfInfo.id);
            }
        }

        // Also clear buses and bus connections
        if (window.dataStore) {
            const allBuses = window.dataStore.getAllBuses() || [];
            const allBusConnections = window.dataStore.getAllBusConnections() || [];

            if (allBuses.length > 0 || allBusConnections.length > 0) {
                const busConnectionIds = allBusConnections.map(bc => bc.id);
                const busIds = allBuses.map(bus => bus.id);

                busConnectionIds.forEach(busConnId => {
                    window.dataStore.removeBusConnection(busConnId);
                });

                busIds.forEach(busId => {
                    window.dataStore.removeBus(busId);
                });
            }
        }

        // Remove network
        this.addTerminalLine(output, ` ✔ Network oaiworkshop Removed${' '.repeat(20)}0.2s`, 'success');
        this.oaiWorkshopNetworkExists = false;
        this.oaiWorkshopCreatedTime = null;

        this.addTerminalLine(output, '', 'blank');

        // Re-render canvas
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Start a specific service
     * @param {string} serviceName - Service name to start
     * @param {HTMLElement} output - Output element
     */
    
    /**
     * Handle docker compose up -d <service> (start a specific service via compose)
     * @param {string} serviceName - Service name (e.g., oai-nrf)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeServiceUp(serviceName, output) {
        if (!serviceName) {
            this.addTerminalLine(output, 'Usage: docker compose -f docker-compose.yml up -d <service-name>', 'error');
            return;
        }

        // Map docker service name to NF type
        const serviceNameMap = {
            'oai-amf': 'AMF', 'oai-smf': 'SMF', 'oai-upf': 'UPF', 'oai-ausf': 'AUSF',
            'oai-udm': 'UDM', 'oai-udr': 'UDR', 'oai-nrf': 'NRF', 'oai-pcf': 'PCF',
            'oai-nssf': 'NSSF', 'mysql': 'MySQL', 'oai-ext-dn': 'ext-dn', 'oai-gnb': 'gNB', 'oai-ue': 'UE'
        };

        const nfType = serviceNameMap[serviceName.toLowerCase()];
        const allNFs = window.dataStore?.getAllNFs() || [];

        let nf = null;
        if (nfType) {
            nf = allNFs.find(n => n.type === nfType);
        }

        // If not found, try to find by exact service name stored as name
        if (!nf) {
            nf = allNFs.find(n => {
                const mapped = (serviceNameMap[((`oai-${n.type}`) || '').toLowerCase()]);
                return n.name === serviceName || (`oai-${n.type || ''}`) === serviceName;
            });
        }

        // If still not found, create via nfManager when possible
        if (!nf && window.nfManager && nfType) {
            const allNFs = window.dataStore?.getAllNFs() || [];
            const position = this.getTopologyPosition(nfType, allNFs);
            nf = window.nfManager.createNetworkFunction(nfType, position);
            if (nf) {
                nf.createdAt = Date.now();
                nf.status = 'starting';
                nf.statusTimestamp = Date.now();
                window.dataStore.updateNF(nf.id, nf);
            }
        }

        if (!nf) {
            this.addTerminalLine(output, `Service '${serviceName}' not found.`, 'error');
            return;
        }

        this.addTerminalLine(output, 'WARN[0000] No services to build', 'warning');
        this.addTerminalLine(output, '[+] up 1/1', 'info');

        const randomDelay = (Math.random() * 0.3 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container ${serviceName} Created${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        // Mark starting and schedule stable status
        if (!nf.createdAt) nf.createdAt = Date.now();
        nf.status = 'starting';
        nf.statusTimestamp = Date.now();
        window.dataStore.updateNF(nf.id, nf);

        // Auto-connect to bus line when starting
        this.autoConnectNFToBus(nf);

        setTimeout(() => {
            const updated = window.dataStore?.getNFById(nf.id);
            if (updated) {
                updated.status = 'stable';
                updated.statusTimestamp = Date.now();
                window.dataStore.updateNF(updated.id, updated);

                if (window.logEngine) {
                    window.logEngine.addLog(updated.id, 'SUCCESS', `${updated.name} is now STABLE and ready`, {
                        previousStatus: 'starting', newStatus: 'stable', uptime: '5 seconds'
                    });
                }

                // Auto-connect MySQL to UDR when stable
                if (updated.type === 'MySQL') {
                    this.connectMySQLToUDR(updated);
                } else if (updated.type === 'UDR') {
                    const allNFs = window.dataStore?.getAllNFs() || [];
                    const mysql = allNFs.find(nf => nf.type === 'MySQL' && nf.status === 'stable');
                    if (mysql) {
                        this.connectMySQLToUDR(mysql);
                    }
                }

                if (window.canvasRenderer) window.canvasRenderer.render();
            }
        }, 5000);

        if (window.canvasRenderer) window.canvasRenderer.render();
    }

    /**
     * Handle docker compose down <service> (stop a specific service via compose)
     * @param {string} serviceName - Service name (e.g., oai-nrf)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeServiceDown(serviceName, output) {
        if (!serviceName) {
            this.addTerminalLine(output, 'Usage: docker compose -f docker-compose.yml down <service-name>', 'error');
            return;
        }

        const serviceNameMap = {
            'oai-amf': 'AMF', 'oai-smf': 'SMF', 'oai-upf': 'UPF', 'oai-ausf': 'AUSF',
            'oai-udm': 'UDM', 'oai-udr': 'UDR', 'oai-nrf': 'NRF', 'oai-pcf': 'PCF',
            'oai-nssf': 'NSSF', 'mysql': 'MySQL', 'oai-ext-dn': 'ext-dn', 'oai-gnb': 'gNB', 'oai-ue': 'UE'
        };

        const nfType = serviceNameMap[serviceName.toLowerCase()];
        const allNFs = window.dataStore?.getAllNFs() || [];

        let nf = null;
        if (nfType) nf = allNFs.find(n => n.type === nfType);
        if (!nf) nf = allNFs.find(n => n.name === serviceName || (`oai-${n.type || ''}`) === serviceName);

        if (!nf) {
            this.addTerminalLine(output, `No ${serviceName} container to stop.`, 'info');
            return;
        }

        this.addTerminalLine(output, '[+] Running 1/1', 'info');
        const randomDelay = (Math.random() * 0.3 + 0.1).toFixed(1);
        this.addTerminalLine(output, `✔ Container ${serviceName} Removed${' '.repeat(20)}${randomDelay}s`, 'success');
        await this.delay(parseFloat(randomDelay) * 1000);

        // Remove NF
        if (window.nfManager) {
            window.nfManager.deleteNetworkFunction(nf.id);
        } else if (window.dataStore) {
            window.dataStore.removeNF(nf.id);
        }

        if (window.canvasRenderer) window.canvasRenderer.render();
    }

    async dockerStart(serviceName, output) {
        if (!serviceName) {
            this.addTerminalLine(output, 'Usage: docker start <service-name>', 'error');
            return;
        }

        const allNFs = window.dataStore?.getAllNFs() || [];
        const serviceNameMap = {
            'oai-amf': 'AMF', 'oai-smf': 'SMF', 'oai-upf': 'UPF', 'oai-ausf': 'AUSF',
            'oai-udm': 'UDM', 'oai-udr': 'UDR', 'oai-nrf': 'NRF', 'oai-pcf': 'PCF',
            'oai-nssf': 'NSSF', 'mysql': 'MySQL', 'ext-dn': 'ext-dn', 'oai-gnb': 'gNB', 'oai-ue': 'UE'
        };

        const nfType = serviceNameMap[serviceName.toLowerCase()];
        const nf = allNFs.find(n => n.type === nfType);

        if (!nf) {
            this.addTerminalLine(output, `Service '${serviceName}' not found.`, 'error');
            return;
        }

        this.addTerminalLine(output, `Starting ${nf.name}...`, 'info');

        if (!nf.createdAt) {
            nf.createdAt = Date.now();
        }
        nf.status = 'starting';
        nf.statusTimestamp = Date.now();
        window.dataStore.updateNF(nf.id, nf);

        setTimeout(() => {
            if (window.dataStore?.getNFById(nf.id)) {
                nf.status = 'stable';
                nf.statusTimestamp = Date.now();
                window.dataStore.updateNF(nf.id, nf);
                if (window.canvasRenderer) {
                    window.canvasRenderer.render();
                }
            }
        }, 5000);

        this.addTerminalLine(output, `✅ ${nf.name} started (status: starting)`, 'success');
        this.addTerminalLine(output, 'Service will be stable in ~5 seconds', 'info');

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Stop a specific service
     * @param {string} serviceName - Service name to stop
     * @param {HTMLElement} output - Output element
     */
    async dockerStop(serviceName, output) {
        if (!serviceName) {
            this.addTerminalLine(output, 'Usage: docker stop <service-name>', 'error');
            return;
        }

        const allNFs = window.dataStore?.getAllNFs() || [];
        const serviceNameMap = {
            'oai-amf': 'AMF', 'oai-smf': 'SMF', 'oai-upf': 'UPF', 'oai-ausf': 'AUSF',
            'oai-udm': 'UDM', 'oai-udr': 'UDR', 'oai-nrf': 'NRF', 'oai-pcf': 'PCF',
            'oai-nssf': 'NSSF', 'mysql': 'MySQL', 'ext-dn': 'ext-dn', 'oai-gnb': 'gNB', 'oai-ue': 'UE'
        };

        const nfType = serviceNameMap[serviceName.toLowerCase()];
        const nf = allNFs.find(n => n.type === nfType);

        if (!nf) {
            this.addTerminalLine(output, `Service '${serviceName}' not found.`, 'error');
            return;
        }

        this.addTerminalLine(output, `Stopping ${nf.name}...`, 'info');
        nf.status = 'stopped';
        nf.statusTimestamp = Date.now();
        window.dataStore.updateNF(nf.id, nf);

        this.addTerminalLine(output, `✅ ${nf.name} stopped`, 'success');

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
    }

    /**
     * Add line to terminal output
     * @param {HTMLElement} output - Output element
     * @param {string} text - Text to add
     * @param {string} type - Line type
     */
    addTerminalLine(output, text, type = 'normal') {
        const line = document.createElement('div');
        line.className = `docker-terminal-line docker-terminal-${type}`;
        line.innerHTML = text || '&nbsp;';
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    /**
     * Generate container ID
     * @returns {string} Random container ID
     */
    generateContainerId() {
        const chars = '0123456789abcdef';
        let id = '';
        for (let i = 0; i < 12; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    /**
     * Get ports for NF
     * @param {Object} nf - Network Function
     * @returns {string} Ports string
     */
    getPortsForNF(nf) {
        const portMap = {
            'AMF': '80/tcp, 8080/tcp, 9090/tcp, 38412/sctp',
            'SMF': '80/tcp, 8080/tcp, 8805/udp',
            'UPF': '2152/udp, 8805/udp',
            'AUSF': '80/tcp, 8080/tcp',
            'UDM': '80/tcp, 8080/tcp',
            'UDR': '80/tcp, 8080/tcp',
            'NRF': '80/tcp, 8080/tcp, 9090/tcp',
            'PCF': '80/tcp, 8080/tcp',
            'NSSF': '80/tcp, 8080/tcp',
            'MySQL': '3306/tcp, 33060/tcp',
            'gNB': '2152/udp, 38412/sctp',
            'UE': '2152/udp'
        };
        return portMap[nf.type] || `${nf.config.port}/tcp`;
    }

    /**
     * Create default NFs as fallback
     * @param {HTMLElement} output - Output element
     */
    async createDefaultNFs(output) {
        const defaultNFs = this.getDefaultNFConfigurations();
        const creationTime = Date.now();

        for (const nfConfig of defaultNFs) {
            this.addTerminalLine(output, `Creating ${nfConfig.type}...`, 'info');

            const position = window.nfManager.calculateAutoPosition(nfConfig.type, 1);
            const nf = window.nfManager.createNetworkFunction(nfConfig.type, position);

            if (nf) {
                nf.config.ipAddress = nfConfig.ipAddress;
                nf.config.port = nfConfig.port;
                nf.config.httpProtocol = nfConfig.httpProtocol || 'HTTP/2';
                nf.createdAt = creationTime;
                window.dataStore.updateNF(nf.id, nf);
                this.addTerminalLine(output, `✅ ${nf.name} created (${nfConfig.ipAddress}:${nfConfig.port})`, 'success');
                await this.delay(200);
            }
        }

        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, `✅ Created ${defaultNFs.length} default Network Functions`, 'success');
    }

    /**
     * Filter topology to exclude gNB and UE
     * @param {Object} topology - Topology object
     * @returns {Object} Filtered topology
     */
    filterTopology(topology) {
        const filtered = JSON.parse(JSON.stringify(topology));

        if (filtered.nfs && Array.isArray(filtered.nfs)) {
            filtered.nfs = filtered.nfs.filter(nf => nf.type !== 'gNB' && nf.type !== 'UE');
        }

        const serviceBusNFIds = new Set();
        if (filtered.buses && Array.isArray(filtered.buses)) {
            filtered.buses.forEach(bus => {
                if (bus.connections && Array.isArray(bus.connections)) {
                    bus.connections.forEach(nfId => {
                        serviceBusNFIds.add(nfId);
                    });
                }
            });
        }

        if (filtered.busConnections && Array.isArray(filtered.busConnections)) {
            filtered.busConnections.forEach(busConn => {
                serviceBusNFIds.add(busConn.nfId);
            });
        }

        if (filtered.connections && Array.isArray(filtered.connections)) {
            const excludedNFIds = new Set();
            if (topology.nfs) {
                topology.nfs.forEach(nf => {
                    if (nf.type === 'gNB' || nf.type === 'UE') {
                        excludedNFIds.add(nf.id);
                    }
                });
            }

            filtered.connections = filtered.connections.filter(conn => {
                if (excludedNFIds.has(conn.sourceId) || excludedNFIds.has(conn.targetId)) {
                    return false;
                }

                const bothOnServiceBus = serviceBusNFIds.has(conn.sourceId) && serviceBusNFIds.has(conn.targetId);
                if (bothOnServiceBus) {
                    const serviceBusInterfaces = ['Nnrf_NFManagement', 'Nnrf_NFDiscovery', 'Nnrf',
                        'Namf', 'Nsmf', 'Nausf', 'Nudm', 'Npcf', 'Nnssf', 'Nudr'];
                    const isServiceBusInterface = serviceBusInterfaces.some(iface =>
                        conn.interfaceName?.includes(iface) || conn.interfaceName === iface);
                    if (isServiceBusInterface) {
                        return false;
                    }
                }
                return true;
            });
        }

        if (filtered.busConnections && Array.isArray(filtered.busConnections)) {
            const excludedNFIds = new Set();
            if (topology.nfs) {
                topology.nfs.forEach(nf => {
                    if (nf.type === 'gNB' || nf.type === 'UE') {
                        excludedNFIds.add(nf.id);
                    }
                });
            }
            filtered.busConnections = filtered.busConnections.filter(busConn => !excludedNFIds.has(busConn.nfId));
        }

        if (filtered.buses && Array.isArray(filtered.buses)) {
            filtered.buses.forEach(bus => {
                if (bus.connections && Array.isArray(bus.connections)) {
                    const excludedNFIds = new Set();
                    if (topology.nfs) {
                        topology.nfs.forEach(nf => {
                            if (nf.type === 'gNB' || nf.type === 'UE') {
                                excludedNFIds.add(nf.id);
                            }
                        });
                    }
                    bus.connections = bus.connections.filter(nfId => !excludedNFIds.has(nfId));
                }
            });
        }

        return filtered;
    }

    /**
     * Get default NF configurations
     * @returns {Array} Array of default NF configurations
     */
    getDefaultNFConfigurations() {
        return [
            { type: 'NRF', ipAddress: '192.168.1.10', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'AMF', ipAddress: '192.168.1.11', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'SMF', ipAddress: '192.168.1.12', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UPF', ipAddress: '192.168.1.13', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'AUSF', ipAddress: '192.168.1.14', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UDM', ipAddress: '192.168.1.15', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UDR', ipAddress: '192.168.1.16', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'PCF', ipAddress: '192.168.1.17', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'NSSF', ipAddress: '192.168.1.18', port: 8080, httpProtocol: 'HTTP/2' },
             { type: 'MySQL', ipAddress: '192.168.1.19', port: 3306, httpProtocol: 'HTTP/2' }
        ];
    }

    /**
     * Format creation time for docker ps
     * @param {number} timestamp - Creation timestamp
     * @returns {string} Formatted time string
     */
    formatCreationTime(timestamp) {
        if (!timestamp) return '3 weeks ago';
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        } else if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else if (days < 7) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else if (days < 30) {
            const weeks = Math.floor(days / 7);
            return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(days / 30);
            return `${months} month${months !== 1 ? 's' : ''} ago`;
        }
    }

    /**
     * Format creation time for watch command
     * @param {number} timestamp - Creation timestamp
     * @returns {string} Formatted time string
     */
    formatCreationTimeForWatch(timestamp) {
        if (!timestamp) return 'About a minute ago';
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);

        if (seconds < 30) {
            return 'Just now';
        } else if (seconds < 60) {
            return 'About a minute ago';
        } else if (minutes === 1) {
            return 'About a minute ago';
        } else if (minutes < 60) {
            return `About ${minutes} minutes ago`;
        } else {
            const hours = Math.floor(minutes / 60);
            if (hours === 1) {
                return 'About an hour ago';
            } else if (hours < 24) {
                return `About ${hours} hours ago`;
            } else {
                const days = Math.floor(hours / 24);
                if (days === 1) {
                    return 'About a day ago';
                } else {
                    return `About ${days} days ago`;
                }
            }
        }
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Setup window controls (drag, resize, minimize, maximize)
     * @param {HTMLElement} terminalModal - Terminal modal element
     */
    setupWindowControls(terminalModal) {
        const terminalWindow = document.getElementById('docker-terminal-window');
        const titlebar = document.getElementById('docker-terminal-titlebar');
        const minimizeBtn = document.getElementById('docker-terminal-minimize');
        const maximizeBtn = document.getElementById('docker-terminal-maximize');
        const resizeHandle = document.getElementById('docker-terminal-resize-handle');

        if (!terminalWindow || !titlebar) return;

        // Resizing functionality
        let isResizing = false;
        let resizeStartX = 0;
        let resizeStartY = 0;
        let startWidth = 0;
        let startHeight = 0;

        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                if (this.terminalState.isMaximized) return;
                isResizing = true;
                resizeStartX = e.clientX;
                resizeStartY = e.clientY;
                startWidth = terminalWindow.offsetWidth;
                startHeight = terminalWindow.offsetHeight;
                e.preventDefault();
                e.stopPropagation();
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const deltaX = e.clientX - resizeStartX;
            const deltaY = e.clientY - resizeStartY;
            const newWidth  = Math.max(400, Math.min(startWidth  + deltaX, window.innerWidth  - 100));
            const newHeight = Math.max(300, Math.min(startHeight + deltaY, window.innerHeight - 100));
            this.terminalState.width  = newWidth;
            this.terminalState.height = newHeight;
            terminalWindow.style.width  = newWidth  + 'px';
            terminalWindow.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.saveTerminalState();
            }
        });

        // Minimize button
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.minimizeTerminal(terminalWindow);
            });
        }

        // Maximize button
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                this.toggleMaximize(terminalWindow);
            });
        }
    }

    /**
     * Minimize terminal window
     * @param {HTMLElement} terminalWindow - Terminal window element
     */
    minimizeTerminal(terminalWindow) {
        this.terminalState.isMinimized = !this.terminalState.isMinimized;

        if (this.terminalState.isMinimized) {
            terminalWindow.style.height = '35px';
            const content = document.getElementById('docker-terminal-content');
            if (content) content.style.display = 'none';
            const resizeHandle = document.getElementById('docker-terminal-resize-handle');
            if (resizeHandle) resizeHandle.style.display = 'none';
        } else {
            terminalWindow.style.height = this.terminalState.height + 'px';
            const content = document.getElementById('docker-terminal-content');
            if (content) content.style.display = 'flex';
            const resizeHandle = document.getElementById('docker-terminal-resize-handle');
            if (resizeHandle) resizeHandle.style.display = 'block';
        }

        this.saveTerminalState();
    }

    /**
     * Toggle maximize/restore terminal window
     * @param {HTMLElement} terminalWindow - Terminal window element
     */
    toggleMaximize(terminalWindow) {
        this.terminalState.isMaximized = !this.terminalState.isMaximized;
        const maximizeBtn = document.getElementById('docker-terminal-maximize');

        if (this.terminalState.isMaximized) {
            if (!terminalWindow.style.left) {
                const rect = terminalWindow.getBoundingClientRect();
                this.terminalState.x = rect.left;
                this.terminalState.y = rect.top;
            }

            terminalWindow.style.left = '0';
            terminalWindow.style.top = '0';
            terminalWindow.style.width = '100vw';
            terminalWindow.style.height = '100vh';
            terminalWindow.style.transform = 'none';
            terminalWindow.style.borderRadius = '0';
            if (maximizeBtn) maximizeBtn.textContent = '❐';
        } else {
            terminalWindow.style.width = this.terminalState.width + 'px';
            terminalWindow.style.height = this.terminalState.height + 'px';
            terminalWindow.style.borderRadius = '8px 8px 0 0';

            if (this.terminalState.x !== null && this.terminalState.y !== null) {
                terminalWindow.style.left = this.terminalState.x + 'px';
                terminalWindow.style.top = this.terminalState.y + 'px';
                terminalWindow.style.transform = 'none';
            } else {
                terminalWindow.style.left = '';
                terminalWindow.style.top = '';
                terminalWindow.style.transform = '';
            }

            if (maximizeBtn) maximizeBtn.textContent = '□';
        }

        this.saveTerminalState();
    }

    /**
     * Apply saved terminal state
     */
    applyTerminalState() {
        const terminalWindow = document.getElementById('docker-terminal-window');
        if (!terminalWindow) return;

        const savedState = localStorage.getItem('dockerTerminalState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.terminalState = { ...this.terminalState, ...state };
            } catch (e) {
                console.warn('Failed to load terminal state:', e);
            }
        }

        terminalWindow.style.width = this.terminalState.width + 'px';
        terminalWindow.style.height = this.terminalState.height + 'px';

        if (this.terminalState.x !== null && this.terminalState.y !== null) {
            terminalWindow.style.left = this.terminalState.x + 'px';
            terminalWindow.style.top = this.terminalState.y + 'px';
            terminalWindow.style.transform = 'none';
        }

        if (this.terminalState.isMaximized) {
            this.toggleMaximize(terminalWindow);
        }

        if (this.terminalState.isMinimized) {
            this.minimizeTerminal(terminalWindow);
        }
    }

    /**
     * Save terminal state to localStorage
     */
    saveTerminalState() {
        try {
            localStorage.setItem('dockerTerminalState', JSON.stringify(this.terminalState));
        } catch (e) {
            console.warn('Failed to save terminal state:', e);
        }
    }

    /**
     * Docker network ls command
     * @param {HTMLElement} output - Output element
     */
    dockerNetworkLS(output) {
        this.addTerminalLine(output, 'NETWORK ID     NAME          DRIVER    SCOPE', 'info');
        this.addTerminalLine(output, 'df33e4a6502d   bridge        bridge    local', 'info');
        this.addTerminalLine(output, '902c1fcc4369   host          host      local', 'info');
        this.addTerminalLine(output, '0c712814bbb0   none          null      local', 'info');

        if (this.oaiWorkshopNetworkExists) {
            this.addTerminalLine(output, `${this.oaiWorkshopNetworkId}   oaiworkshop   bridge    local`, 'success');
        }
    }

    /**
     * Docker network inspect command
     * @param {string} networkName - Network name to inspect
     * @param {HTMLElement} output - Output element
     */
    dockerNetworkInspect(networkName, output) {
        if (networkName === 'bridge') {
            this.inspectBridgeNetwork(output);
        } else if (networkName === 'host') {
            this.inspectHostNetwork(output);
        } else if (networkName === 'none') {
            this.inspectNoneNetwork(output);
        } else if (networkName === 'oaiworkshop') {
            if (this.oaiWorkshopNetworkExists) {
                this.inspectOAIWorkshopNetwork(output);
            } else {
                this.addTerminalLine(output, `Error: No such network: ${networkName}`, 'error');
            }
        } else {
            this.addTerminalLine(output, `Error: No such network: ${networkName}`, 'error');
        }
    }

    /**
     * Inspect bridge network
     * @param {HTMLElement} output - Output element
     */
    inspectBridgeNetwork(output) {
        const json = {
            "Name": "bridge",
            "Id": "df33e4a6502d1229e87fbd225ce8cc4b95fd4553fcaadee50fd5a70a4a021f3d",
            "Created": "2026-01-30T15:26:16.417604705+05:30",
            "Scope": "local",
            "Driver": "bridge",
            "EnableIPv4": true,
            "EnableIPv6": false,
            "IPAM": {
                "Driver": "default",
                "Options": null,
                "Config": [{ "Subnet": "172.17.0.0/16", "Gateway": "172.17.0.1" }]
            },
            "Internal": false,
            "Attachable": false,
            "Ingress": false,
            "ConfigFrom": { "Network": "" },
            "ConfigOnly": false,
            "Containers": {},
            "Options": {
                "com.docker.network.bridge.default_bridge": "true",
                "com.docker.network.bridge.enable_icc": "true",
                "com.docker.network.bridge.enable_ip_masquerade": "true",
                "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
                "com.docker.network.bridge.name": "docker0",
                "com.docker.network.driver.mtu": "1500"
            },
            "Labels": {}
        };
        this.addTerminalLine(output, JSON.stringify([json], null, 2), 'info');
    }

    /**
     * Inspect host network
     * @param {HTMLElement} output - Output element
     */
    inspectHostNetwork(output) {
        const json = {
            "Name": "host",
            "Id": "902c1fcc436950abba5007bd8b39b65ab96fd9c72b3873519ebc55bc14315b74",
            "Created": "2026-01-20T15:04:16.397276602+05:30",
            "Scope": "local",
            "Driver": "host",
            "EnableIPv4": true,
            "EnableIPv6": false,
            "IPAM": { "Driver": "default", "Options": null, "Config": null },
            "Internal": false,
            "Attachable": false,
            "Ingress": false,
            "ConfigFrom": { "Network": "" },
            "ConfigOnly": false,
            "Containers": {},
            "Options": {},
            "Labels": {}
        };
        this.addTerminalLine(output, JSON.stringify([json], null, 2), 'info');
    }

    /**
     * Inspect none network
     * @param {HTMLElement} output - Output element
     */
    inspectNoneNetwork(output) {
        const json = {
            "Name": "none",
            "Id": "0c712814bbb0c32a4d2846f885d90534121f472d0c71d0c34330ad6da8327020",
            "Created": "2026-01-20T15:04:16.389588497+05:30",
            "Scope": "local",
            "Driver": "null",
            "EnableIPv4": true,
            "EnableIPv6": false,
            "IPAM": { "Driver": "default", "Options": null, "Config": null },
            "Internal": false,
            "Attachable": false,
            "Ingress": false,
            "ConfigFrom": { "Network": "" },
            "ConfigOnly": false,
            "Containers": {},
            "Options": {},
            "Labels": {}
        };
        this.addTerminalLine(output, JSON.stringify([json], null, 2), 'info');
    }

    /**
     * Inspect OAI workshop network
     * @param {HTMLElement} output - Output element
     */
    inspectOAIWorkshopNetwork(output) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const containers = {};

        allNFs.forEach(nf => {
            const serviceNameMap = {
                'AMF': 'oai-amf', 'SMF': 'oai-smf', 'UPF': 'oai-upf', 'AUSF': 'oai-ausf',
                'UDM': 'oai-udm', 'UDR': 'oai-udr', 'NRF': 'oai-nrf', 'PCF': 'oai-pcf',
                'NSSF': 'oai-nssf', 'MySQL': 'mysql', 'ext-dn': 'oai-ext-dn'
            };
            const serviceName = serviceNameMap[nf.type] || nf.type.toLowerCase();
            const containerId = this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + 'abcd';

            containers[containerId] = {
                "Name": serviceName,
                "EndpointID": this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + this.generateContainerId() + 'ef01',
                "MacAddress": this.generateMacAddress(),
                "IPv4Address": nf.config.ipAddress + "/26",
                "IPv6Address": ""
            };
        });

        const createdTime = this.oaiWorkshopCreatedTime ? new Date(this.oaiWorkshopCreatedTime).toISOString() : new Date().toISOString();

        const json = {
            "Name": "oaiworkshop",
            "Id": this.oaiWorkshopNetworkId + "d0a87f40b563d8172b3f54045b0da9d9b859ed25522c2aaa8b86",
            "Created": createdTime,
            "Scope": "local",
            "Driver": "bridge",
            "EnableIPv4": true,
            "EnableIPv6": false,
            "IPAM": {
                "Driver": "default",
                "Options": null,
                "Config": [{ "Subnet": "192.168.70.128/26" }]
            },
            "Internal": false,
            "Attachable": false,
            "Ingress": false,
            "ConfigFrom": { "Network": "" },
            "ConfigOnly": false,
            "Containers": containers,
            "Options": { "com.docker.network.bridge.name": "oaiworkshop" },
            "Labels": {
                "com.docker.compose.config-hash": "dca0e19cf413805e199db52df7a818f82ffd4a571265d5f722c8e2198676da59",
                "com.docker.compose.network": "public_net",
                "com.docker.compose.project": "cn",
                "com.docker.compose.version": "5.0.1"
            }
        };

        this.addTerminalLine(output, JSON.stringify([json], null, 2), 'info');
    }

    /**
     * Generate network ID
     * @returns {string} Random network ID
     */
    generateNetworkId() {
        const chars = '0123456789abcdef';
        let id = '';
        for (let i = 0; i < 12; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    /**
     * Generate MAC address
     * @returns {string} Random MAC address
     */
    generateMacAddress() {
        const chars = '0123456789abcdef';
        let mac = '';
        for (let i = 0; i < 6; i++) {
            if (i > 0) mac += ':';
            mac += chars[Math.floor(Math.random() * chars.length)];
            mac += chars[Math.floor(Math.random() * chars.length)];
        }
        return mac;
    }

    /**
     * Docker version command
     * @param {HTMLElement} output - Output element
     */
    dockerVersion(output) {
        this.addTerminalLine(output, 'Client: Docker Engine - Community', 'info');
        this.addTerminalLine(output, ' Version:           28.0.4', 'info');
        this.addTerminalLine(output, ' API version:       1.48', 'info');
        this.addTerminalLine(output, ' Go version:        go1.23.7', 'info');
        this.addTerminalLine(output, ' Git commit:        b8034c0', 'info');
        this.addTerminalLine(output, ' Built:             Tue Mar 25 15:07:11 2025', 'info');
        this.addTerminalLine(output, ' OS/Arch:           linux/amd64', 'info');
        this.addTerminalLine(output, ' Context:           default', 'info');
        this.addTerminalLine(output, '', 'blank');
        this.addTerminalLine(output, 'Server: Docker Engine - Community', 'info');
        this.addTerminalLine(output, ' Engine:', 'info');
        this.addTerminalLine(output, '  Version:          28.0.4', 'info');
        this.addTerminalLine(output, '  API version:      1.48 (minimum version 1.24)', 'info');
        this.addTerminalLine(output, '  Go version:       go1.23.7', 'info');
        this.addTerminalLine(output, '  Git commit:       6430e49', 'info');
        this.addTerminalLine(output, '  Built:            Tue Mar 25 15:07:11 2025', 'info');
        this.addTerminalLine(output, '  OS/Arch:          linux/amd64', 'info');
        this.addTerminalLine(output, '  Experimental:     false', 'info');
        this.addTerminalLine(output, ' containerd:', 'info');
        this.addTerminalLine(output, '  Version:          v2.2.1', 'info');
        this.addTerminalLine(output, '  GitCommit:        dea7da592f5d1d2b7755e3a161be07f43fad8f75', 'info');
        this.addTerminalLine(output, ' runc:', 'info');
        this.addTerminalLine(output, '  Version:          1.3.4', 'info');
        this.addTerminalLine(output, '  GitCommit:        v1.3.4-0-gd6d73eb8', 'info');
        this.addTerminalLine(output, ' docker-init:', 'info');
        this.addTerminalLine(output, '  Version:          0.19.0', 'info');
        this.addTerminalLine(output, '  GitCommit:        de40ad0', 'info');
    }

    /**
     * Get topology-based position for NF (based on 5g.json layout)
     * @param {string} nfType - NF type
     * @param {Array} existingNFs - Array of existing NFs
     * @returns {Object} {x, y} position
     */
    getTopologyPosition(nfType, existingNFs) {
        // Topology positions based on 5g.json layout
        const topologyPositions = {
            'NRF': { x: 132, y: 31 },
            'AMF': { x: 298, y: 223 },
            'SMF': { x: 407, y: 222 },
            'UPF': { x: 505, y: 337 },
            'AUSF': { x: 168, y: 228 },
            'UDM': { x: 629, y: 28 },
            'UDR': { x: 750, y: 228 },
            'PCF': { x: 443, y: 28 },
            'NSSF': { x: 850, y: 28 },
            'MySQL': { x: 750, y: 120 },
            'gNB': { x: 302, y: 337 },
            'UE': { x: 126, y: 340 }
        };

        // If position exists in topology, use it (with small offset if NF already exists)
        if (topologyPositions[nfType]) {
            const basePos = topologyPositions[nfType];
            // Check if another NF of same type exists at this position
            const sameTypeNFs = existingNFs.filter(nf => nf.type === nfType);
            if (sameTypeNFs.length > 0) {
                // Offset slightly to avoid exact overlap
                return {
                    x: basePos.x + (sameTypeNFs.length * 80),
                    y: basePos.y + (sameTypeNFs.length * 60)
                };
            }
            return basePos;
        }

        // Fallback to auto-positioning
        if (window.nfManager) {
            const count = existingNFs.filter(nf => nf.type === nfType).length + 1;
            return window.nfManager.calculateAutoPosition(nfType, count);
        }

        // Default position
        return { x: 200, y: 200 };
    }

    /**
     * Auto-connect NF to bus line when it starts
     * @param {Object} nf - Network Function object
     */
    autoConnectNFToBus(nf) {
        // Exclude certain types from auto-connect
        // MySQL intentionally excluded (user requested it should not connect to bus)
        const excludedTypes = ['UPF', 'gNB', 'UE', 'MySQL'];
        if (excludedTypes.includes(nf.type)) {
            return;
        }

        // Get all buses
        const allBuses = window.dataStore?.getAllBuses() || [];
        if (allBuses.length === 0) {
            // Create Service Bus if it doesn't exist
            if (window.busManager) {
                const serviceBus = window.busManager.createBusLine('horizontal', { x: 200, y: 350 }, 800, 'Service Bus');
                if (serviceBus && window.busManager) {
                    window.busManager.connectNFToBus(nf.id, serviceBus.id);
                    console.log(`✅ Auto-connected ${nf.name} to Service Bus`);
                }
            }
            return;
        }

        // Connect to first available bus (usually Service Bus)
        const targetBus = allBuses.find(bus => bus.name === 'Service Bus') || allBuses[0];
        
        // Check if already connected
        const existingConnections = window.dataStore?.getBusConnectionsForNF(nf.id) || [];
        const alreadyConnected = existingConnections.some(conn => conn.busId === targetBus.id);
        
        if (!alreadyConnected && window.busManager) {
            window.busManager.connectNFToBus(nf.id, targetBus.id);
            console.log(`✅ Auto-connected ${nf.name} to ${targetBus.name}`);
            
            if (window.logEngine) {
                window.logEngine.addLog(nf.id, 'INFO', `Auto-connected to ${targetBus.name} service bus`, {
                    busId: targetBus.id,
                    autoConnect: true
                });
            }
        }
    }

    /**
     * Connect MySQL to UDR automatically
     * @param {Object} mysqlNF - MySQL NF object
     */
    connectMySQLToUDR(mysqlNF) {
        const allNFs = window.dataStore?.getAllNFs() || [];
        const udr = allNFs.find(nf => nf.type === 'UDR' && nf.status === 'stable');
        
        if (!udr) {
            console.log('ℹ️ UDR not found yet, will connect when UDR is available');
            return;
        }

        // Check if connection already exists
        const allConnections = window.dataStore?.getAllConnections() || [];
        const existingConnection = allConnections.find(conn => 
            (conn.sourceId === mysqlNF.id && conn.targetId === udr.id) ||
            (conn.sourceId === udr.id && conn.targetId === mysqlNF.id)
        );

        if (existingConnection) {
            console.log('ℹ️ MySQL-UDR connection already exists');
            return;
        }

        // Create MySQL to UDR connection
        if (window.connectionManager) {
            const connection = {
                id: `conn-mysql-udr-${Date.now()}`,
                sourceId: mysqlNF.id,
                targetId: udr.id,
                type: 'manual',
                showVisual: true,
                createdAt: Date.now(),
                options: {
                    label: 'Data Storage',
                    color: '#2ecc71',
                    style: 'dashed',
                    interfaceType: 'Nudr',
                    lineWidth: 2
                }
            };

            window.dataStore.addConnection(connection);
            console.log('✅ MySQL connected to UDR');

            if (window.logEngine) {
                window.logEngine.addLog(mysqlNF.id, 'SUCCESS', 'Connected to UDR for data storage', {
                    targetNF: udr.name,
                    connectionType: 'Data Storage'
                });
            }

            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        }
    }
}

// Initialize global instance
window.dockerTerminal = new DockerTerminal();
