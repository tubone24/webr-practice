/**
 * WebRサービス - WebRとのインタラクションを管理
 * @module webr-service
 */

import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';

/**
 * WebRサービスクラス
 * @implements {WebRPlayground.IWebRService}
 */
export class WebRService {
    /**
     * @param {WebRPlayground.ConfigOptions} config - 設定オプション
     */
    constructor(config = {}) {
        /** @type {WebR|null} */
        this.webR = null;
        
        /** @type {any} */
        this.shelter = null;
        
        /** @type {boolean} */
        this.ready = false;
        
        /** @type {WebRPlayground.ConfigOptions} */
        this.config = {
            maxOutputLength: 10000,
            plotWidth: 800,
            plotHeight: 600,
            ...config
        };

        /** @type {AbortController|null} */
        this.currentExecution = null;
    }

    /**
     * WebRを初期化
     * @returns {Promise<void>}
     * @throws {Error} 初期化に失敗した場合
     */
    async initialize() {
        try {
            console.log('WebR初期化開始...');
            
            // WebRインスタンスの作成
            this.webR = new WebR();
            await this.webR.init();
            
            // Shelterの作成（隔離された実行環境）
            this.shelter = await new this.webR.Shelter();
            
            // 初期設定
            await this.setupEnvironment();
            
            this.ready = true;
            console.log('WebR初期化完了');
        } catch (error) {
            console.error('WebR初期化エラー:', error);
            this.ready = false;
            throw new Error(`WebR初期化に失敗しました: ${error.message}`);
        }
    }

    /**
     * R環境の初期設定
     * @private
     * @returns {Promise<void>}
     */
    async setupEnvironment() {
        try {
            // プロットサイズの設定
            await this.shelter.captureR(`
                options(width = 80)
                options(digits = 7)
                # 日本語対応の設定
                Sys.setlocale("LC_ALL", "C")
            `);
        } catch (error) {
            console.warn('環境設定中の警告:', error);
        }
    }

    /**
     * Rコードを実行
     * @param {string} code - 実行するRコード
     * @returns {Promise<WebRPlayground.ExecutionResult>}
     */
    async executeCode(code) {
        if (!this.ready) {
            throw new Error('WebRが初期化されていません');
        }

        if (!code || !code.trim()) {
            return {
                success: false,
                error: 'コードが入力されていません'
            };
        }

        const startTime = performance.now();

        try {
            // 実行中の処理をキャンセル可能にする
            this.currentExecution = new AbortController();
            
            // コードの実行
            const result = await this.shelter.captureR(code, {
                withAutoprint: true,
                captureStreams: true,
                captureConditions: true,
                captureGraphics: {
                    width: this.config.plotWidth,
                    height: this.config.plotHeight
                }
            });

            const executionTime = performance.now() - startTime;

            // 出力の処理
            const output = this.formatOutput(result.output);
            
            // 結果の返却
            return {
                success: true,
                output: this.truncateOutput(output),
                images: result.images || [],
                executionTime: Math.round(executionTime)
            };

        } catch (error) {
            const executionTime = performance.now() - startTime;
            
            // エラーの種類を判定
            const errorMessage = this.formatError(error);
            
            return {
                success: false,
                error: errorMessage,
                executionTime: Math.round(executionTime)
            };
        } finally {
            this.currentExecution = null;
        }
    }

    /**
     * 出力をフォーマット
     * @private
     * @param {Array} output - WebRの出力配列
     * @returns {string}
     */
    formatOutput(output) {
        if (!output || output.length === 0) {
            return '';
        }

        return output.map(item => {
            if (typeof item === 'string') {
                return item;
            }
            
            if (typeof item === 'object' && item !== null) {
                // stdout/stderr の処理
                if (item.type === 'stdout' && item.data) {
                    return item.data;
                }
                if (item.type === 'stderr' && item.data) {
                    return `エラー: ${item.data}`;
                }
                if (item.type === 'warning' && item.data) {
                    return `警告: ${item.data}`;
                }
                if (item.type === 'message' && item.data) {
                    return `メッセージ: ${item.data}`;
                }
                
                // 配列の場合
                if (Array.isArray(item)) {
                    return this.formatArray(item);
                }
                
                // オブジェクトの場合
                try {
                    return JSON.stringify(item, null, 2);
                } catch {
                    return String(item);
                }
            }
            
            return String(item);
        }).join('\n');
    }

    /**
     * 配列をフォーマット
     * @private
     * @param {Array} arr - 配列
     * @returns {string}
     */
    formatArray(arr) {
        if (arr.length === 0) return '[]';
        
        // 数値配列の場合
        if (arr.every(item => typeof item === 'number')) {
            return `[${arr.join(', ')}]`;
        }
        
        // 文字列配列の場合
        if (arr.every(item => typeof item === 'string')) {
            return arr.join('\n');
        }
        
        // 混合配列
        return arr.map(item => String(item)).join('\n');
    }

    /**
     * エラーメッセージをフォーマット
     * @private
     * @param {Error} error - エラーオブジェクト
     * @returns {string}
     */
    formatError(error) {
        if (error.message) {
            // R特有のエラーメッセージを日本語化
            let message = error.message;
            
            // よくあるエラーの翻訳
            const errorTranslations = {
                'object .* not found': 'オブジェクトが見つかりません',
                'unexpected': '予期しない',
                'Error in': 'エラー:',
                'could not find function': '関数が見つかりません',
                'argument is of length zero': '引数の長さがゼロです',
                'missing value': '欠損値',
                'invalid': '無効な',
                'incorrect number of dimensions': '次元数が正しくありません'
            };

            for (const [pattern, translation] of Object.entries(errorTranslations)) {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(message)) {
                    message = message.replace(regex, translation);
                }
            }
            
            return message;
        }
        
        return 'コードの実行中にエラーが発生しました';
    }

    /**
     * 出力を制限
     * @private
     * @param {string} output - 出力文字列
     * @returns {string}
     */
    truncateOutput(output) {
        if (output.length <= this.config.maxOutputLength) {
            return output;
        }
        
        const truncated = output.substring(0, this.config.maxOutputLength);
        return truncated + '\n\n... (出力が長すぎるため省略されました)';
    }

    /**
     * 現在の実行をキャンセル
     * @returns {void}
     */
    cancelExecution() {
        if (this.currentExecution) {
            this.currentExecution.abort();
            this.currentExecution = null;
        }
    }

    /**
     * WebRの準備状態を確認
     * @returns {boolean}
     */
    isReady() {
        return this.ready;
    }

    /**
     * リソースをクリーンアップ
     * @returns {void}
     */
    destroy() {
        try {
            this.cancelExecution();
            
            if (this.shelter) {
                // Shelterの破棄は非同期だが、エラーを無視
                this.shelter.destroy().catch(console.error);
                this.shelter = null;
            }
            
            this.webR = null;
            this.ready = false;
        } catch (error) {
            console.error('クリーンアップエラー:', error);
        }
    }

    /**
     * データをRにロード
     * @param {string} variableName - R内の変数名
     * @param {Array|Object} data - ロードするデータ
     * @returns {Promise<boolean>}
     */
    async loadData(variableName, data) {
        if (!this.ready) {
            throw new Error('WebRが初期化されていません');
        }

        try {
            // JSONデータをRに変換
            const jsonString = JSON.stringify(data);
            const code = `
                library(jsonlite)
                ${variableName} <- fromJSON('${jsonString}')
            `;
            
            const result = await this.executeCode(code);
            return result.success;
        } catch (error) {
            console.error('データロードエラー:', error);
            return false;
        }
    }

    /**
     * パッケージをインストール（WebRの制限により動作しない場合がある）
     * @param {string} packageName - パッケージ名
     * @returns {Promise<boolean>}
     */
    async installPackage(packageName) {
        if (!this.ready) {
            throw new Error('WebRが初期化されていません');
        }

        try {
            const code = `
                # WebRではパッケージインストールに制限があります
                if (!require("${packageName}", quietly = TRUE)) {
                    warning("パッケージ '${packageName}' は利用できません")
                    FALSE
                } else {
                    message("パッケージ '${packageName}' が利用可能です")
                    TRUE
                }
            `;
            
            const result = await this.executeCode(code);
            return result.success;
        } catch (error) {
            console.error('パッケージインストールエラー:', error);
            return false;
        }
    }

    /**
     * 変数の値を取得
     * @param {string} variableName - 変数名
     * @returns {Promise<any>}
     */
    async getVariable(variableName) {
        if (!this.ready) {
            throw new Error('WebRが初期化されていません');
        }

        try {
            const code = `jsonlite::toJSON(${variableName}, auto_unbox = TRUE)`;
            const result = await this.executeCode(code);
            
            if (result.success && result.output) {
                try {
                    return JSON.parse(result.output);
                } catch {
                    return result.output;
                }
            }
            
            return null;
        } catch (error) {
            console.error('変数取得エラー:', error);
            return null;
        }
    }
}

// デフォルトエクスポート
export default WebRService;
