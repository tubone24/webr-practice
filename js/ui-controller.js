/**
 * UIコントローラー - ユーザーインターフェースの制御
 * @module ui-controller
 */

import { getExampleCode, getAllExamples } from './examples.js';

/**
 * UIコントローラークラス
 * @implements {WebRPlayground.IUIController}
 */
export class UIController {
    constructor() {
        /** @type {WebRPlayground.UIElements} */
        this.elements = this.initializeElements();
        
        /** @type {WebRPlayground.IWebRService|null} */
        this.webRService = null;
        
        /** @type {Object.<string, Function>} */
        this.shortcuts = {};
        
        /** @type {boolean} */
        this.isRunning = false;
    }

    /**
     * UI要素の初期化
     * @private
     * @returns {WebRPlayground.UIElements}
     */
    initializeElements() {
        return {
            statusDiv: document.getElementById('status'),
            outputDiv: document.getElementById('console-output'),
            plotCanvas: document.getElementById('plot-canvas'),
            plotArea: document.getElementById('plot-area'),
            runBtn: document.getElementById('run-btn'),
            clearOutputBtn: document.getElementById('clear-output-btn'),
            clearInputBtn: document.getElementById('clear-input-btn'),
            codeInput: document.getElementById('code-input'),
            exampleButtons: document.getElementById('example-buttons')
        };
    }

    /**
     * UIコントローラーの初期化
     * @param {WebRPlayground.IWebRService} webRService - WebRサービス
     */
    initialize(webRService) {
        this.webRService = webRService;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // サンプルボタンの生成
        this.createExampleButtons();
        
        // キーボードショートカットの設定
        this.setupKeyboardShortcuts();
        
        // 初期メッセージの表示
        this.setInitialState();
    }

    /**
     * イベントリスナーの設定
     * @private
     */
    setupEventListeners() {
        // 実行ボタン
        this.elements.runBtn.addEventListener('click', () => this.runCode());
        
        // クリアボタン
        this.elements.clearOutputBtn.addEventListener('click', () => this.clearOutput());
        this.elements.clearInputBtn.addEventListener('click', () => this.clearInput());
        
        // コード入力エリアのタブキー処理
        this.elements.codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertTab();
            }
        });
    }

    /**
     * キーボードショートカットの設定
     * @private
     */
    setupKeyboardShortcuts() {
        // Ctrl+Enter で実行
        this.registerShortcut('Enter', true, false, false, () => this.runCode());
        
        // Ctrl+L で出力クリア
        this.registerShortcut('l', true, false, false, () => this.clearOutput());
        
        // Ctrl+K で入力クリア
        this.registerShortcut('k', true, false, false, () => this.clearInput());
        
        // Ctrl+S でコード保存（ブラウザのデフォルト動作を防ぐ）
        this.registerShortcut('s', true, false, false, (e) => {
            e.preventDefault();
            this.saveCode();
        });
        
        // グローバルキーボードイベントハンドラ
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));
    }

    /**
     * キーボードショートカットの登録
     * @private
     * @param {string} key - キー
     * @param {boolean} ctrl - Ctrlキー
     * @param {boolean} shift - Shiftキー
     * @param {boolean} alt - Altキー
     * @param {Function} action - アクション
     */
    registerShortcut(key, ctrl, shift, alt, action) {
        const shortcutKey = this.getShortcutKey(key, ctrl, shift, alt);
        this.shortcuts[shortcutKey] = action;
    }

    /**
     * ショートカットキーの生成
     * @private
     * @param {string} key - キー
     * @param {boolean} ctrl - Ctrlキー
     * @param {boolean} shift - Shiftキー
     * @param {boolean} alt - Altキー
     * @returns {string}
     */
    getShortcutKey(key, ctrl, shift, alt) {
        const parts = [];
        if (ctrl) parts.push('ctrl');
        if (shift) parts.push('shift');
        if (alt) parts.push('alt');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }

    /**
     * キーボードショートカットのハンドリング
     * @private
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyboardShortcut(event) {
        const key = this.getShortcutKey(
            event.key,
            event.ctrlKey || event.metaKey,
            event.shiftKey,
            event.altKey
        );
        
        if (this.shortcuts[key]) {
            this.shortcuts[key](event);
        }
    }

    /**
     * サンプルボタンの作成
     * @private
     */
    createExampleButtons() {
        const examples = getAllExamples();
        
        this.elements.exampleButtons.innerHTML = '';
        
        examples.forEach(example => {
            const button = document.createElement('button');
            button.className = 'example-btn';
            button.textContent = example.label;
            button.title = example.description || '';
            button.addEventListener('click', () => this.loadExample(example.id));
            
            this.elements.exampleButtons.appendChild(button);
        });
    }

    /**
     * 初期状態の設定
     * @private
     */
    setInitialState() {
        // デフォルトのサンプルコードを設定（元のHTMLと同じ）
        this.elements.codeInput.value = `# 基本的な例
x <- 1:10
y <- x^2
summary(y)`;
    }

    /**
     * コードの実行
     * @async
     */
    async runCode() {
        if (!this.webRService || !this.webRService.isReady()) {
            this.showError('WebRが初期化されていません');
            return;
        }
        
        if (this.isRunning) {
            this.showWarning('コードは既に実行中です');
            return;
        }
        
        const code = this.elements.codeInput.value.trim();
        
        if (!code) {
            this.showWarning('コードを入力してください');
            return;
        }
        
        this.setRunning(true);
        
        try {
            // 実行開始メッセージ
            this.appendOutput('実行中...\n\n', true);
            
            // コードの実行
            const result = await this.webRService.executeCode(code);
            
            // 結果の表示
            this.displayOutput(result);
            
        } catch (error) {
            console.error('実行エラー:', error);
            this.showError(`実行エラー: ${error.message}`);
        } finally {
            this.setRunning(false);
        }
    }

    /**
     * 実行結果の表示
     * @param {WebRPlayground.ExecutionResult} result - 実行結果
     */
    displayOutput(result) {
        let output = '';
        
        // 実行時間の表示
        if (result.executionTime) {
            output += `実行時間: ${result.executionTime}ms\n\n`;
        }
        
        // 実行されたコードの表示
        const code = this.elements.codeInput.value.trim();
        output += '実行されたコード:\n';
        output += this.formatCode(code) + '\n\n';
        
        // 結果の表示
        output += '結果:\n';
        
        if (result.success) {
            if (result.output && result.output.trim()) {
                output += result.output;
            } else {
                output += '(出力なし)';
            }
            
            // プロットの表示
            if (result.images && result.images.length > 0) {
                this.displayPlot(result.images[result.images.length - 1]);
                output += '\n\n[プロットが生成されました]';
            } else {
                this.hidePlot();
            }
        } else {
            output += `エラー: ${result.error || '不明なエラー'}`;
            this.hidePlot();
        }
        
        this.elements.outputDiv.textContent = output;
        
        // 出力を最下部までスクロール
        this.elements.outputDiv.scrollTop = this.elements.outputDiv.scrollHeight;
    }

    /**
     * コードのフォーマット
     * @private
     * @param {string} code - コード
     * @returns {string}
     */
    formatCode(code) {
        // コードを行番号付きで表示
        const lines = code.split('\n');
        return lines.map((line, i) => `  ${(i + 1).toString().padStart(3, ' ')}: ${line}`).join('\n');
    }

    /**
     * プロットの表示
     * @private
     * @param {HTMLImageElement} image - 画像要素
     */
    displayPlot(image) {
        const ctx = this.elements.plotCanvas.getContext('2d');
        
        // キャンバスのサイズを画像に合わせる
        this.elements.plotCanvas.width = image.width;
        this.elements.plotCanvas.height = image.height;
        
        // 画像を描画
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.drawImage(image, 0, 0);
        
        // プロットエリアを表示
        this.elements.plotArea.style.display = 'block';
        
        // アニメーション
        this.elements.plotArea.classList.add('fade-in');
    }

    /**
     * プロットを非表示
     * @private
     */
    hidePlot() {
        this.elements.plotArea.style.display = 'none';
    }

    /**
     * 出力にテキストを追加
     * @private
     * @param {string} text - テキスト
     * @param {boolean} clear - クリアするか
     */
    appendOutput(text, clear = false) {
        if (clear) {
            this.elements.outputDiv.textContent = text;
        } else {
            this.elements.outputDiv.textContent += text;
        }
        
        // 最下部までスクロール
        this.elements.outputDiv.scrollTop = this.elements.outputDiv.scrollHeight;
    }

    /**
     * 出力をクリア
     */
    clearOutput() {
        this.elements.outputDiv.textContent = '';
        this.hidePlot();
        this.showInfo('出力をクリアしました');
    }

    /**
     * 入力をクリア
     */
    clearInput() {
        this.elements.codeInput.value = '';
        this.elements.codeInput.focus();
        this.showInfo('入力をクリアしました');
    }

    /**
     * サンプルコードをロード
     * @param {string} exampleId - サンプルID
     */
    loadExample(exampleId) {
        const code = getExampleCode(exampleId);
        if (code) {
            this.elements.codeInput.value = code;
            this.elements.codeInput.focus();
            
            // コードの最初にカーソルを移動
            this.elements.codeInput.setSelectionRange(0, 0);
            this.elements.codeInput.scrollTop = 0;
            
            this.showInfo(`サンプル「${exampleId}」をロードしました`);
        }
    }

    /**
     * ステータスの更新
     * @param {string} message - メッセージ
     * @param {'info'|'success'|'error'} type - タイプ
     */
    updateStatus(message, type = 'info') {
        this.elements.statusDiv.textContent = message;
        
        // クラスの更新
        this.elements.statusDiv.className = 'status-indicator';
        
        if (type === 'success') {
            this.elements.statusDiv.classList.add('ready');
        } else if (type === 'error') {
            this.elements.statusDiv.classList.add('error');
        }
    }

    /**
     * 実行状態の設定
     * @param {boolean} isRunning - 実行中かどうか
     */
    setRunning(isRunning) {
        this.isRunning = isRunning;
        
        if (isRunning) {
            this.elements.runBtn.disabled = true;
            this.elements.runBtn.textContent = '実行中...';
            this.elements.runBtn.classList.add('loading');
        } else {
            this.elements.runBtn.disabled = false;
            this.elements.runBtn.textContent = '実行 (Ctrl+Enter)';
            this.elements.runBtn.classList.remove('loading');
        }
    }

    /**
     * タブの挿入
     * @private
     */
    insertTab() {
        const start = this.elements.codeInput.selectionStart;
        const end = this.elements.codeInput.selectionEnd;
        const value = this.elements.codeInput.value;
        
        // タブ文字を挿入
        this.elements.codeInput.value = value.substring(0, start) + '  ' + value.substring(end);
        
        // カーソル位置を更新
        this.elements.codeInput.selectionStart = this.elements.codeInput.selectionEnd = start + 2;
    }

    /**
     * コードの保存（ローカルストレージ）
     * @private
     */
    saveCode() {
        const code = this.elements.codeInput.value;
        localStorage.setItem('webr-playground-code', code);
        this.showInfo('コードを保存しました');
    }

    /**
     * 保存されたコードの読み込み
     * @private
     */
    loadSavedCode() {
        const code = localStorage.getItem('webr-playground-code');
        if (code) {
            this.elements.codeInput.value = code;
            this.showInfo('保存されたコードを読み込みました');
        }
    }

    /**
     * 情報メッセージの表示
     * @private
     * @param {string} message - メッセージ
     */
    showInfo(message) {
        console.info(message);
        // 必要に応じてトースト通知などを実装
    }

    /**
     * 警告メッセージの表示
     * @private
     * @param {string} message - メッセージ
     */
    showWarning(message) {
        console.warn(message);
        this.appendOutput(`⚠️ 警告: ${message}\n`);
    }

    /**
     * エラーメッセージの表示
     * @private
     * @param {string} message - メッセージ
     */
    showError(message) {
        console.error(message);
        this.appendOutput(`❌ エラー: ${message}\n`);
    }

    /**
     * 準備完了状態の設定
     */
    setReady() {
        this.elements.runBtn.disabled = false;
        this.updateStatus('WebR準備完了', 'success');
        this.clearOutput();
        this.appendOutput('WebRが準備完了しました。Rコードを実行できます。\n');
    }

    /**
     * リソースのクリーンアップ
     */
    destroy() {
        // イベントリスナーの削除
        document.removeEventListener('keydown', this.handleKeyboardShortcut);
        
        // その他のクリーンアップ
        this.webRService = null;
        this.shortcuts = {};
    }
}

// デフォルトエクスポート
export default UIController;
