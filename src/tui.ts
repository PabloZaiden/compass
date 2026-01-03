import {
    BoxRenderable,
    CliRenderer,
    InputRenderable,
    InputRenderableEvents,
    ScrollBoxRenderable,
    SelectRenderable,
    SelectRenderableEvents,
    TabSelectRenderable,
    TabSelectRenderableEvents,
    TextRenderable,
    createCliRenderer,
    type KeyEvent,
    type PasteEvent,
    type Renderable
} from "@opentui/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AgentTypes, defaultModels } from "./agents/factory";
import { defaultConfigValues } from "./config/default";
import type { Config } from "./config/config";
import { OutputMode } from "./models";
import { Runner } from "./runner";
import { LogLevel, escapeArg, logger, onLogEvent, setTuiLoggingEnabled, type TuiLogEvent } from "./utils";

const CONFIG_DIR = join(homedir(), ".compass");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const logColors: Record<LogLevel, string> = {
    [LogLevel.Silly]: "#8c8c8c",
    [LogLevel.Trace]: "#6dd6ff",
    [LogLevel.Debug]: "#7bdcb5",
    [LogLevel.Info]: "#d6dde6",
    [LogLevel.Warn]: "#f5c542",
    [LogLevel.Error]: "#f78888",
    [LogLevel.Fatal]: "#ff5c8d",
};

type Mode = "config" | "running" | "results" | "error";

type FormValues = {
    repoPath: string;
    fixture: string;
    agentType: AgentTypes;
    iterationCount: string;
    outputMode: OutputMode;
    useCache: boolean;
    stopOnError: boolean;
    allowFullAccess: boolean;
    logLevel: LogLevel;
    model: string;
    evalModel: string;
};

export async function launchTui(): Promise<void> {
    setTuiLoggingEnabled(true);
    const tui = new CompassTui();
    await tui.start();
}

class CompassTui {
    private renderer!: CliRenderer;
    private mode: Mode = "config";
    private formValues: FormValues;
    private formFields: { container: BoxRenderable; valueText?: TextRenderable; type?: "text" | "number" | "enum" | "boolean"; key?: keyof FormValues; options?: { name: string; value: unknown }[]; onEnter?: () => void }[] = [];
    private selectedFieldIndex = 0;
    private editingField = false;
    private logScroll?: ScrollBoxRenderable;
    private formScroll?: ScrollBoxRenderable;
    private resultScroll?: ScrollBoxRenderable;
    private logPanel?: BoxRenderable;
    private logPanelVisible = true;
    private logLines: Renderable[] = [];
    private statusText?: TextRenderable;
    private formPanel?: BoxRenderable;
    private resultPanel?: BoxRenderable;
    private editPanel?: BoxRenderable;
    private editInput?: InputRenderable;
    private editSelect?: SelectRenderable;
    private editToggle?: TabSelectRenderable;
    private editingFieldName = "";
    private editPanelLabel?: TextRenderable;
    private resultText?: TextRenderable;
    private runner = new Runner();
    private isRunning = false;
    private spinnerIndex = 0;
    private lastResultJson = "";
    private overlayBox?: BoxRenderable;
    private overlayText?: TextRenderable;
    private overlayVisible = false;
    private editOverlay?: BoxRenderable;
    private editInstruction?: TextRenderable;
    private logUnsubscribe?: () => void;

    constructor() {
        const defaults = defaultConfigValues();
        const initialAgent = AgentTypes.OpenCode;
        this.formValues = {
            repoPath: "",
            fixture: "",
            agentType: initialAgent,
            iterationCount: defaults.iterationCount.toString(),
            outputMode: defaults.outputMode,
            useCache: defaults.useCache,
            stopOnError: defaults.stopOnError,
            allowFullAccess: defaults.allowFullAccess,
            logLevel: defaults.logLevel,
            model: defaultModels[initialAgent],
            evalModel: defaultModels[initialAgent],
        };
        
        // Load saved config if it exists
        this.loadConfig();
    }
    
    private loadConfig(): void {
        try {
            if (existsSync(CONFIG_FILE)) {
                const content = readFileSync(CONFIG_FILE, "utf-8");
                const saved = JSON.parse(content);
                // Merge saved config with defaults
                this.formValues = { ...this.formValues, ...saved };
                logger.debug(`Loaded config from ${CONFIG_FILE}`);
            }
        } catch (e) {
            logger.warn(`Failed to load config: ${e}`);
        }
    }
    
    private saveConfig(): void {
        try {
            // Ensure config directory exists
            if (!existsSync(CONFIG_DIR)) {
                mkdirSync(CONFIG_DIR, { recursive: true });
            }
            
            // Save current form values
            writeFileSync(CONFIG_FILE, JSON.stringify(this.formValues, null, 2), "utf-8");
            logger.debug(`Saved config to ${CONFIG_FILE}`);
        } catch (e) {
            logger.warn(`Failed to save config: ${e}`);
        }
    }

    async start(): Promise<void> {
        this.renderer = await createCliRenderer({
            useAlternateScreen: true,
            useConsole: false,
            exitOnCtrlC: true,
            backgroundColor: "#0b0c10",
            consoleOptions: undefined,
            useMouse: true,
            enableMouseMovement: true,
            openConsoleOnError: false,
        });

        this.buildLayout();
        this.attachLogStream();
        this.registerKeyboardShortcuts();
        this.setupSelectionCopy();
        this.renderer.setFrameCallback(async () => this.tick());
        
        // Ensure console is disabled
        this.renderer.useConsole = false;
        
        this.renderer.start();
        
        // Test logs
        logger.info("TUI initialized successfully");
        logger.debug("Logs panel should be visible at the bottom");
        this.renderer.requestRender();
        this.selectField(0);
        logger.info("Compass TUI ready. Arrows move, Enter edits/runs, Esc exits edit, Ctrl+F flags, q to quit.");
    }

    private buildLayout(): void {
        const root = this.renderer.root;
        const column = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            width: "100%",
            height: "100%",
            gap: 1,
            padding: 1,
        });
        root.add(column);

        const header = new TextRenderable(this.renderer, {
            content: "Compass TUI — Ctrl+R run • Ctrl+F CLI flags • Ctrl+L toggle logs • q/Esc quit",
            fg: "#a8b3c1",
            wrapMode: "word",
            height: 2,
        });
        column.add(header);

        const mainRow = new BoxRenderable(this.renderer, {
            flexDirection: "row",
            flexGrow: 1,
            gap: 1,
        });
        column.add(mainRow);

        this.formPanel = this.buildFormPanel();
        mainRow.add(this.formPanel);

        this.resultPanel = this.buildResultPanel();
        this.resultPanel.visible = false;
        mainRow.add(this.resultPanel);

        this.editPanel = this.buildEditPanel();
        this.editPanel.visible = false;
        mainRow.add(this.editPanel);

        // Log panel at bottom
        this.logPanel = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            height: 12,
            border: true,
            padding: 1,
            title: "Logs (Ctrl+L to toggle)",
        });
        column.add(this.logPanel);

        this.logScroll = new ScrollBoxRenderable(this.renderer, {
            flexGrow: 1,
            scrollY: true,
            stickyScroll: true,
            stickyStart: "bottom",
            contentOptions: {
                flexDirection: "column",
                gap: 0,
            },
        });
        this.logScroll.selectable = true;
        this.logScroll.onMouseDown = () => {
            this.renderer.focusRenderable(this.logScroll!);
        };
        this.logPanel.add(this.logScroll);

        const statusBar = new BoxRenderable(this.renderer, {
            flexDirection: "row",
            padding: 1,
            border: true,
        });
        this.statusText = new TextRenderable(this.renderer, {
            content: "Fill config and press Enter or Ctrl+R to run.",
            fg: "#d6dde6",
            wrapMode: "word",
        });
        statusBar.add(this.statusText);
        column.add(statusBar);

        this.overlayBox = new BoxRenderable(this.renderer, {
            position: "absolute",
            top: 2,
            left: 4,
            width: "70%",
            height: "40%",
            padding: 1,
            border: true,
            visible: false,
            zIndex: 10,
            backgroundColor: "#0e1117",
            flexDirection: "column",
            gap: 1,
        });
        const overlayTitle = new TextRenderable(this.renderer, {
            content: "CLI flags (Ctrl+F or Esc to close)",
            fg: "#e5c07b",
        });
        this.overlayText = new TextRenderable(this.renderer, {
            content: "",
            wrapMode: "word",
            fg: "#d6dde6",
        });
        this.overlayBox.add(overlayTitle);
        this.overlayBox.add(this.overlayText);
        root.add(this.overlayBox);

        // Edit modal overlay
        this.editOverlay = new BoxRenderable(this.renderer, {
            position: "absolute",
            top: 4,
            left: 6,
            width: "60%",
            height: "30%",
            padding: 1,
            border: true,
            visible: false,
            zIndex: 12,
            backgroundColor: "#0e1117",
            flexDirection: "column",
            gap: 1,
        });
        this.editInstruction = new TextRenderable(this.renderer, {
            content: "",
            fg: "#e5c07b",
            wrapMode: "word",
        });
        this.editOverlay.add(this.editInstruction);
        root.add(this.editOverlay);
    }

    private buildEditPanel(): BoxRenderable {
        const panel = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            flexGrow: 1,
            border: true,
            padding: 1,
            gap: 2,
            title: "Edit Field",
        });

        // Label showing field name
        this.editPanelLabel = new TextRenderable(this.renderer, {
            content: "Field",
            fg: "#61afef",
            wrapMode: "word",
        });
        panel.add(this.editPanelLabel);

        // Container for the actual control
        const controlContainer = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            gap: 1,
        });

        // We'll add controls dynamically in openEditModal
        this.editInput = new InputRenderable(this.renderer, {
            value: "",
            width: "100%",
        });
        this.editSelect = new SelectRenderable(this.renderer, {
            options: [],
            width: "100%",
            height: 10,
            showDescription: false,
            wrapSelection: true,
            selectedBackgroundColor: "#61afef",
            selectedTextColor: "#1e2127",
        });
        this.editToggle = new TabSelectRenderable(this.renderer, {
            options: [
                { name: "False", description: "", value: false },
                { name: "True", description: "", value: true },
            ],
            width: "100%",
            showDescription: false,
            selectedBackgroundColor: "#61afef",
            selectedTextColor: "#1e2127",
        });

        this.editInput.visible = false;
        this.editSelect.visible = false;
        this.editToggle.visible = false;

        controlContainer.add(this.editInput);
        controlContainer.add(this.editSelect);
        controlContainer.add(this.editToggle);

        panel.add(controlContainer);

        // Instructions
        const instructions = new TextRenderable(this.renderer, {
            content: "Enter to save, Esc to cancel",
            fg: "#d6dde6",
            wrapMode: "word",
        });
        panel.add(instructions);

        return panel;
    }

    private buildFormPanel(): BoxRenderable {
        const panel = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            flexGrow: 1,
            border: true,
            padding: 0,
            gap: 0,
            title: "Configuration",
        });

        const scroll = new ScrollBoxRenderable(this.renderer, {
            flexGrow: 1,
            scrollY: true,
            stickyScroll: false,
            viewportCulling: true,
            contentOptions: {
                flexDirection: "column",
                gap: 1,
                padding: 1,
            },
        });
        scroll.selectable = true;
        this.formScroll = scroll;

        this.formFields = [];

        this.addField(scroll, "Agent", "enum", "agentType", this.agentOptions());
        this.addField(scroll, "Repository path", "text", "repoPath");
        this.addField(scroll, "Fixture file", "text", "fixture");
        this.addField(scroll, "Iterations", "number", "iterationCount");
        this.addField(scroll, "Output mode", "enum", "outputMode", this.outputModeOptions());
        this.addField(scroll, "Log level", "enum", "logLevel", this.logLevelOptions());
        this.addField(scroll, "Use cache", "boolean", "useCache");
        this.addField(scroll, "Stop on error", "boolean", "stopOnError");
        this.addField(scroll, "Allow full access", "boolean", "allowFullAccess");
        this.addField(scroll, "Model", "text", "model");
        this.addField(scroll, "Eval model", "text", "evalModel");

        this.addRunField(scroll, "Run", () => {
            void this.startRun();
        });

        panel.add(scroll);

        return panel;
    }

    private buildResultPanel(): BoxRenderable {
        const panel = new BoxRenderable(this.renderer, {
            flexDirection: "column",
            flexGrow: 1,
            border: true,
            padding: 1,
            gap: 1,
            title: "Results",
        });

        const scroll = new ScrollBoxRenderable(this.renderer, {
            flexGrow: 1,
            scrollY: true,
            stickyScroll: false,
            contentOptions: {
                flexDirection: "column",
                gap: 1,
            },
        });
        scroll.selectable = true;
        scroll.onMouseDown = () => {
            this.renderer.focusRenderable(scroll);
        };
        this.resultScroll = scroll;
        this.resultText = new TextRenderable(this.renderer, {
            content: "",
            wrapMode: "word",
            fg: "#d6dde6",
        });
        this.resultText.selectable = true;
        scroll.add(this.resultText);
        panel.add(scroll);

        const footer = new TextRenderable(this.renderer, {
            content: "Ctrl+R run again • Enter to edit config • q/Esc quit",
            fg: "#8aa2c2",
            wrapMode: "word",
        });
        panel.add(footer);

        return panel;
    }

    private addField(panel: BoxRenderable, label: string, type: "text" | "number" | "enum" | "boolean", key: keyof FormValues, options?: { name: string; value: unknown }[]): void {
        const wrapper = this.createFieldContainer();
        const labelNode = new TextRenderable(this.renderer, {
            content: label,
            fg: "#c0cad6",
        });
        wrapper.add(labelNode);
        
        const valueText = new TextRenderable(this.renderer, {
            content: this.getFieldValueDisplay(key, type, options),
            fg: "#98c379",
        });
        wrapper.add(valueText);
        
        panel.add(wrapper);
        this.formFields.push({ container: wrapper, valueText, type, key, options });
    }

    private addRunField(panel: BoxRenderable, label: string, onEnter: () => void): void {
        const wrapper = this.createFieldContainer();
        const labelNode = new TextRenderable(this.renderer, {
            content: label,
            fg: "#a0e8af",
        });
        wrapper.add(labelNode);
        panel.add(wrapper);
        this.formFields.push({ container: wrapper, onEnter });
    }

    private createFieldContainer(): BoxRenderable {
        return new BoxRenderable(this.renderer, {
            flexDirection: "column",
            gap: 0,
            padding: 1,
            border: true,
            borderColor: "#2c2f36",
        });
    }

    private agentOptions() {
        return Object.values(AgentTypes)
            .filter((value): value is AgentTypes => typeof value === "number")
            .map(value => ({
                name: AgentTypes[value],
                description: defaultModels[value],
                value,
            }));
    }

    private outputModeOptions() {
        return Object.values(OutputMode)
            .filter((value): value is OutputMode => typeof value === "number")
            .map(value => ({
                name: OutputMode[value],
                description: "",
                value,
            }));
    }

    private logLevelOptions() {
        return Object.values(LogLevel)
            .filter((value): value is LogLevel => typeof value === "number")
            .map(value => ({
                name: LogLevel[value],
                description: "",
                value,
            }));
    }

    private registerKeyboardShortcuts(): void {
        // Listen to renderer events for layout changes
        this.renderer.on("resize", () => {
            // Recalculate scroll when viewport resizes
            this.ensureFieldVisible(this.selectedFieldIndex);
        });
        
        this.renderer.keyInput.on("keypress", (key: KeyEvent) => {
            // Copy with Ctrl+Shift+C
            if (key.ctrl && key.shift && key.name === "c") {
                // Try to copy selected text using xclip/xsel or pbcopy on macOS
                void this.copyToClipboard();
                return;
            }
            
            // Always allow Ctrl+C to exit
            if (key.ctrl && key.name === "c") {
                this.shutdown();
                return;
            }
            
            // When editing a field, only handle Escape - let everything else pass through to the input
            if (this.editingField) {
                if (key.name === "escape") {
                    this.blurCurrentField();
                    return;
                }
                // Let the focused control handle all other keys
                return;
            }
            
            if (!this.overlayVisible && (key.name === "q" || key.name === "escape") && !this.isRunning) {
                this.shutdown();
                return;
            }
            if (key.ctrl && key.name === "r") {
                void this.startRun();
                return;
            }
            if (key.ctrl && key.name === "f") {
                void this.toggleCliFlags();
                return;
            }
            if (key.ctrl && key.name === "l") {
                this.toggleLogPanel();
                return;
            }
            if (this.overlayVisible && key.name === "escape") {
                this.hideOverlay();
                return;
            }
            if (this.mode === "config" && !this.overlayVisible) {
                if (key.name === "down" || key.name === "tab" || key.name === "j") {
                    this.moveSelection(1);
                    key.preventDefault?.();
                    return;
                }
                if (key.name === "up" || (key.shift && key.name === "tab") || key.name === "k") {
                    this.moveSelection(-1);
                    key.preventDefault?.();
                    return;
                }
                if (key.name === "return" || key.name === "enter") {
                    this.activateCurrentField();
                    key.preventDefault?.();
                    return;
                }
            }
            if ((this.mode === "results" || this.mode === "error") && !this.overlayVisible) {
                if (key.name === "return") {
                    this.showConfig();
                    return;
                }
            }
        });
        
        // Handle paste events for input fields
        this.renderer.keyInput.on("paste", (event: PasteEvent) => {
            if (this.editingField && this.editInput && this.editInput.visible) {
                // Insert pasted text into the input
                const currentValue = this.editInput.value;
                this.editInput.value = currentValue + event.text;
                event.preventDefault();
            }
        });
    }

    private selectField(index: number): void {
        if (!this.formFields.length) return;
        const normalized = (index + this.formFields.length) % this.formFields.length;
        this.selectedFieldIndex = normalized;
        this.updateSelectionStyles();
    }

    private moveSelection(delta: number): void {
        this.selectField(this.selectedFieldIndex + delta);
    }

    private updateFormFieldValues(): void {
        this.formFields.forEach(field => {
            if (field.valueText && field.key && field.type) {
                field.valueText.content = this.getFieldValueDisplay(field.key, field.type, field.options);
            }
        });
    }

    private updateSelectionStyles(): void {
        this.formFields.forEach((field, idx) => {
            const isSelected = idx === this.selectedFieldIndex;
            field.container.border = isSelected;
            field.container.borderColor = isSelected ? "#5da9e9" : "#2c2f36";
        });
        
        // Ensure selected field is visible by scrolling if needed
        this.ensureFieldVisible(this.selectedFieldIndex);
        this.renderer.requestRender();
    }

    private ensureFieldVisible(fieldIndex: number): void {
        if (!this.formScroll || !this.formFields[fieldIndex]) return;
        
        try {
            const currentScrollTop = this.formScroll.scrollTop;
            const viewportHeight = this.formScroll.height - 2; // BorderBox takes 2 lines
            
            // Scroll content has padding: 1 at the top
            let fieldOffsetY = 1; // Initial padding of scroll content
            
            // Sum up heights of all previous fields
            // Each field: border(1) + padding-top(1) + label(1) + value(1) + padding-bottom(1) + border(1) + gap(1) = 7 lines
            for (let i = 0; i < fieldIndex; i++) {
                fieldOffsetY += 7; // 7 lines per field (includes gap)
            }
            
            const fieldHeight = 7; // Height of current field
            const fieldTop = fieldOffsetY;
            const fieldBottom = fieldOffsetY + fieldHeight;
            
            // Scroll to make field visible with small margin
            if (fieldTop < currentScrollTop) {
                this.formScroll.scrollTop = Math.max(0, fieldTop - 1);
            } else if (fieldBottom > currentScrollTop + viewportHeight) {
                this.formScroll.scrollTop = Math.max(0, fieldBottom - viewportHeight + 1);
            }
        } catch (e) {
            // Silently ignore measurement errors
        }
    }

    private activateCurrentField(): void {
        const current = this.formFields[this.selectedFieldIndex];
        if (!current) return;
        if (current.onEnter) {
            current.onEnter();
            return;
        }
        if (!current.type || !current.key) return;
        this.openEditModal({
            type: current.type,
            key: current.key,
            options: current.options,
            container: current.container,
        });
    }

    private blurCurrentField(): void {
        this.closeEditModal();
        this.editingField = false;
        this.updateSelectionStyles();
        this.updateStatus("Use arrows to move, Enter to edit/run");
    }

    private openEditModal(field: { type: "text" | "number" | "enum" | "boolean"; key: keyof FormValues; options?: { name: string; value: unknown }[]; container: BoxRenderable }): void {
        if (!this.editPanel || !this.editPanelLabel) return;
        
        this.editingField = true;
        this.editingFieldName = this.getFieldDisplayName(field.key);
        this.editPanelLabel.content = "Edit: " + this.editingFieldName;

        // Hide form, show edit panel
        if (this.formPanel) this.formPanel.visible = false;
        this.editPanel.visible = true;

        // Hide all controls
        if (this.editInput) this.editInput.visible = false;
        if (this.editSelect) this.editSelect.visible = false;
        if (this.editToggle) this.editToggle.visible = false;

        this.updateStatus("Editing: " + this.editingFieldName + ". Enter to save, Esc to cancel");

        switch (field.type) {
            case "text": {
                if (!this.editInput) return;
                this.editInput.value = (this.formValues[field.key] as string) || "";
                this.editInput.removeAllListeners("change");
                this.editInput.removeAllListeners(InputRenderableEvents.ENTER);
                
                this.editInput.on("change", (_text: string) => {
                    // Allow typing
                });
                this.editInput.on(InputRenderableEvents.ENTER, () => {
                    (this.formValues as any)[field.key] = this.editInput!.value.trim();
                    this.closeEditModal();
                });
                this.editInput.visible = true;
                this.renderer.requestRender();
                // Delay focus to ensure renderer is ready
                setTimeout(() => {
                    this.editInput?.focus();
                    this.renderer.focusRenderable(this.editInput as Renderable);
                }, 10);
                break;
            }
            case "number": {
                if (!this.editInput) return;
                this.editInput.value = (this.formValues[field.key] as string) || "";
                this.editInput.removeAllListeners("change");
                this.editInput.removeAllListeners(InputRenderableEvents.ENTER);
                
                this.editInput.on("change", (text: string) => {
                    this.editInput!.value = text.replace(/[^0-9]/g, "");
                });
                this.editInput.on(InputRenderableEvents.ENTER, () => {
                    (this.formValues as any)[field.key] = this.editInput!.value.replace(/[^0-9]/g, "");
                    this.closeEditModal();
                });
                this.editInput.visible = true;
                this.renderer.requestRender();
                setTimeout(() => {
                    this.editInput?.focus();
                    this.renderer.focusRenderable(this.editInput as Renderable);
                }, 10);
                break;
            }
            case "enum": {
                if (!this.editSelect) return;
                const options = field.options ?? [];
                this.editSelect.removeAllListeners(SelectRenderableEvents.ITEM_SELECTED);
                
                this.editSelect.options = options.map(o => ({ name: o.name, description: "", value: o.value }));
                
                const currentIndex = Math.max(options.findIndex(o => o.value === (this.formValues as any)[field.key]), 0);
                this.editSelect.setSelectedIndex(currentIndex);
                
                this.editSelect.on(SelectRenderableEvents.ITEM_SELECTED, () => {
                    const selected = this.editSelect!.getSelectedOption();
                    if (!selected) return;
                    (this.formValues as any)[field.key] = selected.value;
                    
                    // If agent was changed, update default models
                    if (field.key === "agentType") {
                        const newAgent = selected.value as AgentTypes;
                        this.formValues.model = defaultModels[newAgent];
                        this.formValues.evalModel = defaultModels[newAgent];
                        this.updateFormFieldValues();
                    }
                    
                    this.closeEditModal();
                });
                
                this.editSelect.visible = true;
                this.renderer.requestRender();
                setTimeout(() => {
                    this.editSelect?.focus();
                    this.renderer.focusRenderable(this.editSelect as Renderable);
                }, 10);
                break;
            }
            case "boolean": {
                if (!this.editToggle) return;
                this.editToggle.removeAllListeners(TabSelectRenderableEvents.ITEM_SELECTED);
                
                this.editToggle.setSelectedIndex((this.formValues as any)[field.key] ? 0 : 1);
                
                this.editToggle.on(TabSelectRenderableEvents.ITEM_SELECTED, () => {
                    const selected = this.editToggle!.getSelectedOption();
                    if (!selected) return;
                    (this.formValues as any)[field.key] = Boolean(selected.value);
                    this.closeEditModal();
                });
                
                this.editToggle.visible = true;
                this.renderer.requestRender();
                setTimeout(() => {
                    this.editToggle?.focus();
                    this.renderer.focusRenderable(this.editToggle as Renderable);
                }, 10);
                break;
            }
        }
        this.renderer.requestRender();
    }

    private closeEditModal(): void {
        // Show form, hide edit panel
        if (this.formPanel) this.formPanel.visible = true;
        if (this.editPanel) this.editPanel.visible = false;
        
        this.editingField = false;
        this.editingFieldName = "";
        this.updateFormFieldValues();
        this.updateSelectionStyles();
        this.updateStatus("Use arrows to move, Enter to edit/run");
        this.renderer.requestRender();
        
        // Save config after any edit
        this.saveConfig();
    }

    private getFieldValueDisplay(key: keyof FormValues, type: string, options?: { name: string; value: unknown }[]): string {
        const value = this.formValues[key];
        
        if (type === "enum" && options) {
            const option = options.find(o => o.value === value);
            return option ? option.name : String(value);
        }
        
        if (type === "boolean") {
            return value ? "Yes" : "No";
        }
        
        return String(value || "");
    }

    private getFieldDisplayName(key: keyof FormValues): string {
        const names: Record<keyof FormValues, string> = {
            repoPath: "Repository Path",
            fixture: "Fixture",
            agentType: "Agent Type",
            iterationCount: "Iteration Count",
            outputMode: "Output Mode",
            useCache: "Use Cache",
            stopOnError: "Stop On Error",
            allowFullAccess: "Allow Full Access",
            logLevel: "Log Level",
            model: "Model",
            evalModel: "Eval Model",
        };
        return names[key] || key;
    }

    private attachLogStream(): void {
        this.logUnsubscribe = onLogEvent((event: TuiLogEvent) => {
            this.appendLog(event);
        });
    }

    private appendLog(event: TuiLogEvent): void {
        if (!this.logScroll) return;
        const clean = stripAnsi(event.message);
        const prefix = `[${LogLevel[event.level]}] `;
        const line = new TextRenderable(this.renderer, {
            content: prefix + clean,
            fg: logColors[event.level] ?? "#d6dde6",
            wrapMode: "word",
            width: "100%",
        });
        this.logLines.push(line);
        if (this.logLines.length > 400) {
            const first = this.logLines.shift();
            if (first) {
                this.logScroll.content.remove(first.id);
            }
        }
        this.logScroll.content.add(line);
        this.logScroll.requestRender();
    }

    private async startRun(): Promise<void> {
        if (this.isRunning) return;
        try {
            const config = await this.buildConfig();
            logger.settings.minLevel = config.logLevel;
            this.mode = "running";
            this.isRunning = true;
            this.updateStatus("Running benchmarks…");
            this.formPanel!.visible = false;
            this.resultPanel!.visible = false;
            const result = await this.runner.run(config);
            this.lastResultJson = JSON.stringify(result, null, 2);
            this.showResult(this.lastResultJson, false);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.showResult(message, true);
        } finally {
            this.isRunning = false;
        }
    }

    private async buildConfig(validatePaths = true): Promise<Config> {
        const repoPath = this.formValues.repoPath.trim();
        if (!repoPath) {
            throw new Error("Repository path is required.");
        }
        if (validatePaths && !existsSync(repoPath)) {
            throw new Error(`Repository path does not exist: ${repoPath}`);
        }

        const fixture = this.formValues.fixture.trim();
        if (!fixture) {
            throw new Error("Fixture file is required.");
        }
        if (validatePaths && !await Bun.file(fixture).exists()) {
            throw new Error(`Fixture file does not exist: ${fixture}`);
        }

        const iterations = parseInt(this.formValues.iterationCount, 10);
        if (Number.isNaN(iterations) || iterations <= 0) {
            throw new Error("Iterations must be a positive integer.");
        }

        const model = this.formValues.model.trim() || defaultModels[this.formValues.agentType];
        const evalModel = this.formValues.evalModel.trim() || defaultModels[this.formValues.agentType];

        return {
            repoPath,
            fixture,
            iterationCount: iterations,
            outputMode: this.formValues.outputMode,
            useCache: this.formValues.useCache,
            stopOnError: this.formValues.stopOnError,
            allowFullAccess: this.formValues.allowFullAccess,
            logLevel: this.formValues.logLevel,
            model,
            evalModel,
            agentType: this.formValues.agentType,
        };
    }

    private showResult(content: string, isError: boolean): void {
        this.mode = isError ? "error" : "results";
        if (this.resultPanel) this.resultPanel.visible = true;
        if (this.formPanel) this.formPanel.visible = false;
        if (this.resultText) {
            this.resultText.fg = isError ? "#f78888" : "#d6dde6";
            this.resultText.content = content;
        }
        if (this.resultScroll) {
            this.renderer.focusRenderable(this.resultScroll);
        }
        this.updateStatus(isError ? "Run failed. Press Enter to change config." : "Run complete. Press Ctrl+R to run again or Enter to change config.");
        this.renderer.requestRender();
    }

    private showConfig(): void {
        this.mode = "config";
        if (this.formPanel) this.formPanel.visible = true;
        if (this.resultPanel) this.resultPanel.visible = false;
        this.updateStatus("Edit configuration, then Enter or Ctrl+R to run.");
        this.editingField = false;
        this.updateSelectionStyles();
        this.renderer.requestRender();
    }

    private async toggleCliFlags(): Promise<void> {
        if (this.overlayVisible) {
            this.hideOverlay();
            return;
        }

        try {
            const config = await this.buildConfig(false);
            const command = this.buildCliFlags(config);
            if (this.overlayText) {
                this.overlayText.content = command;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (this.overlayText) {
                this.overlayText.content = `Cannot generate flags: ${message}`;
            }
        }
        if (this.overlayBox) {
            this.overlayBox.visible = true;
        }
        this.overlayVisible = true;
        this.renderer.requestRender();
    }

    private hideOverlay(): void {
        if (this.overlayBox) {
            this.overlayBox.visible = false;
        }
        this.overlayVisible = false;
        this.renderer.requestRender();
    }

    private buildCliFlags(config: Config): string {
        const args = [
            "bun",
            "src/index.ts",
            "--repo", escapeArg(config.repoPath),
            "--fixture", escapeArg(config.fixture),
            "--agent", AgentTypes[config.agentType],
            "--iterations", config.iterationCount.toString(),
            "--output-mode", OutputMode[config.outputMode],
            "--log-level", LogLevel[config.logLevel],
            "--use-cache", String(config.useCache),
            "--stop-on-error", String(config.stopOnError),
            "--allow-full-access", String(config.allowFullAccess),
            "--model", escapeArg(config.model),
            "--eval-model", escapeArg(config.evalModel),
        ];
        return args.join(" ");
    }

    private tick(): void {
        if (this.isRunning && this.statusText) {
            this.spinnerIndex = (this.spinnerIndex + 1) % spinnerFrames.length;
            const spinner = spinnerFrames[this.spinnerIndex];
            this.statusText.content = `${spinner} Running…`; 
        }
    }

    private toggleLogPanel(): void {
        if (!this.logPanel) return;
        this.logPanelVisible = !this.logPanelVisible;
        this.logPanel.visible = this.logPanelVisible;
        
        // Recalculate scroll after layout changes
        setTimeout(() => {
            this.ensureFieldVisible(this.selectedFieldIndex);
        }, 10);
        
        this.renderer.requestRender();
    }

    private updateStatus(message: string): void {
        if (!this.statusText) return;
        this.statusText.content = message;
        this.renderer.requestRender();
    }

    private setupSelectionCopy(): void {
        // Poll for selection changes every 100ms
        let lastSelectionText = "";
        let wasSelecting = false;
        
        const checkSelection = () => {
            try {
                const selection = this.renderer.getSelection();
                const isSelecting = selection?.isActive ?? false;
                
                // When selection ends (was selecting, now not)
                if (wasSelecting && !isSelecting && lastSelectionText) {
                    this.updateStatus(`✓ Copied ${lastSelectionText.length} chars`);
                    setTimeout(() => {
                        if (this.mode === "config") {
                            this.updateStatus("Use arrows to move, Enter to edit/run");
                        }
                    }, 1500);
                    lastSelectionText = "";
                }
                
                // While actively selecting
                if (isSelecting && selection) {
                    const selectedText = selection.getSelectedText();
                    if (selectedText && selectedText !== lastSelectionText && selectedText.length > 0) {
                        this.copyTextToClipboard(selectedText);
                        lastSelectionText = selectedText;
                    }
                }
                
                wasSelecting = isSelecting;
            } catch (e) {
                // Ignore errors
            }
        };
        
        // Poll every 100ms
        setInterval(checkSelection, 100);
    }

    private copyTextToClipboard(text: string): void {
        try {
            // Use OSC 52 escape sequence to copy to system clipboard
            const base64Text = Buffer.from(text).toString("base64");
            const oscSequence = `\x1b]52;c;${base64Text}\x07`;
            const renderer = this.renderer as any;
            const originalWrite = renderer.realStdoutWrite || renderer.stdout?.write || process.stdout.write.bind(process.stdout);
            originalWrite(oscSequence);
        } catch (e) {
            // Silently ignore if clipboard operation fails
        }
    }

    private async copyToClipboard(): Promise<void> {
        try {
            const selection = this.renderer.getSelection();
            if (selection && selection.isActive) {
                const selectedText = selection.getSelectedText();
                if (selectedText) {
                    this.copyTextToClipboard(selectedText);
                    this.updateStatus("Copied to clipboard!");
                    setTimeout(() => {
                        this.updateStatus("Use arrows to move, Enter to edit/run");
                    }, 1500);
                    return;
                }
            }
            
            // No selection
            this.updateStatus("Copy with Shift+Mouse drag or use your terminal's copy feature");
            setTimeout(() => {
                this.updateStatus("Use arrows to move, Enter to edit/run");
            }, 2000);
        } catch (e) {
            // Silently ignore
        }
    }

    private shutdown(): void {
        this.logUnsubscribe?.();
        setTuiLoggingEnabled(false);
        this.renderer.destroy();
        process.exit(0);
    }
}

function stripAnsi(value: string): string {
    return value.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
}
