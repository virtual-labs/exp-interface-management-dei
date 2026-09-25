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
 * 
 * ============================================
 * STANDARDIZED TERMINAL FEATURES
 * ============================================
 * This implementation includes standardized UI patterns that can be
 * reused across other simulation components:
 * 
 * 1. AUTOCOMPLETE LOGIC (Tab Key)
 *    - Uses Longest Common Prefix (LCP) algorithm
 *    - Single match: Auto-completes fully
 *    - Multiple matches: Extends to LCP, then shows all options
 *    - No matches: Visual feedback (opacity flicker)
 *    - Multi-column grid display for options
 *    - See: handleTabCompletion()
 * 
 * 2. SIMPLIFIED WINDOW CONTROLS
 *    - Only Close button (×) in title bar
 *    - No minimize/maximize buttons
 *    - No dragging or resizing
 *    - Fixed centered modal overlay
 *    - See: openTerminal()
 * 
 * 3. VI MODE - FULL NAVIGATION
 *    Exit Commands:
 *    - Press 'q' for quick exit (like less/more pagers)
 *    - Press ':q', ':q!', ':wq' for vi-style exit
 *    - Press 'Escape' to exit or clear command buffer
 *    
 *    Navigation Keys:
 *    - 'j' / 'k' → Scroll line by line
 *    - 'f' / 'b' → Scroll page by page
 *    - 'G' → Go to bottom
 *    - 'gg' → Go to top (press 'g' twice)
 *    - Arrow keys, PageUp/PageDown supported
 *    
 *    All keystrokes prevented from reaching terminal
 *    Uses event capture phase for proper isolation
 *    See: enterViMode(), viKeyHandler
 * 
 * 4. KEYBOARD SHORTCUTS
 *    - Ctrl+C → Interrupt/Stop watch mode
 *    - Ctrl+L → Clear screen
 *    - Arrow Up/Down → Command history navigation
 *    - Enter → Execute command
 *    - Tab → Autocomplete with LCP
 * 
 * 5. CLEAN OUTPUT
 *    - No extra blank lines after commands
 *    - Professional spacing like real terminals
 *    - Color-coded output (Success/Warning/Error/Info)
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
                        Docker Terminal
                    </div>
                    <div class="docker-terminal-controls">
                        <button class="docker-terminal-btn close" id="docker-terminal-close" title="Close">×</button>
                    </div>
                </div>
                <div class="docker-terminal-content" id="docker-terminal-content">
                    <div class="docker-terminal-output" id="docker-terminal-output"></div>
                </div>
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
    }

    /**
     * Setup Docker terminal functionality
     * @param {HTMLElement} terminalModal - Terminal modal element
     */
    setupTerminal(terminalModal) {
        const output = document.getElementById('docker-terminal-output');
        const content = document.getElementById('docker-terminal-content');
        const closeBtn = document.getElementById('docker-terminal-close');

        // Command history for Up/Down navigation
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        this.cursorPosition = 0;

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

        // Focus terminal on click
        content.addEventListener('click', () => {
            this.focusInput();
        });

        // Initial welcome message
        this.addTerminalLine(output, 'Welcome to Docker Terminal', 'info');
        this.addTerminalLine(output, 'Type "help" for available commands.', 'info');

        // Create initial input line
        this.createInputLine(output);

        // Setup keyboard handling once per terminal instance
        this.setupKeyboardHandling();
    }

    /**
     * Create a new inline input line with prompt
     * @param {HTMLElement} output - Output element
     */
    createInputLine(output) {
        // Remove any existing input line and suggestion bar
        const existingInput = document.getElementById('active-terminal-input');
        if (existingInput) existingInput.remove();
        const existingBar = document.getElementById('tab-suggestions');
        if (existingBar) existingBar.remove();

        // Create input line container
        const inputLine = document.createElement('div');
        inputLine.id = 'active-terminal-input';
        inputLine.className = 'docker-terminal-input-line';
        inputLine.innerHTML = `
            <span class="docker-terminal-prompt">docker@main></span>
            <span class="docker-terminal-input-before" id="terminal-input-before"></span>
            <span class="docker-terminal-cursor" id="terminal-cursor">█</span>
            <span class="docker-terminal-input-after" id="terminal-input-after"></span>
        `;
        output.appendChild(inputLine);

        // Create suggestion bar directly after the input line (hidden by default)
        const sugBar = document.createElement('div');
        sugBar.id = 'tab-suggestions';
        sugBar.className = 'tab-suggestions';
        sugBar.style.display = 'none';
        output.appendChild(sugBar);

        // Store reference to input text elements
        this.inputBeforeEl = document.getElementById('terminal-input-before');
        this.inputAfterEl = document.getElementById('terminal-input-after');
        this.cursorEl = document.getElementById('terminal-cursor');

        // Scroll to bottom
        output.scrollTop = output.scrollHeight;

        // Start cursor blink
        this.startCursorBlink();
    }

    /**
     * Setup global keyboard handling for terminal
     */
    setupKeyboardHandling() {
        // Use a persistent bound method for the event listener to avoid duplication
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }

        this.boundKeyHandler = async (e) => {
            // Ignore if in vi mode (vi handler will handle it)
            if (this.isInViMode) {
                return;
            }

            // Only handle if terminal is visible
            const terminalModal = document.getElementById('docker-terminal-modal');
            if (!terminalModal || !terminalModal.classList.contains('show')) {
                return;
            }

            // While watch mode is running, only allow Ctrl+C — block everything else
            if (this.isWatching && !(e.ctrlKey && e.key === 'c')) {
                e.preventDefault();
                return;
            }

            // Handle Ctrl+C to stop watch mode or interrupt
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this._hideSuggestions();
                const output = document.getElementById('docker-terminal-output');

                if (this.isWatching) {
                    this.stopWatch();
                    const activeInput = document.getElementById('active-terminal-input');
                    if (activeInput) activeInput.remove();
                    const sugBar = document.getElementById('tab-suggestions');
                    if (sugBar) sugBar.remove();
                    this.addTerminalLine(output, '^C', 'command');
                    this.addTerminalLine(output, 'Watch mode stopped.', 'info');
                    this.currentInput = '';
                    this.cursorPosition = 0;
                    this.createInputLine(output);
                } else if (this._currentDelayReject) {
                    // A command is running — ignore Ctrl+C completely, do nothing
                    return;
                } else {
                    // Nothing running — clear the current input line
                    const activeInput = document.getElementById('active-terminal-input');
                    if (activeInput) activeInput.remove();
                    const typed = this.currentInput ? `docker@main> ${this.currentInput}^C` : 'docker@main> ^C';
                    this.addTerminalLine(output, typed, 'command');
                    this.currentInput = '';
                    this.cursorPosition = 0;
                    this.createInputLine(output);
                }
                return;
            }

            // Handle Ctrl+L to clear screen
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this._hideSuggestions();
                const output = document.getElementById('docker-terminal-output');
                output.innerHTML = '';
                this.createInputLine(output);
                return;
            }

            // Handle Enter to execute command
            if (e.key === 'Enter') {
                e.preventDefault();
                this._hideSuggestions();
                const command = this.currentInput.trim();
                const output = document.getElementById('docker-terminal-output');

                // Remove the active input line (will be replaced with static command line)
                const activeInput = document.getElementById('active-terminal-input');
                if (activeInput) {
                    activeInput.remove();
                }

                // Display the executed command
                if (command) {
                    this.addTerminalLine(output, `docker@main> ${command}`, 'command');
                    
                    // Add to history
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                    
                    // Process command — always await so we create prompt after it finishes
                    await this.processCommand(command, output);
                } else {
                    // Empty command, just show prompt
                    this.addTerminalLine(output, 'docker@main>', 'command');
                }

                // Reset current input and cursor position
                this.currentInput = '';
                this.cursorPosition = 0;

                // Create new input line (runs after command finishes OR after Ctrl+C cancels it)
                this.createInputLine(output);
                return;
            }

            // Handle Up arrow for history
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.currentInput = this.commandHistory[this.historyIndex] || '';
                    this.cursorPosition = this.currentInput.length;
                    this.updateInputDisplay();
                }
                return;
            }

            // Handle Down arrow for history
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.currentInput = this.commandHistory[this.historyIndex] || '';
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.currentInput = '';
                }
                this.cursorPosition = this.currentInput.length;
                this.updateInputDisplay();
                return;
            }

            // Handle Left arrow to move cursor left
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (this.cursorPosition > 0) {
                    this.cursorPosition--;
                    this.updateInputDisplay();
                }
                return;
            }

            // Handle Right arrow to move cursor right
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (this.cursorPosition < this.currentInput.length) {
                    this.cursorPosition++;
                    this.updateInputDisplay();
                }
                return;
            }

            // Handle Tab for auto-completion
            if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
                return;
            }

            // Handle Backspace (delete character before cursor)
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.cursorPosition > 0) {
                    this.currentInput = this.currentInput.substring(0, this.cursorPosition - 1) + 
                                       this.currentInput.substring(this.cursorPosition);
                    this.cursorPosition--;
                    this._hideSuggestions();
                    this.updateInputDisplay();
                }
                return;
            }

            // Handle Delete (delete character after cursor)
            if (e.key === 'Delete') {
                e.preventDefault();
                if (this.cursorPosition < this.currentInput.length) {
                    this.currentInput = this.currentInput.substring(0, this.cursorPosition) + 
                                       this.currentInput.substring(this.cursorPosition + 1);
                    this.updateInputDisplay();
                }
                return;
            }

            // Handle Home (move cursor to beginning)
            if (e.key === 'Home') {
                e.preventDefault();
                this.cursorPosition = 0;
                this.updateInputDisplay();
                return;
            }

            // Handle End (move cursor to end)
            if (e.key === 'End') {
                e.preventDefault();
                this.cursorPosition = this.currentInput.length;
                this.updateInputDisplay();
                return;
            }

            // Handle character input (printable characters)
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.currentInput = this.currentInput.substring(0, this.cursorPosition) + 
                                   e.key + 
                                   this.currentInput.substring(this.cursorPosition);
                this.cursorPosition++;
                this._hideSuggestions();
                this.updateInputDisplay();
            }
        };

        document.addEventListener('keydown', this.boundKeyHandler);
    }

    /**
     * Update the input text display with cursor at correct position
     */
    updateInputDisplay() {
        if (this.inputBeforeEl && this.inputAfterEl) {
            const before = this.currentInput.substring(0, this.cursorPosition);
            const after = this.currentInput.substring(this.cursorPosition);
            this.inputBeforeEl.textContent = before;
            this.inputAfterEl.textContent = after;
            // Scroll to keep input visible
            const output = document.getElementById('docker-terminal-output');
            if (output) {
                output.scrollTop = output.scrollHeight;
            }
        }
    }

    /**
     * Start cursor blinking animation
     */
    startCursorBlink() {
        // Clear existing blink interval
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
        }

        let visible = true;
        this.cursorBlinkInterval = setInterval(() => {
            if (this.cursorEl) {
                this.cursorEl.style.opacity = visible ? '1' : '0';
                visible = !visible;
            }
        }, 500);
    }

    /**
     * Stop cursor blinking
     */
    stopCursorBlink() {
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
            this.cursorBlinkInterval = null;
        }
    }

    /**
     * Focus the terminal input
     */
    focusInput() {
        // Input is always focused when terminal is active
        const output = document.getElementById('docker-terminal-output');
        if (output) {
            output.scrollTop = output.scrollHeight;
        }
    }

    /**
     * Handle Tab key for command completion — next-word suggestion behavior:
     * - Suggests only the NEXT word, not the full command
     * - Each Tab press cycles through the next-word options in the input line
     * - Suggestion chips below show all next-word options, active one highlighted
     * - Any non-Tab key dismisses the suggestion bar
     */
    handleTabCompletion() {
        const commands = [
            'help', 'status', 'check', 'clear', 'cls', 'exit', 'ls',
            'vi docker-compose.yml',
            'docker ps',
            'docker network ls',
            'docker network inspect ',
            'docker version',
            'docker start ',
            'docker stop ',
            'docker compose -f docker-compose.yml up -d',
            'docker compose -f docker-compose.yml down',
            'docker compose -f docker-compose-gnb.yml up -d',
            'docker compose -f docker-compose-gnb.yml down',
            'docker compose -f docker-compose-ue.yml up -d',
            'docker compose -f docker-compose-ue.yml down',
            'docker compose -f docker-compose-ran.yml up -d oai-ue1',
            'docker compose -f docker-compose-ran.yml up -d oai-ue2',
            'watch docker compose -f docker-compose.yml ps -a'
        ];

        const val = this.currentInput;
        if (!val.length) return;

        // --- If already in a cycle session, advance to next token ---
        if (this._tabTokens && this._tabTokens.length > 0 && this._tabBase !== null &&
            this.currentInput.startsWith(this._tabBase)) {
            this._tabIndex = (this._tabIndex + 1) % this._tabTokens.length;
            this.currentInput = this._tabBase + this._tabTokens[this._tabIndex];
            this.cursorPosition = this.currentInput.length;
            this.updateInputDisplay();
            this._renderSuggestions();
            return;
        }

        // Normalize multiple spaces → single space for matching, but preserve
        // whether the input ends with a space (user is ready for next word)
        const endsWithSpace = val.endsWith(' ');
        const normalized = val.replace(/\s+/g, ' ').trimStart();
        // Use normalized as the lookup key against commands
        const normLower = normalized.toLowerCase();

        // --- Fresh Tab: find all commands that start with normalized input ---
        const matches = commands.filter(cmd =>
            cmd.toLowerCase().startsWith(normLower)
        );

        if (matches.length === 0) {
            // No match — flicker feedback
            if (this.inputBeforeEl) {
                this.inputBeforeEl.style.opacity = '0.3';
                setTimeout(() => { if (this.inputBeforeEl) this.inputBeforeEl.style.opacity = '1'; }, 120);
            }
            return;
        }

        // Extract the next word from each match (the word right after normalized input)
        const nextTokens = [...new Set(
            matches.map(cmd => {
                const rest = cmd.slice(normalized.length);
                if (!rest) return null;
                const trimmed = rest.trimStart();
                const spaceIdx = trimmed.indexOf(' ');
                const word = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx + 1);
                return word;
            }).filter(Boolean)
        )];

        if (nextTokens.length === 0) {
            return;
        }

        // The clean base to build completions from (normalized, no extra spaces)
        const cleanBase = normalized;

        if (nextTokens.length === 1) {
            // Only one option — complete silently, replacing raw input with clean version
            this.currentInput = cleanBase + nextTokens[0];
            this.cursorPosition = this.currentInput.length;
            this.updateInputDisplay();
            this._hideSuggestions();
            return;
        }

        // Multiple next-word options — start cycle session using clean base
        this._tabBase = cleanBase;
        this._tabTokens = nextTokens;
        this._tabIndex = 0;
        this.currentInput = cleanBase + nextTokens[0];
        this.cursorPosition = this.currentInput.length;
        this.updateInputDisplay();
        this._renderSuggestions();
    }

    /**
     * Render suggestions as plain white text on one line directly below the input
     */
    _renderSuggestions() {
        const bar = document.getElementById('tab-suggestions');
        if (!bar || !this._tabTokens) return;

        bar.textContent = this._tabTokens.map(t => t.trim()).join('  ');
        bar.style.display = 'block';

        const output = document.getElementById('docker-terminal-output');
        if (output) output.scrollTop = output.scrollHeight;
    }

    /**
     * Hide the suggestion bar
     */
    _hideSuggestions() {
        const bar = document.getElementById('tab-suggestions');
        if (bar) bar.style.display = 'none';
        this._tabTokens = null;
        this._tabBase = null;
        this._tabIndex = 0;
    }

    /**
     * Process Docker command
     * @param {string} command - Command to process
     * @param {HTMLElement} output - Output element
     */
    async processCommand(command, output) {
        // Normalize: collapse multiple spaces so "docker  compose" === "docker compose"
        const cmd = command.toLowerCase().trim().replace(/\s+/g, ' ');
        const args = cmd.split(' ');

        // Reset delay tracking before each new command
        this._currentDelayReject = null;

        if (cmd === 'help' || cmd === '?') {
            this.showHelp(output);
        } else if (cmd === 'docker') {
            this.addTerminalLine(output, 'Usage: docker [OPTIONS] COMMAND', 'info');
            this.addTerminalLine(output, '', 'blank');
            this.addTerminalLine(output, 'Common Commands:', 'info');
            this.addTerminalLine(output, '  ps          List containers', 'info');
            this.addTerminalLine(output, '  network     Manage networks', 'info');
            this.addTerminalLine(output, '  version     Show the Docker version information', 'info');
            this.addTerminalLine(output, '  compose     Docker Compose management', 'info');
            this.addTerminalLine(output, '', 'blank');
            this.addTerminalLine(output, 'Run \'docker COMMAND --help\' for more information on a command.', 'info');
        } else if (cmd === 'ls') {
            this.dockerLS(output);
        } else if (cmd.startsWith('vi ') || cmd === 'vi') {
            const fileName = args[1] || '';
            this.dockerVi(fileName, output);
        } else if (cmd === 'status' || cmd === 'check') {
            this.checkSystemStatus(output);
        } else if (cmd === 'docker compose -f docker-compose.yml up -d' ||
                   cmd === 'docker compose up -d') {
            await this.dockerComposeUp(output);
        } else if (cmd === 'docker compose -f docker-compose-gnb.yml up -d') {
            await this.dockerComposeGnbUp(output);
        } else if (cmd === 'docker compose -f docker-compose-ue.yml up -d') {
            await this.dockerComposeUeUp(output);
        } else if (cmd === 'docker compose -f docker-compose-ran.yml up -d oai-ue1') {
            await this.dockerComposeUe1Up(output);
        } else if (cmd === 'docker compose -f docker-compose-ran.yml up -d oai-ue2') {
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
                   cmd.startsWith('watch docker compose ps -a')) {
            this.startWatch(output);
        } else if (cmd === 'docker compose -f docker-compose.yml down' ||
                   cmd === 'docker compose down') {
            await this.dockerComposeDown(output);
        } else if (cmd.startsWith('docker compose -f docker-compose.yml up -d ') ||
                   cmd.startsWith('docker compose up -d ')) {
            const parts = command.split(' ').filter(Boolean);
            const serviceName = parts[parts.length - 1];
            await this.dockerComposeServiceUp(serviceName, output);
        } else if (cmd.startsWith('docker compose -f docker-compose.yml down ') ||
                   cmd.startsWith('docker compose down ')) {
            const parts = command.split(' ').filter(Boolean);
            const serviceName = parts[parts.length - 1];
            await this.dockerComposeServiceDown(serviceName, output);
        } else if (cmd === 'docker compose -f docker-compose-gnb.yml down') {
            await this.dockerComposeGnbDown(output);
        } else if (cmd === 'docker compose -f docker-compose-ue.yml down') {
            await this.dockerComposeUeDown(output);
        } else if (cmd.startsWith('docker start ')) {
            const serviceName = args.slice(2).join(' ');
            await this.dockerStart(serviceName, output);
        } else if (cmd.startsWith('docker stop ')) {
            const serviceName = args.slice(2).join(' ');
            await this.dockerStop(serviceName, output);
        } else if (cmd === 'cls' || cmd === 'clear') {
            output.innerHTML = '';
        } else if (cmd === 'exit') {
            const closeBtn = document.getElementById('docker-terminal-close');
            if (closeBtn) closeBtn.click();
        } else {
            this.addTerminalLine(output, `Command not found: ${command}`, 'error');
            this.addTerminalLine(output, 'Type "help" for available commands.', 'info');
        }

        // Command finished — clear delay tracking
        this._currentDelayReject = null;

        // No extra blank line - like real terminals
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
     * List files in the current directory (matches reference image)
     * @param {HTMLElement} output - Output element
     */
    dockerLS(output) {
        this.addTerminalLine(output, 'docker-compose.yml', 'info');
    }

    /**
     * Open a file in an embedded read-only viewer (vi)
     * @param {string} fileName - File to open
     * @param {HTMLElement} output - Output element
     */
    dockerVi(fileName, output) {
        if (!fileName || fileName !== 'docker-compose.yml') {
            this.addTerminalLine(output, `vi: ${fileName || 'no file'}: No such file or directory`, 'error');
            return;
        }

        const content = `services:
    mysql:
        container_name: "mysql"
        image: ghcr.io/openairinterface/mysql:8.0
        volumes:
            - ./database/oai_db.sql:/docker-entrypoint-initdb.d/oai_db.sql
            - ./healthscripts/mysql-healthcheck.sh:/tmp/mysql-healthcheck.sh
        environment:
            - TZ=Europe/Paris
            - MYSQL_DATABASE=oai_db
            - MYSQL_USER=test
            - MYSQL_PASSWORD=test
            - MYSQL_ROOT_PASSWORD=linux
        healthcheck:
            test: /bin/bash -c "/tmp/mysql-healthcheck.sh"
            interval: 10s
            timeout: 5s
            retries: 30
        networks:
            public_net:
                ipv4_address: 192.168.70.131

    oai-udr:
        container_name: "oai-udr"
        image: ghcr.io/openairinterface/oai-udr:develop
        expose:
            - 80/tcp
            - 8080/tcp
        volumes:
            - ./conf/config.yaml:/openair-udr/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - mysql
            - oai-nrf
        networks:
            public_net:
                ipv4_address: 192.168.70.136

    oai-udm:
        container_name: "oai-udm"
        image: ghcr.io/openairinterface/oai-udm:develop
        expose:
            - 80/tcp
            - 8080/tcp
        volumes:
            - ./conf/config.yaml:/openair-udm/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - oai-udr
        networks:
            public_net:
                ipv4_address: 192.168.70.137

    oai-ausf:
        container_name: "oai-ausf"
        image: ghcr.io/openairinterface/oai-ausf:develop
        expose:
            - 80/tcp
            - 8080/tcp
        volumes:
            - ./conf/config.yaml:/openair-ausf/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - oai-udm
        networks:
            public_net:
                ipv4_address: 192.168.70.138

    oai-nrf:
        container_name: "oai-nrf"
        image: ghcr.io/openairinterface/oai-nrf:develop
        expose:
            - 80/tcp
            - 8080/tcp
        volumes:
            - ./conf/config.yaml:/openair-nrf/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        networks:
            public_net:
                ipv4_address: 192.168.70.130

    oai-amf:
        container_name: "oai-amf"
        image: ghcr.io/openairinterface/oai-amf:develop
        expose:
            - 80/tcp
            - 8080/tcp
            - 38412/sctp
        volumes:
            - ./conf/config.yaml:/openair-amf/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - mysql
            - oai-nrf
            - oai-ausf
        networks:
            public_net:
                ipv4_address: 192.168.70.132

    oai-smf:
        container_name: "oai-smf"
        image: ghcr.io/openairinterface/oai-smf:develop
        expose:
            - 80/tcp
            - 8080/tcp
            - 8805/udp
        volumes:
            - ./conf/config.yaml:/openair-smf/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - oai-nrf
            - oai-amf
        networks:
            public_net:
                ipv4_address: 192.168.70.133

    oai-upf:
        container_name: "oai-upf"
        image: ghcr.io/openairinterface/oai-upf:develop
        expose:
            - 80/tcp
            - 2152/udp
            - 8805/udp
        volumes:
            - ./conf/config.yaml:/openair-upf/etc/config.yaml
        environment:
            - TZ=Europe/Paris
        depends_on:
            - oai-nrf
            - oai-smf
        cap_add:
            - NET_ADMIN
            - SYS_ADMIN
        cap_drop:
            - ALL
        privileged: true
        networks:
            public_net:
                ipv4_address: 192.168.70.134

    oai-traffic-server:
        privileged: true
        init: true
        container_name: oai-ext-dn
        image: ghcr.io/openairinterface/trf-gen-cn5g:latest
        environment:
            - UPF_FQDN=oai-upf
            - UE_NETWORK=10.0.0.0/24
            - USE_FQDN=yes
        healthcheck:
            test: /bin/bash -c "ip r | grep 12.1.1"
            interval: 10s
            timeout: 5s
            retries: 5
        networks:
            public_net:
                ipv4_address: 192.168.70.135

networks:
    public_net:
        driver: bridge
        name: oaiworkshop
        ipam:
            config:
                - subnet: 192.168.70.128/26
        driver_opts:
            com.docker.network.bridge.name: "oaiworkshop"`;

        this.enterViMode(fileName, content);
    }

    /**
     * Enter embedded vi mode inside terminal window
     * @param {string} fileName - File name
     * @param {string} content - File content
     */
    enterViMode(fileName, content) {
        const terminalContent = document.getElementById('docker-terminal-content');
        if (!terminalContent) return;

        // Save and hide current output/input
        const output = document.getElementById('docker-terminal-output');
        const inputLine = document.getElementById('docker-terminal-input-line');
        if (output) output.style.display = 'none';
        if (inputLine) inputLine.style.display = 'none';

        // Create vi container (covers the area)
        const viContainer = document.createElement('div');
        viContainer.id = 'vi-editor-container';
        viContainer.style.cssText = `
            position: absolute;
            top: 35px; /* Adjust for titlebar height */
            left: 0;
            right: 0;
            bottom: 0;
            background: #000;
            display: flex;
            flex-direction: column;
            z-index: 100;
        `;

        const editorBody = document.createElement('div');
        editorBody.style.cssText = `
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #d4d4d4;
        `;

        const lines = content.split('\n');
        let highlightedContent = '';
        lines.forEach((line, index) => {
            const lineNum = (index + 1).toString().padStart(2, ' ');
            // Simple syntax highlighting for YAML
            let formattedLine = line
                .replace(/^(\s*)([a-zA-Z0-9_-]+):/, '$1<span style="color:#9cdcfe">$2</span>:')
                .replace(/: "(.*)"$/, ': <span style="color:#ce9178">"$1"</span>')
                .replace(/: (.*)$/, (match, group) => {
                    if (group.includes('span')) return match;
                    return ': <span style="color:#b5cea8">' + group + '</span>';
                });
            
            highlightedContent += `<div style="display:flex; white-space: pre;"><span style="color:#858585; min-width: 30px; margin-right: 15px; user-select:none; text-align: right;">${lineNum}</span><span>${formattedLine}</span></div>`;
        });

        editorBody.innerHTML = highlightedContent;

        const statusBar = document.createElement('div');
        statusBar.style.cssText = `
            height: 25px;
            background: #264f78;
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px;
            font-size: 11px;
            font-family: sans-serif;
        `;
        statusBar.innerHTML = `<span>"${fileName}" [readonly]</span><span>Press 'q' or ':q' to close | j/k: line | f/b: page | G/gg: top/bottom</span>`;

        viContainer.appendChild(editorBody);
        viContainer.appendChild(statusBar);
        terminalContent.appendChild(viContainer);

        this.isInViMode = true;
        this.viCommandBuffer = '';
        this.viGBuffer = ''; // For 'gg' command

        // Custom key handler for vi mode - Full vi navigation
        this.viKeyHandler = (e) => {
            if (!this.isInViMode) return;

            // Prevent all keys from reaching terminal
            e.preventDefault();
            e.stopPropagation();

            const viBody = document.querySelector('#vi-editor-container > div:first-child');
            if (!viBody) return;

            // Handle 'g' for 'gg' (go to top)
            if (e.key.toLowerCase() === 'g') {
                if (this.viGBuffer === 'g') {
                    // Second 'g' - go to top
                    viBody.scrollTop = 0;
                    this.viGBuffer = '';
                } else {
                    // First 'g' - wait for second
                    this.viGBuffer = 'g';
                    setTimeout(() => { this.viGBuffer = ''; }, 1000); // Reset after 1 second
                }
                return;
            }

            // Handle 'G' (go to bottom)
            if (e.key === 'G') {
                viBody.scrollTop = viBody.scrollHeight;
                return;
            }

            // Handle 'j' (scroll down one line)
            if (e.key.toLowerCase() === 'j') {
                viBody.scrollTop += 20; // Approximate line height
                return;
            }

            // Handle 'k' (scroll up one line)
            if (e.key.toLowerCase() === 'k') {
                viBody.scrollTop -= 20; // Approximate line height
                return;
            }

            // Handle 'f' (scroll forward one page)
            if (e.key.toLowerCase() === 'f') {
                viBody.scrollTop += viBody.clientHeight;
                return;
            }

            // Handle 'b' (scroll backward one page)
            if (e.key.toLowerCase() === 'b') {
                viBody.scrollTop -= viBody.clientHeight;
                return;
            }

            // Handle Arrow keys for scrolling
            if (e.key === 'ArrowDown') {
                viBody.scrollTop += 20;
                return;
            }

            if (e.key === 'ArrowUp') {
                viBody.scrollTop -= 20;
                return;
            }

            if (e.key === 'PageDown') {
                viBody.scrollTop += viBody.clientHeight;
                return;
            }

            if (e.key === 'PageUp') {
                viBody.scrollTop -= viBody.clientHeight;
                return;
            }

            // Handle simple 'q' key to exit (like less/more pagers)
            if (e.key.toLowerCase() === 'q' && this.viCommandBuffer === '') {
                this.exitViMode();
                return;
            }

            // Handle ':' to start command mode
            if (e.key === ':') {
                this.viCommandBuffer = ':';
                return;
            }

            // If in command mode, handle command input
            if (this.viCommandBuffer === ':') {
                if (e.key === 'q' || e.key === 'Q') {
                    // :q or :Q command
                    this.exitViMode();
                    return;
                } else if (e.key === 'Escape') {
                    // Cancel command mode
                    this.viCommandBuffer = '';
                    return;
                }
            }

            // Handle Enter key in command mode
            if (e.key === 'Enter' && this.viCommandBuffer.startsWith(':')) {
                const cmd = this.viCommandBuffer.slice(1).toLowerCase();
                if (['q', 'q!', 'wq', 'quit', 'exit'].includes(cmd)) {
                    this.exitViMode();
                }
                this.viCommandBuffer = '';
                return;
            }

            // Handle Escape to exit or clear command buffer
            if (e.key === 'Escape') {
                if (this.viCommandBuffer) {
                    this.viCommandBuffer = '';
                } else {
                    this.exitViMode();
                }
                return;
            }
        };
        // Use capture phase to intercept BEFORE main terminal handler
        document.addEventListener('keydown', this.viKeyHandler, true);
    }

    /**
     * Exit vi mode and restore terminal
     */
    exitViMode() {
        const viContainer = document.getElementById('vi-editor-container');
        if (viContainer) viContainer.remove();

        const output = document.getElementById('docker-terminal-output');
        const inputLine = document.getElementById('docker-terminal-input-line');
        if (output) output.style.display = 'block';
        if (inputLine) inputLine.style.display = 'flex';
        
        this.isInViMode = false;
        document.removeEventListener('keydown', this.viKeyHandler, true);
        
        // Refocus main terminal input
        const input = document.getElementById('docker-terminal-input');
        if (input) input.focus();
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
            '    Start both UE containers (oai-ue1 and oai-ue2)',
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
            '  ls',
            '    List files in current directory',
            '',
            '  vi <file-name>',
            '    Open file in read-only viewer (e.g., vi docker-compose.yml)',
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

        // Always clear existing topology before deploying the full core
        this.addTerminalLine(output, 'Clearing existing topology...', 'info');
        window.dataStore.clearAll();
        if (window.logEngine) {
            window.logEngine.clearAllLogs();
        }
        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }

        // Load topology from hardcoded data (same as Deploy Core button)
        let allNFs = [];

        try {
            // Get topology from UIController's getCoreOneClickTopology method
            const topology = window.uiController?.getCoreOneClickTopology();
            
            if (!topology) {
                throw new Error('Topology data not available from UIController');
            }

            // Filter out gNB and UE from topology
            const filteredTopology = this.filterTopology(topology);

            // Import filtered topology into dataStore
            // Set creation timestamps for all NFs before import
            const importTime = Date.now();
            if (filteredTopology.nfs && Array.isArray(filteredTopology.nfs)) {
                filteredTopology.nfs.forEach(nf => {
                    nf.createdAt = importTime; // Set creation time
                });
            }

            window.dataStore.importData(filteredTopology);

            // Load icon images and trigger logs for NFs
            if (filteredTopology.nfs && Array.isArray(filteredTopology.nfs)) {
                for (const nf of filteredTopology.nfs) {
                    // Skip gNB and UE
                    if (nf.type === 'gNB' || nf.type === 'UE') continue;

                    // Load icon image
                    if (nf.icon && !nf.iconImage) {
                        const img = new Image();
                        img.onload = () => {
                            nf.iconImage = img;
                            if (window.canvasRenderer) {
                                window.canvasRenderer.render();
                            }
                        };
                        img.onerror = () => {
                            console.warn(`Failed to load icon for ${nf.name}: ${nf.icon}`);
                        };
                        img.src = nf.icon;
                    }

                    // Trigger log engine for this NF to generate startup logs
                    if (window.logEngine) {
                        // Get the NF from dataStore after import
                        const importedNF = window.dataStore.getNFById(nf.id);
                        if (importedNF) {
                            // Use 5g-logs.json patterns for log generation
                            window.logEngine.onNFAdded(importedNF);
                        }
                    }
                }
            }

            // Get updated list of NFs
            allNFs = window.dataStore.getAllNFs();

            // Re-render canvas to show imported topology
            if (window.canvasRenderer) {
                window.canvasRenderer.render();
            }
        } catch (error) {
            this.addTerminalLine(output, `❌ Failed to load topology: ${error.message}`, 'error');
            this.addTerminalLine(output, 'Falling back to default NF creation...', 'warning');
            this.addTerminalLine(output, '', 'blank');

            // Fallback to default NFs if topology file fails
            await this.createDefaultNFs(output);
            allNFs = window.dataStore.getAllNFs();
        }

        // Show Docker Compose style output
        this.addTerminalLine(output, `[+] Running ${allNFs.length + 1}/${allNFs.length + 1}`, 'info');

        // Create network
        this.addTerminalLine(output, ' ✔ Network oaiworkshop Created' + ' '.repeat(20) + '0.2s', 'success');
        this.oaiWorkshopNetworkExists = true;
        this.oaiWorkshopCreatedTime = Date.now();
        await this.delay(200);

        // Start each NF with Docker Compose format (skip gNB and UE)
        for (const nf of allNFs) {
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
                'NSSF': 'oai-nssf', 'MySQL': 'mysql', 'ext-dn': 'oai-ext-dn'
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

                    // Auto-connect to bus if available
                    this.autoConnectNFToBus(updatedNF);

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
            const position = window.nfManager.calculateAutoPosition('gNB', 1);
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
    }

    /**
     * Execute docker compose -f docker-compose-ue.yml up -d (start both UEs)
     * @param {HTMLElement} output - Output element
     */
    async dockerComposeUeUp(output) {
        this.addTerminalLine(output, 'WARN[0000] No services to build', 'warning');
        this.addTerminalLine(output, 'WARN[0000] Found orphan containers ([oai-upf oai-smf oai-amf oai-ausf oai-udm oai-udr mysql oai-nrf oai-ext-dn]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.', 'warning');
        this.addTerminalLine(output, '[+] up 2/2', 'info');

        const allNFs = window.dataStore?.getAllNFs() || [];
        const ueNames = ['oai-ue1', 'oai-ue2'];
        const createdUEs = [];
        const existingUENames = new Set();

        // Get all existing UEs and their names
        const existingUEs = allNFs.filter(nf => nf.type === 'UE');
        existingUEs.forEach(ue => {
            if (ue.name) {
                existingUENames.add(ue.name);
            }
        });

        // Create or find UE-1 and UE-2
        for (let i = 0; i < 2; i++) {
            const ueNumber = i + 1;
            const expectedName = `UE-${ueNumber}`;
            
            // Refresh allNFs to include newly created UEs
            const currentNFs = window.dataStore?.getAllNFs() || [];
            
            // Try to find existing UE with exact name
            let ue = currentNFs.find(nf => nf.type === 'UE' && nf.name === expectedName);

            // If not found, create a new one
            if (!ue && window.nfManager) {
                // Try to get position from topology data
                let position = null;
                try {
                    const topology = window.uiController?.getCoreOneClickTopology();
                    if (topology && topology.nfs && Array.isArray(topology.nfs)) {
                        const matchingUE = topology.nfs.find(n =>
                            n.type === 'UE' && (n.name === expectedName || n.name === `UE-${ueNumber}`)
                        );
                        if (matchingUE && matchingUE.position) {
                            position = matchingUE.position;
                        }
                    }
                } catch (error) {
                    console.warn('Could not load UE position from topology:', error);
                }

                // If no position from topology, calculate auto position
                if (!position) {
                    // Count existing UEs + already created UEs in this loop
                    const totalUECount = currentNFs.filter(nf => nf.type === 'UE').length + createdUEs.length + 1;
                    position = window.nfManager.calculateAutoPosition('UE', totalUECount);
                }

                ue = window.nfManager.createNetworkFunction('UE', position);
                
                if (ue) {
                    ue.name = expectedName;
                    ue.createdAt = Date.now();
                    ue.status = 'starting';
                    ue.statusTimestamp = Date.now();
                    window.dataStore.updateNF(ue.id, ue);
                    createdUEs.push(ue);
                    console.log(`✅ Created ${ue.name} at position (${position.x}, ${position.y})`);
                }
            } else if (ue) {
                // UE already exists, check if it's already in createdUEs
                const alreadyAdded = createdUEs.some(existing => existing.id === ue.id);
                if (!alreadyAdded) {
                    // UE already exists, just update status if needed
                    if (ue.status !== 'stable') {
                        ue.status = 'starting';
                        ue.statusTimestamp = Date.now();
                        window.dataStore.updateNF(ue.id, ue);
                    }
                    createdUEs.push(ue);
                    console.log(`ℹ️ Using existing ${ue.name}`);
                } else {
                    console.log(`⚠️ ${ue.name} already added to createdUEs, skipping`);
                }
            }

            // Show container creation message
            const randomDelay = (Math.random() * 0.2 + 0.1).toFixed(1);
            this.addTerminalLine(output, `✔ Container ${ueNames[i]} Created${' '.repeat(20)}${randomDelay}s`, 'success');
            await this.delay(parseFloat(randomDelay) * 1000);
        }

        // Ensure we have exactly 2 UEs
        if (createdUEs.length < 2) {
            this.addTerminalLine(output, `⚠️ Warning: Only ${createdUEs.length} UE(s) created, expected 2`, 'warning');
        }

        // Set UEs to stable after 5 seconds
        createdUEs.forEach((ue, index) => {
            setTimeout(() => {
                const updatedUe = window.dataStore?.getNFById(ue.id);
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
        });

        if (window.canvasRenderer) {
            window.canvasRenderer.render();
        }
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
            const position = window.nfManager.calculateAutoPosition('UE', 1);
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
            const position = window.nfManager.calculateAutoPosition('UE', 2);
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

        // Hide the input line and suggestion bar — no typing while watching
        const activeInput = document.getElementById('active-terminal-input');
        if (activeInput) activeInput.style.display = 'none';
        const sugBar = document.getElementById('tab-suggestions');
        if (sugBar) sugBar.style.display = 'none';

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

        // NOTE: Do NOT remove buses and bus connections
        // Buses should persist so that when NFs are restarted, they can reconnect
        // Only remove bus connections for the NFs that are being deleted
        if (window.dataStore) {
            const allBusConnections = window.dataStore.getAllBusConnections() || [];
            
            // Only remove bus connections for the NFs that are being deleted
            const nfIdsToRemove = new Set(nfIds.map(nf => nf.id));
            const busConnectionsToRemove = allBusConnections.filter(bc => 
                nfIdsToRemove.has(bc.nfId)
            );
            
            busConnectionsToRemove.forEach(busConn => {
                window.dataStore.removeBusConnection(busConn.id);
            });
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
            // Try to get position from topology data
            let position = null;
            try {
                const topology = window.uiController?.getCoreOneClickTopology();
                if (topology && topology.nfs && Array.isArray(topology.nfs)) {
                    const matchingNF = topology.nfs.find(n => n.type === nfType);
                    if (matchingNF && matchingNF.position) {
                        position = matchingNF.position;
                    }
                }
            } catch (error) {
                console.warn('Could not load position from topology:', error);
            }
            
            // If no position from topology, calculate auto position
            if (!position) {
                const allNFs = window.dataStore?.getAllNFs() || [];
                const sameTypeCount = allNFs.filter(n => n.type === nfType).length + 1;
                position = window.nfManager.calculateAutoPosition(nfType, sameTypeCount);
            }
            
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

                // Auto-connect to bus if available
                this.autoConnectNFToBus(updated);

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
                    if (nf.type === 'gNB' || nf.type === 'UE' || nf.type === 'MySQL' || nf.type === 'ext-dn') {
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
                            if (nf.type === 'gNB' || nf.type === 'UE' || nf.type === 'MySQL' || nf.type === 'ext-dn') {
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
            { type: 'AMF', ipAddress: '192.168.1.20', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'SMF', ipAddress: '192.168.1.30', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UPF', ipAddress: '192.168.1.40', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'AUSF', ipAddress: '192.168.1.50', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UDM', ipAddress: '192.168.1.60', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'UDR', ipAddress: '192.168.1.70', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'PCF', ipAddress: '192.168.1.80', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'NSSF', ipAddress: '192.168.1.90', port: 8080, httpProtocol: 'HTTP/2' },
            { type: 'MySQL', ipAddress: '192.168.1.100', port: 3306, httpProtocol: 'HTTP/2' }
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
        return new Promise((resolve) => {
            const t = setTimeout(resolve, ms);
            this._currentDelayReject = () => clearTimeout(t);
        });
    }

    /**
     * Setup window controls (simplified - no drag, resize, or window buttons)
     * @param {HTMLElement} terminalModal - Terminal modal element
     */
    setupWindowControls(terminalModal) {
        // Simplified - no dragging, resizing, or window control buttons
        // Terminal is now a fixed modal overlay
        const terminalWindow = document.getElementById('docker-terminal-window');
        if (terminalWindow) {
            // Center the terminal
            terminalWindow.style.position = 'fixed';
            terminalWindow.style.left = '50%';
            terminalWindow.style.top = '50%';
            terminalWindow.style.transform = 'translate(-50%, -50%)';
        }
    }

    /**
     * Apply saved terminal state (simplified - no state management)
     */
    applyTerminalState() {
        // Simplified - terminal is now a fixed centered modal
        // No state to restore
    }

    /**
     * Save terminal state to localStorage (simplified - no state to save)
     */
    saveTerminalState() {
        // Simplified - no state to save
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
                "Config": [{ "Subnet": "192.168.70.0/26" }]
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
     * Auto-connect NF to bus line if applicable
     * @param {Object} nf - Network Function
     */
    autoConnectNFToBus(nf) {
        // Don't auto-connect UPF, gNB, UE, MySQL, and ext-dn as per requirement
        const excludedTypes = ['UPF', 'gNB', 'UE', 'MySQL', 'ext-dn'];
        
        if (excludedTypes.includes(nf.type)) {
            console.log(`🚫 Skipping auto-connect for ${nf.type} (excluded type)`);
            return;
        }

        // Check if NF is already connected to a bus
        const allBusConnections = window.dataStore?.getAllBusConnections() || [];
        const existingConnection = allBusConnections.find(bc => bc.nfId === nf.id);
        
        if (existingConnection) {
            console.log(`ℹ️ ${nf.name} is already connected to bus`);
            return;
        }

        // Try to find bus connection from one-click.json first
        this.restoreBusConnectionFromTopology(nf).then(restored => {
            if (restored) {
                console.log(`✅ Restored bus connection for ${nf.name} from topology`);
                return;
            }

            // If not found in topology, auto-connect to first available bus
            const allBuses = window.dataStore?.getAllBuses() || [];
            
            if (allBuses.length === 0) {
                console.log('ℹ️ No bus lines available for auto-connect');
                return;
            }

            // Connect to the first available bus
            const targetBus = allBuses[0];

            if (window.busManager) {
                console.log(`🔗 Auto-connecting ${nf.name} to ${targetBus.name}`);
                const connection = window.busManager.connectNFToBus(nf.id, targetBus.id);

                if (connection) {
                    // Add log for auto-connection
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
        }).catch(error => {
            console.warn('Error in auto-connect:', error);
        });
    }

    /**
     * Restore bus connection from topology data
     * @param {Object} nf - Network Function
     * @returns {Promise<boolean>} True if connection was restored
     */
    async restoreBusConnectionFromTopology(nf) {
        try {
            const topology = window.uiController?.getCoreOneClickTopology();
            if (!topology) {
                return false;
            }
            
            if (!topology.busConnections || !Array.isArray(topology.busConnections)) {
                return false;
            }

            // Find bus connection for this NF type in topology
            // We match by NF type since IDs will be different
            const matchingBusConn = topology.busConnections.find(bc => {
                // Find the NF in topology that matches this type
                const topologyNF = topology.nfs?.find(n => n.id === bc.nfId);
                return topologyNF && topologyNF.type === nf.type;
            });

            if (!matchingBusConn) {
                return false;
            }

            // Find the bus in current dataStore
            const allBuses = window.dataStore?.getAllBuses() || [];
            const targetBus = allBuses.find(bus => {
                // Match by bus name or use first bus if name matches
                return bus.name === 'Service Bus' || allBuses.length === 1;
            }) || allBuses[0];

            if (!targetBus || !window.busManager) {
                return false;
            }

            // Check if already connected
            const allBusConnections = window.dataStore?.getAllBusConnections() || [];
            const existingConnection = allBusConnections.find(bc => bc.nfId === nf.id);
            
            if (existingConnection) {
                return true; // Already connected
            }

            // Restore the connection
            console.log(`🔄 Restoring bus connection for ${nf.name} to ${targetBus.name}`);
            const connection = window.busManager.connectNFToBus(nf.id, targetBus.id);

            if (connection) {
                if (window.logEngine) {
                    window.logEngine.addLog(nf.id, 'INFO',
                        `Restored connection to ${targetBus.name} service bus from topology`, {
                        busId: targetBus.id,
                        interfaceName: connection.interfaceName,
                        restored: true
                    });
                }
                return true;
            }

            return false;
        } catch (error) {
            console.warn('Could not restore bus connection from topology:', error);
            return false;
        }
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
}

// Initialize global instance
window.dockerTerminal = new DockerTerminal();
