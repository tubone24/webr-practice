/**
 * サンプルコード管理モジュール
 * @module examples
 */

/**
 * サンプルコードの定義
 * @type {Object.<string, WebRPlayground.CodeExample>}
 */
export const examples = {
    basic: {
        id: 'basic',
        label: '基本統計',
        category: 'basic',
        description: 'データの基本統計量を計算',
        code: `# 基本統計の例
x <- c(1, 4, 7, 10, 15, 20, 25, 30)
cat("データ:", paste(x, collapse=", "), "\\n")
cat("平均:", mean(x), "\\n")
cat("中央値:", median(x), "\\n")
cat("標準偏差:", sd(x), "\\n")
print(summary(x))`
    },

    plot: {
        id: 'plot',
        label: 'グラフ作成',
        category: 'visualization',
        description: '正弦波のグラフを描画',
        code: `# グラフ作成の例（完全版）
x <- seq(0, 2*pi, length.out = 50)
y <- sin(x)

# プロット作成（一括実行で確実に動作）
plot(x, y, type = "l", col = "blue", lwd = 2, main = "正弦波", xlab = "x", ylab = "sin(x)"); grid()

cat("プロットを作成しました\\n")`
    },

    dataframe: {
        id: 'dataframe',
        label: 'データフレーム',
        category: 'basic',
        description: 'データフレームの作成と操作',
        code: `# データフレームの例
df <- data.frame(
  name = c("田中", "佐藤", "鈴木", "高橋"),
  age = c(25, 30, 28, 35),
  height = c(170, 165, 175, 180)
)
print(df)
cat("\\n平均年齢:", mean(df$age), "歳\\n")
cat("平均身長:", mean(df$height), "cm\\n")`
    },

    regression: {
        id: 'regression',
        label: '回帰分析',
        category: 'statistics',
        description: '線形回帰分析の実行',
        code: `# 回帰分析の例（完全版）
set.seed(123)
x <- 1:20
y <- 2*x + 3 + rnorm(20, 0, 2)
model <- lm(y ~ x)

# プロットと回帰線（一括実行）
plot(x, y, pch = 16, col = "blue", main = "回帰分析"); abline(model, col = "red", lwd = 2)

cat("回帰係数:\\n")
cat("切片:", round(coef(model)[1], 3), "\\n")
cat("傾き:", round(coef(model)[2], 3), "\\n")
cat("R-squared:", round(summary(model)$r.squared, 3), "\\n")`
    },

    multiplot: {
        id: 'multiplot',
        label: '複数グラフ',
        category: 'visualization',
        description: '4つのグラフを同時表示',
        code: `# 複数グラフの例
par(mfrow = c(2, 2))

# グラフ1: 散布図
x1 <- rnorm(50)
y1 <- x1 + rnorm(50, 0, 0.5)
plot(x1, y1, main = "散布図", pch = 16, col = "blue")

# グラフ2: ヒストグラム
hist(rnorm(100), main = "ヒストグラム", col = "lightblue")

# グラフ3: 箱ひげ図
boxplot(rnorm(100), main = "箱ひげ図", col = "lightgreen")

# グラフ4: 線グラフ
t <- seq(0, 10, 0.1)
plot(t, exp(-t/3) * cos(t), type = "l", main = "減衰振動", col = "red")

par(mfrow = c(1, 1))
cat("複数グラフを作成しました\\n")`
    },

    advanced: {
        id: 'advanced',
        label: '高度なグラフ',
        category: 'advanced',
        description: '複数の正規分布の比較',
        code: `# 高度なグラフの例（完全版）
x <- seq(-3, 3, 0.1)
y1 <- dnorm(x, 0, 1)
y2 <- dnorm(x, 0, 0.5)
y3 <- dnorm(x, 1, 1)

# 複数曲線プロット（一括実行で確実）
plot(x, y1, type = "l", col = "blue", lwd = 2, ylim = c(0, 0.8), main = "正規分布の比較", xlab = "x", ylab = "確率密度"); lines(x, y2, col = "red", lwd = 2); lines(x, y3, col = "green", lwd = 2); grid(); legend("topright", legend = c("N(0,1)", "N(0,0.5)", "N(1,1)"), col = c("blue", "red", "green"), lwd = 2)

cat("高度なグラフを作成しました\\n")`
    },

    matrix: {
        id: 'matrix',
        label: '行列演算',
        category: 'basic',
        description: '行列の作成と基本演算',
        code: `# 行列演算の例
# 行列の作成
A <- matrix(c(1, 2, 3, 4, 5, 6), nrow = 2, ncol = 3)
B <- matrix(c(7, 8, 9, 10, 11, 12), nrow = 3, ncol = 2)

cat("=== 行列A (2×3) ===\\n")
print(A)

cat("\\n=== 行列B (3×2) ===\\n")
print(B)

# 行列の積
C <- A %*% B
cat("\\n=== 行列積 A × B (2×2) ===\\n")
print(C)

# 逆行列と固有値（正方行列の場合）
cat("\\n=== 正方行列の解析 ===\\n")
D <- matrix(c(4, 2, 2, 3), nrow = 2)
cat("行列D:\\n")
print(D)

cat("\\n行列式: ", det(D), "\\n")
cat("\\n逆行列:\\n")
print(solve(D))

# 固有値と固有ベクトル
eigen_result <- eigen(D)
cat("\\n固有値:\\n")
print(eigen_result$values)
cat("\\n固有ベクトル:\\n")
print(eigen_result$vectors)`
    },

    functions: {
        id: 'functions',
        label: '関数定義',
        category: 'basic',
        description: 'カスタム関数の作成と使用',
        code: `# カスタム関数の定義と使用
# 統計量を計算する関数
calculate_stats <- function(data, name = "データ") {
  cat(sprintf("=== %s の統計量 ===\\n", name))
  cat("サンプル数:", length(data), "\\n")
  cat("平均:", round(mean(data), 2), "\\n")
  cat("標準偏差:", round(sd(data), 2), "\\n")
  cat("最小値:", min(data), "\\n")
  cat("最大値:", max(data), "\\n")
  cat("変動係数:", round(sd(data)/mean(data) * 100, 2), "%\\n")
  
  # 結果をリストで返す
  invisible(list(
    n = length(data),
    mean = mean(data),
    sd = sd(data),
    min = min(data),
    max = max(data),
    cv = sd(data)/mean(data)
  ))
}

# 二次方程式の解を求める関数
solve_quadratic <- function(a, b, c) {
  discriminant <- b^2 - 4*a*c
  cat(sprintf("方程式: %dx² + %dx + %d = 0\\n", a, b, c))
  
  if (discriminant < 0) {
    cat("実数解なし（判別式 < 0）\\n")
    real_part <- -b / (2*a)
    imag_part <- sqrt(-discriminant) / (2*a)
    cat(sprintf("複素数解: %.2f ± %.2fi\\n", real_part, imag_part))
    return(NULL)
  } else if (discriminant == 0) {
    x <- -b / (2*a)
    cat(sprintf("重解: x = %.2f\\n", x))
    return(x)
  } else {
    x1 <- (-b + sqrt(discriminant)) / (2*a)
    x2 <- (-b - sqrt(discriminant)) / (2*a)
    cat(sprintf("解: x₁ = %.2f, x₂ = %.2f\\n", x1, x2))
    return(c(x1, x2))
  }
}

# 関数の使用例
set.seed(456)
sample_data <- rnorm(100, mean = 50, sd = 10)
stats <- calculate_stats(sample_data, "正規分布サンプル")

cat("\\n")
solve_quadratic(1, -5, 6)   # x² - 5x + 6 = 0
cat("\\n")
solve_quadratic(1, 0, 1)    # x² + 1 = 0（虚数解）
cat("\\n")
solve_quadratic(1, -4, 4)   # x² - 4x + 4 = 0（重解）`
    }
};

/**
 * カテゴリごとにサンプルを取得
 * @param {string} category - カテゴリ名
 * @returns {Array<WebRPlayground.CodeExample>}
 */
export function getExamplesByCategory(category) {
    return Object.values(examples).filter(ex => ex.category === category);
}

/**
 * サンプルコードを取得
 * @param {string} id - サンプルID
 * @returns {string|null}
 */
export function getExampleCode(id) {
    return examples[id]?.code || null;
}

/**
 * すべてのサンプルを取得
 * @returns {Array<WebRPlayground.CodeExample>}
 */
export function getAllExamples() {
    return Object.values(examples);
}

/**
 * カテゴリ一覧を取得
 * @returns {Array<string>}
 */
export function getCategories() {
    const categories = new Set();
    Object.values(examples).forEach(ex => {
        if (ex.category) categories.add(ex.category);
    });
    return Array.from(categories);
}
