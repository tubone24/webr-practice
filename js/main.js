/**
 * WebR実験場 - メインアプリケーション
 * @module main
 */

import { WebRService } from './webr-service.js';
import { UIController } from './ui-controller.js';

/**
 * アプリケーションクラス
 */
class WebRPlaygroundApp {
    constructor() {
        /** @type {WebRPlayground.IWebRService} */
        this.webRService = null;
        
        /** @type {WebRPlayground.IUIController} */
        this.uiController = null;
        
        /** @type {WebRPlayground.ConfigOptions} */
        this.config = {
            enableAutoRun: false,
            maxOutputLength: 10000,
            plotWidth: 800,
            plotHeight: 600,
            theme: this.getPreferredTheme()
        };
        
        /** @type {boolean} */
        this.initialized = false;
    }

    /**
     * アプリケーションの初期化
     * @async
     */
    async initialize() {
        if (this.initialized) {
            console.warn('アプリケーションは既に初期化されています');
            return;
        }

        try {
            console.log('WebR実験場を初期化しています...');
            
            // UIコントローラーの初期化
            this.uiController = new UIController();
            
            // WebRサービスの初期化
            this.webRService = new WebRService(this.config);
            
            // UIにサービスを接続
            this.uiController.initialize(this.webRService);
            
            // 初期化状態の表示
            this.uiController.updateStatus('WebRを初期化しています...', 'info');
            
            // WebRの初期化
            await this.initializeWebR();
            
            // グローバルアクセス用の設定
            this.setupGlobalAccess();
            
            // ページ離脱時の処理
            this.setupUnloadHandler();
            
            this.initialized = true;
            console.log('WebR実験場の初期化が完了しました');
            
        } catch (error) {
            console.error('初期化エラー:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * WebRの初期化
     * @private
     * @async
     */
    async initializeWebR() {
        try {
            // プログレス表示
            const progressMessages = [
                'WebAssemblyを読み込んでいます...',
                'R環境を構築しています...',
                'パッケージを準備しています...',
                'もうすぐ完了します...'
            ];
            
            let messageIndex = 0;
            const progressInterval = setInterval(() => {
                if (messageIndex < progressMessages.length) {
                    this.uiController.updateStatus(progressMessages[messageIndex], 'info');
                    messageIndex++;
                }
            }, 1000);
            
            // WebRの初期化実行
            await this.webRService.initialize();
            
            clearInterval(progressInterval);
            
            // 初期化成功
            this.uiController.setReady();
            
            // パフォーマンス計測
            this.logPerformance();
            
        } catch (error) {
            throw new Error(`WebRの初期化に失敗しました: ${error.message}`);
        }
    }

    /**
     * 初期化エラーのハンドリング
     * @private
     * @param {Error} error - エラー
     */
    handleInitializationError(error) {
        const errorMessage = `初期化エラー: ${error.message}`;
        
        this.uiController.updateStatus(errorMessage, 'error');
        this.uiController.showError(errorMessage);
        
        // エラーの詳細をコンソールに出力
        console.error('初期化エラーの詳細:', error);
        
        // エラーレポートの送信（必要に応じて実装）
        this.reportError(error);
    }

    /**
     * グローバルアクセスの設定
     * @private
     */
    setupGlobalAccess() {
        // デバッグ用にグローバルオブジェクトを作成
        window.webRPlayground = {
            app: this.uiController,
            service: this.webRService,
            config: this.config,
            
            // ユーティリティ関数
            utils: {
                /**
                 * コードを実行
                 * @param {string} code - Rコード
                 * @returns {Promise<WebRPlayground.ExecutionResult>}
                 */
                runCode: async (code) => {
                    return await this.webRService.executeCode(code);
                },
                
                /**
                 * 変数を取得
                 * @param {string} varName - 変数名
                 * @returns {Promise<any>}
                 */
                getVariable: async (varName) => {
                    return await this.webRService.getVariable(varName);
                },
                
                /**
                 * プロットを画像として保存
                 */
                savePlot: () => {
                    this.savePlotAsImage();
                },
                
                /**
                 * コードをファイルとして保存
                 */
                saveCode: () => {
                    this.saveCodeAsFile();
                }
            }
        };
    }

    /**
     * ページ離脱時の処理
     * @private
     */
    setupUnloadHandler() {
        window.addEventListener('beforeunload', (event) => {
            // 実行中のタスクがある場合は警告
            if (this.uiController && this.uiController.isRunning) {
                event.preventDefault();
                event.returnValue = 'コードの実行中です。ページを離れますか？';
                return event.returnValue;
            }
            
            // リソースのクリーンアップ
            this.cleanup();
        });
    }

    /**
     * 優先テーマの取得
     * @private
     * @returns {'light'|'dark'}
     */
    getPreferredTheme() {
        // システムのダークモード設定を確認
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        // ローカルストレージの設定を確認
        const savedTheme = localStorage.getItem('webr-playground-theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }
        
        return 'light';
    }

    /**
     * テーマの切り替え
     * @param {'light'|'dark'} theme - テーマ
     */
    setTheme(theme) {
        this.config.theme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('webr-playground-theme', theme);
    }

    /**
     * パフォーマンスのログ出力
     * @private
     */
    logPerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            
            console.log('パフォーマンス情報:');
            console.log(`  ページ読み込み時間: ${loadTime}ms`);
            console.log(`  DOM準備時間: ${domReadyTime}ms`);
            
            // WebR初期化時間（推定）
            const webRInitTime = performance.now();
            console.log(`  WebR初期化時間: ${Math.round(webRInitTime)}ms`);
        }
    }

    /**
     * エラーレポートの送信
     * @private
     * @param {Error} error - エラー
     */
    reportError(error) {
        // エラー情報の収集
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        // コンソールに出力（本番環境ではサーバーに送信）
        console.log('エラーレポート:', errorInfo);
        
        // Google Analytics等への送信（必要に応じて実装）
        // this.sendToAnalytics('error', errorInfo);
    }

    /**
     * プロットを画像として保存
     * @private
     */
    savePlotAsImage() {
        const canvas = this.uiController.elements.plotCanvas;
        if (!canvas || canvas.width === 0) {
            this.uiController.showWarning('保存するプロットがありません');
            return;
        }
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plot_${new Date().getTime()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.uiController.showInfo('プロットを保存しました');
        });
    }

    /**
     * コードをファイルとして保存
     * @private
     */
    saveCodeAsFile() {
        const code = this.uiController.elements.codeInput.value;
        if (!code) {
            this.uiController.showWarning('保存するコードがありません');
            return;
        }
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code_${new Date().getTime()}.R`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.uiController.showInfo('コードを保存しました');
    }

    /**
     * リソースのクリーンアップ
     * @private
     */
    cleanup() {
        try {
            if (this.webRService) {
                this.webRService.destroy();
            }
            
            if (this.uiController) {
                this.uiController.destroy();
            }
            
            // グローバルオブジェクトの削除
            if (window.webRPlayground) {
                delete window.webRPlayground;
            }
            
            console.log('リソースのクリーンアップが完了しました');
        } catch (error) {
            console.error('クリーンアップエラー:', error);
        }
    }
}

/**
 * アプリケーションの起動
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('WebR実験場を起動しています...');
    
    // アプリケーションインスタンスの作成
    const app = new WebRPlaygroundApp();
    
    // 初期化の実行
    try {
        await app.initialize();
    } catch (error) {
        console.error('アプリケーションの起動に失敗しました:', error);
        
        // フォールバックUIの表示
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h2>⚠️ エラー</h2>
                    <p>WebR実験場の起動に失敗しました。</p>
                    <p>ブラウザを更新してもう一度お試しください。</p>
                    <p style="font-size: 0.9em; color: #666; margin-top: 20px;">
                        エラー: ${error.message}
                    </p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        ページを更新
                    </button>
                </div>
            `;
        }
    }
});

// サービスワーカーの登録（オフライン対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('サービスワーカーの登録はスキップされました:', error.message);
        });
    });
}

// エクスポート（必要に応じて）
export { WebRPlaygroundApp };
